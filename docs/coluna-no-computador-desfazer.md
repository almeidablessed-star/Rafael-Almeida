# Coluna no computador — desfazer

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
