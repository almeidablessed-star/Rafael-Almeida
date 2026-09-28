# Pendência: mostrar o Lucro no card "Saldos & Divisão dos Pedidos"

> Registrado em 2026-09-27, durante a etapa que explicou melhor o card
> (ícone de ajuda, "—" no lugar do 0% e vermelho no saldo negativo). A linha do
> Lucro ficou **de fora de propósito**, porque é a única parte que exigiria
> cálculo novo.

## O problema

Uma venda paga se divide em cinco partes: ingrediente, mão de obra, contas da
empresa, investimento e **lucro**. O card mostra três círculos — Reposição, Mão
de obra e Custo+Investimento — e o lucro não aparece em lugar nenhum. Quem
tentar somar os três círculos não chega no valor do pedido, e nada na tela
explica por quê.

Hoje o texto de ajuda do card avisa que "o lucro também sai de cada venda, mas
não aparece aqui", o que resolve a confusão imediata. Falta mostrar o valor.

## A forma decidida: linha, não um quarto círculo

Verificado no código: **nenhum lançamento tira dinheiro do Lucro.** Os tipos de
transação existentes são `venda`, `reposicao`, `maodeobra`, `custo` e
`investimento` — não existe lançamento de lucro, e `calculateWeeklyBalances`
não tem um cofrinho para ele. Um quarto círculo ficaria em 100% para sempre e
não informaria nada.

Por isso a forma certa é uma **linha com o valor em dinheiro**, no rodapé do
card, abaixo da legenda de Despesas/Investimento. Algo como:

> Lucro da semana: $X — fica guardado, nenhum gasto sai daqui.

Acompanhando o período escolhido (`vocab.daPeriodo`: "da semana" / "da
quinzena" / "do mês") e a moeda configurada, como o resto do card.

## Por que isso é cálculo novo

O valor **não existe pronto** numa forma que sirva a este card. Há dois
candidatos, e os dois respondem outra pergunta:

1. A composição gravada em cada venda (`SaleBreakdown`) tem `reposicao`,
   `maoDeObra`, `custos`, `investimento`, `delivery` e `adicionais` — **não tem
   um campo de lucro**. Ele é o que sobra depois de tirar todo o resto.
2. `calculateSummary(...).lucroLiquido` existe, mas é calculado sobre o
   **filtro de período do topo da tela** (Este Mês, ano), não sobre a janela de
   reset do card, e além disso desconta os lançamentos de despesa. Usado aqui,
   ele apareceria contradizendo os círculos ao lado.

Seria preciso uma soma nova sobre a **mesma janela** dos círculos: para cada
venda paga do período, `totalValue` menos as partes já gravadas.

## A questão que ainda falta responder antes de implementar

**Como entram os pedidos pagos só com sinal?**

Esta é a pergunta que decide se o Lucro vai bater ou brigar com os círculos, e
ela não tem resposta óbvia — o card já trata o assunto de dois jeitos
diferentes:

- As **entradas dos cofrinhos** (`accumulatedInflow`) usam a composição cheia
  da venda (`parseSaleDetail`), ou seja, o valor **total** do pedido, mesmo que
  só o sinal tenha entrado no caixa.
- O **total pago** da mesma função (`totalPaidSalesAmount`) usa só o
  `signalValue`, e joga o restante em `totalAReceber`.

Então, num pedido de $500 com sinal de $100, os cofrinhos já contam a
composição dos $500, mas o dinheiro que entrou de verdade foi $100. Se o Lucro
for calculado sobre o valor recebido, ele vai parecer pequeno demais perto dos
círculos; se for sobre o valor total, vai mostrar como guardado um dinheiro que
ainda não chegou.

**Nenhuma das duas respostas é obviamente certa** — é uma decisão de produto, e
precisa ser tomada antes de escrever a conta, não depois. Vale decidir junto se
a mesma regra deveria valer para os três círculos, que hoje já usam o valor
cheio.

## Situação

Aguardando decisão. Nada implementado.
