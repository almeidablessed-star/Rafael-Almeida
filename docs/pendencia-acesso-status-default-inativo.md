# Pendência — virar o default de `acesso_status` para `'inativo'` antes do lançamento

> Registrado em 2026-10-02, logo depois de rodar a migration do schema de
> assinatura (Etapa 2 do plano Hotmart). **Não fazer agora**, por decisão
> explícita do Rafael.

## O comando

Quando o app começar a vender de verdade — ou seja, quando houver a primeira
assinatura paga por alguém de fora —, rodar no SQL Editor do Supabase:

```sql
ALTER TABLE public.usuarias ALTER COLUMN acesso_status SET DEFAULT 'inativo';
```

## Por que não agora

A migration criou `usuarias.acesso_status` com `DEFAULT 'ativo'` **de
propósito**: isso faz o backfill das contas que já existiam entrarem como
ativas, de modo que ninguém que já usava o app fosse trancado no dia em que a
coluna nasceu. Enquanto o único usuário é o próprio Rafael, com contas de
teste, o default aberto é o que mantém o trabalho fluindo — trocar agora só
criaria atrito para criar conta de teste.

## Por que fazer antes do lançamento

O default vale também para contas **futuras**. Enquanto ele for `'ativo'`,
qualquer linha nova em `usuarias` nasce com acesso liberado, inclusive uma
criada por um caminho que não passe pelo webhook da Hotmart. Depois que houver
dinheiro envolvido, a regra correta se inverte: o acesso deve ser negado por
padrão e só ser concedido pela confirmação de pagamento da Hotmart —
`PURCHASE_APPROVED` / `PURCHASE_COMPLETE`. Com o default em `'inativo'`, um
furo no fluxo de cadastro falha para o lado seguro (pessoa sem acesso, que
reclama e é destravada na hora) em vez de falhar para o lado caro (acesso
grátis e silencioso).

## Ordem em relação às outras etapas

Isto só faz sentido **depois** que o webhook souber conceder acesso
explicitamente (Etapa 3 do plano) — caso contrário as contas novas nasceriam
inativas e nada as ativaria. Checklist antes de rodar o comando:

1. O webhook grava `acesso_status = 'ativo'` em `PURCHASE_APPROVED` /
   `PURCHASE_COMPLETE`, testado ponta a ponta com uma compra real ou sandbox.
2. O webhook grava `'inativo'` nos eventos de perda de acesso.
3. Existe uma tela explicando o bloqueio (Etapa 5), senão quem cair nesse
   estado vê o app quebrado sem entender por quê.

## Etapas do plano Hotmart ainda em aberto

Nenhuma delas foi iniciada; o trabalho parou aqui a pedido do Rafael:

- **Etapa 3** — webhook: eventos de cancelamento (`PURCHASE_CANCELED`,
  `PURCHASE_REFUNDED`, `PURCHASE_CHARGEBACK`, `PURCHASE_PROTEST`,
  `PURCHASE_EXPIRED`, `PURCHASE_DELAYED`, `SUBSCRIPTION_CANCELLATION`) e
  gravação do vínculo com o parceiro via `affiliates.affiliate_code`.
- **Etapa 4** — RLS de acesso nas 8 tabelas, exigindo `acesso_status = 'ativo'`.
- **Etapa 5** — tela de assinatura inativa, no roteamento.
- **Etapa 6** — painel do parceiro: login, view agregada, policy, teste cruzado.

Decisão já tomada: a atribuição usa `affiliate_code` (programa de Afiliados da
Hotmart), **não** `coupon_code`. Ainda não há nenhum afiliado cadastrado na
conta da Hotmart, então a confirmação com dado real só acontece quando o
primeiro parceiro existir.
