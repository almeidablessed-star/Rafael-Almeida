import React, { useEffect, useRef } from 'react';
import { perguntar } from '../components/AvisoApp';

/**
 * O mesmo "Sair sem salvar?" do pedido, para os outros cadastros. Qualquer
 * digitacao ou toque em botao dentro de `ouvintes` conta como mexer; o X leva
 * `data-fechar` para nao contar. "Cancelar" continua saindo direto, porque ali a
 * intencao e clara.
 */
export function useSairSemSalvar(aberto: boolean) {
  const mexeuRef = useRef(false);

  useEffect(() => {
    if (aberto) mexeuRef.current = false;
  }, [aberto]);

  const marcar = () => {
    mexeuRef.current = true;
  };

  const ouvintes = {
    onInputCapture: marcar,
    onChangeCapture: marcar,
    onClickCapture: (e: React.MouseEvent) => {
      const alvo = e.target as HTMLElement;
      if (alvo.closest('button') && !alvo.closest('[data-fechar]')) marcar();
    },
  };

  const tentarFechar = async (fechar: () => void) => {
    if (
      mexeuRef.current &&
      !(await perguntar('O que você preencheu aqui ainda não foi salvo.', {
        titulo: 'Sair sem salvar?',
        confirmar: 'Sair sem salvar',
        cancelar: 'Continuar editando',
        perigo: true,
      }))
    ) {
      return;
    }
    fechar();
  };

  return { ouvintes, tentarFechar };
}
