import { supabase } from '../lib/supabase';

/**
 * Backup completo (versao 2): clientes, fichas tecnicas, produtos, Minha
 * Empresa e lancamentos, num arquivo so.
 *
 * SEM FOTOS, de proposito: elas eram ~99% do arquivo (medido em 26/10/2026:
 * 2,2 MB com fotos, 7 KB sem), e uma conta real com fotos passaria do limite
 * de restauracao (~20 MB). Quem restaura fica sem as fotos; a tela avisa.
 *
 * As linhas vao com os nomes das colunas do banco: quem le o arquivo de volta
 * e a funcao `restaurar_backup_completo`
 * (supabase/migrations/20261026150000_restaurar_backup_completo.sql), que
 * tambem religa insumo -> produto e pedido -> ficha pelos ids novos. Coluna
 * nova numa destas tabelas precisa entrar aqui E la.
 *
 * O backup antigo (versao 1, uma lista de lancamentos) continua restaurando
 * pelo caminho de sempre.
 */

export const VERSAO_BACKUP_COMPLETO = 2;

const COLUNAS = {
  produtos:
    'id,nome,categoria,preco_pago,quantidade_embalagem,unidade_embalagem,controla_estoque,quantidade_atual,quantidade_referencia,nivel_minimo,nivel_minimo_unidade,created_at,updated_at',
  fichas_tecnicas:
    'id,nome_produto,categoria,custo,mao_de_obra,reposicao,investimento,tamanhos,insumos,rendimento,created_at',
  clientes:
    'id,nome,telefone,endereco,city,notes,eventDate,recurringEventTitle,additionalEvents,created_at',
  transacoes:
    'id,tipo,descricao,data,quantidade,valor_unitario,valor_total,valor_sinal,status_pagamento,forma_pagamento,cliente_nome,cliente_telefone,data_evento,horario_entrega,endereco_entrega,observacoes,notas,fornecedor,periodo_mao_de_obra,categoria,breakdown,ficha_itens,insumos_consumidos,produto_id,created_at',
  despesas_empresa: 'nome,valor,percentual_rateio,ordem,created_at,updated_at',
  configuracao_empresa_historico: 'campo,valor_antigo,valor_novo,changed_at',
  administrative_costs:
    'agua,aluguel,energia,gas,internet,limpeza,gasolina,hora_trabalho,monthly_income_target,working_days_per_week,cmv_target_percent,investment_target_percent,profit_target_percent,migrado_de_colunas_fixas,periodo_reset',
  usuarias: 'nome_confeitaria,moeda,telefone,endereco,instagram',
};

export interface BackupCompleto {
  app: 'carula';
  versao: number;
  criadoEm: string;
  produtos: any[];
  fichas: any[];
  clientes: any[];
  transacoes: any[];
  despesas: any[];
  historico: any[];
  custos: Record<string, unknown> | null;
  perfil: Record<string, unknown> | null;
}

/** O Supabase devolve no maximo 1000 linhas por pedido: busca de 1000 em 1000. */
const buscarTodas = async (tabela: keyof typeof COLUNAS, uid: string, ordem: string) => {
  const PAGINA = 1000;
  const todas: any[] = [];
  for (let inicio = 0; ; inicio += PAGINA) {
    const { data, error } = await supabase
      .from(tabela)
      .select(COLUNAS[tabela])
      .eq('usuaria_id', uid)
      .order(ordem, { ascending: true })
      .range(inicio, inicio + PAGINA - 1);
    if (error) throw error;
    todas.push(...(data || []));
    if (!data || data.length < PAGINA) return todas;
  }
};

export const montarBackupCompleto = async (): Promise<BackupCompleto> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sem sessão: entre de novo e tente outra vez.');
  const uid = user.id;

  const [produtos, fichas, clientes, transacoes, despesas, historico] = await Promise.all([
    buscarTodas('produtos', uid, 'id'),
    buscarTodas('fichas_tecnicas', uid, 'id'),
    buscarTodas('clientes', uid, 'id'),
    buscarTodas('transacoes', uid, 'id'),
    buscarTodas('despesas_empresa', uid, 'ordem'),
    buscarTodas('configuracao_empresa_historico', uid, 'changed_at'),
  ]);

  const { data: custos, error: erroCustos } = await supabase
    .from('administrative_costs')
    .select(COLUNAS.administrative_costs)
    .eq('usuaria_id', uid)
    .limit(1)
    .maybeSingle();
  if (erroCustos) throw erroCustos;

  const { data: perfil, error: erroPerfil } = await supabase
    .from('usuarias')
    .select(COLUNAS.usuarias)
    .eq('id', uid)
    .maybeSingle();
  if (erroPerfil) throw erroPerfil;

  return {
    app: 'carula',
    versao: VERSAO_BACKUP_COMPLETO,
    criadoEm: new Date().toISOString(),
    produtos,
    fichas,
    clientes,
    transacoes,
    despesas,
    historico,
    custos: (custos as unknown as Record<string, unknown>) || null,
    perfil: (perfil as unknown as Record<string, unknown>) || null,
  };
};

/** O arquivo e um backup completo (versao 2)? O antigo e uma lista. */
export const ehBackupCompleto = (dado: unknown): dado is BackupCompleto =>
  !!dado && typeof dado === 'object' && !Array.isArray(dado) && (dado as any).versao === VERSAO_BACKUP_COMPLETO;

const TIPOS_VALIDOS = ['venda', 'reposicao', 'maodeobra', 'custo', 'investimento', 'lucro'];
const ehData = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/**
 * Confere o arquivo INTEIRO antes de qualquer coisa ser apagada. O banco ainda
 * recusa o resto (e desfaz tudo); aqui sai o erro claro dos casos comuns.
 */
export const validarBackupCompleto = (dado: BackupCompleto): string | null => {
  for (const lista of ['produtos', 'fichas', 'clientes', 'transacoes', 'despesas', 'historico'] as const) {
    if (dado[lista] !== undefined && !Array.isArray(dado[lista])) return `A parte "${lista}" do arquivo está quebrada.`;
  }
  const total =
    (dado.produtos?.length || 0) + (dado.fichas?.length || 0) + (dado.clientes?.length || 0) + (dado.transacoes?.length || 0);
  if (total === 0) return 'Este backup está vazio. Nada foi alterado.';

  const problemas: string[] = [];
  (dado.transacoes || []).forEach((t: any, i: number) => {
    if (!t || typeof t !== 'object') problemas.push(`lançamento ${i + 1}: formato errado`);
    else if (!TIPOS_VALIDOS.includes(t.tipo)) problemas.push(`lançamento ${i + 1}: tipo desconhecido`);
    else if (typeof t.descricao !== 'string') problemas.push(`lançamento ${i + 1}: falta a descrição`);
    else if (!ehData(t.data)) problemas.push(`lançamento ${i + 1}: falta a data`);
  });
  (dado.fichas || []).forEach((f: any, i: number) => {
    if (!f || typeof f !== 'object' || typeof f.nome_produto !== 'string') problemas.push(`ficha ${i + 1}: falta o nome`);
  });
  (dado.produtos || []).forEach((p: any, i: number) => {
    if (!p || typeof p !== 'object' || typeof p.nome !== 'string') problemas.push(`produto ${i + 1}: falta o nome`);
  });
  (dado.clientes || []).forEach((c: any, i: number) => {
    if (!c || typeof c !== 'object' || typeof c.nome !== 'string') problemas.push(`cliente ${i + 1}: falta o nome`);
  });
  if (problemas.length > 0) {
    return (
      `Este arquivo tem ${problemas.length} item(ns) com problema e não pode ser restaurado. Nada foi alterado.\n\n` +
      problemas.slice(0, 3).join('\n') +
      (problemas.length > 3 ? '\n...' : '')
    );
  }
  return null;
};

/** Troca tudo da conta pelo arquivo, numa transacao so (ver a funcao SQL). */
export const restaurarBackupCompleto = async (dado: BackupCompleto) => {
  const { data, error } = await supabase.rpc('restaurar_backup_completo', { dados: dado });
  if (error) throw error;
  return data as { produtos: number; fichas: number; clientes: number; transacoes: number; despesas: number };
};
