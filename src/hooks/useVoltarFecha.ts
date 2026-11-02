import { useEffect, useRef } from 'react';

/**
 * Botao voltar do celular (Android, e o gesto de voltar) fecha a janela aberta
 * em vez de sair do app. Cada janela aberta ganha uma entrada numerada no
 * historico; depois de um voltar, a janela de cima cuja entrada ficou para
 * tras e fechada. Se `fechar` perguntar "Sair sem salvar?" e a pessoa ficar,
 * a entrada volta.
 *
 * Nada de contar os voltar que o proprio app pede: o navegador junta dois
 * voltar seguidos num so, e a conta ficava errada (o voltar seguinte era
 * ignorado). O numero da entrada atual diz sozinho o que ficou para tras.
 */
type Janela = { id: number; fechar: () => Promise<void> };
const pilha: Janela[] = [];
// Comeca no relogio: entradas que sobraram de antes de recarregar ficam sempre
// com numero menor e nunca seguram uma janela nova aberta.
let ultimoId = Date.now();
let ouvindo = false;

const entradaAtual = (): number => Number(history.state?.carulaJanela) || 0;

const aoVoltar = () => {
  const topo = pilha[pilha.length - 1];
  if (topo && topo.id > entradaAtual()) topo.fechar();
};

export function useVoltarFecha(aberto: boolean, fechar: () => void | Promise<void>) {
  const fecharRef = useRef(fechar);
  fecharRef.current = fechar;
  const abertoRef = useRef(aberto);
  abertoRef.current = aberto;

  useEffect(() => {
    if (!aberto) return;
    if (!ouvindo) {
      window.addEventListener('popstate', aoVoltar);
      ouvindo = true;
    }
    const id = ++ultimoId;
    const janela: Janela = {
      id,
      fechar: async () => {
        await fecharRef.current();
        // Continuou aberta (escolheu continuar editando): repoe a entrada.
        await new Promise((r) => setTimeout(r, 0));
        if (abertoRef.current && pilha.includes(janela)) history.pushState({ carulaJanela: id }, '');
      },
    };
    pilha.push(janela);
    history.pushState({ carulaJanela: id }, '');
    return () => {
      const i = pilha.indexOf(janela);
      if (i >= 0) pilha.splice(i, 1);
      // Fechou por um botao: tira a propria entrada, se ainda for a atual.
      setTimeout(() => {
        if (entradaAtual() === id) history.back();
      }, 0);
    };
  }, [aberto]);
}
