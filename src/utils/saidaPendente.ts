import { perguntar } from '../components/AvisoApp';

/**
 * Edicao que ainda nao foi salva numa tela fixa (ex.: despesas em Empresa).
 * Trocar de aba desmonta a tela e o que foi digitado some: quem troca de aba
 * pergunta aqui antes.
 */
let pendente: string | null = null;

export const marcarSaidaPendente = (mensagem: string | null) => {
  pendente = mensagem;
};

export const podeSair = async (): Promise<boolean> => {
  if (!pendente) return true;
  const sair = await perguntar(pendente, {
    titulo: 'Sair sem salvar?',
    confirmar: 'Sair sem salvar',
    cancelar: 'Continuar editando',
    perigo: true,
  });
  if (sair) pendente = null;
  return sair;
};
