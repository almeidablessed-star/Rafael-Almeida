import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Produto, Transaction } from '../types';
import { useProdutos } from '../context/ProdutosContext';
import { formatQuantity, parseNumeroDigitado } from '../utils/formatters';
import { useCurrency } from '../context/CurrencyContext';
import { capitalizeFirstLetter } from '../utils/textCase';
import { StockMovementsHistory } from './StockMovementsHistory';
import { BalancesAndExpensesModule } from './BalancesAndExpensesModule';
import { GenericDeleteConfirmModal } from './GenericDeleteConfirmModal';
import { DuplicateNameWarningModal } from './DuplicateNameWarningModal';
import { useDelayedDelete } from '../hooks/useDelayedDelete';
import { FieldValidationError } from './FieldValidationError';
import { normalizeName } from '../utils/fichaMatcher';
import { areUnitsCompatible, convertQuantity } from '../utils/units';
import { CARD_COMANDA, ROTULO_COMANDA, CAMPO_TINTA, CAIXA_NUMERO, NUMERO, CHIP_UNIDADE, Picote } from './estiloComanda';
import { CustomSelect } from './CustomSelect';
import { CampoComAjuda } from './onboarding/CampoComAjuda';
import {
  Package,
  Plus,
  AlertTriangle,
  Search,
  Edit3,
  Trash2,
  Check,
  X,
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

/**
 * Etiqueta do card do Estoque, em palavras do dia a dia. Antes era
 * Critico/Alerta/Atencao/Normal/Alto, e "Alerta" (ate 25% acima do minimo)
 * parecia "ja passou do limite" para quem tinha 4,7 kg com aviso em 4 kg. As
 * faixas sao as mesmas de `getColorBasedOnThreshold`.
 */
const getStatusLabel = (quantity: number, minThreshold: number): string => {
  if (quantity < minThreshold) return 'Comprar já';
  if (minThreshold <= 0) return quantity > 0 ? 'Tranquilo' : 'Comprar já';
  const slack = ((quantity - minThreshold) / minThreshold) * 100;
  if (slack < 25) return 'Perto de acabar';
  if (slack < 50) return 'De olho';
  return 'Tranquilo';
};

/**
 * Arredonda para 2 casas sem o tropeco do ponto flutuante: 4,725 vira 4,73, e
 * nao 4,72 (4,725 * 100 da 472,4999...). Passa antes pelas 3 casas, que sao
 * exatas para quantidades digitadas em g/ml convertidas para kg/L.
 */
const arredonda2 = (valor: number): number => Math.round(Math.round(valor * 1000) / 10) / 100;

/**
 * A frase do card: quanto falta para o aviso, na unidade do aviso. Curta de
 * proposito: no celular de 360px ela cabe numa linha so ao lado dos botoes.
 */
const fraseDoAviso = (quantity: number, minThreshold: number, unidade: string): string => {
  if (minThreshold <= 0) return 'Sem aviso de compra';
  const diferenca = arredonda2(quantity - minThreshold);
  if (diferenca > 0) return `${formatQuantity(diferenca)} ${unidade} até o aviso`;
  if (diferenca === 0) return 'Chegou no aviso';
  return `${formatQuantity(-diferenca)} ${unidade} abaixo`;
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
  onAddTransaction: (txData: Omit<Transaction, 'id' | 'createdAt'>) => Promise<boolean>;
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
  // Unidade em que a confeiteira DIGITA o estoque guardado. O banco segue
  // gravando na unidade da embalagem (e o que alerta e baixa de estoque leem):
  // a conversao acontece ao salvar. Sem isto, num acucar cadastrado em kg,
  // digitar "900" pensando em gramas gravava 900 kg.
  const [quantidadeAtualUnidade, setQuantidadeAtualUnidade] = useState<Produto['unidadeEmbalagem']>('g');
  const [nivelMinimo, setNivelMinimo] = useState('');
  const [nivelMinimoUnidade, setNivelMinimoUnidade] = useState<Produto['unidadeEmbalagem']>('g');
  /**
   * A pessoa ja mexeu no alerta neste formulario? Enquanto nao mexeu, digitar
   * a quantidade da embalagem re-sugere 20% dela. Depois de mexer, a sugestao
   * nunca mais toca no campo — inclusive se ela zerar de proposito.
   *
   * O alerta nasce em 0, e 0 e ambiguo: pode ser "nunca configurei" ou "nao
   * quero alerta". Por isso a sugestao aparece no CAMPO, visivel e editavel
   * antes de salvar, em vez de ser decidida na hora de gravar — assim o valor
   * salvo e sempre a escolha dela, e nao existe regra de sobrescrita para dar
   * errado depois.
   */
  const [alertaTocado, setAlertaTocado] = useState(false);
  /**
   * So no cadastro NOVO: "acabei de comprar esta embalagem" soma a embalagem
   * ao que ja estava guardado. Pedido do Rafael (19/10 e 25/10/2026): quem
   * cadastra a farinha logo depois de comprar esperava 2 kg guardados + 1 kg
   * comprado = 3 kg, e o app gravava 2 kg. So mexe no estoque; o gasto da
   * compra continua sendo lancado pela aba Compras.
   */
  const [acabeiDeComprar, setAcabeiDeComprar] = useState(false);

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
      setQuantidadeAtualUnidade('g');
      setAlertaTocado(false);
      setAcabeiDeComprar(false);
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
    setQuantidadeAtualUnidade(p.unidadeEmbalagem);
    setNivelMinimo(p.nivelMinimo != null ? String(p.nivelMinimo) : '');
    setNivelMinimoUnidade(p.nivelMinimoUnidade || 'g');
    // Editando um produto que ja existe: o alerta dele e uma escolha feita, e
    // a sugestao nao pode reescrever nada — nem se ela mudar a embalagem aqui.
    setAlertaTocado(true);
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

    const precoNum = parseNumeroDigitado(precoPago) || 0;
    const qtdEmbalagemNum = parseNumeroDigitado(quantidadeEmbalagem) || 1;
    const qtdAtualDigitada = parseNumeroDigitado(quantidadeAtual) || 0;
    const qtdGuardada = convertQuantity(qtdAtualDigitada, quantidadeAtualUnidade, unidadeEmbalagem) ?? qtdAtualDigitada;
    // A embalagem ja esta na unidade em que o estoque e gravado.
    const qtdAtualNum = !editingId && acabeiDeComprar ? qtdGuardada + qtdEmbalagemNum : qtdGuardada;
    const nivelMinNum = parseNumeroDigitado(nivelMinimo) || 0;

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
    <div className="pb-12 animate-fadeIn" style={{ background: '#F6F2F5' }}>
      <div
        className="overflow-hidden"
        style={{
          // Sem sombra: este envolucro e a pagina inteira, nao um cartao — a sombra
          // roxa caia abaixo da borda de baixo dele e aparecia como faixa no fim da
          // tela no iPhone. Mesma correcao da aba Pedidos.
          fontFamily: "'Manrope', sans-serif",
          // Sangra para cima cobrindo a safe area, mesmo padrao do header do
          // Dashboard — ver comentario em OrdersModule.tsx.
          marginTop: 'calc(0px - env(safe-area-inset-top, 0px))',
        }}
      >
        {/* Mesmas medidas do cabecalho de Fichas, Clientes e Empresa: 40 px de
            topo, titulo em 31 px e 120 px de roxo abaixo, com a folha subindo
            70 px. Antes este tinha 24 px, titulo em 29 px, uma linha so para o
            selo de estoque baixo acima do titulo e um texto de apoio embaixo —
            a folha comecava ~40 px mais abaixo que nas outras abas (pedido do
            Rafael, 26/10/2026). */}
        <div
          className="px-5 flex items-center justify-between gap-3"
          style={{ background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)', paddingTop: 'calc(40px + env(safe-area-inset-top, 0px) + var(--topo-ios27, 0px))', paddingBottom: '120px' }}
        >
          <span className="text-white leading-tight flex-1 text-center" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '31px', lineHeight: '1.1' }}>
            Produtos
          </span>
        </div>

        <div
          className="flex flex-col gap-4"
          style={{
            marginTop: '-70px', background: '#F6F2F5', borderRadius: '28px 28px 0 0', position: 'relative', padding: '20px',
            marginLeft: 'calc(-0.5 * var(--app-bleed) + 50%)', marginRight: 'calc(-0.5 * var(--app-bleed) + 50%)',
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

          {/* Form em tela cheia, no mesmo padrao do cadastro de Clientes. Antes
              abria no topo da lista: quem clicava no lapis de um produto la
              embaixo nao via nada acontecer, porque o form surgia fora da tela. */}
          {isAdding && aba !== 'compras' && createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-900/80 backdrop-blur-xs p-0 sm:p-4" role="dialog" aria-modal="true">
            <div className="w-full h-full sm:h-auto sm:max-w-[430px] sm:max-h-[90vh] bg-[#F6F2F5] sm:rounded-[24px] overflow-hidden flex flex-col" style={{ boxShadow: '0 30px 70px rgba(58,35,80,0.26)' }}>
              {/* Visual do design "Editar Produto" (Claude Design, artefato
                  "Pedido Carula Cake"): cabecalho roxo, cards brancos com
                  rotulos em caixa alta, picote de comanda entre as partes e a
                  unidade como chip escuro dentro do campo. Medidas mais justas
                  que as do design para o form continuar cabendo inteiro na
                  tela do celular, sem rolar. O safe-area tira o X de baixo do
                  relogio no iPhone. */}
              <div
                style={{ background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)', paddingTop: 'calc(14px + env(safe-area-inset-top, 0px) + var(--topo-ios27, 0px))', paddingBottom: '30px' }}
                className="px-5 flex items-end justify-between gap-3 flex-shrink-0"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '.2em', color: 'rgba(247,220,225,.8)' }}>PRODUTOS</span>
                  <h3 className="text-white" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '28px', lineHeight: 1.1, fontWeight: 400 }}>
                    {editingId ? 'Editar Produto' : 'Novo Produto'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex items-center justify-center text-white flex-shrink-0 transition-colors hover:bg-white/25"
                  style={{ width: '36px', height: '36px', borderRadius: '11px', background: 'rgba(255,255,255,.16)' }}
                  aria-label="Fechar"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2.4} />
                </button>
              </div>

              <form ref={produtoFormRef} onSubmit={handleSave} noValidate className="flex-1 min-h-0 flex flex-col" style={{ marginTop: '-18px', borderRadius: '24px 24px 0 0', background: '#F6F2F5', fontFamily: "'Manrope', sans-serif", color: '#241B2B' }}>
              <div className="flex-1 overflow-y-auto flex flex-col gap-2.5" style={{ padding: '16px 16px 14px' }}>
                {formError && (
                  <div className="p-2.5 rounded-xl bg-[#FDF4F5] border border-[rgba(196,98,111,.35)] text-[12px] text-[#C4626F]">
                    {formError}
                  </div>
                )}

                {/* Produto */}
                <section className="flex flex-col gap-2.5" style={CARD_COMANDA}>
                  <label className="flex flex-col" style={{ borderBottom: '1.5px dashed rgba(110,63,114,.25)' }}>
                    <span style={ROTULO_COMANDA}>NOME DO PRODUTO <span style={{ color: '#C4626F' }}>*</span></span>
                    <input
                      id="produto-nome"
                      type="text" required placeholder="Farinha de Trigo" value={nome}
                      onChange={(e) => {
                        setNome(capitalizeFirstLetter(e.target.value));
                        if (invalidFieldId === 'produto-nome') setInvalidFieldId(null);
                      }}
                      className="w-full bg-transparent outline-none placeholder:italic placeholder:text-[#B3A6B8]"
                      style={CAMPO_TINTA}
                    />
                  </label>
                  {invalidFieldId === 'produto-nome' && <FieldValidationError />}
                  <label className="flex flex-col" style={{ borderBottom: '1.5px dashed rgba(110,63,114,.25)' }}>
                    <span style={ROTULO_COMANDA}>CATEGORIA</span>
                    <input
                      type="text" list="categorias-sugeridas" placeholder="Massa, Recheio, Cobertura…" value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      className="w-full bg-transparent outline-none placeholder:italic placeholder:text-[#B3A6B8]"
                      style={CAMPO_TINTA}
                    />
                  </label>
                  <datalist id="categorias-sugeridas">
                    {CATEGORIAS_SUGERIDAS.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </section>

                {/* Compra: preco pago, embalagem e o custo calculado */}
                <section className="relative overflow-hidden" style={{ ...CARD_COMANDA, padding: 0 }}>
                  <div className="flex items-end gap-2.5" style={{ padding: '12px 16px 10px' }}>
                    <label className="flex flex-col gap-1.5 flex-shrink-0" style={{ width: '112px' }}>
                      <span style={ROTULO_COMANDA}>PREÇO PAGO <span style={{ color: '#C4626F' }}>*</span></span>
                      <span className="relative flex items-center gap-1" style={{ height: '42px', boxSizing: 'border-box', borderRadius: '6px 15px 15px 6px', background: '#FCEFF2', border: '1px solid rgba(196,98,111,.2)', padding: '0 10px 0 22px' }}>
                        <span aria-hidden="true" className="absolute rounded-full" style={{ left: '9px', top: '50%', transform: 'translateY(-50%)', width: '7px', height: '7px', background: '#FFFFFF', boxShadow: 'inset 0 1px 2px rgba(196,98,111,.4)' }} />
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#C4626F' }}>{symbol}</span>
                        <input
                          id="produto-preco"
                          type="text" inputMode="decimal" required placeholder="8.00" value={precoPago}
                          onChange={(e) => {
                            setPrecoPago(e.target.value);
                            if (invalidFieldId === 'produto-preco') setInvalidFieldId(null);
                          }}
                          className="w-full min-w-0 bg-transparent outline-none placeholder:text-[#B3A6B8]"
                          style={{ fontSize: '17px', fontWeight: 800, color: '#3A2350' }}
                        />
                      </span>
                    </label>
                    <label className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <span style={ROTULO_COMANDA}>QTD. DA EMBALAGEM <span style={{ color: '#C4626F' }}>*</span></span>
                      <span className="flex items-center gap-2" style={CAIXA_NUMERO}>
                        <input
                          id="produto-quantidade-embalagem"
                          type="text" inputMode="decimal" required placeholder="1000" value={quantidadeEmbalagem}
                          onChange={(e) => {
                            setQuantidadeEmbalagem(e.target.value);
                            if (invalidFieldId === 'produto-quantidade-embalagem') setInvalidFieldId(null);
                            // Sugere 20% da embalagem como alerta, na MESMA
                            // unidade dela — o campo de alerta tem unidade
                            // propria, e sugerir num sistema e gravar noutro ja
                            // deu problema neste app. 20% porque o vermelho do
                            // anel dispara em 1,25x o alerta: 20% acende com um
                            // quarto do pacote ainda na prateleira, cedo o
                            // bastante para recomprar sem faltar.
                            if (!alertaTocado) {
                              const qtd = parseNumeroDigitado(e.target.value);
                              setNivelMinimoUnidade(unidadeEmbalagem);
                              setNivelMinimo(
                                Number.isFinite(qtd) && qtd > 0
                                  ? String(Math.round(qtd * 0.2 * 100) / 100).replace('.', ',')
                                  : ''
                              );
                            }
                          }}
                          className="flex-1 w-full min-w-0 bg-transparent outline-none placeholder:text-[#B3A6B8]"
                          style={NUMERO}
                        />
                        <CustomSelect
                          value={unidadeEmbalagem}
                          onChange={(v) => {
                            setUnidadeEmbalagem(v as any);
                            // A unidade do alerta tem que acompanhar enquanto ele
                            // for sugestao: trocar a embalagem para kg e deixar o
                            // alerta em g transformaria "0,2" em 0,2 g — mil vezes
                            // menor do que o pretendido, e silenciosamente.
                            if (!alertaTocado) setNivelMinimoUnidade(v as any);
                            // O estoque guardado so aceita unidades da mesma
                            // familia da embalagem (g/kg, ml/L); trocou de familia,
                            // volta para a unidade da embalagem.
                            if (!areUnitsCompatible(quantidadeAtualUnidade, v)) setQuantidadeAtualUnidade(v as any);
                          }}
                          chip
                          ariaLabel="Unidade de embalagem"
                          style={CHIP_UNIDADE}
                          options={UNIDADES.map((u) => ({ value: u, label: u }))}
                        />
                      </span>
                    </label>
                  </div>
                  {(invalidFieldId === 'produto-preco' || invalidFieldId === 'produto-quantidade-embalagem') && (
                    <div style={{ padding: '0 16px 8px' }}><FieldValidationError /></div>
                  )}

                  <Picote />

                  {/* Informacao calculada, nao um campo: o custo por unidade
                      e o que as fichas usam para somar os insumos. */}
                  <div className="flex items-center justify-between gap-3" style={{ padding: '10px 16px 12px' }}>
                    <div className="flex flex-col">
                      <span style={ROTULO_COMANDA}>CUSTO POR UNIDADE</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#7A6E80' }}>calculado automaticamente</span>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-.02em', color: '#3A2350' }}>
                      {custoPorUnidade({
                        precoPago: parseNumeroDigitado(precoPago) || 0,
                        quantidadeEmbalagem: parseNumeroDigitado(quantidadeEmbalagem) || 1,
                      }).toFixed(4)}
                      <span style={{ fontSize: '12px', color: '#7A6E80', fontWeight: 700 }}> /{unidadeEmbalagem}</span>
                    </span>
                  </div>
                </section>

                {/* Estoque */}
                <section className="relative overflow-hidden" style={{ ...CARD_COMANDA, padding: 0 }}>
                  <div className="flex items-center gap-3" style={{ padding: '12px 16px 10px' }}>
                    <div className="flex-1 flex flex-col gap-0.5">
                      <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '20px', lineHeight: 1.15 }}>Controlar estoque deste produto?</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, lineHeight: 1.45, color: '#7A6E80' }}>Desligue para itens frescos comprados na hora (ex: frutas), que não ficam "em estoque".</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={controlaEstoque}
                      aria-label="Controlar estoque"
                      onClick={() => setControlaEstoque((v) => !v)}
                      className="relative flex-shrink-0"
                      style={{ width: '52px', height: '30px', border: 'none', borderRadius: '999px', cursor: 'pointer', background: controlaEstoque ? 'linear-gradient(120deg, #6E3F72, #A85E86)' : '#E6E1DB', boxShadow: 'inset 0 1px 3px rgba(36,27,43,.25)', transition: 'background .2s' }}
                    >
                      <span className="absolute rounded-full" style={{ top: '3px', left: controlaEstoque ? '25px' : '3px', width: '24px', height: '24px', background: '#FFFFFF', boxShadow: '0 2px 6px rgba(36,27,43,.3)', transition: 'left .2s' }} />
                    </button>
                  </div>

                  {controlaEstoque && (
                    <>
                      <Picote />
                      <div className="flex flex-col gap-2.5" style={{ padding: '10px 16px 12px' }}>
                        {/* Mesmo rotulo que a Ficha usa para este campo. Ali,
                            "Quantidade atual em estoque" ficava ao lado do
                            quanto a receita usa e ja custou um insumo cadastrado
                            com estoque zero. Aqui o vizinho e outro — o tamanho
                            da embalagem — mas continuam sendo dois "quantidade"
                            na mesma tela, e nao ha motivo para as duas telas
                            chamarem a mesma coisa por nomes diferentes. */}
                        <div className="flex flex-col gap-1.5">
                          <span style={ROTULO_COMANDA}>QUANTO VOCÊ JÁ TEM GUARDADO</span>
                          <span className="flex items-center gap-2" style={CAIXA_NUMERO}>
                            <input
                              type="text" inputMode="decimal" placeholder="0" value={quantidadeAtual} onChange={(e) => setQuantidadeAtual(e.target.value)}
                              aria-label="Quanto você já tem guardado"
                              className="flex-1 w-full min-w-0 bg-transparent outline-none placeholder:text-[#B3A6B8]"
                              style={NUMERO}
                            />
                            <CustomSelect
                              value={quantidadeAtualUnidade}
                              onChange={(v) => setQuantidadeAtualUnidade(v as any)}
                              chip
                              ariaLabel="Unidade do estoque guardado"
                              style={CHIP_UNIDADE}
                              options={UNIDADES.filter((u) => areUnitsCompatible(u, unidadeEmbalagem)).map((u) => ({ value: u, label: u }))}
                            />
                          </span>
                          <CampoComAjuda
                            microcopy="Seu estoque de hoje — não o tamanho da embalagem que você compra."
                            exemploDinamico={
                              'É quanto você já tem em casa hoje. O campo acima é o tamanho do pacote ' +
                              'que você costuma comprar (ex.: 1000 g), usado para calcular o custo. ' +
                              'Pode deixar em zero se ainda não comprou.'
                            }
                          />
                          {!editingId && (
                            <label className="flex items-start gap-2 cursor-pointer" style={{ fontSize: '12px', color: '#241B2B', fontFamily: "'Manrope', sans-serif", marginTop: '2px' }}>
                              <input
                                type="checkbox"
                                checked={acabeiDeComprar}
                                onChange={(e) => setAcabeiDeComprar(e.target.checked)}
                                style={{ marginTop: '2px', accentColor: '#6E3F72', width: '16px', height: '16px', flexShrink: 0 }}
                              />
                              <span>
                                Acabei de comprar esta embalagem
                                {(parseNumeroDigitado(quantidadeEmbalagem) || 0) > 0 && (
                                  <span style={{ color: '#7A6E80' }}>
                                    {' '}— somar {quantidadeEmbalagem} {unidadeEmbalagem} ao que já tenho
                                  </span>
                                )}
                              </span>
                            </label>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="flex items-center gap-1.5" style={{ ...ROTULO_COMANDA, color: '#C4626F' }}>
                            <AlertTriangle className="w-[11px] h-[11px]" strokeWidth={2.4} />
                            ALERTA MÍNIMO
                          </span>
                          <span className="flex items-center gap-2" style={{ ...CAIXA_NUMERO, background: '#FDF4F5', border: '1px solid rgba(196,98,111,.18)', boxShadow: 'none' }}>
                            <input
                              type="text" inputMode="decimal" placeholder="100" value={nivelMinimo} onChange={(e) => { setNivelMinimo(e.target.value); setAlertaTocado(true); }}
                              aria-label="Alerta mínimo"
                              className="flex-1 w-full min-w-0 bg-transparent outline-none placeholder:text-[#B3A6B8]"
                              style={NUMERO}
                            />
                            <CustomSelect
                              value={nivelMinimoUnidade}
                              onChange={(v) => { setNivelMinimoUnidade(v as any); setAlertaTocado(true); }}
                              chip
                              ariaLabel="Unidade do nível mínimo"
                              style={CHIP_UNIDADE}
                              options={UNIDADES.map((u) => ({ value: u, label: u }))}
                            />
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </section>
              </div>

                {/* Rodape fixo no fim da tela */}
                <div
                  className="flex-shrink-0 bg-white flex gap-2.5 px-4 pt-3"
                  style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid rgba(36,27,43,.06)', boxShadow: '0 -8px 24px rgba(58,35,80,0.07)' }}
                >
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-shrink-0 transition-transform hover:-translate-y-0.5"
                    style={{ width: '104px', height: '48px', borderRadius: '16px', border: '1px solid rgba(110,63,114,.18)', background: '#FFFFFF', boxShadow: '0 4px 12px rgba(58,35,80,.08)', fontSize: '14px', fontWeight: 800, color: '#3A2350' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 active:scale-95"
                    style={{ height: '48px', borderRadius: '16px', border: 'none', background: '#3A2350', boxShadow: '0 10px 20px rgba(58,35,80,.3)', fontSize: '15px', fontWeight: 800, color: '#F5B9C6' }}
                  >
                    <Check className="w-4 h-4" strokeWidth={2.6} />
                    Salvar produto
                  </button>
                </div>
              </form>
            </div>

            {/* Fica dentro do portal: fora dele, o z-50 do aviso caia atras
                do form em tela cheia (z-[99999]) e a usuaria nao via nada. */}
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
            </div>,
            document.body
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
            {/* Selo de estoque baixo: estava no cabecalho, ao lado do titulo, e
                saiu de la quando os titulos foram centralizados. Fica no topo
                da lista do Estoque, que e onde ele importa. */}
            {lowStockCount > 0 && (
              <span
                className="self-start inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-full whitespace-nowrap"
                style={{ background: '#C4626F', color: '#FFF8F6' }}
              >
                <AlertTriangle className="w-3 h-3" style={{ strokeWidth: 2.5 }} />
                {lowStockCount} {lowStockCount === 1 ? 'Estoque Baixo' : 'Estoques Baixos'}
              </span>
            )}
            <div className="grid grid-cols-1 gap-4 lista-tablet lista-altura-igual">
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
                // Quantidade e aviso na MESMA unidade (a do aviso): "4.725 g"
                // ao lado de "4 kg" obrigava a fazer a conta de cabeca.
                const unidadeDoAviso = p.nivelMinimoUnidade || p.unidadeEmbalagem;

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
                      <text x="38" y="58" textAnchor="middle" fontSize="11" fontWeight="900" fill={colors.stroke} fontFamily="'Manrope', sans-serif">
                        {formatQuantity(arredonda2(qtdNormalizada))} {unidadeDoAviso}
                      </text>
                    </svg>

                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap estoque-titulo">
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
                        <span className="text-[10.5px]" style={{ color: '#7A6E80' }}>Avisar abaixo de:</span>
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
                        <div style={{ fontSize: '11px', fontWeight: 800, color: colors.text, background: '#F6F2F5', border: '1px solid rgba(36,27,43,.08)', borderRadius: '12px', padding: '7px 9px', whiteSpace: 'nowrap', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {fraseDoAviso(qtdNormalizada, min, unidadeDoAviso)}
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
            <div className="grid grid-cols-1 gap-3 lista-tablet">
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
