/**
 * Contorno EXPERIMENTAL para o brilho no topo do app instalado no iPhone (iOS 27).
 *
 * Desde o iOS 26 o sistema desenha um efeito de vidro ("Liquid Glass") na borda
 * de cima dos apps salvos na tela de inicio que usam a barra transparente, e no
 * iOS 27 ele virou um brilho forte, ~40pt abaixo da hora. Nao ha CSS nem meta
 * que desligue. A faixa solida de App.tsx (fdb9849) nao resolveu no aparelho de
 * teste com iOS 27.
 *
 * Este truque vem de um relato (tips.ojapp.app/en/ios-27-pwa-top-blur-workaround-2):
 * o brilho sumia depois de abrir e fechar um menu lateral. Aqui isso e
 * reproduzido sem nada visivel: uma cobertura e um painel quase transparentes
 * (opacidade 0.01, sem receber toques) aparecem por 500ms e o painel desliza
 * para fora da tela, ficando no DOM. Roda so no iPhone/iPad com o app
 * instalado, ao abrir e ao voltar do segundo plano.
 *
 * Nao e tecnica oficial da Apple nem do WebKit: pode parar de funcionar numa
 * atualizacao. Quando a Apple corrigir o iOS, este arquivo pode sair.
 */
const ID_COBERTURA = 'carula-ios-brilho-cobertura';
const ID_PAINEL = 'carula-ios-brilho-painel';

function ehIosInstalado(): boolean {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const instalado = (navigator as Navigator & { standalone?: boolean }).standalone === true
    || window.matchMedia('(display-mode: standalone)').matches;
  return ios && instalado;
}

function pega(id: string, css: string): HTMLDivElement {
  let el = document.getElementById(id) as HTMLDivElement | null;
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = css;
    document.body.appendChild(el);
  }
  return el;
}

function passaOPainel() {
  const cobertura = pega(ID_COBERTURA,
    'position:fixed;inset:0;z-index:2147483646;background:rgba(255,255,255,0.01);pointer-events:none;display:none');
  const painel = pega(ID_PAINEL,
    'position:fixed;top:0;right:0;bottom:0;width:90%;height:100%;z-index:2147483647;background:rgba(255,255,255,0.01);pointer-events:none;transform:translateX(110%);transition:transform .3s');
  cobertura.style.display = 'block';
  painel.style.transform = 'translateX(0%)';
  window.setTimeout(() => {
    cobertura.style.display = 'none';
    painel.style.transform = 'translateX(110%)';
  }, 500);
}

export function contornaBrilhoDoTopoIos() {
  if (typeof window === 'undefined' || !ehIosInstalado()) return;
  if (document.readyState === 'complete') passaOPainel();
  else window.addEventListener('load', passaOPainel, { once: true });
  // Ao voltar do segundo plano o iOS pode redesenhar a borda: repete.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') passaOPainel();
  });
}
