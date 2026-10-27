import { useEffect, useState } from 'react';

/**
 * Liga a versao computador: janela com 1024px ou mais e SEM toque.
 *
 * O toque vem da marca `tela-de-toque` (utils/telaDeToque.ts), posta no
 * `<html>` antes do primeiro render. Com ela, o iPad deitado (1180px) continua
 * no layout de tablet de hoje, mesmo passando de 1024px. Abaixo de 1024px vale
 * o de sempre: celular, ou a coluna de celular no meio da janela.
 *
 * Desenho aprovado em docs/design/desktop-redesign/README.md.
 */
const CONSULTA = '(min-width: 1024px)';

const ehComputador = () => {
  if (typeof window === 'undefined') return false;
  try {
    return (
      window.matchMedia(CONSULTA).matches &&
      !document.documentElement.classList.contains('tela-de-toque')
    );
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
