import { RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Zoom de dois dedos na miniatura da folha do PDF (celular).
 *
 * O app inteiro bloqueia o zoom do sistema (`user-scalable=no` no index.html), e
 * liberar so nesta tela poderia deixar o app ampliado depois de fechar. Por isso
 * o zoom e proprio: amplia so a folha, dentro da area dela, e os botoes da janela
 * ficam parados.
 *
 * - dois dedos: amplia ate ZOOM_MAXIMO, centrado entre os dedos;
 * - um dedo, com a folha ampliada: arrasta. Sem zoom, um dedo rola a tela normal;
 * - toque duplo: amplia, ou volta ao tamanho normal.
 *
 * O transform e escrito direto no elemento durante o gesto: passar pelo React a
 * cada movimento redesenharia a folha inteira e o gesto ficaria travado. Por isso
 * o `style` da folha nao declara `transform`.
 */

const ZOOM_MAXIMO = 4;
const ZOOM_TOQUE_DUPLO = 2.5;
const INTERVALO_TOQUE_DUPLO_MS = 300;
const TOLERANCIA_TOQUE_PX = 12;

/** Posicao valida num eixo: menor que a area, centraliza; maior, nao deixa sobrar vazio. */
const limitar = (posicao: number, tamanho: number, area: number) =>
  tamanho <= area ? (area - tamanho) / 2 : Math.min(0, Math.max(area - tamanho, posicao));

type Medida = { escala: number; altura: number; recuo: number; largura: number };

export const useZoomDaPrevia = (
  areaRef: RefObject<HTMLDivElement | null>,
  folhaRef: RefObject<HTMLDivElement | null>,
  medida: Medida | null
) => {
  const [ampliada, setAmpliada] = useState(false);
  const medidaRef = useRef(medida);
  medidaRef.current = medida;
  // Zoom e canto superior esquerdo da folha, em px da area.
  const estado = useRef({ zoom: 1, esquerda: 0, topo: 0 });

  const desenhar = useCallback(() => {
    const folha = folhaRef.current;
    const m = medidaRef.current;
    if (!folha) return;
    if (!m) {
      folha.style.transform = '';
      return;
    }
    const { zoom, esquerda, topo } = estado.current;
    folha.style.transform = `translate(${esquerda - m.recuo}px, ${topo}px) scale(${m.escala * zoom})`;
  }, [folhaRef]);

  /** Aplica zoom e posicao, sempre dentro dos limites. */
  const aplicar = useCallback(
    (zoom: number, esquerda: number, topo: number) => {
      const m = medidaRef.current;
      const area = areaRef.current;
      if (!m || !area) return;
      const z = Math.min(ZOOM_MAXIMO, Math.max(1, zoom));
      estado.current = {
        zoom: z,
        esquerda: limitar(esquerda, m.largura * m.escala * z, area.clientWidth),
        topo: limitar(topo, m.altura * z, area.clientHeight),
      };
      area.style.touchAction = z > 1 ? 'none' : 'pan-y';
      desenhar();
      setAmpliada(z > 1);
    },
    [areaRef, desenhar]
  );

  const resetar = useCallback(() => {
    const m = medidaRef.current;
    aplicar(1, m ? m.recuo : 0, 0);
    if (!m) {
      estado.current = { zoom: 1, esquerda: 0, topo: 0 };
      setAmpliada(false);
    }
  }, [aplicar]);

  // Medida nova (girou a tela, trocou a aba da folha, entrou ou saiu a captura do
  // PDF): recomeca do tamanho normal.
  const chaveMedida = medida ? `${medida.escala}|${medida.altura}|${medida.recuo}` : '';
  useLayoutEffect(() => {
    resetar();
    desenhar();
  }, [chaveMedida, resetar, desenhar]);

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;

    const noPonto = (t: Touch) => {
      const r = area.getBoundingClientRect();
      return { x: t.clientX - r.left, y: t.clientY - r.top };
    };

    let pinca: { distancia: number; zoom: number; meioX: number; meioY: number; esquerda: number; topo: number } | null = null;
    let arraste: { x: number; y: number; esquerda: number; topo: number } | null = null;
    let toque: { x: number; y: number; moveu: boolean } | null = null;
    let ultimoToque: { x: number; y: number; quando: number } | null = null;

    const iniciarPinca = (a: Touch, b: Touch) => {
      const pa = noPonto(a);
      const pb = noPonto(b);
      pinca = {
        distancia: Math.hypot(pa.x - pb.x, pa.y - pb.y) || 1,
        zoom: estado.current.zoom,
        meioX: (pa.x + pb.x) / 2,
        meioY: (pa.y + pb.y) / 2,
        esquerda: estado.current.esquerda,
        topo: estado.current.topo,
      };
    };
    const iniciarArraste = (t: Touch) => {
      const p = noPonto(t);
      arraste = { x: p.x, y: p.y, esquerda: estado.current.esquerda, topo: estado.current.topo };
    };

    const aoTocar = (e: TouchEvent) => {
      if (!medidaRef.current) return;
      if (e.touches.length >= 2) {
        e.preventDefault();
        toque = null;
        arraste = null;
        iniciarPinca(e.touches[0], e.touches[1]);
        return;
      }
      const p = noPonto(e.touches[0]);
      toque = { x: p.x, y: p.y, moveu: false };
      if (estado.current.zoom > 1) iniciarArraste(e.touches[0]);
    };

    const aoMover = (e: TouchEvent) => {
      if (!medidaRef.current) return;
      if (e.touches.length >= 2 && pinca) {
        e.preventDefault();
        const pa = noPonto(e.touches[0]);
        const pb = noPonto(e.touches[1]);
        const distancia = Math.hypot(pa.x - pb.x, pa.y - pb.y);
        const zoom = Math.min(ZOOM_MAXIMO, Math.max(1, pinca.zoom * (distancia / pinca.distancia)));
        const proporcao = zoom / pinca.zoom;
        const meioX = (pa.x + pb.x) / 2;
        const meioY = (pa.y + pb.y) / 2;
        // O ponto da folha que estava entre os dedos continua entre os dedos.
        aplicar(zoom, meioX - (pinca.meioX - pinca.esquerda) * proporcao, meioY - (pinca.meioY - pinca.topo) * proporcao);
        return;
      }
      if (e.touches.length === 1) {
        const p = noPonto(e.touches[0]);
        if (toque && Math.hypot(p.x - toque.x, p.y - toque.y) > TOLERANCIA_TOQUE_PX) toque.moveu = true;
        if (arraste) {
          e.preventDefault();
          aplicar(estado.current.zoom, arraste.esquerda + p.x - arraste.x, arraste.topo + p.y - arraste.y);
        }
      }
    };

    const aoSoltar = (e: TouchEvent) => {
      if (!medidaRef.current) return;
      if (pinca) {
        pinca = null;
        // Sobrou um dedo na tela: ele continua arrastando dali, sem pulo.
        if (e.touches.length === 1 && estado.current.zoom > 1) iniciarArraste(e.touches[0]);
        ultimoToque = null;
        return;
      }
      if (e.touches.length > 0) return;
      arraste = null;
      const foi = toque;
      toque = null;
      if (!foi || foi.moveu) {
        ultimoToque = null;
        return;
      }
      const agora = Date.now();
      const duplo =
        ultimoToque &&
        agora - ultimoToque.quando < INTERVALO_TOQUE_DUPLO_MS &&
        Math.hypot(foi.x - ultimoToque.x, foi.y - ultimoToque.y) < TOLERANCIA_TOQUE_PX * 2;
      if (!duplo) {
        ultimoToque = { x: foi.x, y: foi.y, quando: agora };
        return;
      }
      ultimoToque = null;
      e.preventDefault();
      const m = medidaRef.current;
      if (estado.current.zoom > 1) {
        aplicar(1, m.recuo, 0);
      } else {
        // O ponto tocado fica onde esta.
        aplicar(
          ZOOM_TOQUE_DUPLO,
          foi.x - (foi.x - estado.current.esquerda) * ZOOM_TOQUE_DUPLO,
          foi.y - (foi.y - estado.current.topo) * ZOOM_TOQUE_DUPLO
        );
      }
    };

    const aoCancelar = () => {
      pinca = null;
      arraste = null;
      toque = null;
    };

    // Safari: sem isto, o gesto de pinca dele tambem reage.
    const bloquearGesto = (e: Event) => {
      if (medidaRef.current) e.preventDefault();
    };

    // passive: false porque o preventDefault precisa valer durante o gesto.
    area.addEventListener('touchstart', aoTocar, { passive: false });
    area.addEventListener('touchmove', aoMover, { passive: false });
    area.addEventListener('touchend', aoSoltar, { passive: false });
    area.addEventListener('touchcancel', aoCancelar);
    area.addEventListener('gesturestart', bloquearGesto, { passive: false });
    area.addEventListener('gesturechange', bloquearGesto, { passive: false });
    return () => {
      area.removeEventListener('touchstart', aoTocar);
      area.removeEventListener('touchmove', aoMover);
      area.removeEventListener('touchend', aoSoltar);
      area.removeEventListener('touchcancel', aoCancelar);
      area.removeEventListener('gesturestart', bloquearGesto);
      area.removeEventListener('gesturechange', bloquearGesto);
    };
  }, [areaRef, aplicar]);

  return { ampliada, resetar };
};
