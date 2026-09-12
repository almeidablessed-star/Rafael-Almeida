# Investigação pendente: erro de CORS em `transacoes` e `estoque_movimentos` no boot

> Encontrado em 2026-09-10, durante o trabalho de preview dos novos layouts
> (docs/limpeza-estoque-legado.md documenta uma investigação no mesmo
> formato — este arquivo segue o mesmo padrão).

## Sintoma

Em toda carga fria da página (F5 / navegação nova), o console mostra dois
erros de CORS, sempre nos mesmos dois endpoints:

```
Access to fetch at '.../rest/v1/estoque_movimentos?select=*&usuaria_id=eq...&order=created_at.desc&limit=200'
from origin 'http://localhost:3000' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.

Access to fetch at '.../rest/v1/transacoes?select=*&usuaria_id=eq...&order=data.desc,created_at.desc'
from origin 'http://localhost:3000' has been blocked by CORS policy: ...
```

Correspondem a `fetchMovimentos` (`ProdutosContext.tsx`) e `fetchTransacoes`
(`TransacoesContext.tsx`), ambas disparadas pelo `useEffect(() => { ... },
[user])` de cada contexto assim que `user` fica disponivel.

## Confirmado: nao e transitorio

Reproduzido em 5+ recargas seguidas, sempre os mesmos dois endpoints. Nunca
acontece em `produtos`, `fichas_tecnicas` ou `administrative_costs` —
buscados pelos contextos irmaos (`ProdutosContext` tambem busca produtos sem
erro; `FichasTecnicasContext`, `CostsContext` idem).

## Hipoteses descartadas (com evidencia)

1. **JWT com relogio adiantado** (o mesmo sintoma de um bug ja visto e
   corrigido nesta mesma sessao, em outro contexto). Descartada: decodificado
   o token ao vivo no momento do erro — `iat` no passado, token valido.
2. **React StrictMode** (double-invoke de efeitos em dev pode fazer um
   `fetch` cancelado aparecer como erro de CORS no Chrome, em vez de
   `AbortError`). Descartada: `StrictMode` removido temporariamente de
   `main.tsx`, pagina recarregada, erro identico. Revertido em seguida —
   `git diff` confirmado limpo, nada ficou da experiencia.
3. **Query malformada** (parametro de `order` composto, `limit`, etc.).
   Descartada: a MESMA consulta (mesmo filtro `usuaria_id`, mesmo `order`,
   mesmo `limit`) rodada manualmente via console segundos depois do erro
   automatico teve sucesso instantaneo (HTTP 200).

## O padrao que sobra (nao confirmado como causa)

A falha acontece **sempre** na primeira tentativa automatica dessas duas
buscas especificas, exatamente no boot da pagina — nunca quando a mesma
chamada e repetida manualmente logo depois. Isso sugere uma corrida de
inicializacao (a sessao do Supabase ainda nao totalmente hidratada no
cliente `supabase-js` no exato instante em que esses dois `useEffect`
disparam), mas o mecanismo exato nao foi fechado — precisaria de
instrumentacao do `fetch` interno (por exemplo, um wrapper temporario que
loga headers enviados/recebidos) para confirmar.

Intrigante: `ProdutosProvider` e `TransacoesProvider` sao os provedores MAIS
internos na arvore (`App.tsx`), montando por ULTIMO — o que deveria dar MAIS
tempo para a sessao estar pronta, nao menos. Isso enfraquece a hipotese
simples de "corre demais cedo", sem descarta-la — pode haver algo especifico
de como esses dois contextos, e so eles, disparam a primeira busca.

## Impacto pratico

Nenhum ate agora. Os dados de `transacoes` e `estoque_movimentos` aparecem
corretamente na tela depois do carregamento — o app funciona normalmente,
o erro fica so no console. Nao bloqueou nenhum teste desta sessao (Selo de
Saude Financeira, auditoria de conversao de unidade, etc. — todos usam
`estoque_movimentos`/`transacoes` e funcionaram certo).

## Proximos passos, quando for investigar

1. Instrumentar temporariamente o `fetch` global (ou o cliente supabase-js)
   pra logar o `Authorization` header exato enviado nessas duas chamadas no
   boot, comparado com uma chamada que da certo (ex: `fetchProdutos`).
2. Conferir se ha alguma diferenca de timing entre o `useEffect` desses dois
   contextos e os que funcionam — por exemplo, um deles depende de um valor
   computado (`despesasMensais`, `estrutura`) que atrase a montagem o
   suficiente pra sessao estar pronta.
3. Considerar se vale a pena adicionar um retry simples (ex: se a resposta
   falhar por erro de rede/CORS logo apos o login, tentar de novo uma vez)
   como mitigacao, independente de achar a causa raiz.

## Atualizacao 2026-09-10 (sessao seguinte): hipotese de corrida REFUTADA

Instrumentado o boot de ponta a ponta: um wrapper temporario em
`window.fetch` (logando URL, timestamp relativo, header `Authorization` e
status de cada chamada Supabase) mais logs de timing no `AuthContext.tsx`
(`initAuth` start, `getSession()` resolvido, `setUser` chamado) e no efeito
de disparo de busca de `ProdutosContext`, `TransacoesContext` e
`CustomersContext` (controle — contexto irmao que nunca falha).

**Ordem real do boot, consistente em toda recarga capturada:**

```
getSession() RESOLVIDO        ~23-90ms   ← token disponivel aqui
fetch usuarias (perfil)       ~23-90ms
CustomersContext dispara      ~310-380ms
fetch clientes/fichas/custos  ~310-390ms
TransacoesContext dispara     ~475-625ms  ← ~500ms DEPOIS do token pronto
ProdutosContext dispara       ~475-625ms  ← ~500ms DEPOIS do token pronto
fetch transacoes/produtos/estoque_movimentos
```

O token fica disponivel **~500ms antes** desses dois contextos sequer
disparar — folga generosa, maior ate que a dos contextos que sempre
funcionam. Nao ha corrida apertada nenhuma nesse ponto. A hipotese de
"sessao ainda nao hidratada no instante do disparo" fica **refutada por
estes dados**, nao so enfraquecida como ja constava acima.

**Nao reproduzido**: 9 recargas seguidas (navegacao normal, aba nova,
`location.reload()`) com a instrumentacao ativa — zero erros de CORS em
todas, incluindo `transacoes`/`estoque_movimentos`, sempre `status=200
ok=true`.

**Hipotese em aberto sobre o motivo de nao reproduzir**: o processo do
servidor de dev que rodou a investigacao original tinha morrido (visto nos
logs, parado ha ~1h50) e o que estava no ar nesta sessao seguinte foi
reiniciado do zero, sem o acumulo de HMR/estado de uma sessao longa. Pode
ser que o bug dependa de alguma condicao desse tipo (servidor de dev
"velho", muitas recargas de HMR acumuladas) — ou de rede/maquina do lado do
navegador real, fora do alcance do harness de automacao usado nas duas
investigacoes. Nao ha evidencia ainda pra afirmar isso, so descartar a
causa mais provavel testada.

## Atualizacao 2026-09-12: segunda tentativa de reproducao automatizada, tambem sem sucesso

Com a instrumentacao ainda intacta (`window.__fetchLog` confirmado ativo e
populado logo apos o load), rodada uma nova tentativa de forca bruta via
automacao de navegador, desta vez variando mais o padrao de uso do que a
tentativa anterior (que so recarregava a pagina):

- **~32 recargas completas** (`location.reload()`/nova navegacao),em lotes
  de 5, 10, 10 e 7, sem pausa entre elas.
- Troca rapida entre todas as abas do app (Inicio, Pedidos, Fichas,
  Clientes, Produtos, Minha Empresa), incluindo trocas encadeadas sem
  esperar a tela anterior terminar de carregar.
- Ciclos de abrir e fechar o modal "Nova Ficha" intercalados com troca de
  aba, tambem sem pausa.

**Resultado: zero erros em toda a rodada.** Em nenhum momento
`window.__fetchLog` teve uma entrada com `.error` preenchido, nenhuma
resposta com status >= 400, e o console nao registrou nenhuma mensagem de
erro (nem de CORS, nem de outro tipo). Toda recarga trouxe as mesmas 17
chamadas esperadas — incluindo `transacoes` e `estoque_movimentos`, os dois
endpoints que falham quando o bug aparece — sempre `status=200 ok=true`.

Isso reforca a suspeita ja registrada na atualizacao anterior: o bug
provavelmente depende de alguma condicao do navegador real/rede do lado da
usuaria (extensao, cache, estado de conexao, etc.) que o harness de
automacao de navegador nao reproduz, mais do que de uma corrida de
inicializacao no codigo em si — ja foram duas tentativas de forca bruta
(9 recargas simples + 32 recargas com padroes variados de navegacao/troca de
aba/abrir-fechar modal), ambas com zero erro.

## Estrategia a partir de 2026-09-12: pausar a forca bruta, aguardar reproducao organica

Decisao do Rafael: nao vale mais dedicar tempo ativo tentando forcar a
reproducao por automacao — a abordagem ja foi esgotada duas vezes sem
sucesso. A instrumentacao continua ativa no ambiente local dele
(`window.__fetchLog` + os logs de timing nos contextos), e se o erro
aparecer organicamente durante o uso normal do app (fora de um teste
dedicado), ele captura na hora e traz para investigar com dado real em mao.

**Status**: pendencia PAUSADA (nao fechada, nao resolvida) — aguardando
reproducao organica futura. Sem proximo passo ativo definido por enquanto.
Instrumentacao **permanece no lugar de proposito** (nao reverter):
`src/debug-fetch-instrumentation.ts` + `src/main.tsx` + os logs de timing em
`AuthContext.tsx`/`ProdutosContext.tsx`/`TransacoesContext.tsx`/
`CustomersContext.tsx`. Se o erro aparecer, o wrapper de fetch loga o header
`Authorization` completo e a URL completa da chamada que falhou
(`window.__fetchLog` guarda tudo em memoria, inspecionavel a qualquer
momento via console). Só reverter os arquivos de instrumentacao
(`git checkout -- src/main.tsx src/context/AuthContext.tsx
src/context/ProdutosContext.tsx src/context/TransacoesContext.tsx
src/context/CustomersContext.tsx && rm src/debug-fetch-instrumentation.ts`)
quando o Rafael decidir encerrar a investigacao de vez, reproduzindo ou
nao.
