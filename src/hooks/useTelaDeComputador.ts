import { useEffect, useState } from 'react';

/**
 * Liga a versao computador: janela com 1024px ou mais, com ou sem toque.
 *
 * Ate 17/11/2026 o toque desligava esta versao (marca `tela-de-toque`, de
 * utils/telaDeToque.ts) e o iPad deitado ficava no layout de tablet — que nessa
 * largura sai desproporcional. Agora decide so a largura: iPad deitado (1133 a
 * 1366px) e iPad Pro grande em pe (1024px) recebem a versao computador; iPad
 * comum em pe (744 a 834px) segue no layout de tablet, porque o menu lateral
 * de 248px deixaria o conteudo apertado. Girar o aparelho troca na hora (o
 * App.tsx mantem as telas montadas nessa troca, para nao perder o que estava
 * sendo digitado).
 *
 * Desenho aprovado em docs/design/desktop-redesign/README.md.
 */
const CONSULTA = '(min-width: 1024px)';

const ehComputador = () => {
  if (typeof window === 'undefined') return false;
  try {
    return window.matchMedia(CONSULTA).matches;
  } catch {
    return false;
  }
};

export function useTelaDeComputador(): boolean {
  const [computador, setComputador] = useState(ehComputador);

  useEffect(() => {
    const mq = window.matchMedia(CONSULTA);
    const atualizar = () => setComputador(ehComputador());
    mq.addEventListener('change', atualizar);
    return () => mq.removeEventListener('change', atualizar);
  }, []);

  return computador;
}
