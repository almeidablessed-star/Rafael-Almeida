# Coluna no computador — desfazer

> **09/10/2026 — os dois ajustes de aparência abaixo foram DESFEITOS a pedido
> do usuário** ("desfaz tudo"). Revertidos e publicados nos commits `0b1d509`
> (desfaz `e673737`, a cor de fundo das abas) e `8320ec7` (desfaz `3629e9a`, o
> espaço no fim das telas). Motivo: depois desses dois commits o app perdeu
> partes do **topo** das telas no celular; o pedido original era só de ajuste
> na parte de **baixo**, ao rolar.
>
> O layout de computador (`a821a6e` e `0e8a670`) **continua no ar** — não foi
> revertido. Depois dos reverts, `src/` ficou idêntico a `0e8a670` (conferido:
> `git diff 0e8a670 HEAD -- src` vazio).
>
> As seções sobre esses dois commits ficam abaixo como registro do que eles
> faziam; para refazê-los um dia, é só reverter os reverts.

Commits: `a821a6e` (coluna centralizada a partir de 640px) e `0e8a670` (os
blocos de ponta a ponta param de vazar da coluna).

Publicado em 09/10/2026: **só o app**. Nenhuma Edge Function foi republicada
nesta mudança — o `smart-processor` segue na versão 24 (`d8ef546`).

## O que a mudança faz

A partir de 640px o app vira uma coluna centralizada de 480px (`#root`), com
fundo de areia em volta. Abaixo de 640px nada muda — conferido em 375 e 414px,
nas seis abas, comparando a geometria elemento a elemento.

## Desfazer (um bloco por vez no cmd)

```bash
git revert --no-edit 0e8a670 a821a6e
```

```bash
git push origin chore/carula-site-preview
```

```bash
git push origin HEAD:production && git push origin HEAD:master
```

A ordem importa: `0e8a670` foi feito em cima de `a821a6e`, então o de cima sai
primeiro. Depois disso o app volta a ocupar a janela inteira no computador,
com o selo "Pago" por cima do valor na aba Pedidos e o menu de baixo esticado
de ponta a ponta — era assim antes.

Nada de banco, função ou Hotmart está envolvido aqui: o desfazer é só o app.

## Espaço no fim das telas (`3629e9a`) — desfazer separado

Publicado em 09/10/2026, junto com o app. Mudou **uma linha** em
`src/index.css`: a classe `bottom-nav-safe` passou de 5rem (80px) fixos para
`calc(82px + max(1rem, env(safe-area-inset-bottom)))`, porque o menu de baixo
mede 70px mais a área segura do aparelho — faltavam 6px.

É independente dos dois commits acima; para tirar só ele:

```bash
git revert --no-edit 3629e9a
```

```bash
git push origin chore/carula-site-preview && git push origin HEAD:production && git push origin HEAD:master
```

Voltando atrás, um cartão que termine colado no fim do conteúdo volta a ficar
com 6px escondidos atrás do menu. Nada mais muda.

## Cor de fundo das abas (`e673737`) — desfazer separado

Publicado em 09/10/2026, só o app. Trocou **a cor do fundo** em cinco pontos
(Fichas, Produtos, Clientes e Compras), de `#FFFFFF`/`#FAF7FA` para `#F6F2F5`,
que é a cor que o Início já usava. Nenhuma classe de tamanho, posição ou
espaçamento foi tocada.

```bash
git revert --no-edit e673737
```

```bash
git push origin chore/carula-site-preview && git push origin HEAD:production && git push origin HEAD:master
```

Voltando atrás, reaparecem as faixas de cor diferente no fim dessas telas —
62px em Fichas, 26px em Produtos e 14px em Clientes.
