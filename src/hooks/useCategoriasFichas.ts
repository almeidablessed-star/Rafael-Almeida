import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { CATEGORIAS_CONTA_NOVA, CATEGORIAS_PADRAO, ConfigCategorias, lerConfigCategorias } from '../utils/categoriasFichas';

/**
 * Nomes, emojis e regras do "Montar bolo" das abas de Fichas da conta logada
 * (`usuarias.categorias_fichas`, ver utils/categoriasFichas.ts).
 *
 * Busca a coluna a parte, e nao junto do perfil no AuthContext, de proposito:
 * se ela falhar (coluna ainda nao criada, rede caindo), so as abas voltam ao
 * padrao — o login e o perfil nao dependem disto.
 *
 * Fichas, pedido e PDF usam ao mesmo tempo; o estado fica no modulo para todos
 * enxergarem a mesma coisa e uma busca so por conta.
 */
let atual: ConfigCategorias = CATEGORIAS_PADRAO;
let contaCarregada: string | null = null;
let buscando: Promise<void> | null = null;
const ouvintes = new Set<(c: ConfigCategorias) => void>();

const publicar = (config: ConfigCategorias) => {
  atual = config;
  ouvintes.forEach((ouvir) => ouvir(config));
};

const carregar = (uid: string) => {
  if (contaCarregada === uid || buscando) return;
  buscando = (async () => {
    try {
      const { data, error } = await supabase.from('usuarias').select('categorias_fichas').eq('id', uid).single();
      if (error) {
        contaCarregada = uid;
        publicar(CATEGORIAS_PADRAO);
        return;
      }
      if (data?.categorias_fichas) {
        contaCarregada = uid;
        publicar(lerConfigCategorias(data.categorias_fichas));
        return;
      }
      // Nada gravado ainda. Conta sem nenhuma ficha comeca com as abas do
      // Montar bolo (CATEGORIAS_CONTA_NOVA) e isso ja fica gravado — senao, na
      // primeira ficha cadastrada, as abas voltariam ao padrao antigo. Conta
      // com fichas, ou se a contagem falhar, fica com o padrao de sempre.
      const { count, error: erroContagem } = await supabase
        .from('fichas_tecnicas')
        .select('id', { count: 'exact', head: true })
        .eq('usuaria_id', uid);
      contaCarregada = uid;
      if (!erroContagem && count === 0) {
        publicar(CATEGORIAS_CONTA_NOVA);
        const { error: erroGravar } = await supabase.from('usuarias').update({ categorias_fichas: CATEGORIAS_CONTA_NOVA }).eq('id', uid);
        if (erroGravar) console.error('Erro ao gravar as abas iniciais das fichas:', erroGravar);
      } else {
        publicar(CATEGORIAS_PADRAO);
      }
    } catch {
      contaCarregada = uid;
      publicar(CATEGORIAS_PADRAO);
    } finally {
      buscando = null;
    }
  })();
};

export function useCategoriasFichas() {
  const { user } = useAuth();
  const [config, setConfig] = useState<ConfigCategorias>(atual);

  useEffect(() => {
    ouvintes.add(setConfig);
    setConfig(atual);
    return () => {
      ouvintes.delete(setConfig);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      contaCarregada = null;
      publicar(CATEGORIAS_PADRAO);
      return;
    }
    if (contaCarregada !== user.id) {
      contaCarregada = null;
      carregar(user.id);
    }
  }, [user]);

  /** Grava no banco; devolve false se nao deu (a tela avisa e mantem o rascunho). */
  const salvar = async (nova: ConfigCategorias): Promise<boolean> => {
    if (!user) return false;
    const limpa = lerConfigCategorias(nova);
    try {
      const { error } = await supabase.from('usuarias').update({ categorias_fichas: limpa }).eq('id', user.id);
      if (error) {
        console.error('Erro ao salvar as abas das fichas:', error);
        return false;
      }
    } catch (e) {
      console.error('Erro ao salvar as abas das fichas:', e);
      return false;
    }
    publicar(limpa);
    return true;
  };

  return { config, salvar };
}
