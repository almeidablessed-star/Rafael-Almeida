# Fundo das abas no celular — desfazer

Publicado em 10/10/2026, **só o app**. Nenhuma Edge Function foi republicada
nesta sequência: o `smart-processor` segue na versão 24.

## O problema

No iPhone, ao rolar até o fim das telas, aparecia uma faixa de cor diferente do
fundo — roxa/rosa em algumas abas, um cinza levemente diferente em outras. A
aba **Início** era a única certa, e virou a referência: ela usa `#F6F2F5` do
cabeçalho ao fim.

## O que foi feito, em ordem

| Commit | O que mudou |
|---|---|
| `b429633` | **Pedidos:** tira a sombra roxa (`0 30px 70px`) do envoltório que embrulha a página inteira. Como ele não é um cartão, a sombra caía abaixo da borda de baixo dele e, no iPhone — onde `100vh` é maior que a área visível — essa borda fica acima do menu. |
| `384d53f` | A mesma sombra sai de **Fichas, Clientes, Produtos, Compras e Empresa**. |
| `9b1aac5` | **Clientes:** os fundos de tela passam de `#FAF7FA` para `#F6F2F5`. |
| `5d95c20` | **Clientes:** idem para o bloco da lista e a tela de carregamento. |
| `a9f84ab` | **Fichas** (folha era branca), **Produtos** e **Compras** (`#FAF7FA`) passam para `#F6F2F5`. |
| `6a2e43c` | **Fichas:** tira a sombra INTERNA roxa da folha (`inset 0 ±8px 16px`), que escurecia as bordas de cima e de baixo. Era a única sombra interna do app. |

Em todos eles, **cartões, blocos internos, campos de digitação e botões ficaram
como estavam** — só mudou o fundo que aparece por trás e no fim das telas.

## Garantias medidas

Em 375 e 414 px, nas seis abas, antes e depois de cada commit: os doze números
de verificação de geometria (posição e tamanho dos primeiros elementos)
bateram. Nenhuma mudança de posição ou tamanho, nem nos cabeçalhos. Em 1280 px
a coluna do computador seguiu em 480 px com o menu alinhado.

## Desfazer

Tudo de uma vez, do mais novo para o mais antigo:

```bash
git revert --no-edit 6a2e43c a9f84ab 5d95c20 9b1aac5 384d53f b429633
```

```bash
git push origin chore/carula-site-preview && git push origin HEAD:production && git push origin HEAD:master
```

Ou só um deles, usando a linha correspondente da tabela — eles são
independentes entre si, cada um mexe em um arquivo ou num conjunto próprio.

Voltando atrás, volta a faixa roxa/rosa no fim das telas e as abas voltam a ter
tons de fundo diferentes do Início.

## O que NÃO faz parte disto

O layout de computador (`a821a6e`, `0e8a670`) continua no ar e não tem relação
com esta sequência — o desfazer dele está em
[coluna-no-computador-desfazer.md](coluna-no-computador-desfazer.md).
