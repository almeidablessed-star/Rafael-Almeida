# Nota: a legenda do Início mostra estimativa, não o valor real

> 2026-09-28. Próximo passo já identificado, **não implementado** e ainda não
> aprovado. Nota curta de propósito.

No card "Saldos & Divisão dos Pedidos" do Início, a linha de baixo diz algo como
"Despesas $14,15 · Investimento $7,00". Esses dois números **não são os saldos
reais**: o card mostra Despesas e Investimento somados numa pilha só, e a
legenda reparte essa pilha usando a **proporção das metas** configuradas em
Minha Empresa (no exemplo, 67% / 33%).

Ou seja, é uma estimativa apresentada com cara de fato. Se a confeiteira gastar
tudo de investimento e nada de despesas, a legenda continuará dizendo 67/33.

## Por que isso apareceu agora

A aba Compras passou a mostrar um cartão de **Investimento** com o saldo
**real** (commit desta etapa). Os dois números vão divergir na tela: o do Início
é proporcional às metas, o de Compras é o dinheiro que de fato sobrou.

## A correção proposta

Trocar a legenda do Início pelos **valores reais**, que já estão calculados e
disponíveis — o saldo de investimento existe pronto no mesmo cálculo que
alimenta os cartões, e o de despesas sai por subtração. Nenhuma conta nova.

**Isso muda números no Início**, então é um passo separado, com aprovação
própria. Ficou deliberadamente fora da etapa dos cartões de Compras para que
uma coisa não escondesse a outra.

## Uma pergunta junto

Se a legenda passar a mostrar os dois valores reais, talvez o card combinado
"Despesas + Investimento" do Início deixe de fazer sentido como pilha única —
poderia virar dois cartões, como ficou em Compras. Vale decidir as duas coisas
na mesma conversa.
