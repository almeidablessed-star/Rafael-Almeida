# Bug pendente: editar um pedido com entrega não restaura o toggle "Entrega"

> Encontrado em 2026-09-11/12, durante o teste ao vivo da troca do cálculo de
> entrega por milha para valor manual (mesmo formato de registro usado para o
> CORS em docs/investigacao-cors-transacoes-movimentos.md e para as outras
> pendências cosméticas/baixa prioridade nesta pasta).

## Sintoma

No formulário de Pedido (`TransactionFormModal.tsx`), uma venda salva com
"Entrega" ativada e uma taxa preenchida guarda esse valor corretamente (soma
certo no total, aparece certo no card "Saldos & Divisão" do Início). Mas ao
**reabrir esse mesmo pedido para editar**, o toggle "Entrega (delivery)"
sempre volta pra "Não" e o campo de taxa aparece vazio — mesmo que o pedido
tenha sido salvo com entrega e taxa preenchida.

Confirmado ao vivo em 2026-09-11: criei um pedido de teste com Entrega = Sim
e taxa R$ 25,00, salvei (total bateu certo, R$ 25,00 apareceu certo em Saldos
& Divisão), reabri esse mesmo pedido pra editar e "Entrega" apareceu como
"Não", campo de taxa vazio.

## Causa raiz

`TransactionFormModal.tsx`, `useEffect` que popula os campos ao editar
(`if (editingTransaction) { ... }`, por volta da linha 361): esse bloco
define `customerName`, `deliveryTime`, `deliveryAddress`, `observations` etc.
a partir de `editingTransaction`, mas **nunca define `hasDelivery` nem
`deliveryFeeInput`** (antes da troca, também nunca definia `deliveryMiles`).
Como esses dois estados não têm um campo dedicado no banco — a taxa de
entrega só existe embutida no texto de observações da venda, reconstruída via
regex em `financialEngine.ts` para os cálculos do Dashboard — o formulário de
edição não tem de onde ler esse valor de volta, e cai no default
(`hasDelivery = false`, ver o reset em torno da linha 451).

Este bug já existia **antes** desta sessão (a versão por milha tinha
exatamente a mesma lacuna com `deliveryMiles`) — não é uma regressão
introduzida pela troca do cálculo automático pelo valor manual, só ficou mais
visível ao testar o fluxo de ponta a ponta.

## Impacto prático

Editar um pedido que tinha entrega (por qualquer outro motivo — trocar
telefone, ajustar quantidade, etc.) e salvar de novo **apaga silenciosamente
a taxa de entrega** desse pedido, porque o formulário reabre com "Entrega:
Não" e, ao salvar, grava as observações sem a linha "Taxa de Entrega: R$
X,XX." — o que também some do cálculo em Saldos & Divisão na próxima vez que
a página recalcular.

## O que precisa de decisão antes de corrigir

1. A causa de fundo é a taxa de entrega não ter coluna própria no banco — só
   existir como texto dentro de observações, parseado por regex. Duas rotas
   possíveis: (a) ensinar o formulário de edição a reler o valor de volta do
   texto salvo (mesmo regex que o `financialEngine.ts` já usa), ou (b) dar
   à entrega uma coluna própria em `transacoes` e migrar a leitura/escrita
   para lá. A opção (b) resolve de raiz mas é mudança de schema — mesmo
   processo de sempre (mostrar migration, confirmar antes de rodar).
2. Confirmar se existem hoje, na conta real, pedidos com entrega que já foram
   editados depois de criados — esses já perderam a taxa salva nas
   observações (não dá pra recuperar retroativamente o valor exato, só o
   fato de que existiu, se o texto ainda mencionar "Entrega" de alguma
   forma).
