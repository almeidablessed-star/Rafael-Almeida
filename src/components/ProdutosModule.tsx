import React, { useState, useEffect, useRef } from 'react';
import { Produto, Transaction } from '../types';
import { useProdutos } from '../context/ProdutosContext';
import { formatQuantity } from '../utils/formatters';
import { useCurrency } from '../context/CurrencyContext';
import { capitalizeFirstLetter } from '../utils/textCase';
import { StockMovementsHistory } from './StockMovementsHistory';
import { BalancesAndExpensesModule } from './BalancesAndExpensesModule';
import { GenericDeleteConfirmModal } from './GenericDeleteConfirmModal';
import { DuplicateNameWarningModal } from './DuplicateNameWarningModal';
import { useDelayedDelete } from '../hooks/useDelayedDelete';
import { FieldValidationError } from './FieldValidationError';
import { normalizeName } from '../utils/fichaMatcher';
import {
  Package,
  Plus,
  AlertTriangle,
  Search,
  Edit3,
  Trash2,
  Check,
  Sparkles,
} from 'lucide-react';

/**
 * Catalogo unico "Produtos" (spec Modulo Produtos, secao 2). Substitui o
 * antigo EstoqueModule como fonte de verdade de precos/estoque — a aba
 * "Estoque" de antes vira aqui um FILTRO (`controlaEstoque = true`), nao uma
 * tela separada.
 *
 * O antigo EstoqueModule/EstoqueContext continuam existindo por enquanto
 * (nada foi removido) ate Fichas e Compras estarem religados a este catalogo
 * — mesma cautela incremental usada na reestruturacao financeira (o
 * AdminCostsCard so foi removido depois do MinhaEmpresaCard provado).
 */

const CATEGORIAS_SUGERIDAS = ['Massa', 'Recheio', 'Cobertura', 'Decoração', 'Embalagem'];
const UNIDADES: Produto['unidadeEmbalagem'][] = ['g', 'kg', 'ml', 'L', 'un', 'pacote'];

const getColorBasedOnThreshold = (
  quantity: number,
  minThreshold: number
): { stroke: string; text: string; background: string } => {
  if (quantity < minThreshold) {
    return { stroke: '#C4626F', text: '#C4626F', background: '#FFEBEE' };
  }
  if (minThreshold <= 0) {
    return quantity > 0
      ? { stroke: '#4CAF7D', text: '#4CAF7D', background: '#E8F5E9' }
      : { stroke: '#C4626F', text: '#C4626F', background: '#FFEBEE' };
  }
  const slack = ((quantity - minThreshold) / minThreshold) * 100;
  if (slack >= 75) return { stroke: '#4CAF7D', text: '#4CAF7D', background: '#E8F5E9' };
  if (slack >= 50) return { stroke: '#81C784', text: '#81C784', background: '#F1F8E9' };
  if (slack >= 25) return { stroke: '#F5A623', text: '#F5A623', background: '#FFF3E0' };
  return { stroke: '#C4626F', text: '#C4626F', background: '#FFEBEE' };
};

/**
 * Percentual do anel de estoque — mesma base de calculo (quantity vs
 * minThreshold) e os MESMOS cortes de `getColorBasedOnThreshold` (slack de
 * 25/50/75%), para o numero e a cor sempre contarem a mesma historia. Antes
 * comparava quantidadeAtual com quantidadeReferencia (o ultimo "estoque
 * cheio" de reabastecimento) — uma base sem nenhuma relacao com o alerta
 * minimo, entao o anel podia ficar laranja/vermelho com o numero preso em
 * 100%.
 *
 * Reta unica: 0 -> 0%, minThreshold -> 25%, 1.25x -> 50% (cor vira laranja),
 * 1.5x -> 75% (cor vira verde claro), 1.75x -> 100%, capado (cor vira verde
 * forte).
 */
const getPercentageBasedOnThreshold = (quantity: number, minThreshold: number): number => {
  if (minThreshold <= 0) return quantity > 0 ? 100 : 0;
  if (quantity < minThreshold) return Math.max(0, (quantity / minThreshold) * 25);
  const slack = ((quantity - minThreshold) / minThreshold) * 100;
  return Math.min(100, 25 + slack);
};

const getStatusLabel = (quantity: number, minThreshold: number): string => {
  if (quantity < minThreshold) return 'Crítico';
  if (minThreshold <= 0) return quantity > 0 ? 'Alto' : 'Crítico';
  const slack = ((quantity - minThreshold) / minThreshold) * 100;
  if (slack < 25) return 'Alerta';
  if (slack < 50) return 'Atenção';
  if (slack < 75) return 'Normal';
  return 'Alto';
};

const getCriticalityRank = (quantity: number, minThreshold: number): number => {
  if (quantity < minThreshold) return 0;
  if (minThreshold <= 0) return quantity > 0 ? 4 : 0;
  const slack = ((quantity - minThreshold) / minThreshold) * 100;
  if (slack < 25) return 1;
  if (slack < 50) return 2;
  if (slack < 75) return 3;
  return 4;
};

/**
 * Compara quantidade e alerta minimo em unidades diferentes (ex: quantidade
 * em kg, alerta em g) sem essa normalizacao, 2.5kg comparava cru com 500 e
 * parecia "menor" — mesmo bug ja corrigido uma vez em EstoqueModule.tsx,
 * reproduzido aqui por descuido e pego no teste manual desta tela.
 */
const normalizeToCommonUnit = (value: number, fromUnit: string, toUnit: string): number => {
  if (fromUnit === toUnit) return value;
  if (fromUnit === 'kg' && toUnit === 'g') return value * 1000;
  if (fromUnit === 'g' && toUnit === 'kg') return value / 1000;
  if (fromUnit === 'L' && toUnit === 'ml') return value * 1000;
  if (fromUnit === 'ml' && toUnit === 'L') return value / 1000;
  return value;
};

const getThresholdDelta = (unit: string): number => {
  if (unit === 'kg' || unit === 'L') return 0.5;
  if (unit === 'g' || unit === 'ml') return 100;
  return 1;
};

interface ProdutosModuleProps {
  /** Repassados direto para o BalancesAndExpensesModule embutido na aba Compras. */
  transactions: Transaction[];
  onAddTransaction: (txData: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  /**
   * Pedido externo (tour guiado, checklist de primeiros passos) pra abrir
   * direto no filtro Compras, em vez do default "Todos os Produtos". So um
   * "sinal" de uma via: ao ser consumido, avisa o pai via
   * `onAbaInicialConsumida` pra ele limpar o pedido — senao uma visita manual
   * futura a esta aba continuaria "grudada" em Compras.
   */
  abaInicial?: 'compras';
  onAbaInicialConsumida?: () => void;
}

export const ProdutosModule: React.FC<ProdutosModuleProps> = ({
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  abaInicial,
  onAbaInicialConsumida,
}) => {
  const { produtos: produtosDoContexto, addProduto, updateProduto, deleteProduto, custoPorUnidade } = useProdutos();
  const { formatCurrency, symbol } = useCurrency();
  const [aba, setAba] = useState<'todos' | 'estoque' | 'compras'>('todos');

  const [deletingProduto, setDeletingProduto] = useState<Produto | null>(null);
  const {
    pendingItems: pendingDeleteProdutos,
    requestDelete: requestDeleteProduto,
    cancelDelete: cancelDeleteProduto,
  } = useDelayedDelete<Produto>({
    deleteFn: async (produto) => {
      try {
        await deleteProduto(produto.id);
      } catch (err: any) {
        alert(`⚠️ Não foi possível excluir o produto:\n\n${err?.message || err}`);
      }
    },
  });

  // Tira os produtos pendentes da lista na hora (mesmo padrao de
  // `fichasVisiveis` em FichasTecnicasModule.tsx) — o DELETE real so vai pro
  // banco 10s depois, ver useDelayedDelete. Mais de um pode estar pendente ao
  // mesmo tempo (excluir dois itens em sequencia rapida), entao filtra pelo
  // conjunto inteiro, nao so o ultimo.
  const produtos = pendingDeleteProdutos.length > 0
    ? produtosDoContexto.filter((p) => !pendingDeleteProdutos.some((pend) => pend.id === p.id))
    : produtosDoContexto;

  useEffect(() => {
    if (abaInicial) {
      setAba(abaInicial);
      onAbaInicialConsumida?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abaInicial]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  const produtoFormRef = useRef<HTMLFormElement>(null);
  /** Id do campo obrigatorio vazio, pra mostrar o card de erro custom no lugar do balao nativo do navegador. */
  const [invalidFieldId, setInvalidFieldId] = useState<string | null>(null);

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [precoPago, setPrecoPago] = useState('');
  const [quantidadeEmbalagem, setQuantidadeEmbalagem] = useState('');
  const [unidadeEmbalagem, setUnidadeEmbalagem] = useState<Produto['unidadeEmbalagem']>('g');
  const [controlaEstoque, setControlaEstoque] = useState(true);
  const [quantidadeAtual, setQuantidadeAtual] = useState('');
  const [nivelMinimo, setNivelMinimo] = useState('');
  const [nivelMinimoUnidade, setNivelMinimoUnidade] = useState<Produto['unidadeEmbalagem']>('g');

  /** Produto duplicado achado ao salvar (criar ou renomear) — guarda os dados
   * prontos pra salvar, pra "Criar mesmo assim" nao precisar remontar tudo. */
  const [duplicateWarning, setDuplicateWarning] = useState<{ data: Omit<Produto, 'id'>; existing: Produto } | null>(null);

  useEffect(() => {
    if (!isAdding) {
      setNome('');
      setCategoria('');
      setPrecoPago('');
      setQuantidadeEmbalagem('');
      setUnidadeEmbalagem('g');
      setControlaEstoque(true);
      setQuantidadeAtual('');
      setNivelMinimo('');
      setNivelMinimoUnidade('g');
      setEditingId(null);
    }
  }, [isAdding]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setIsAdding(true);
    setInvalidFieldId(null);
  };

  const handleOpenEdit = (p: Produto) => {
    setNome(p.nome);
    setCategoria(p.categoria || '');
    setPrecoPago(String(p.precoPago));
    setQuantidadeEmbalagem(String(p.quantidadeEmbalagem));
    setUnidadeEmbalagem(p.unidadeEmbalagem);
    setControlaEstoque(p.controlaEstoque);
    setQuantidadeAtual(p.quantidadeAtual != null ? String(Math.round(p.quantidadeAtual * 100) / 100).replace('.', ',') : '');
    setNivelMinimo(p.nivelMinimo != null ? String(p.nivelMinimo) : '');
    setNivelMinimoUnidade(p.nivelMinimoUnidade || 'g');
    setEditingId(p.id);
    setIsAdding(true);
    setInvalidFieldId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Substitui o balao de validacao nativo do navegador (form ganhou
    // `noValidate`) — mesmo padrao usado em Ficha Tecnica, Pedido e Compras.
    const form = produtoFormRef.current;
    if (form && !form.checkValidity()) {
      const invalidField = form.querySelector<HTMLElement>(':invalid');
      setInvalidFieldId(invalidField?.id || null);
      requestAnimationFrame(() => invalidField?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }
    setInvalidFieldId(null);

    if (!nome.trim()) return;
    setFormError('');

    const precoNum = parseFloat(precoPago.replace(',', '.')) || 0;
    const qtdEmbalagemNum = parseFloat(quantidadeEmbalagem.replace(',', '.')) || 1;
    const qtdAtualNum = parseFloat(quantidadeAtual.replace(',', '.')) || 0;
    const nivelMinNum = parseFloat(nivelMinimo.replace(',', '.')) || 0;

    const data: Omit<Produto, 'id'> = {
      nome: nome.trim(),
      categoria: categoria.trim() || null,
      precoPago: precoNum,
      quantidadeEmbalagem: qtdEmbalagemNum,
      unidadeEmbalagem,
      controlaEstoque,
      quantidadeAtual: controlaEstoque ? qtdAtualNum : null,
      quantidadeReferencia: null, // contexto decide (mesma regra do EstoqueContext)
      nivelMinimo: controlaEstoque ? nivelMinNum : null,
      nivelMinimoUnidade: controlaEstoque ? nivelMinimoUnidade : null,
    };

    // Mesmo nome (ignorando maiuscula/minuscula, acento e pontuacao — ver
    // normalizeName) de outro produto ja cadastrado: pra criacao ou pra
    // renomear um existente pra um nome que ja e de outro. Decisao de produto:
    // avisa mas nao bloqueia, ver docs/pendencia-nomes-duplicados-produto-cliente-ficha.md.
    const duplicado = produtosDoContexto.find(
      (p) => p.id !== editingId && normalizeName(p.nome) === normalizeName(data.nome)
    );
    if (duplicado) {
      setDuplicateWarning({ data, existing: duplicado });
      return;
    }

    await performSave(data);
  };

  const performSave = async (data: Omit<Produto, 'id'>) => {
    try {
      if (editingId) {
        await updateProduto(editingId, data);
      } else {
        await addProduto(data);
      }
      setIsAdding(false);
      setDuplicateWarning(null);
    } catch (err) {
      setFormError((err as any).message || 'Erro ao salvar produto');
    }
  };

  const handleDelete = (produto: Produto) => {
    setDeletingProduto(produto);
  };

  const handleQuickAdjustThreshold = async (p: Produto, delta: number) => {
    const novo = Math.max(0, (p.nivelMinimo || 0) + delta);
    await updateProduto(p.id, { ...p, nivelMinimo: novo });
  };

  const produtosDoEstoque = produtos.filter((p) => p.controlaEstoque);
  const listaBase = aba === 'estoque' ? produtosDoEstoque : produtos;
  const filtrados = listaBase.filter((p) => p.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  const sortedEstoque = aba === 'estoque'
    ? [...filtrados].sort((a, b) => {
        const normA = normalizeToCommonUnit(a.quantidadeAtual || 0, a.unidadeEmbalagem, a.nivelMinimoUnidade || a.unidadeEmbalagem);
        const normB = normalizeToCommonUnit(b.quantidadeAtual || 0, b.unidadeEmbalagem, b.nivelMinimoUnidade || b.unidadeEmbalagem);
        const rankA = getCriticalityRank(normA, a.nivelMinimo || 0);
        const rankB = getCriticalityRank(normB, b.nivelMinimo || 0);
        return rankA - rankB;
      })
    : filtrados;

  const lowStockCount = produtosDoEstoque.filter((p) => {
    const norm = normalizeToCommonUnit(p.quantidadeAtual || 0, p.unidadeEmbalagem, p.nivelMinimoUnidade || p.unidadeEmbalagem);
    return norm <= (p.nivelMinimo || 0);
  }).length;

  return (
    <div className="pb-12 animate-fadeIn" style={{ background: '#FAF7FA' }}>
      <div
        className="overflow-hidden shadow-card"
        style={{
          boxShadow: '0 30px 70px rgba(58,35,80,.26)',
          fontFamily: "'Manrope', sans-serif",
          // Sangra para cima cobrindo a safe area, mesmo padrao do header do
          // Dashboard — ver comentario em OrdersModule.tsx.
          marginTop: 'calc(0px - env(safe-area-inset-top, 0px))',
        }}
      >
        <div
          className="px-5 flex flex-col gap-2"
          style={{ background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)', paddingTop: 'calc(24px + env(safe-area-inset-top, 0px))', paddingBottom: '90px' }}
        >
          {/* `visibility: hidden` (nao renderizacao condicional) para o badge
              sempre ocupar o mesmo espaco no cabecalho: escondendo o elemento
              via `&&` em vez disso, o container encolhia sem o badge (Todos/
              Compras) e crescia com ele (Estoque com item critico), num
              "pulo" perceptivel de layout ao trocar de aba. */}
          <div className="flex items-center justify-end gap-2.5">
            <span
              className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full whitespace-nowrap shrink-0"
              style={{
                background: '#C4626F',
                color: '#FFF8F6',
                visibility: aba === 'estoque' && lowStockCount > 0 ? 'visible' : 'hidden',
              }}
            >
              <AlertTriangle className="w-2.5 h-2.5" style={{ strokeWidth: 2.5 }} />
              {lowStockCount || 0} {lowStockCount === 1 ? 'Estoque Baixo' : 'Estoques Baixos'}
            </span>
          </div>
          <span className="text-white leading-tight" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '29px', lineHeight: '1.1' }}>
            Produtos
          </span>
          <span className="text-[11px] leading-relaxed" style={{ color: 'rgba(247,220,225,.8)' }}>
            Catálogo único de ingredientes, embalagens e decoração — a mesma fonte usada nas Fichas e nas Compras.
          </span>
        </div>

        <div
          className="flex flex-col gap-4"
          style={{
            marginTop: '-56px', background: '#FAF7FA', borderRadius: '28px 28px 0 0', position: 'relative', padding: '20px',
            marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)',
            paddingLeft: 'calc(20px + max(0px, env(safe-area-inset-left)))', paddingRight: 'calc(20px + max(0px, env(safe-area-inset-right)))',
          }}
        >
          {/* Abas Todos / Estoque / Compras. Fecha o formulario de Novo/Editar
              Produto ao trocar de aba: ele so era escondido ao ir pra Compras
              (aba !== 'compras'), entao trocar entre Todos/Estoque com o
              formulario aberto deixava a lista de baixo (ja correta) escondida
              atras dele — parecia que o filtro nao tinha funcionado. */}
          <div style={{ display: 'flex', gap: '3px', background: 'white', borderRadius: '14px', padding: '3px', boxShadow: '0 6px 14px rgba(58,35,80,.07)' }}>
            {[{ id: 'todos', label: 'Todos os Produtos' }, { id: 'estoque', label: 'Estoque' }, { id: 'compras', label: 'Compras' }].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setAba(tab.id as any); setIsAdding(false); }}
                style={{
                  flex: 1, padding: '8px', fontSize: '11px', fontWeight: 800, borderRadius: '11px', border: 'none', cursor: 'pointer',
                  background: aba === tab.id ? '#3A2350' : 'transparent',
                  color: aba === tab.id ? '#F5B9C6' : '#7A6E80',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search + Adicionar — nao fazem sentido na aba Compras */}
          {aba !== 'compras' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search className="w-3.75 h-3.75 absolute" style={{ color: '#A096A6', left: '13px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar produto..."
                style={{ width: '100%', padding: '11px 12px 11px 34px', background: '#FFFFFF', borderRadius: '14px', fontSize: '11px', color: '#A096A6', border: 'none', boxShadow: '0 6px 14px rgba(58,35,80,.07)', fontFamily: "'Manrope', sans-serif", outline: 'none' }}
              />
            </div>
            <button
              onClick={handleOpenAdd}
              className="active:scale-95 transition-transform"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#3A2350', color: '#F5B9C6', fontWeight: 800, fontSize: '11px', padding: '11px 13px', borderRadius: '14px', whiteSpace: 'nowrap', cursor: 'pointer', boxShadow: '0 8px 16px rgba(58,35,80,.28)', border: 'none', fontFamily: "'Manrope', sans-serif" }}
              title="Adicionar novo produto"
            >
              <Plus className="w-3.5 h-3.5" style={{ strokeWidth: 3 }} />
              Adicionar Produto
            </button>
          </div>
          )}

          {formError && aba !== 'compras' && (
            <div className="p-2.5 rounded-xl bg-[#FDF4F5] border border-[rgba(196,98,111,.35)] text-[12px] text-[#C4626F]" style={{ fontFamily: "'Manrope', sans-serif" }}>
              {formError}
            </div>
          )}

          {/* Form */}
          {isAdding && aba !== 'compras' && (
            <div className="bg-[#F6F2F5] rounded-xl overflow-hidden shadow-highlight border border-[#E6E1DB] animate-slideUp">
              <div style={{ background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)' }} className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
                <h3 className="font-brand font-black text-sm sm:text-base text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F5B9C6]" />
                  {editingId ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <button type="button" onClick={() => setIsAdding(false)} className="text-xs text-white/70 hover:text-white font-bold px-2 py-1 transition-colors">
                  Cancelar
                </button>
              </div>

              <form ref={produtoFormRef} onSubmit={handleSave} noValidate className="bg-[#F6F2F5] p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-[#E6E1DB] shadow-card">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-900 mb-1.5">Nome do Produto *</label>
                    <input
                      id="produto-nome"
                      type="text" required placeholder="Farinha de Trigo" value={nome}
                      onChange={(e) => {
                        setNome(capitalizeFirstLetter(e.target.value));
                        if (invalidFieldId === 'produto-nome') setInvalidFieldId(null);
                      }}
                      className="w-full px-3 py-2.5 bg-white border border-[#E6E1DB] rounded-xl text-xs font-normal text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] transition-all"
                    />
                    {invalidFieldId === 'produto-nome' && <FieldValidationError />}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-900 mb-1.5">Categoria</label>
                    <input
                      type="text" list="categorias-sugeridas" placeholder="Massa, Recheio, Cobertura..." value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-[#E6E1DB] rounded-xl text-xs font-normal text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] transition-all"
                    />
                    <datalist id="categorias-sugeridas">
                      {CATEGORIAS_SUGERIDAS.map((c) => <option key={c} value={c} />)}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-900 mb-1.5">Preço pago *</label>
                    <input
                      id="produto-preco"
                      type="text" inputMode="decimal" required placeholder="8.00" value={precoPago}
                      onChange={(e) => {
                        setPrecoPago(e.target.value);
                        if (invalidFieldId === 'produto-preco') setInvalidFieldId(null);
                      }}
                      className="w-full px-3 py-2.5 bg-white border border-[#E6E1DB] rounded-xl text-xs font-normal text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] transition-all"
                    />
                    {invalidFieldId === 'produto-preco' && <FieldValidationError />}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-900 mb-1.5">Quantidade da embalagem *</label>
                    <div className="flex gap-2">
                      <input
                        id="produto-quantidade-embalagem"
                        type="text" inputMode="decimal" required placeholder="1000" value={quantidadeEmbalagem}
                        onChange={(e) => {
                          setQuantidadeEmbalagem(e.target.value);
                          if (invalidFieldId === 'produto-quantidade-embalagem') setInvalidFieldId(null);
                        }}
                        className="flex-1 px-3 py-2.5 bg-white border border-[#E6E1DB] rounded-xl text-xs font-normal text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] transition-all"
                      />
                      <select
                        value={unidadeEmbalagem} onChange={(e) => setUnidadeEmbalagem(e.target.value as any)}
                        className="px-3 py-2.5 bg-white border border-[#E6E1DB] rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] transition-all"
                      >
                        {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    {invalidFieldId === 'produto-quantidade-embalagem' && <FieldValidationError />}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-900 mb-1.5">
                      Custo por unidade — calculado automaticamente
                    </label>
                    <input
                      type="text" disabled
                      value={`${custoPorUnidade({
                        precoPago: parseFloat(precoPago.replace(',', '.')) || 0,
                        quantidadeEmbalagem: parseFloat(quantidadeEmbalagem.replace(',', '.')) || 1,
                      }).toFixed(4)}/${unidadeEmbalagem}`}
                      className="w-full px-3 py-2.5 bg-neutral-100 border border-[#E6E1DB] rounded-xl text-xs font-normal text-neutral-400 focus:outline-none transition-all cursor-not-allowed"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl border border-[#E6E1DB] bg-white">
                    <div>
                      <p className="text-xs font-bold text-neutral-900">Controlar estoque deste produto?</p>
                      <p className="text-[10px] text-neutral-500 mt-0.5">Desligue para itens frescos comprados na hora (ex: frutas), que não ficam "em estoque".</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setControlaEstoque((v) => !v)}
                      style={{
                        width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
                        background: controlaEstoque ? '#6E3F72' : '#E6E1DB', transition: 'background 0.2s',
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: '2px', left: controlaEstoque ? '20px' : '2px', width: '18px', height: '18px',
                        borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                      }} />
                    </button>
                  </div>

                  {controlaEstoque && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-neutral-900 mb-1.5">Quantidade atual em estoque</label>
                        <input
                          type="text" inputMode="decimal" placeholder="0" value={quantidadeAtual} onChange={(e) => setQuantidadeAtual(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-[#E6E1DB] rounded-xl text-xs font-normal text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-900 mb-1.5">Alerta mínimo</label>
                        <div className="flex gap-2">
                          <input
                            type="text" inputMode="decimal" placeholder="100" value={nivelMinimo} onChange={(e) => setNivelMinimo(e.target.value)}
                            className="flex-1 px-3 py-2.5 bg-white border border-[#E6E1DB] rounded-xl text-xs font-normal text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] transition-all"
                          />
                          <select
                            value={nivelMinimoUnidade} onChange={(e) => setNivelMinimoUnidade(e.target.value as any)}
                            className="px-3 py-2.5 bg-white border border-[#E6E1DB] rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] transition-all"
                          >
                            {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 rounded-xl bg-white border border-[#E6E1DB] text-neutral-700 font-bold text-xs hover:bg-neutral-50 shadow-card active:scale-95 transition-all duration-normal">
                    Cancelar
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-[#6E3F72] hover:bg-[#5A3560] text-white font-brand font-bold text-xs shadow-card flex items-center gap-1 active:scale-95 transition-all duration-normal">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Aba Compras: reaproveita a tela inteira de Compras (mesma que
              ainda vive sozinha no rodape), so que embutida — sem o
              cabecalho proprio "Saldos" duplicando o "Produtos" daqui de
              cima (ver prop `embedded` em BalancesAndExpensesModule.tsx). */}
          {aba === 'compras' ? (
            <BalancesAndExpensesModule
              embedded
              transactions={transactions}
              onAddTransaction={onAddTransaction}
              onEditTransaction={onEditTransaction}
              onDeleteTransaction={onDeleteTransaction}
            />
          ) : (
          <>
          {/* Lista */}
          {sortedEstoque.length === 0 ? (
            aba === 'estoque' ? (
              <div
                className="flex flex-col items-center gap-2.5 text-center"
                style={{
                  background: '#fff',
                  border: '1px solid rgba(58,35,80,0.1)',
                  borderRadius: '20px',
                  boxShadow: '0 8px 20px rgba(58,35,80,.09)',
                  padding: '40px 20px',
                }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#F3E9F3' }}
                >
                  <Package className="w-[30px] h-[30px]" style={{ color: '#6E3F72' }} strokeWidth={2} />
                </div>
                <div className="font-serif-display" style={{ fontSize: '22px', color: '#3A2350' }}>
                  Nenhum produto com estoque controlado
                </div>
                <div className="text-sm" style={{ color: '#7A6E80', maxWidth: '290px' }}>
                  Ative o controle de estoque nos seus produtos para receber alertas quando algo estiver acabando.
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="transition-colors"
                  style={{
                    marginTop: '8px',
                    background: '#3A2350',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                    padding: '13px 22px',
                    borderRadius: '11px',
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(58,35,80,.3)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#6E3F72'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#3A2350'; }}
                >
                  Controlar estoque de um produto
                </button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center gap-2.5 text-center"
                style={{
                  background: '#fff',
                  border: '1px solid rgba(58,35,80,0.1)',
                  borderRadius: '20px',
                  boxShadow: '0 8px 20px rgba(58,35,80,.09)',
                  padding: '40px 20px',
                }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#F3E9F3' }}
                >
                  <Package className="w-[30px] h-[30px]" style={{ color: '#6E3F72' }} strokeWidth={2} />
                </div>
                <div className="font-serif-display" style={{ fontSize: '22px', color: '#3A2350' }}>
                  Nenhum produto cadastrado
                </div>
                <div className="text-sm" style={{ color: '#7A6E80', maxWidth: '280px' }}>
                  Cadastre seus produtos para acompanhar estoque, custo e preço de venda em um só lugar.
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="transition-colors"
                  style={{
                    marginTop: '8px',
                    background: '#3A2350',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                    padding: '13px 22px',
                    borderRadius: '11px',
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(58,35,80,.3)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#6E3F72'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#3A2350'; }}
                >
                  Adicionar primeiro produto
                </button>
              </div>
            )
          ) : aba === 'estoque' ? (
            <>
            <div className="grid grid-cols-1 gap-4">
              {sortedEstoque.map((p) => {
                const qtd = p.quantidadeAtual || 0;
                const min = p.nivelMinimo || 0;
                // Comparacao sempre na unidade do ALERTA, nunca nos numeros crus:
                // quantidade em kg e alerta em g precisam estar na mesma escala
                // antes de decidir critico/alto (ver normalizeToCommonUnit).
                const qtdNormalizada = normalizeToCommonUnit(qtd, p.unidadeEmbalagem, p.nivelMinimoUnidade || p.unidadeEmbalagem);
                const colors = getColorBasedOnThreshold(qtdNormalizada, min);
                const displayPercentage = getPercentageBasedOnThreshold(qtdNormalizada, min);
                const isCritical = qtdNormalizada < min || (min <= 0 && qtdNormalizada <= 0);

                return (
                  <div
                    key={p.id}
                    className="rounded-[22px] p-3.5 flex items-center gap-3 transition-all"
                    style={{ background: isCritical ? '#FDF4F5' : '#FFFFFF', border: isCritical ? '1px solid rgba(196,98,111,.35)' : '1px solid rgba(36,27,43,.06)', boxShadow: '0 8px 20px rgba(58,35,80,.09)' }}
                  >
                    <svg width="76" height="64" viewBox="0 0 76 64" className="flex-shrink-0">
                      <path d="M8 60a30 30 0 0 1 60 0" fill="none" stroke="#F1ECF2" strokeWidth="10" strokeLinecap="round" />
                      <path d="M8 60a30 30 0 0 1 60 0" fill="none" stroke={colors.stroke} strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={`${displayPercentage * (Math.PI * 30 / 100)} ${Math.PI * 30}`} />
                      <text x="38" y="58" textAnchor="middle" fontSize="12" fontWeight="900" fill={colors.stroke} fontFamily="'Manrope', sans-serif">
                        {Math.round(displayPercentage)}%
                      </text>
                    </svg>

                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-brand text-[13px]" style={{ color: '#241B2B', fontWeight: 800 }}>
                          {p.nome.charAt(0).toUpperCase() + p.nome.slice(1)}
                        </h4>
                        {p.categoria && (
                          <span style={{ background: '#F6F2F5', color: '#7A6E80' }} className="text-[8.5px] font-bold px-[7px] py-[3px] rounded-md uppercase whitespace-nowrap">
                            {p.categoria}
                          </span>
                        )}
                        <span style={{ background: colors.background, color: colors.text }} className="text-[8.5px] font-bold px-[7px] py-[3px] rounded-md uppercase whitespace-nowrap">
                          {getStatusLabel(qtdNormalizada, min)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10.5px]" style={{ color: '#7A6E80' }}>Alerta quando menor que:</span>
                        <div className="flex items-center" style={{ background: '#F6F2F5', border: '1px solid rgba(36,27,43,.08)', borderRadius: '10px', padding: '2px' }}>
                          <button
                            onClick={() => handleQuickAdjustThreshold(p, -getThresholdDelta(p.nivelMinimoUnidade || 'g'))}
                            className="active:scale-95 transition-transform"
                            style={{ width: '22px', height: '22px', borderRadius: '8px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#5B4A6B', border: 'none', cursor: 'pointer', boxShadow: '0 2px 5px rgba(58,35,80,.1)' }}
                          >−</button>
                          <span style={{ padding: '0 7px', fontSize: '11px', fontWeight: 800, color: '#241B2B', whiteSpace: 'nowrap' }}>
                            {min} <span style={{ fontSize: '9px', fontWeight: 600, color: '#8A7E90' }}>{p.nivelMinimoUnidade}</span>
                          </span>
                          <button
                            onClick={() => handleQuickAdjustThreshold(p, getThresholdDelta(p.nivelMinimoUnidade || 'g'))}
                            className="active:scale-95 transition-transform"
                            style={{ width: '22px', height: '22px', borderRadius: '8px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#5B4A6B', border: 'none', cursor: 'pointer', boxShadow: '0 2px 5px rgba(58,35,80,.1)' }}
                          >+</button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#241B2B', background: '#F6F2F5', border: '1px solid rgba(36,27,43,.08)', borderRadius: '12px', padding: '7px 14px', whiteSpace: 'nowrap' }}>
                          {formatQuantity(qtd)} <span style={{ fontSize: '10px', fontWeight: 600, color: '#8A7E90' }}>{p.unidadeEmbalagem}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleOpenEdit(p)} className="hover:bg-[#EFE6F0] transition-colors" style={{ width: '28px', height: '28px', borderRadius: '9px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Edit3 className="w-3.5 h-3.5" style={{ color: '#7A6E80', strokeWidth: 2 }} />
                          </button>
                          <button onClick={() => handleDelete(p)} className="hover:bg-[#FBE9EC] transition-colors" style={{ width: '28px', height: '28px', borderRadius: '9px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trash2 className="w-3.5 h-3.5" style={{ color: '#C4626F', strokeWidth: 2 }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Historico de movimentacoes: migrado de EstoqueModule.tsx para
                aqui, junto do estoque REAL (o antigo mostrava um historico
                correto ao lado de quantidades que ninguem mais atualiza). */}
            <div className="mt-2">
              <div className="mb-3">
                <h2 className="text-xs font-extrabold uppercase text-[var(--color-pastry-chocolate)]">
                  Histórico de Movimentações
                </h2>
                <p className="text-[10.5px] mt-1" style={{ color: '#7A6E80' }}>
                  Rastreie todas as consumições, devoluções e reposições automáticas de estoque
                </p>
              </div>
              <StockMovementsHistory />
            </div>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {sortedEstoque.map((p) => (
                <div key={p.id} className="rounded-[18px] p-3.5 flex items-center justify-between gap-3" style={{ background: '#FFFFFF', border: '1px solid rgba(36,27,43,.06)', boxShadow: '0 8px 20px rgba(58,35,80,.09)' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-brand text-[13px]" style={{ color: '#241B2B', fontWeight: 800 }}>{p.nome}</h4>
                      {p.categoria && (
                        <span style={{ background: '#F6F2F5', color: '#7A6E80' }} className="text-[8.5px] font-bold px-[7px] py-[3px] rounded-md uppercase whitespace-nowrap">
                          {p.categoria}
                        </span>
                      )}
                      {!p.controlaEstoque && (
                        <span style={{ background: '#FFF3E0', color: '#B27A16' }} className="text-[8.5px] font-bold px-[7px] py-[3px] rounded-md uppercase whitespace-nowrap">
                          Sem estoque
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: '#7A6E80' }}>
                      {formatCurrency(p.precoPago)} / {p.quantidadeEmbalagem} {p.unidadeEmbalagem} · custo unitário {symbol} {custoPorUnidade(p).toFixed(4)}/{p.unidadeEmbalagem}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleOpenEdit(p)} className="hover:bg-[#EFE6F0] transition-colors" style={{ width: '28px', height: '28px', borderRadius: '9px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Edit3 className="w-3.5 h-3.5" style={{ color: '#7A6E80', strokeWidth: 2 }} />
                    </button>
                    <button onClick={() => handleDelete(p)} className="hover:bg-[#FBE9EC] transition-colors" style={{ width: '28px', height: '28px', borderRadius: '9px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 className="w-3.5 h-3.5" style={{ color: '#C4626F', strokeWidth: 2 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
          )}
        </div>
      </div>

      <GenericDeleteConfirmModal
        isOpen={!!deletingProduto}
        itemType="produto"
        itemName={deletingProduto?.nome}
        itemDetails={[
          { label: '💰', value: formatCurrency(deletingProduto?.precoPago || 0) },
        ]}
        onClose={() => setDeletingProduto(null)}
        onConfirmDelete={() => {
          if (deletingProduto) {
            requestDeleteProduto(deletingProduto);
            setDeletingProduto(null);
          }
        }}
      />

      <DuplicateNameWarningModal
        isOpen={!!duplicateWarning}
        itemType="produto"
        nome={duplicateWarning?.data.nome || ''}
        onClose={() => setDuplicateWarning(null)}
        onCriarMesmoAssim={() => {
          if (duplicateWarning) performSave(duplicateWarning.data);
        }}
        onUsarExistente={() => {
          if (duplicateWarning) handleOpenEdit(duplicateWarning.existing);
          setDuplicateWarning(null);
        }}
      />

      {/* Toast de exclusao pendente: um por item, empilhados — cada um some
          quando os 10s de "Desfazer" DELE completarem (ver
          `pendingDeleteProdutos`). Mais de um pode estar visivel ao mesmo
          tempo se a usuaria excluir varios itens em sequencia rapida. */}
      {pendingDeleteProdutos.map((produto, index) => (
        <div
          key={produto.id}
          className="fixed left-1/2 -translate-x-1/2 z-50"
          style={{ bottom: `${96 + index * 56}px` }}
        >
          <div
            className="flex items-center gap-3.5 animate-fadeIn"
            style={{ padding: '10px 12px 10px 18px', borderRadius: '999px', background: '#3A2350', boxShadow: '0 20px 36px rgba(58,35,80,0.26)' }}
          >
            <span className="flex items-center gap-2 text-sm font-bold text-white whitespace-nowrap">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#A9D8B8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Produto deletado
            </span>
            <button
              type="button"
              onClick={() => cancelDeleteProduto(produto.id)}
              className="flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95"
              style={{ padding: '8px 14px', borderRadius: '999px', border: 'none', background: '#F5B9C6', color: '#6E2231', cursor: 'pointer' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 14 4 9l5-5" />
                <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11" />
              </svg>
              Desfazer
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
