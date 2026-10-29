import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { abrirFoto, apagarFotoTrocada, ehEnderecoDeposito, guardarFoto } from '../utils/fotoDeposito';
import { supabase } from '../lib/supabase';
import { gerarMiniatura } from '../utils/imageCompression';
import { useAuth } from './AuthContext';
import { FichaTecnica, IngredientUsage } from '../types';

/**
 * Fonte unica das fichas tecnicas, compartilhada por todas as telas.
 *
 * Antes isto era o hook `hooks/useFichasTecnicas.ts`, com estado LOCAL — a
 * mesma estrutura que o `useCustomers` tinha, e o mesmo defeito latente: cada
 * componente que chamava o hook criava uma copia independente, e o useEffect de
 * busca dependia so de [user], que e definido no login e nunca muda. Cada tela
 * buscava do banco uma unica vez, no carregamento da pagina.
 *
 * Aqui os dois lados do problema ja existiam: o `FichasTecnicasModule` grava e
 * o `TransactionFormModal` le. Cadastrar uma ficha nova na aba Fichas nao a
 * fazia aparecer no formulario de pedido ate um F5 — e como o formulario casa
 * produto com ficha por nome para dar baixa no estoque, uma ficha invisivel
 * significa pedido lancado sem baixa nenhuma, silenciosamente.
 *
 * Com um provider unico, quem cadastra e quem consulta compartilham o mesmo
 * array. Ver [[CustomersContext]], que resolve o mesmo problema para clientes.
 */

/** Formato da tabela `fichas_tecnicas` no Supabase. */
interface SupabaseFichaTecnica {
  id: number;
  usuaria_id: string;
  nome_produto: string;
  categoria: string;
  foto_url?: string;
  foto_mini?: string | null;
  rendimento?: string | null;
  tamanhos: Array<{
    id: string;
    descricao: string;
    preco: number;
    quantidade?: number;
    horasTrabalho?: number;
    valorHora?: number;
    rendimento?: string | null;
    ingredients?: IngredientUsage[];
    maoDeObraCost?: number;
    custoCost?: number;
    investimentoCost?: number;
  }>;
  insumos: IngredientUsage[];
  mao_de_obra: number;
  custo: number;
  reposicao: number;
  investimento: number;
  created_at: string;
  updated_at: string;
}

interface FichasTecnicasContextType {
  fichas: FichaTecnica[];
  isLoading: boolean;
  error: string | null;
  fetchFichas: () => Promise<void>;
  fetchFichaPhoto: (fichaId: string) => Promise<string | null>;
  addFicha: (data: Omit<FichaTecnica, 'id' | 'createdAt'>) => Promise<FichaTecnica>;
  updateFicha: (id: string, data: Omit<FichaTecnica, 'id' | 'createdAt'>) => Promise<FichaTecnica>;
  deleteFicha: (id: string) => Promise<void>;
  restoreFicha: (ficha: FichaTecnica) => Promise<void>;
}

const FichasTecnicasContext = createContext<FichasTecnicasContextType | undefined>(undefined);

const mapSupabaseToFicha = (data: SupabaseFichaTecnica): FichaTecnica => {
  // Normalize category: bolo -> bolos, doce -> doces
  let normalizedCategory = data.categoria;
  if (normalizedCategory === 'bolo') normalizedCategory = 'bolos';
  if (normalizedCategory === 'doce') normalizedCategory = 'doces';

  // Ficha sem tamanho nenhum abre com UM, nao com tres.
  //
  // Os tres vazios vinham de quando o formulario tambem nascia com tres. Cada
  // confeiteira tem uma realidade — umas vendem um tamanho so — e dois campos
  // extras em branco sugeriam que era preciso preencher os tres. Quem precisa
  // de mais usa o "+ Adicionar" no formulario, um de cada vez.
  let tamanhos = data.tamanhos || [];
  if (tamanhos.length === 0) {
    tamanhos = [
      { id: 'ts-1', descricao: '1', preco: 0, maoDeObraCost: 0, custoCost: 0, investimentoCost: 0 },
    ];
  }

  return {
    id: String(data.id),
    name: data.nome_produto,
    category: normalizedCategory as any,
    // Endereco do deposito nao vai para a tela: quem mostra a foto pede o link
    // por `fetchFichaPhoto` (ver utils/fotoDeposito.ts).
    imageUrl: ehEnderecoDeposito(data.foto_url) ? undefined : data.foto_url,
    fotoMini: data.foto_mini || undefined,
    yieldInfo: data.rendimento || undefined,
    tamanhos: tamanhos,
    ingredients: data.insumos || [],
    maoDeObraCost: data.mao_de_obra,
    custoCost: data.custo,
    investimentoCost: data.investimento,
    createdAt: new Date(data.created_at).getTime(),
    // Coluna nova (migration 20260922) — ficha buscada antes dela existir no
    // banco simplesmente nao traz o campo, e o fallback pro created_at evita
    // undefined em vez de quebrar a comparacao de "ficha desatualizada".
    updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : new Date(data.created_at).getTime(),
  };
};

/** Lado da miniatura da ficha: o card mostra a foto em 72 px; o dobro cobre
 * tela retina. */
const LADO_MINI_FICHA = 144;

/**
 * Foto e miniatura andam juntas, e `undefined` quer dizer "a foto nao foi
 * carregada nesta tela": as duas colunas ficam de FORA do update e o banco
 * mantem o que tinha. Antes, salvar a edicao antes de a foto terminar de
 * carregar gravava a foto generica de bolo no lugar da verdadeira.
 *
 * Foto que nao e data URI (o link da foto generica) ja e leve: vira a propria
 * miniatura.
 */
/**
 * Ficha nova (criar ou duplicar). Duplicando uma ficha cuja foto ja esta no
 * deposito, a miniatura nao tem de onde ser gerada (nao ha data URI): vale a
 * miniatura da ficha original, que o Duplicar manda junto em `fotoMini`.
 */
const fotoDaFichaNova = async (fichaData: Omit<FichaTecnica, 'id' | 'createdAt'>, usuariaId: string) => {
  const foto = (await fotoEMiniaturaDaFicha(fichaData.imageUrl, usuariaId, true)) as { foto_url?: string | null; foto_mini?: string | null };
  if (foto.foto_url && foto.foto_mini === undefined && fichaData.fotoMini) return { ...foto, foto_mini: fichaData.fotoMini };
  return foto;
};

const fotoEMiniaturaDaFicha = async (imageUrl: string | undefined, usuariaId: string, novoRegistro = false) => {
  if (imageUrl === undefined) return {};
  if (!imageUrl) return { foto_url: null, foto_mini: null };
  // Foto nova (data URI) ou ja do deposito: o arquivo vai/fica no deposito e o
  // banco guarda so o endereco. Ver utils/fotoDeposito.ts.
  const foto_url = await guardarFoto(imageUrl, usuariaId, 'fichas', { novoRegistro });
  if (imageUrl.startsWith('data:')) return { foto_url, foto_mini: await gerarMiniatura(imageUrl, LADO_MINI_FICHA) };
  // A mesma foto de antes: a miniatura gravada continua valendo.
  if (ehEnderecoDeposito(foto_url)) return { foto_url };
  return { foto_url, foto_mini: imageUrl };
};

const mapFichaToSupabase = (ficha: Omit<FichaTecnica, 'id' | 'createdAt'>) => ({
  nome_produto: ficha.name,
  categoria: ficha.category,
  rendimento: ficha.yieldInfo || null,
  tamanhos: (ficha.tamanhos || []).map(t => ({
    id: t.id,
    descricao: t.descricao,
    preco: t.preco,
    quantidade: t.quantidade,
    // Horas e tarifa: sao o que a confeiteira PREENCHE, e `maoDeObraCost` e o
    // resultado. Sem grava-las, reabrir a ficha mostrava o valor calculado mas
    // os campos de origem em branco — a conta perdia a memoria de si mesma.
    horasTrabalho: t.horasTrabalho ?? null,
    valorHora: t.valorHora ?? null,
    // Rendimento DESTE tamanho. Sem grava-lo aqui ele existiria so na tela e
    // sumiria ao salvar — o mesmo descarte silencioso que ja aconteceu com
    // horas, tarifa e a lista de insumos. Este mapeador e um whitelist: campo
    // novo no tipo que nao for citado aqui nao chega ao banco.
    rendimento: t.rendimento ?? null,
    // Insumos DESTE tamanho. Sem grava-los aqui, a lista por tamanho existiria
    // so na tela e a baixa de estoque continuaria usando a da ficha — o mesmo
    // descarte silencioso que acabou de acontecer com horas e tarifa.
    ingredients: t.ingredients ?? [],
    maoDeObraCost: t.maoDeObraCost ?? 0,
    custoCost: t.custoCost ?? 0,
    investimentoCost: t.investimentoCost ?? 0,
  })),
  insumos: ficha.ingredients || [],
  // A coluna continua existindo no banco (pode ser NOT NULL), mas o app nao a
  // le mais: grava 0 e pronto. Ver o commit que removeu `reposicaoCost`.
  reposicao: 0,
  mao_de_obra: ficha.maoDeObraCost,
  custo: ficha.custoCost,
  investimento: ficha.investimentoCost,
});

export const FichasTecnicasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [fichas, setFichas] = useState<FichaTecnica[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      // Logout limpa a lista: sem isto, as fichas da conta anterior
      // continuariam em memoria para quem entrasse depois.
      setFichas([]);
      return;
    }
    fetchFichas();
  }, [user]);

  const fetchFichas = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('fichas_tecnicas')
        // Sem `foto_url` (a foto inteira, pesada) mas COM `foto_mini`: a lista
        // mostra a miniatura, que vem junto, de uma vez. Antes a aba buscava
        // as fotos inteiras uma a uma a cada volta (~7 MB, 3 a 4 s).
        .select('id,usuaria_id,nome_produto,categoria,rendimento,tamanhos,insumos,mao_de_obra,custo,reposicao,investimento,created_at,updated_at,foto_mini')
        .eq('usuaria_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Sem fallback para localStorage, de proposito.
      //
      // Havia aqui uma queda para `carula_fichas_tecnicas` quando o Supabase
      // vinha vazio ou dava erro. O efeito era pior do que o problema: fichas
      // de uma fase antiga voltavam a aparecer na tela com ids que NAO existem
      // no banco, entao editar ou apagar qualquer uma delas falhava no
      // `parseInt(id)`. E uma lista vazia por falha de rede virava "voce nao
      // tem fichas", que e uma afirmacao falsa.
      //
      // Vazio agora significa vazio; erro agora aparece como erro.
      setFichas((data || []).map(mapSupabaseToFicha));
      void gerarMiniaturasQueFaltam();
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar fichas técnicas');
      console.error('Error fetching fichas:', err);
      setFichas([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addFicha = async (fichaData: Omit<FichaTecnica, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const { data, error: insertError } = await supabase
        .from('fichas_tecnicas')
        .insert([{ usuaria_id: user.id, ...mapFichaToSupabase(fichaData), ...(await fotoDaFichaNova(fichaData, user.id)) }])
        .select()
        .single();

      if (insertError) throw insertError;

      const newFicha = mapSupabaseToFicha(data);
      // Atualizacao funcional: duas telas podem gravar em sequencia, e a forma
      // `[nova, ...fichas]` usaria uma copia possivelmente velha.
      setFichas((prev) => [newFicha, ...prev]);
      return newFicha;
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar ficha técnica');
      throw err;
    }
  };

  const updateFicha = async (id: string, fichaData: Omit<FichaTecnica, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      // Foto que estava gravada, para apagar do deposito se for trocada.
      const fotoAntes =
        fichaData.imageUrl === undefined
          ? undefined
          : (await supabase.from('fichas_tecnicas').select('foto_url').eq('id', parseInt(id)).eq('usuaria_id', user.id).single()).data?.foto_url;
      const foto = await fotoEMiniaturaDaFicha(fichaData.imageUrl, user.id);
      const { data, error: updateError } = await supabase
        .from('fichas_tecnicas')
        .update({ ...mapFichaToSupabase(fichaData), ...foto })
        .eq('id', parseInt(id))
        .eq('usuaria_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      await apagarFotoTrocada(fotoAntes, (foto as { foto_url?: string | null }).foto_url);

      const updated = mapSupabaseToFicha(data);
      setFichas((prev) => prev.map((f) => (f.id === id ? updated : f)));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar ficha técnica');
      throw err;
    }
  };

  const deleteFicha = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('fichas_tecnicas')
        .delete()
        .eq('id', parseInt(id))
        .eq('usuaria_id', user.id);

      if (deleteError) throw deleteError;

      setFichas((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar ficha técnica');
      throw err;
    }
  };

  const restoreFicha = async (ficha: FichaTecnica) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const { data, error: insertError } = await supabase
        .from('fichas_tecnicas')
        .insert([
          {
            id: parseInt(ficha.id),
            usuaria_id: user.id,
            nome_produto: ficha.name,
            categoria: ficha.category,
            foto_url: (await guardarFoto(ficha.imageUrl, user.id, 'fichas')) ?? null,
            tamanhos: ficha.tamanhos,
            insumos: ficha.ingredients,
            mao_de_obra: ficha.maoDeObraCost,
            custo: ficha.custoCost,
            reposicao: 0,
            investimento: ficha.investimentoCost,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      const restored = mapSupabaseToFicha(data);
      setFichas((prev) => [restored, ...prev]);
    } catch (err: any) {
      setError(err.message || 'Erro ao restaurar ficha técnica');
      throw err;
    }
  };

  /**
   * Fichas salvas antes da miniatura existir: tem foto, mas `foto_mini` vazia.
   * Uma vez por sessao, busca a foto de cada uma (so dessas), gera a
   * miniatura e grava. Uma por vez, para nao baixar todas de uma vez no 4G.
   */
  const miniaturasEmAndamentoRef = useRef(false);
  const gerarMiniaturasQueFaltam = async () => {
    if (!user || miniaturasEmAndamentoRef.current) return;
    miniaturasEmAndamentoRef.current = true;
    try {
      const { data: pendentes, error: erroPendentes } = await supabase
        .from('fichas_tecnicas')
        .select('id')
        .eq('usuaria_id', user.id)
        .not('foto_url', 'is', null)
        .is('foto_mini', null);
      if (erroPendentes || !pendentes) return;

      for (const { id } of pendentes) {
        const { data: linha } = await supabase
          .from('fichas_tecnicas')
          .select('foto_url')
          .eq('id', id)
          .eq('usuaria_id', user.id)
          .single();
        // So fotos antigas (data URI): as do deposito ja nascem com miniatura.
        if (!linha?.foto_url || !linha.foto_url.startsWith('data:')) continue;
        const foto_mini = await gerarMiniatura(linha.foto_url, LADO_MINI_FICHA);
        if (!foto_mini) continue;
        const { error: erroGravar } = await supabase
          .from('fichas_tecnicas')
          .update({ foto_mini })
          .eq('id', id)
          .eq('usuaria_id', user.id);
        if (erroGravar) continue;
        setFichas((prev) => prev.map((f) => (f.id === String(id) ? { ...f, fotoMini: foto_mini } : f)));
      }
    } catch (err) {
      console.error('Erro ao gerar miniaturas das fichas:', err);
    } finally {
      miniaturasEmAndamentoRef.current = false;
    }
  };

  const fetchFichaPhoto = async (fichaId: string): Promise<string | null> => {
    const existing = fichas.find(f => f.id === fichaId);
    if (existing?.imageUrl) return abrirFoto(existing.imageUrl);

    try {
      const { data, error } = await supabase
        .from('fichas_tecnicas')
        .select('foto_url')
        .eq('id', parseInt(fichaId))
        .eq('usuaria_id', user?.id)
        .single();

      if (error) throw error;
      return abrirFoto(data?.foto_url);
    } catch (err: any) {
      console.error('Error fetching ficha photo:', err);
      return null;
    }
  };

  return (
    <FichasTecnicasContext.Provider
      value={{ fichas, isLoading, error, fetchFichas, fetchFichaPhoto, addFicha, updateFicha, deleteFicha, restoreFicha }}
    >
      {children}
    </FichasTecnicasContext.Provider>
  );
};

export const useFichasTecnicas = () => {
  const context = useContext(FichasTecnicasContext);
  if (!context) {
    throw new Error('useFichasTecnicas precisa estar dentro de <FichasTecnicasProvider>');
  }
  return context;
};
