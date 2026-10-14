# Pendências abertas do painel de parceiros

> Atualizado em 2026-10-14, com a validação do `email.complained`. Lista viva:
> risque o item quando ele for resolvido.

## Já aplicado em produção

**Script B — trava de privilégios em `usuarias`** (2026-10-07, SQL Editor;
cópia em `supabase/migrations/20261007120000_usuarias_trava_privilegios_colunas.sql`).
`authenticated` passou a ter INSERT só em `id, nome, nome_confeitaria, moeda,
created_at` e UPDATE só em `nome, nome_confeitaria, moeda, foto_url, telefone,
endereco, instagram`. `anon` ficou sem escrita nenhuma e o DELETE foi revogado
dos dois. Verificado em `information_schema`: 8 privilégios de tabela e 12 de
coluna. É esta trava que impede alguém de se reativar sozinho mexendo em
`acesso_status` pelo console — sem ela a RLS do Script A seria decorativa.

**Script A — a RLS passa a exigir assinatura ativa** (2026-10-07, depois do B;
cópia em `supabase/migrations/20261007120100_rls_exige_acesso_ativo.sql`). Criou a
função `tem_acesso_ativo()` e deixou **uma única política** em cada uma das dez
tabelas: `administrative_costs`, `clientes`, `fichas_tecnicas`, `transacoes`,
`produtos`, `estoque_movimentos`, `despesas_empresa`,
`configuracao_empresa_historico`, `pedidos` e `saldos_semanais`. Verificado em
`pg_policies`: 10 linhas, todas `ALL`, uma política por tabela.

**Testes que fecharam a etapa.** Conta ativa continuou lendo e gravando — o
onboarding e um pedido foram criados depois do Script A. Conta inativa teve a
gravação **recusada pelo banco**, com `new row violates row-level security
policy for table "clientes"`, e encontrou a tela de pausa ao recarregar. A
reativação devolveu o app ao normal. As sete contas terminaram em `ativo`.

**Cadastro de conta nova — concluído.** Testado com
`almeida.blessed+cadastro1@gmail.com` depois dos Scripts B e A: criar conta,
preencher o perfil e concluir o onboarding funcionaram sem erro; o app mostrou o
passo a passo inicial e abriu o Início. Isto é o que prova que o INSERT
restrito do Script B não quebrou o cadastro.

Os desfazeres estão em [[etapa4-scripts-de-desfazer]] — Script C-B para quando só
o B foi aplicado, Script C completo para o estado de hoje.

## Obrigatórias antes do lançamento

**O botão "Sair" da tela de pausa não fazia nada — RESOLVIDO** em 2026-10-07 e
testado pelo Rafael em produção, em janela anônima com uma conta inativa: a tela
de pausa apareceu, o Sair levou ao login e a reativação devolveu o app ao
normal. A causa: a página destruturava
`signOut` de `useAuth()`, mas o contexto expõe a função como `logout`; o campo
vinha `undefined` e o botão nunca teve handler.

**Por que o typecheck não pegou — e isso vale para o projeto inteiro:**
`@types/react` **não está instalado**. Sem ele, `useContext` e o resto da API do
React são `any` para o compilador, e destruturar um campo inexistente de um
hook passa batido. Ou seja, "14 erros, nenhum novo" **não** prova que um nome de
campo existe. Instalar `@types/react` e `@types/react-dom` faria essa classe de
erro voltar a ser detectável — vale avaliar como tarefa própria.

**Ativação de conta nova pela compra.** O webhook tenta gravar
`acesso_status = 'ativo'` quando a compra é aprovada, mas nesse momento a linha
em `usuarias` ainda não existe — ela só nasce quando a compradora preenche o
perfil —, então o UPDATE acerta zero linhas. Hoje isso é invisível porque o
default da coluna é `'ativo'`. **No dia em que o default virar `'inativo'`
(ver [[pendencia-acesso-status-default-inativo]]), uma compradora de verdade
ficaria sem acesso.** Proposta a avaliar: estender `vincular_parceiro_da_compra`
ou criar uma função irmã `SECURITY DEFINER`, chamada no `setupProfile`, que ative
a conta quando houver evento de aprovação para aquele e-mail — respeitando
cancelamento e reembolso posteriores, ou seja, **o evento mais recente é que
decide**. Obrigatório ANTES de trocar o default.

**Cadastro aberto sem confirmação de e-mail.** Observado em produção: "Criar
conta" com e-mail e senha entrou direto na tela de perfil, sem pedir código.
Hipótese a verificar: a confirmação de e-mail está desligada no Supabase Auth.
Duas consequências. Primeira: qualquer pessoa cria conta e, enquanto o default
for `'ativo'`, nasce com acesso. Segunda, mais grave: a função de ativação pela
compra descrita acima **tem de exigir `email_confirmed_at` preenchido** — sem
isso, alguém cadastra o e-mail de quem comprou e herda o acesso da compra.
Decidir entre ligar a confirmação de e-mail ou fechar o cadastro aberto e
deixar só as contas criadas pelo webhook.

**`HOTMART_URL` está vazia.** Em `src/pages/AssinaturaInativaPage.tsx` a
constante é `''`, marcada com `TODO`. Enquanto estiver assim o botão "Renovar
assinatura" **não é renderizado** — de propósito: um botão que não leva a lugar
nenhum é pior que nenhum botão. Mas isso significa que hoje quem está pausado não
tem caminho de volta. Preencher antes de haver assinante de verdade.

**Remetente do Resend — RESOLVIDO** (segredo gravado em 2026-10-08; conferido
em 2026-10-13). O texto antigo dizia que o remetente era o sandbox `resend.dev`,
que so entrega ao dono da conta — nao e mais verdade.

- `RESEND_FROM` = `acesso@carulaconfeitaria.com.br`. Conferido por
  `npx supabase secrets list`, que devolve o SHA-256 de cada segredo: o digest
  do `RESEND_FROM` bate com o desse endereco, e NAO bate com
  `onboarding@resend.dev`. (O esquema do hash foi confirmado antes pelo
  `ALERTA_EMAIL`, cujo digest bate com o e-mail de alerta conhecido.)
- DNS publicado e resolvendo: DKIM em `resend._domainkey.carulaconfeitaria.com.br`,
  SPF e MX em `send.carulaconfeitaria.com.br` (CNAME para `send.forge.rmta.net`,
  infraestrutura do Resend).
- Dominio `carulaconfeitaria.com.br` marcado **Verified** no painel do Resend —
  confirmado pelo Rafael em 2026-10-13. Esta parte so se ve no painel: do lado
  do codigo e do DNS nao da para provar que o Resend concluiu a verificacao.

**`otp_codes` — bloqueio imediato aplicado pelo Rafael** (2026-10-08): as cinco
políticas foram removidas e `anon` e `authenticated` perderam os privilégios na
tabela. Só o service-role a toca. Isso **quebra a `VerifyOtpPage` antiga de
propósito**, até a versão reescrita subir. O motivo era grave: o código ficava em
texto puro e legível por qualquer visitante, e a política de INSERT só conferia
`user_id`, sem olhar o e-mail — qualquer pessoa logada podia forjar uma linha com
o e-mail de outra e obter sessão da vítima, porque a função gerava o link pelo
e-mail da requisição.

**Aviso ativo quando o e-mail falha.** O webhook passou a registrar
`EMAIL_FALHOU` em `assinatura_eventos` quando o Resend recusa, mas **ninguém é
avisado**: o registro só aparece para quem for olhar. Uma compra paga que não
virou acesso pode ficar dias sem ninguém notar. **Obrigatório antes do
lançamento.** Até lá, rodar esta consulta uma vez por semana:

```sql
SELECT recebido_em, email, usuaria_id,
       payload->>'classe'      AS classe,
       payload->>'codigo_http' AS codigo_http,
       payload->>'motivo'      AS motivo
  FROM public.assinatura_eventos
 WHERE evento = 'EMAIL_FALHOU'
   AND recebido_em > now() - interval '7 days'
 ORDER BY recebido_em DESC;
```

Classe `destinatario` quer dizer conta criada e e-mail recusado: a pessoa existe
e precisa de um reenvio. Classe `nosso` ou `transitorio` quer dizer que a conta
foi desfeita e a Hotmart vai reenviar sozinha — o que precisa de conserto ali é
a configuração.

**Bounce assíncrono — RESOLVIDO em 2026-10-13.** O problema era real: o
`EMAIL_FALHOU` só nascia quando o Resend **recusava na hora**, na própria
chamada de envio. O caso mais comum na vida real é outro — o Resend aceita,
responde 200, e só depois a caixa de destino devolve (endereço digitado
errado, conta inexistente, caixa cheia). Esse *bounce assíncrono* chega apenas
pelo webhook, no evento `email.bounced`
([documentação](https://resend.com/docs/webhooks/emails/bounced)), e como
ninguém o tratava a compradora pagava, a conta existia, o código nunca chegava
e a consulta acima continuava vazia.

O que foi feito:

- **Função nova `resend-webhook`** (commit `1f68bc5`), separada das outras três
  porque é a única que recebe DO Resend, com outro contrato de segurança.
  Publicada com `verify_jwt = false`; quem autentica é a assinatura Svix
  (HMAC-SHA256 sobre `<svix-id>.<svix-timestamp>.<corpo cru>`, janela de 5
  minutos contra repetição, comparação em tempo constante).
  URL: `https://inqyobsjuztztvafpzxn.supabase.co/functions/v1/resend-webhook`.
- **Segredo `RESEND_WEBHOOK_SECRET` configurado** nos secrets do projeto. Sem
  ele a função recusa tudo com 500 — e 500, não 200, de propósito: o Resend
  reenvia o que falha, então os eventos represados entram sozinhos quando a
  configuração aparece.
- **Webhook cadastrado no painel do Resend**, assinando `email.bounced` e
  `email.complained`. `email.delivered` e `email.sent` ficaram de fora: gerariam
  volume sem decisão associada.
- Grava a MESMA linha `EMAIL_FALHOU` em `assinatura_eventos`, com
  `classe: destinatario_assincrono` e `provedor: resend` — então a consulta de
  monitoramento acima passou a enxergar os dois caminhos sem mudar nada.

**Teste de ponta a ponta em 2026-10-13**, com o simulador oficial do Resend
(`bounced@resend.dev`, que devolve SMTP 550 5.1.1 — bounce real, não dado
fictício):

- Envio aceito, id `01a13828-0aec-72a3-b8cb-c40e0f4c05c6`.
- Linha **37** gravada em `assinatura_eventos`, conferida pelo Rafael:
  `evento = EMAIL_FALHOU`, `classe = destinatario_assincrono`,
  `provedor = resend`, `email_id` e `hotmart_event_id` corretos.
- Aviso por e-mail chegou na caixa do `ALERTA_EMAIL`, com o assunto e o
  conteúdo esperados.

A linha 37 fica no banco de propósito: é um bounce real do simulador oficial.

**Complained validado em 2026-10-14**, pelo mesmo caminho e com o simulador
oficial (`complained@resend.dev`, que marca o envio como spam — reclamação
real, não dado fictício):

- Envio aceito, id `01a13c16-90eb-7204-90af-cf80112842c8`. A consulta do
  próprio e-mail na API do Resend devolveu `last_event: "complained"`.
- Linha **38** gravada em `assinatura_eventos`, conferida pelo Rafael:
  `evento = EMAIL_FALHOU`, `classe = destinatario_assincrono`,
  **`tipo_do_evento = email.complained`** — o campo que separa a reclamação do
  bounce — e `bounce_tipo` / `bounce_subtipo` **nulos**, como esperado (só o
  bounce preenche esses dois).
- Aviso por e-mail chegou na caixa do `ALERTA_EMAIL`, com o conteúdo esperado.

Como a linha 37, a 38 fica no banco de propósito: é uma reclamação real do
simulador oficial.

**O soft bounce não tem como ser testado — limite conhecido, não pendência.**
O Resend oferece quatro endereços de teste, e nenhum simula soft bounce
([documentação](https://resend.com/docs/dashboard/emails/send-test-emails)):
`delivered@resend.dev` (entrega), `bounced@resend.dev` (rejeição com SMTP
550 5.1.1 — **hard** bounce), `complained@resend.dev` (marcado como spam) e
`suppressed@resend.dev` (endereço já suprimido por ter bouncado antes). Os
dois eventos que a função escuta estão validados com evento real; o caso de
caixa cheia ou indisponibilidade temporária só poderá ser observado se um
soft bounce de verdade aparecer em produção. Se isso acontecer, o que vale
conferir é o `motivo` da linha: a função lê `data.bounce.message`, com queda
para `data.reason` e para `"sem mensagem"` — o registro nasce de qualquer
jeito, é o detalhe do motivo que fica por confirmar.

**A trava de duplicidade NUNCA esteve aberta — correção de 2026-10-14.** Esta
seção registrava, desde 13/10, que a proteção contra duplicidade era "só uma
consulta antes do insert, sem restrição do banco", e listava o índice único
como pendência. **Estava errado.** A coluna `hotmart_event_id` já tinha um
índice único o tempo todo, chamado `assinatura_eventos_hotmart_event_id_key`.

Como o erro aconteceu, para não se repetir: a conclusão foi tirada de **não
achar migration no repositório**, sem nunca consultar `pg_indexes`. Neste
projeto a ausência de migration não prova ausência de estrutura — várias
coisas foram criadas direto no Supabase e não têm arquivo versionado (a
coluna `rendimento` de `fichas_tecnicas` é outro caso conhecido, e a própria
tabela `assinatura_eventos` não tem `CREATE TABLE` em `supabase/migrations/`).
**Afirmação sobre o banco se confere no banco.**

O sufixo `_key` é a pista que faltou: é o nome que o Postgres dá sozinho ao
índice que nasce de uma restrição `UNIQUE` na tabela — ou seja, a coluna foi
declarada única na criação da tabela, não por um `CREATE INDEX` avulso.

O que de fato aconteceu em 14/10: um segundo índice, redundante
(`assinatura_eventos_hotmart_event_id_unico`), chegou a ser criado antes de a
duplicidade ser percebida, e foi removido em seguida. A migration que o criava
saiu do repositório — manter um arquivo que recria um índice desnecessário só
prepararia a próxima confusão. Nada de errado ficou no banco: dois índices
únicos iguais protegem o mesmo que um, só custam escrita à toa.

**Segue valendo**, agora com o motivo certo: as funções consultam antes de
gravar (primeira camada, que responde 200 sem ruído no caso comum) e o banco
recusa a segunda linha se duas execuções simultâneas passarem pela janela
(segunda camada, que já existia). O que o `smart-processor` ainda faz e vale
anotar: em `registrarFalhaDeEmail` o aviso por e-mail é enviado mesmo quando o
insert é recusado, então um reenvio naquele ponto exato pode gerar **alerta
repetido** — linha repetida, não.

**Reenvio pode ser usado contra a pessoa (aceito por ora).** Quem souber o
e-mail de alguém pode apertar "Não recebi o código" e, com isso, **invalidar o
código pendente dessa pessoa** e **gastar o teto diário dela** (5 por dia), que é
justamente o que impede o abuso de virar enxurrada de e-mail. O resultado é
incômodo — a dona da conta pede outro e recebe —, nunca acesso indevido: o
código vai sempre para o endereço cadastrado. Decidido conviver com isso por
ora; a saída seria exigir uma prova humana no botão.

**Reenvio de código — IMPLEMENTADO**, aguardando publicação e teste: função
`resend-otp` e botão "Não recebi o código" nas duas telas de verificação.
Intervalo mínimo de 60 s, teto de 5 por dia por conta, código novo invalida os
anteriores, e resposta sempre idêntica — inclusive com o limite estourado,
porque dizer "espere um pouco" confirmaria que a conta existe.

**CORS `*` no `swift-responder` — RESOLVIDO em 2026-10-13** (commit `54239e4`,
funcao ja implantada). O `*` virou uma lista de origens:

- `APP_URL` (lida do ambiente), `https://rafael-almeida-nine.vercel.app`,
  `https://carulaconfeitaria.com.br` (com e sem `www`),
  `http://localhost:3000` e `http://localhost:5173`.
- Origem **na lista** -> ecoada, o navegador libera a leitura.
- Origem **ausente ou `null`** -> responde `*`, de proposito. E o caso do PWA
  instalado, que em alguns aparelhos nao manda origem — e e justamente o
  publico do app. Era este o risco que adiou a correcao.
- Origem **fora da lista** -> nenhum cabecalho de CORS. A funcao responde
  igual (nao e 403: CORS nao e autorizacao); o navegador e que recusa
  entregar a resposta a pagina que chamou.
- `Vary: Origin` em todas as respostas, para cache nenhum servir a resposta de
  uma origem para outra.

Nada do que de fato protege este endpoint foi tocado: resposta unica para todo
erro, piso de tempo, teto de tentativas, hash em tempo constante e identidade
vinda do `user_id` da linha. Vale lembrar o que a lista NAO faz: CORS nao
impede ninguem de chamar o endpoint (curl, script e servidor passam longe). O
ganho real e contra phishing — uma pagina que convenca a pessoa a digitar o
codigo nao consegue mais LER os tokens de sessao da resposta.

**Verificado em 2026-10-13, em duas camadas:**

1. Sondagens contra a funcao publicada: origem permitida e ecoada; `evil.com`
   nao recebe cabecalho nenhum; `Origin: null` e origem ausente recebem `*`.
   No POST real, corpo e status sao identicos nos dois casos — a funcao nao
   virou um novo oraculo, so deixou de autorizar a leitura.
2. Teste no aparelho, feito pelo Rafael: **login por codigo funcionou pelo app
   instalado na tela inicial (PWA, Safari) e tambem pelo Safari normal**. Era
   a hipotese que faltava derrubar, e ela caiu.

**Remetente do Resend fixo no codigo.** Alem de trocar o sandbox pelo dominio
`carulaconfeitaria.com.br` depois de verifica-lo, o remetente deve virar
configuravel por secret (`RESEND_FROM`, que ja e lido com um valor padrao no
codigo) — assim trocar de dominio nao exige republicar funcao.

**Excluir `supabase/functions` do `tsconfig`.** O typecheck foi de 14 para 21
erros quando a segunda funcao entrou no repositorio: sao todos `Cannot find name
Deno` e `Cannot find module https://esm.sh/...`. E codigo Deno sendo conferido
por um `tsconfig` de navegador; o ruido mascara erro de verdade. Excluir a pasta
devolve o sinal.

**`DROP COLUMN code` pendente.** A coluna em texto puro continua na tabela, agora
sem NOT NULL e sem ninguém escrevendo nela. Só remover **depois** de as duas
funções novas estarem no ar e nenhum código em trânsito depender dela.

## Sem pressa

**O portão só reavalia no próximo carregamento do perfil.** Se a assinatura for
cancelada com o app aberto, `ProtectedRoute` continua deixando passar até o
perfil ser recarregado — e, com a RLS ligada, essa pessoa vê telas vazias sem
entender o motivo, porque a tela de pausa ainda não apareceu. Vale avaliar
revalidar o status quando a aba volta a receber foco. Baixa prioridade:
cancelamento com o app aberto é raro e um F5 resolve.

**Fundo bege da tela de pausa — RESOLVIDO** em 2026-10-07 e conferido na tela
pelo Rafael: o `#EDE7DC` do
onboarding deu lugar ao `#F6F2F5`, o mesmo fundo das demais telas, e o circulo
do icone passou a usar o gradiente roxo da identidade.

**Apagar as tabelas antigas `pedidos` e `saldos_semanais`.** Nenhuma linha de
`src/` as acessa. `pedidos` tem 11 linhas e `saldos_semanais` está vazia. Entraram
no bloqueio da Etapa 4 por precaução. Só apagar depois que o Rafael confirmar que
aquelas 11 linhas são mesmo resto de teste.
