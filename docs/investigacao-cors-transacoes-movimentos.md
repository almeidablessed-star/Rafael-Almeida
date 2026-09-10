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
