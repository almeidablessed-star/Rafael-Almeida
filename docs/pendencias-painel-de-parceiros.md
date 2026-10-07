# Pendências abertas do painel de parceiros

> Atualizado em 2026-10-07, depois de a Etapa 4 ir para produção. Lista viva:
> risque o item quando ele for resolvido.

## Já aplicado em produção

**Script B — trava de privilégios em `usuarias`** (2026-10-07, SQL Editor;
cópia em `supabase/migrations/20261007_1_usuarias_trava_privilegios_colunas.sql`).
`authenticated` passou a ter INSERT só em `id, nome, nome_confeitaria, moeda,
created_at` e UPDATE só em `nome, nome_confeitaria, moeda, foto_url, telefone,
endereco, instagram`. `anon` ficou sem escrita nenhuma e o DELETE foi revogado
dos dois. Verificado em `information_schema`: 8 privilégios de tabela e 12 de
coluna. É esta trava que impede alguém de se reativar sozinho mexendo em
`acesso_status` pelo console — sem ela a RLS do Script A seria decorativa.

**Script A — a RLS passa a exigir assinatura ativa** (2026-10-07, depois do B;
cópia em `supabase/migrations/20261007_2_rls_exige_acesso_ativo.sql`). Criou a
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

**O botão "Sair" da tela de pausa não faz nada.** Observado pelo Rafael em
produção, com uma conta inativa: clicar não desloga e não acontece nada. É a
**única** saída de quem está pausado, então hoje essa pessoa fica presa na tela.
Ainda não investigado. **Prioridade alta.**

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

**`otp_codes` com políticas abertas.** Ficou fora do escopo da Etapa 4 e segue
pendente. É a tabela dos códigos de acesso por e-mail; políticas permissivas
demais ali são problema de segurança real. **Bloqueador antes do lançamento.**

## Sem pressa

**O portão só reavalia no próximo carregamento do perfil.** Se a assinatura for
cancelada com o app aberto, `ProtectedRoute` continua deixando passar até o
perfil ser recarregado — e, com a RLS ligada, essa pessoa vê telas vazias sem
entender o motivo, porque a tela de pausa ainda não apareceu. Vale avaliar
revalidar o status quando a aba volta a receber foco. Baixa prioridade:
cancelamento com o app aberto é raro e um F5 resolve.

**Fundo bege da tela de pausa.** `AssinaturaInativaPage` usa `#EDE7DC`; trocar
por uma cor da identidade do app. Baixa prioridade.

**Apagar as tabelas antigas `pedidos` e `saldos_semanais`.** Nenhuma linha de
`src/` as acessa. `pedidos` tem 11 linhas e `saldos_semanais` está vazia. Entraram
no bloqueio da Etapa 4 por precaução. Só apagar depois que o Rafael confirmar que
aquelas 11 linhas são mesmo resto de teste.
