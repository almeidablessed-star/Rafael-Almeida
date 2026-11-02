import { useEffect, useRef } from 'react';
import { fecharAvisoAberto } from '../components/AvisoApp';

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
  if (!topo || topo.id <= entradaAtual()) return;
  // Com o "Sair sem salvar?" na tela, voltar de novo e "Continuar editando".
  // Antes o segundo voltar ja nao tinha entrada nenhuma e saia do app.
  if (fecharAvisoAberto()) {
    history.pushState({ carulaJanela: topo.id }, '');
    return;
  }
  topo.fechar();
};

export function useVoltarFecha(aberto: boolean, fechar: () => void | Promise<void>) {
  const fecharRef = useRef(fechar);
  fecharRef.current = fechar;

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
        // Repoe a entrada antes de perguntar: a pergunta fica em cima dela, e um
        // novo voltar cai em aoVoltar em vez de sair do app. Se a janela fechar,
        // a limpeza abaixo tira a entrada de novo.
        history.pushState({ carulaJanela: id }, '');
        await fecharRef.current();
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
