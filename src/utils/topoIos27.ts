/**
 * Espaco extra no topo das telas SO no iPhone com iOS 27+ e o app instalado.
 *
 * O iOS 27 desenha um brilho ("Liquid Glass") na borda de cima dos apps salvos
 * na tela de inicio, ~40pt abaixo da hora, por cima do que estiver ali. Nao ha
 * CSS ou meta que desligue; uma faixa solida e um painel invisivel foram
 * testados no aparelho e nao adiantaram (revertidos). A saida e tirar os
 * botoes e textos da area: os cabecalhos roxos somam `var(--topo-ios27)` ao
 * padding de cima, e esta funcao liga essa variavel so onde o problema existe.
 *
 * COMO SABER QUE E iOS 27: nao da pelo userAgent. Desde o iOS 26 o Safari
 * congela a versao do sistema ("iPhone OS 18_x"), e o app instalado nao traz
 * o token "Version/". A primeira tentativa (c5a584c) lia o userAgent e nunca
 * ligava. Agora detecta pelo que o Safari 27 sabe fazer: o seletor `:heading`
 * e o `appearance: base-select` sao novos no Safari 27.0 (webkit.org/blog/18325)
 * e nao existem no 26. Exige os dois, para uma atualizacao 26.x que traga um
 * deles nao ligar o espaco num iOS 26.
 *
 * iOS 26 ou antes, Android, iPad e navegador ficam com 0px, como antes.
 * Quando a Apple corrigir o brilho, basta trocar ESPACO por '0px'.
 */
const ESPACO = '52px';

function ehIphoneInstalado(): boolean {
  const iphone = /iPhone|iPod/.test(navigator.userAgent);
  const instalado = (navigator as Navigator & { standalone?: boolean }).standalone === true
    || window.matchMedia('(display-mode: standalone)').matches;
  return iphone && instalado;
}

function temRecursosDoSafari27(): boolean {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return false;
  try {
    return CSS.supports('selector(:heading)') && CSS.supports('appearance', 'base-select');
  } catch {
    return false;
  }
}

export function ligaTopoIos27() {
  if (typeof window === 'undefined') return;
  if (ehIphoneInstalado() && temRecursosDoSafari27()) {
    document.documentElement.style.setProperty('--topo-ios27', ESPACO);
  }
}
