# RESOLVIDO (2026-09-18): formulário de Compras fora do padrão visual validado

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

## Achado adicional (2026-09-17): símbolo de moeda hardcoded

O label "Valor Gasto (R$)" (`BalancesAndExpensesModule.tsx:368`) tem o `R$`
fixo no texto, em vez de vir do `CurrencyContext` (`useCurrency().symbol`) —
mesma classe de bug já corrigida no onboarding financeiro (Passo 1 e Passo 4
de `EmpresaOnboardingFlow.tsx`, commit `e48aa24`). Como este arquivo já tem
redesign visual pendente acima, faz sentido resolver os dois juntos quando
essa pendência for endereçada, em vez de mexer no arquivo duas vezes.

## Resolução (2026-09-18)

Investigação ao vivo (conta de teste `rdealmeida590@gmail.com`, moeda
configurada em USD) confirmou, além do já mapeado acima, dois problemas
concretos que não apareciam claros só lendo o doc:

- **Toast "Despesa lançada!" sem estilo nenhum** — usava
  `var(--color-primary)`, uma variável que não existe em `src/index.css` (o
  arquivo que de fato é importado pelo app); só existe no `index.css.css`
  órfão. O badge renderizava sem fundo, sem borda e com texto na cor padrão
  do navegador.
- **Estado vazio "Nenhuma compra registrada nesta categoria" ilegível** —
  ícone e texto na cor `#E6E1DB` (o mesmo tom usado pra borda), contraste
  baixíssimo sobre o fundo claro — na prática, quase invisível.

Os três problemas (toast, estado vazio, símbolo de moeda) foram corrigidos em
`BalancesAndExpensesModule.tsx`:

- Toast: tokens trocados por `#F3E9F3` (fundo) / `#6E3F72` (borda, ícone,
  texto) — mesma dupla já usada nos badges de categoria mais abaixo no
  próprio arquivo.
- Estado vazio: redesenhado seguindo a estrutura já validada em
  `CustomersModule.tsx`/`OrdersModule.tsx` (badge de ícone 56px arredondado
  `#F3E9F3` com `Package` em `#6E3F72`, título serif `#3A2350`, texto de
  apoio `#7A6E80`).
- Moeda: label e prefixo do campo "Valor Gasto" agora usam
  `useCurrency().symbol` em vez de `R$` fixo.

Testado ao vivo na conta de teste: lançada uma compra real pra confirmar o
toast, conferido visualmente, e removida em seguida (delete com delay de
10s, confirmado que o saldo voltou a `$0.00` após reload — a remoção foi
persistida no banco, não só otimista no cliente).

Nada de lógica de submit/validação, cálculo de saldo ou vínculo com Produtos
foi alterado — só o visual e os dois bugs de token/moeda.
