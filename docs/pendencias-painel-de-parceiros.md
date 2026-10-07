# Pendências abertas do painel de parceiros

> Registrado em 2026-10-07, junto com o deploy da Etapa 5 (tela de assinatura
> pausada). Lista curta e viva: risque o item quando ele for resolvido.

## Obrigatórias antes do lançamento

**`HOTMART_URL` está vazia.** Em `src/pages/AssinaturaInativaPage.tsx` a
constante é `''`, marcada com `TODO`, à espera do link da oferta na Hotmart.
Enquanto estiver assim, o botão "Renovar assinatura" **não é renderizado** — de
propósito: um botão que não leva a lugar nenhum é pior que nenhum botão, porque
a pessoa clica, nada acontece e conclui que o app quebrou. Hoje quem estiver
pausado vê a mensagem e o botão de sair, sem caminho de volta. Preencher a
constante é obrigatório antes de haver assinante de verdade.

**`otp_codes` com políticas abertas.** A investigação ficou de fora do escopo da
Etapa 4 e continua pendente. É a tabela que guarda os códigos de acesso por
e-mail; políticas permissivas demais ali são um problema de segurança real, não
cosmético. **Bloqueador antes do lançamento.**

## Próximo passo do fluxo

**Os Scripts A, B e C da Etapa 4 ainda NÃO foram rodados.** São, respectivamente:
o bloqueio por RLS nas 10 tabelas, a trava de privilégios por coluna em
`usuarias` (sem a qual qualquer pessoa logada se reativa sozinha com uma linha
de JavaScript no console — isso foi confirmado na prática) e o desfazer dos dois.
Eles só rodam **depois** deste deploy, que é o que garante que uma conta inativa
encontre a tela de pausa em vez de cair no onboarding financeiro de nove passos
que também não grava. E só com aprovação explícita do Rafael.

## Melhorias e limpeza, sem pressa

**O portão só reavalia no próximo carregamento do perfil.** Se a assinatura for
cancelada com o app já aberto, `ProtectedRoute` continua deixando passar até que
o perfil seja recarregado. Depois que a RLS da Etapa 4 estiver ligada, essa
pessoa passa a ver telas vazias — os dados não chegam — sem entender o motivo,
porque a tela de pausa ainda não apareceu. Vale avaliar revalidar o status
quando a aba volta a receber foco. **Baixa prioridade:** cancelamento com o app
aberto é raro, e um F5 resolve.

**Apagar as tabelas antigas `pedidos` e `saldos_semanais`.** Nenhuma linha do
código em `src/` as acessa — a varredura encontrou apenas `administrative_costs`,
`clientes`, `configuracao_empresa_historico`, `despesas_empresa`,
`estoque_movimentos`, `fichas_tecnicas`, `otp_codes`, `produtos`, `transacoes` e
`usuarias`. `pedidos` tem 11 linhas e `saldos_semanais` está vazia. Elas entraram
no bloqueio da Etapa 4 por precaução, porque bloqueio pela metade é o que se
esquece depois. Só apagar **depois** que o Rafael confirmar que aquelas 11 linhas
são mesmo resto de teste.
