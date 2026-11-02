import { useEffect, useRef } from 'react';

/**
 * Busca de novo quando a pessoa volta para o app (outra aba, outro app, tela
 * bloqueada) e, com ele aberto, a cada 5 minutos. Sem isto a tela ficava com o
 * que foi carregado ao abrir: com celular e computador ao mesmo tempo, ou o app
 * aberto por horas, um ajuste feito com dados velhos gravava o estoque antigo.
 */
const INTERVALO_MINIMO = 30 * 1000;
const A_CADA = 5 * 60 * 1000;

export function useAoVoltarParaOApp(buscar: () => void, ativo: boolean) {
  const buscarRef = useRef(buscar);
  buscarRef.current = buscar;

  useEffect(() => {
    if (!ativo) return;
    let ultima = Date.now();
    const talvezBuscar = (minimo: number) => {
      if (document.visibilityState !== 'visible' || Date.now() - ultima < minimo) return;
      ultima = Date.now();
      buscarRef.current();
    };
    const aoVoltar = () => talvezBuscar(INTERVALO_MINIMO);
    document.addEventListener('visibilitychange', aoVoltar);
    window.addEventListener('focus', aoVoltar);
    const timer = setInterval(() => talvezBuscar(A_CADA), A_CADA);
    return () => {
      document.removeEventListener('visibilitychange', aoVoltar);
      window.removeEventListener('focus', aoVoltar);
      clearInterval(timer);
    };
  }, [ativo]);
}
