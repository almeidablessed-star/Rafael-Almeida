/**
 * Marca o `<html>` com `tela-de-toque` em aparelho de toque (iPad, tablet
 * Android, celular).
 *
 * A partir de 640px o app vira uma coluna de celular no meio da tela (ver
 * "COLUNA NO COMPUTADOR" em index.css). No computador isso continua; no iPad a
 * coluna deixava ~40% da tela em bege, e muitas confeiteiras trabalham no iPad
 * justamente por ser maior que o celular. Com esta marca, o index.css deixa o
 * app ocupar a tela toda e poe Pedidos e Fichas em grade.
 *
 * Por que nao so pela largura: um iPad em pe (820px) e uma janela estreita de
 * computador tem a mesma largura. O que separa os dois e o toque. O iPad se
 * apresenta como Mac no userAgent, entao tambem nao da por ele; mas tem
 * `maxTouchPoints` > 1 e ponteiro "grosso" (dedo). No celular a marca tambem
 * liga, mas abaixo de 640px nenhuma regra dela vale.
 */
export function ligaTelaDeToque() {
  try {
    const toque = navigator.maxTouchPoints > 1 && window.matchMedia('(pointer: coarse)').matches;
    if (toque) document.documentElement.classList.add('tela-de-toque');
  } catch {
    // Sem a marca o app so fica na coluna, como sempre foi.
  }
}
