# Etapa 3 do plano Hotmart — webhook de assinatura, confirmada em 2026-10-02

Fecha a Etapa 3: a Edge Function `smart-processor` passou a tratar perda de
acesso, a gravar o vínculo com o parceiro e a registrar todo evento recebido.
Commit `aa40eaa`, nos três branches em lockstep. Edge Function na **versão 15**,
publicada com `--no-verify-jwt` — a flag é obrigatória: sem ela o Supabase
passaria a exigir JWT e toda chamada da Hotmart seria rejeitada.

## O que foi testado, e com o quê

Os testes usaram o **hottok real** da conta da Hotmart, configurado como secret
`HOTMART_SECRET_KEY` no Supabase. Vale registrar o detalhe que quase virou erro:
o hottok é **emitido pela Hotmart**, não escolhido por nós — a documentação diz
que alterá-lo exige falar com o suporte deles. Gerar um valor aleatório e
guardá-lo só do nosso lado faria a função rejeitar com 401 toda chamada real, e
isso só apareceria na primeira venda.

| teste | enviado | resultado |
|---|---|---|
| Rejeição sem token | POST sem header | HTTP 401 |
| Rejeição com token errado | `X-HOTMART-HOTTOK` inválido | HTTP 401 |
| Cancelamento de conta inexistente | `SUBSCRIPTION_CANCELLATION`, e-mail sem conta | 200, `matched:false`, sem quebrar |
| Cancelamento de conta existente | `SUBSCRIPTION_CANCELLATION` da conta de teste | 200, `matched:true`, conta vira `inativo` |
| Reenvio do mesmo evento | mesmo `id` repetido | 200 `Event already processed`, **não** gravou linha nova |
| Evento não tratado | `SWITCH_PLAN` | 200 `Event ignored`, registrado mesmo assim |

Conferido no banco: três linhas em `assinatura_eventos` (o reenvio não criou uma
quarta), a conta de teste com `acesso_status = 'inativo'`, e **nenhuma outra
conta afetada**. Os dados de teste foram removidos depois.

## Decisões que valem relembrar

`PURCHASE_DELAYED` ficou **de fora** dos eventos que revogam acesso. Atraso de
pagamento não é cancelamento, e cortar o acesso de quem apenas esqueceu de pagar
seria pior do que esperar o cancelamento chegar depois.

A conta é procurada primeiro pelo `subscriber_code` da Hotmart e só então pelo
e-mail: o código é estável, o e-mail a pessoa troca.

A atribuição do parceiro vem de `affiliates[0].affiliate_code` e só é escrita
quando `parceiro_id` ainda está `NULL`, garantido pelo `.is('parceiro_id', null)`
no próprio filtro do UPDATE — a primeira venda é que vale, e não há leitura antes
da escrita onde duas chamadas simultâneas pudessem se atropelar.

O registro em `assinatura_eventos` acontece **depois** do efeito, nunca antes: é
a presença da linha que prova "este evento já agiu". Gravar antes faria um
reenvio após falha ser descartado sem nunca ter surtido efeito.

## O que continua em aberto

**A linha de `usuarias` só nasce quando a compradora entra e preenche o perfil.**
Numa compra de conta nova, portanto, o UPDATE de concessão acerta zero linhas e a
atribuição do parceiro não chega a `usuarias`. O vínculo não se perde — fica em
`assinatura_eventos.parceiro_id` —, mas **alguém precisa resgatá-lo na criação do
perfil**, em `setupProfile` (`src/context/AuthContext.tsx`), que já é idempotente
por `upsert`. Sem isso, o painel do parceiro (Etapa 6) nasceria vazio. Esta é a
primeira coisa a resolver na Etapa 4.

Demais etapas: 4 (RLS exigindo `acesso_status = 'ativo'` nas 8 tabelas), 5 (tela
de assinatura inativa) e 6 (painel do parceiro). Nada delas foi iniciado, e
`acesso_status` ainda **não bloqueia nada** no app — é só um campo gravado.

Ver também [[pendencia-acesso-status-default-inativo]], que precisa do webhook
concedendo acesso explicitamente antes de poder ser aplicada.
