# PENDENTE: formulário de Compras fora do padrão visual validado

> Registrado em 2026-09-14, mesmo padrão dos outros `docs/bug-*.md` /
> `docs/pendencia-*.md` desta pasta (achado colateral durante o redesign de
> "Clientes — Estado Vazio" e "Novo Registro" — fora do escopo pedido naquele
> momento, então só documentado, sem correção).

## Sintoma

Ao pedir pra confirmar que o redesign do formulário "Novo Registro"
(`TransactionFormModal.tsx`) também deixaria a tela de Compras visualmente
consistente — já que um comentário no código sugeria que os dois
compartilhavam o mesmo componente —, o teste ao vivo mostrou que **isso não é
verdade**: a tela de Compras usa um formulário próprio e completamente
separado, que nunca passa pelo `TransactionFormModal`.

## Onde fica

`src/components/BalancesAndExpensesModule.tsx` — seção "Lançar Compra Real /
Despesa" (linha 282), com seus próprios campos: "O que você comprou?
(Descrição)" (linha 299), Categoria da Compra (Reposição/Investimento), Valor
Gasto, Data da Compra, Quantidade e Unidade no Estoque (opcional), botão
"Registrar Compra e Descontar do Cofrinho" (linha 456). Esse componente é
renderizado dentro da aba "Compras" de `ProdutosModule.tsx`.

Ainda usa o estilo antigo: cores/classes fora da paleta roxo/lilás validada
nas telas já redesenhadas nesta sessão (Estoque, Produtos, Cliente-Cadastro,
Fichas-Aba, Ficha Técnica-Opções, Pedidos-Estado Vazio, Pedido-Novo,
Clientes-Estado Vazio, Novo Registro).

## Causa da confusão original

O comentário em `TransactionFormModal.tsx:993` ("a aba Compras abre este
mesmo modal com `initialType='reposicao'`") está **desatualizado**. Ele se
refere a `src/components/RestockModule.tsx`, aberto pela aba `'reposicao'`
em `App.tsx:531` — mas essa aba foi removida do rodapé
(`src/components/BottomNav.tsx`) há algum tempo, substituída pelos filtros
dentro de Produtos. A rota `activeTab === 'reposicao'` e o `RestockModule`
continuam no código, mas são **inalcançáveis pela navegação real do app**
hoje — é código morto. A tela de Compras que a usuária realmente usa é o
`BalancesAndExpensesModule.tsx` descrito acima.

## O que precisa decidir antes de corrigir

- Se um redesign futuro for feito, ele deveria seguir o mesmo padrão visual
  já validado (tokens reais: `#3A2350` / `#6E3F72` / `#F3E9F3` / `#7A6E80` /
  borda `#E6E1DB`), aplicado em cima da estrutura de campos que já existe
  (mesmo espírito do redesign de "Novo Registro": não mexer em lógica, só
  visual).
- Vale também decidir, numa limpeza separada, se `RestockModule.tsx` e a
  rota `activeTab === 'reposicao'` em `App.tsx` devem ser removidos de vez
  (código morto, sem navegação que os alcance) — fora do escopo deste
  registro, só deixando anotado.
