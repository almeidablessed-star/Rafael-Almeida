import { useEffect } from 'react';

/**
 * Cor da barra de status do sistema (a faixa da hora e da bateria) no Android.
 *
 * No Android, com o app instalado, essa faixa e SOLIDA e fixa: o app nao
 * desenha por baixo dela, como faz no iPhone com `black-translucent`. Ela usa
 * a `<meta name="theme-color">`, e com o roxo mais escuro do degrade (#3A2350)
 * a faixa saia mais forte que o cabecalho e continuava roxa por cima do
 * conteudo claro quando a pessoa rolava a tela.
 *
 * Agora a cor acompanha a tela: no topo, um roxo do meio do degrade, que e o
 * tom que o cabecalho tem rente a borda de cima; depois que o cabecalho sai de
 * vista, o fundo claro do app. O Chrome do Android troca a cor da faixa na
 * hora quando a meta muda. No iPhone instalado a meta nao pinta nada (o
 * conteudo ja passa por baixo da faixa), entao la isto nao muda o visual.
 *
 * `aba` re-aplica a cor ao trocar de aba, porque cada aba volta ao topo.
 */
const ROXO_TOPO = '#4F2E5E';
const FUNDO_CLARO = '#F6F2F5';
// Altura rolada a partir da qual o cabecalho roxo ja saiu quase todo da tela.
const LIMITE_PX = 140;

export function useCorDaBarraDoSistema(aba: string) {
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    let atual = '';
    const aplica = () => {
      const cor = window.scrollY > LIMITE_PX ? FUNDO_CLARO : ROXO_TOPO;
      if (cor !== atual) {
        meta.setAttribute('content', cor);
        atual = cor;
      }
    };
    aplica();
    window.addEventListener('scroll', aplica, { passive: true });
    return () => window.removeEventListener('scroll', aplica);
  }, [aba]);
}
