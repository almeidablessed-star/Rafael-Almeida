# Nota rápida: o rendimento pode sair sem a unidade no PDF de orçamento

> 2026-10-13. Achado de passagem ao fechar
> `docs/bug-rendimento-ficha-nao-persiste.md`. **Não investigado** — registrado
> só para não se perder. Nota curta de propósito.

## O que foi observado

Criei uma ficha de teste com rendimento **"10 Fatias"** (valor 10, unidade
Fatias no seletor ao lado) e conferi a linha crua no banco: o que ficou
gravado em `fichas_tecnicas.rendimento` foi **`"10"`**, sem a palavra
"Fatias".

Na tela isso não aparece como defeito: ao reabrir a ficha, o campo mostra 10 e
o seletor mostra Fatias, porque são dois controles separados.

O PDF de orçamento, porém, imprime o campo cru:

`src/components/QuotePdfModal.tsx`, por volta da linha 1275 —
`Rendimento: {ficha.yieldInfo}`.

Se o valor gravado for só o número, a linha do orçamento provavelmente sai
como **"Rendimento: 10"**, sem dizer de quê — 10 fatias? 10 unidades? 10
gramas? Para a cliente que recebe o orçamento, a informação fica ambígua.

## Por que isto NÃO é conclusão fechada

Existe código em `FichasTecnicasModule.tsx` (por volta das linhas 265-273) que
monta `${yieldInfo} ${label}` — ou seja, em algum caminho a unidade É anexada
ao texto. Esse caminho não rodou no meu teste, provavelmente porque deixei o
seletor na unidade padrão (Fatias) sem tocar nele.

Então há duas possibilidades, e não sei qual vale:

1. A unidade só é anexada quando a pessoa **troca** a unidade no seletor — e
   quem aceita o padrão grava só o número. Seria inconsistência real.
2. Há outro caminho que anexa sempre, e o meu teste passou por uma brecha.

**O PDF em si não foi gerado nem olhado.** Isso exigiria um pedido usando a
ficha e a geração do orçamento.

## O que fazer quando alguém retomar

1. Gerar um orçamento de verdade com uma ficha que tenha rendimento, e ver
   como a linha sai impressa. É o teste que decide se existe problema.
2. Se sair sem unidade: decidir entre gravar o texto completo ("10 Fatias") ou
   guardar valor e unidade em campos separados e juntar só na exibição. A
   segunda é mais correta e mais cara — mexe no schema.
3. Conferir também as fichas antigas, que caem no fallback
   (`getYieldInfoCompat`, a descrição do primeiro tamanho) e podem imprimir
   algo como "Rendimento: 20 cm" no orçamento — um diâmetro no lugar de uma
   contagem.
