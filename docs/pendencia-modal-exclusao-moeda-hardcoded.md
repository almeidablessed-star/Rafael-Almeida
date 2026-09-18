# RESOLVIDO (2026-09-18): modal de exclusão de Lançamento/Pedido sempre mostrava "R$"

> Registrado em 2026-09-18, achado colateral durante o teste ao vivo da
> correção de `BalancesAndExpensesModule.tsx` (ver
> `docs/pendencia-redesign-compras.md`) — fora do escopo daquela tarefa,
> então só documentado aqui inicialmente, sem correção. Corrigido no mesmo
> dia, em commit separado, a pedido do usuário.

## Sintoma

Testando na conta de teste (`rdealmeida590@gmail.com`, moeda configurada em
USD — símbolo `$` em todo o resto do app), ao abrir o modal de confirmação
"Excluir Lançamento?" o valor aparece como `R$ 1,00`, com o símbolo fixo em
Real mesmo com a conta configurada em outra moeda.

## Onde fica

`src/App.tsx:609`, na chamada de `GenericDeleteConfirmModal`:

```tsx
{ label: '💰', value: formatCurrency(deletingTransaction?.totalValue || 0) },
```

Esse `formatCurrency` é o importado de `utils/formatters.ts` (linha 15),
**não** o `formatCurrency` do `CurrencyContext` (`useCurrency()`). A
assinatura da função em `formatters.ts` é
`formatCurrency(value, currency: 'BRL' | 'USD' | 'EUR' = 'BRL')` — como a
chamada em `App.tsx` não passa o segundo argumento, sempre cai no default
`'BRL'`, ignorando a moeda escolhida pela usuária.

## Escopo do problema

Esse modal (`GenericDeleteConfirmModal`) é compartilhado por **todas** as
exclusões de transação — Pedidos, Compras e Despesas passam pelo mesmo
`handleRequestDelete`/`handleConfirmDelete` em `App.tsx`. Não é um problema
isolado da tela de Compras; qualquer exclusão de transação no app mostra o
valor em Real, independente da moeda configurada.

## Resolução

`App.tsx` (a função `AppContent`, dentro do `CurrencyProvider`) passou a
chamar `useCurrency()` e usar o `formatCurrency` de lá em vez do importado
estaticamente de `utils/formatters.ts`, que sempre caía no default `'BRL'`.
O import estático foi removido (só era usado nesse ponto).

Testado ao vivo na conta de teste com moeda em USD: lançada uma compra real,
aberto o modal "Excluir Lançamento?" e confirmado que mostra `$2.00` em vez
de `R$ 2,00`. A compra de teste foi excluída em seguida (delay de 10s
confirmado, saldo persistiu em `$0.00` após reload).

Durante a verificação apareceu um `ReferenceError: formatCurrency is not
defined` no console — investigado antes de descartar: era um artefato
transitório do Fast Refresh do Vite no momento exato de salvar o arquivo
editado (confirmado abrindo uma aba nova e limpa, sem o erro). Não é um bug
do código.

Não foi conferido se `GenericDeleteConfirmModal` tem o mesmo problema em
outros tipos de item (Produtos, Clientes, Fichas) — os únicos usos de
`itemType="transaction"` testados foram Pedido/Compra/Despesa, que passam
todos pela mesma chamada corrigida aqui.
