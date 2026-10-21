/**
 * Espaco extra no topo das telas SO no iPhone com iOS 27+ e o app instalado.
 *
 * O iOS 27 desenha um brilho ("Liquid Glass") na borda de cima dos apps salvos
 * na tela de inicio, ~40pt abaixo da hora, por cima do que estiver ali. Nao ha
 * CSS ou meta que desligue; uma faixa solida e um painel invisivel foram
 * testados no aparelho e nao adiantaram (revertidos). A saida e tirar os
 * botoes e textos da area: os cabecalhos roxos somam `var(--topo-ios27)` ao
 * padding de cima, e esta funcao liga essa variavel (44px) so onde o problema
 * existe. iPhone no iOS 26 ou antes, Android e navegador ficam com 0px, ou seja,
 * exatamente como antes.
 *
 * Quando a Apple corrigir, basta trocar ESPACO por '0px' (ou subir a versao).
 */
const ESPACO = '44px';
const VERSAO_MINIMA = 27;

export function ligaTopoIos27() {
  if (typeof window === 'undefined') return;
  const versao = navigator.userAgent.match(/(?:iPhone|iPod)[^)]* OS (\d+)_/);
  const instalado = (navigator as Navigator & { standalone?: boolean }).standalone === true
    || window.matchMedia('(display-mode: standalone)').matches;
  if (versao && Number(versao[1]) >= VERSAO_MINIMA && instalado) {
    document.documentElement.style.setProperty('--topo-ios27', ESPACO);
  }
}
