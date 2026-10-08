# Pendências abertas do painel de parceiros

> Atualizado em 2026-10-07, depois de a Etapa 4 ir para produção. Lista viva:
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

**Resend ainda envia pelo remetente de teste.** O remetente e `resend.dev`, de
sandbox, que so entrega ao dono da conta Resend. Uma compradora de verdade nunca
recebe o codigo de acesso. Verificar o dominio `carulaconfeitaria.com.br` no
Resend e apontar o `RESEND_FROM` para ele. **Obrigatorio antes do lancamento.**

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

**Bounce assíncrono não gera `EMAIL_FALHOU` — o buraco maior desta consulta.**
O `EMAIL_FALHOU` só nasce quando o Resend **recusa na hora**, na própria chamada
de envio. O caso mais comum na vida real é outro: o Resend **aceita** o e-mail,
responde 200, e só depois a caixa de destino devolve — endereço digitado errado,
conta inexistente, caixa cheia. Isso é um *bounce assíncrono*, e chega apenas
pelo webhook do Resend, no evento `email.bounced`
([documentação](https://resend.com/docs/webhooks/emails/bounced)). Como esse
webhook não é tratado, **essas falhas hoje não aparecem em lugar nenhum**: a
compradora pagou, a conta existe, o código nunca chegou, e a consulta acima
continua vazia. Tratar o webhook e registrar `EMAIL_FALHOU` com classe
`destinatario_assincrono` é **obrigatório antes do lançamento**, junto com o
aviso ativo — os dois resolvem o mesmo problema por caminhos diferentes.

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

**CORS `*` no `swift-responder`.** Qualquer origem pode chamar o verificador.
Mantido nesta etapa porque restringir pode quebrar o PWA instalado, que nem
sempre manda a origem esperada. Avaliar uma lista de origens permitidas depois
de confirmar o comportamento do PWA.

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
