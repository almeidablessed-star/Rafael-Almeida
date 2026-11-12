import React, { useEffect, useState } from 'react';
import { situacaoPagamento, faltaReceberDoPedido } from '../utils/situacaoPagamento';
import { Transaction, TransactionType } from '../types';
import { formatCurrency, formatDateBr, getTodayIso } from '../utils/formatters';
import { useCurrency } from '../context/CurrencyContext';
import { QuotePdfModal } from './QuotePdfModal';
import { TituloDaPagina } from './TituloDaPagina';
import { useTelaDeComputador } from '../hooks/useTelaDeComputador';
import {
  ShoppingBag,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  Edit3,
  Trash2,
  Filter,
  Users,
  Check,
  Hourglass,
  MoreHorizontal,
} from 'lucide-react';

/**
 * Botao de pagamento de cada estado (utils/situacaoPagamento.ts): leva ao
 * proximo estado — pendente/sinal -> pago, pago -> pendente (este no menu).
 */
const BOTAO = {
  pendente: {
    texto: 'Marcar pago',
    title: 'Clique para marcar este pedido como PAGO',
    ariaLabel: (nome: string) => `Marcar o pedido de ${nome} como pago`,
  },
  sinal: {
    texto: 'Recebi o restante',
    title: 'Recebi o restante: marca este pedido como PAGO por inteiro',
    ariaLabel: (nome: string) => `Recebi o restante do pedido de ${nome}: marcar como pago`,
  },
  pago: {
    texto: 'Voltar para pendente',
    title: 'Clique para alterar este pedido para PENDENTE',
    ariaLabel: (nome: string) => `Mudar o pedido de ${nome} para pendente`,
  },
} as const;

interface CartaoPedidoProps {
  tx: Transaction;
  /** A entrega ja passou e ainda falta receber. */
  atrasado: boolean;
  pc: boolean;
  menuAberto: boolean;
  formatMoney: (valor: number) => string;
  onAlternarMenu: () => void;
  onEditar: () => void;
  onExcluir: () => void;
  onPdf: () => void;
  onPagamento?: () => void;
}

/**
 * Card de um pedido, igual no celular e no computador. Sempre branco; a cor
 * fica na etiqueta do canto (rosa = falta receber, verde = pago) e so o
 * atrasado ganha o fio vinho na lateral. Excluir mora no menu "mais opcoes",
 * longe do toque acidental.
 */
const CartaoPedido: React.FC<CartaoPedidoProps> = ({
  tx, atrasado, pc, menuAberto, formatMoney, onAlternarMenu, onEditar, onExcluir, onPdf, onPagamento,
}) => {
  const situacao = situacaoPagamento(tx);
  const nome = tx.customerName || 'cliente';
  const falta = faltaReceberDoPedido(tx);
  const sombra = '0 8px 20px rgba(58,35,80,.09)';
  const botaoBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    minHeight: '44px', border: 0, borderRadius: '14px', fontFamily: 'inherit',
    fontSize: '14px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
  };
  const leve: React.CSSProperties = { ...botaoBase, background: '#F3EDF4', color: '#3A2350' };
  const quadrado: React.CSSProperties = { ...leve, width: '44px', flex: 'none', padding: 0 };
  const itemMenu: React.CSSProperties = {
    ...botaoBase, width: '100%', justifyContent: 'flex-start', padding: '0 14px',
    borderRadius: '10px', background: 'transparent', color: '#241B2B', fontWeight: 600,
  };
  // No celular, "Recebi o restante" nao cabe ao lado de "PDF" por extenso (360px).
  const pdfSoIcone = !pc && situacao === 'sinal' && !!onPagamento;
  const parar = (acao: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); acao(); };

  return (
    <article
      className="cartao-pedido"
      onClick={onEditar}
      style={{
        position: 'relative',
        zIndex: menuAberto ? 5 : undefined,
        padding: '16px',
        borderRadius: '22px',
        background: '#FFFFFF',
        boxShadow: atrasado ? `inset 4px 0 0 #C4626F, ${sombra}` : sombra,
        cursor: 'pointer',
        fontFamily: pc ? 'inherit' : "'Manrope', sans-serif",
        color: '#241B2B',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.25, overflowWrap: 'anywhere' }}>
            {tx.customerName || 'Cliente'}
          </div>
          <div style={{ marginTop: '3px', fontSize: '13px', color: '#5B5062' }}>
            Entrega {formatDateBr(tx.date)}
            {tx.paymentMethod ? <> · <span style={{ textTransform: 'capitalize' }}>{tx.paymentMethod}</span></> : null}
          </div>
          {atrasado && (
            <div style={{ marginTop: '2px', fontSize: '13px', fontWeight: 700, color: '#A32D3D' }}>Atrasado</div>
          )}
        </div>
        <span
          style={{
            flex: 'none', padding: '6px 11px', borderRadius: '999px', fontSize: '12px', fontWeight: 700,
            whiteSpace: 'nowrap',
            background: situacao === 'pago' ? '#DDF1E3' : '#FBE3E9',
            color: situacao === 'pago' ? '#26402F' : '#3A2350',
          }}
        >
          {situacao === 'pago' ? 'Pago' : `Falta ${formatMoney(falta)}`}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 10px', margin: '14px 0' }}>
        <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>
          {formatMoney(tx.totalValue)}
        </span>
        {!!tx.signalValue && situacao !== 'pago' && (
          <span style={{ fontSize: '13px', color: '#5B5062' }}>
            {situacao === 'sinal'
              ? `sinal de ${formatMoney(tx.signalValue)} já pago`
              : `sinal combinado de ${formatMoney(tx.signalValue)}`}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onPagamento && situacao !== 'pago' && (
          <button
            type="button"
            onClick={parar(onPagamento)}
            aria-label={BOTAO[situacao].ariaLabel(nome)}
            title={BOTAO[situacao].title}
            style={{ ...botaoBase, flex: 1, minWidth: 0, padding: '0 10px', background: '#3A2350', color: '#FFFFFF' }}
          >
            {BOTAO[situacao].texto}
          </button>
        )}
        <button
          type="button"
          onClick={parar(onPdf)}
          aria-label={`Gerar orçamento em PDF do pedido de ${nome}`}
          title="Gerar e Visualizar Orçamento em PDF"
          style={pdfSoIcone ? quadrado : { ...leve, padding: '0 14px', flex: situacao === 'pago' || !onPagamento ? 1 : 'none' }}
        >
          <Printer size={pdfSoIcone ? 17 : 15} strokeWidth={2} aria-hidden="true" />
          {!pdfSoIcone && 'PDF'}
        </button>
        <button type="button" onClick={parar(onEditar)} aria-label={`Editar o pedido de ${nome}`} title="Editar" style={quadrado}>
          <Edit3 size={17} strokeWidth={2} aria-hidden="true" />
        </button>
        <div style={{ position: 'relative', flex: 'none' }}>
          <button
            type="button"
            onClick={parar(onAlternarMenu)}
            aria-label={`Mais opções do pedido de ${nome}`}
            aria-haspopup="menu"
            aria-expanded={menuAberto}
            title="Mais opções"
            style={quadrado}
          >
            <MoreHorizontal size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
          {/* Com o menu aberto, um toque em qualquer outro lugar so fecha o
              menu — sem abrir a edicao do card que estava embaixo do dedo. */}
          {menuAberto && (
            <div
              aria-hidden="true"
              onClick={parar(onAlternarMenu)}
              style={{ position: 'fixed', inset: 0, zIndex: 9, cursor: 'default' }}
            />
          )}
          {menuAberto && (
            <div
              role="menu"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute', right: 0, bottom: 'calc(100% + 8px)', zIndex: 10, minWidth: '210px',
                padding: '6px', borderRadius: '16px', background: '#FFFFFF',
                boxShadow: '0 14px 34px rgba(58,35,80,.22), 0 0 0 1px rgba(58,35,80,.08)',
              }}
            >
              {onPagamento && situacao === 'pago' && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { onAlternarMenu(); onPagamento(); }}
                  aria-label={BOTAO.pago.ariaLabel(nome)}
                  style={itemMenu}
                >
                  <Clock size={16} strokeWidth={2} aria-hidden="true" />
                  {BOTAO.pago.texto}
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => { onAlternarMenu(); onExcluir(); }}
                aria-label={`Excluir o pedido de ${nome}`}
                style={{ ...itemMenu, color: '#A32D3D' }}
              >
                <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
                Excluir pedido
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

interface OrdersModuleProps {
  transactions: Transaction[];
  onOpenAddModal: (type?: TransactionType) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  onTogglePaymentStatus?: (tx: Transaction) => void;
}

export const OrdersModule: React.FC<OrdersModuleProps> = ({
  transactions,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  onTogglePaymentStatus,
}) => {
  const { formatCurrency: formatMoney } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pago' | 'sinal' | 'pendente'>('todos');
  const [quoteTx, setQuoteTx] = useState<Transaction | null>(null);
  // Qual pedido esta com o menu "mais opcoes" aberto; um toque fora ou Esc fecha.
  const [menuDoPedido, setMenuDoPedido] = useState<string | null>(null);
  useEffect(() => {
    if (menuDoPedido == null) return;
    const fechar = () => setMenuDoPedido(null);
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar(); };
    document.addEventListener('click', fechar);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('click', fechar);
      document.removeEventListener('keydown', tecla);
    };
  }, [menuDoPedido]);

  const [vista, setVista] = useState<'proximos' | 'historico'>('proximos');
  // Versao computador (docs/design/desktop-redesign, Pedidos.dc.html). Ver o `if (pc)`.
  const pc = useTelaDeComputador();

  // Filter sales/orders only
  const sales = transactions.filter((t) => t.type === 'venda');

  // Proximos x Historico. Antes a lista mostrava todo pedido ja lancado, para
  // sempre, e a tela so crescia. Agora o pedido vai para o Historico no dia
  // SEGUINTE ao da entrega (no proprio dia ele ainda precisa estar a vista) —
  // a nao ser que ainda falte receber dinheiro dele: pedido atrasado sem
  // pagamento continua em Proximos, marcado, para nao ser esquecido.
  // Nada e apagado nem gravado: e so um filtro da tela pela data da entrega.
  const hoje = getTodayIso();
  const faltaReceber = (s: Transaction) =>
    s.paymentStatus === 'pendente' ||
    (!!s.signalValue && Number(s.signalValue) < (s.totalValue || 0));
  const estaNoHistorico = (s: Transaction) => !!s.date && s.date < hoje && !faltaReceber(s);
  const proximos = sales.filter((s) => !estaNoHistorico(s));
  const historico = sales.filter(estaNoHistorico);
  // Proximos: a entrega mais perto primeiro. Historico: o mais recente primeiro.
  const salesDaVista = (vista === 'historico' ? historico : proximos)
    .slice()
    .sort((a, b) => {
      const ordem = (a.date || '').localeCompare(b.date || '');
      return vista === 'historico' ? -ordem : ordem;
    });

  const filteredSales = salesDaVista.filter((s) => {
    const matchesSearch =
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.customerName && s.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

    // Pendente, Sinal pago ou Pago: a mesma regra da etiqueta (utils/situacaoPagamento.ts).
    const matchesStatus =
      statusFilter === 'todos' ? true : situacaoPagamento(s) === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Financial calculations
  const totalVendas = sales.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
  const totalPagas = sales
    .filter((s) => (s.paymentStatus || 'pago') === 'pago')
    .reduce((acc, curr) => {
      const paidAmount = curr.signalValue ? Number(curr.signalValue) : (curr.totalValue || 0);
      return acc + paidAmount;
    }, 0);
  const totalPendentes = sales
    .filter((s) => s.paymentStatus === 'pendente')
    .reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
  const totalAReceber = sales
    .filter((s) => (s.paymentStatus || 'pago') === 'pago' && s.signalValue)
    .reduce((acc, curr) => {
      const remainingAmount = (curr.totalValue || 0) - (curr.signalValue || 0);
      return acc + remainingAmount;
    }, 0);

  // Contagens dos filtros de status: so da vista aberta, para o numero bater
  // com os cards que aparecem embaixo.
  const pendingCount = salesDaVista.filter((s) => situacaoPagamento(s) === 'pendente').length;
  const paidCount = salesDaVista.filter((s) => situacaoPagamento(s) === 'pago').length;
  const sinalCount = salesDaVista.filter((s) => situacaoPagamento(s) === 'sinal').length;
  // Legenda das caixas de resumo: quem tem so o sinal pago aparece nas duas
  // (o sinal entrou em "pagas", o restante esta em "a receber").
  const comSinal = sinalCount ? ` + ${sinalCount} com sinal` : '';

  // Legenda das caixas de resumo: os valores delas somam TODOS os pedidos, entao
  // a contagem tambem. Com a da vista, "$100 em vendas pagas" saia ao lado de
  // "0 pedidos pagos" quando o pedido estava no Historico.
  const pagosNoTotal = sales.filter((s) => situacaoPagamento(s) === 'pago').length;
  const pendentesNoTotal = sales.filter((s) => situacaoPagamento(s) === 'pendente').length;
  const sinalNoTotal = sales.filter((s) => situacaoPagamento(s) === 'sinal').length;
  const comSinalNoTotal = sinalNoTotal ? ` + ${sinalNoTotal} com sinal` : '';

  // Ha pedidos, so nao nesta vista (ou na busca/filtro). Mesmo texto no
  // celular e no computador.
  const mensagemListaVazia =
    searchTerm || statusFilter !== 'todos'
      ? 'Nenhum pedido encontrado com esse filtro.'
      : vista === 'historico'
      ? 'Nenhum pedido no histórico ainda. Os pedidos entregues e pagos vêm para cá no dia seguinte à entrega.'
      : 'Nenhum pedido para os próximos dias.';

  // Conta sem nenhum pedido: o convite para lancar o primeiro.
  const vazioSemPedidos = (
    <div
      className="flex flex-col items-center gap-2.5 text-center lista-vazia"
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
        <ShoppingBag className="w-[30px] h-[30px]" style={{ color: '#6E3F72' }} strokeWidth={2} />
      </div>
      <div className="font-serif-display" style={{ fontSize: '22px', color: '#3A2350' }}>
        Nenhum pedido encontrado
      </div>
      <div className="text-sm" style={{ color: '#7A6E80', maxWidth: '280px' }}>
        Lance seu primeiro pedido para começar a vender.
      </div>
      <button
        type="button"
        onClick={() => onOpenAddModal('venda')}
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
        Lançar Novo Pedido
      </button>
    </div>
  );

  const modalPdf = quoteTx && (
    <QuotePdfModal
      transaction={quoteTx}
      onClose={() => setQuoteTx(null)}
    />
  );

  // ------------------------------------------------------------------
  // COMPUTADOR (docs/design/desktop-redesign, Pedidos.dc.html): titulo com
  // o selo, resumo num cartao branco, os controles numa linha so e as
  // comandas em grade. Mesmos numeros, filtros, busca e modais do celular.
  // ------------------------------------------------------------------
  if (pc) {
    const caixaResumo = (
      tipo: 'pagas' | 'receber',
      rotulo: string,
      valor: number,
      contagem: string,
    ) => {
      const pagas = tipo === 'pagas';
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            padding: '18px 20px',
            borderRadius: '18px',
            background: pagas ? '#EEF7F0' : '#FBF5EA',
            border: `1px solid ${pagas ? '#CBE6D3' : '#F0E2C8'}`,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', color: pagas ? '#2E6B45' : '#7A5A1E' }}>
            {pagas ? <Check size={13} strokeWidth={2.6} aria-hidden="true" /> : <Hourglass size={13} strokeWidth={2.2} aria-hidden="true" />}
            {rotulo}
          </span>
          <span style={{ fontSize: '26px', fontWeight: 800, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{formatMoney(valor)}</span>
          <span style={{ fontSize: '12px', color: pagas ? '#3F6B4C' : '#7A5A1E' }}>{contagem}</span>
        </div>
      );
    };

    const filtrosStatus = [
      { id: 'todos', rotulo: 'Todos', total: salesDaVista.length },
      { id: 'pago', rotulo: 'Pagos', total: paidCount },
      { id: 'sinal', rotulo: 'Sinal pago', total: sinalCount },
      { id: 'pendente', rotulo: 'Pendentes', total: pendingCount },
    ] as const;

    return (
      <div
        className="animate-fadeIn"
        style={{ display: 'flex', flexDirection: 'column', gap: '28px', fontFamily: "'Manrope', system-ui, sans-serif", fontSize: '14px', lineHeight: 1.5, color: '#241B2B' }}
      >
        <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 16px' }}>
          <TituloDaPagina>Pedidos &amp; Encomendas</TituloDaPagina>
          <span style={{ padding: '6px 14px', borderRadius: '999px', background: '#F3E9F3', color: '#3A2350', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {sales.length} {sales.length === 1 ? 'Pedido' : 'Pedidos'}
          </span>
        </header>

        <section
          aria-label="Resumo das vendas"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '22px 36px',
            padding: '30px',
            borderRadius: '24px',
            background: '#FFFFFF',
            boxShadow: '0 8px 20px rgba(58,35,80,0.08)',
          }}
        >
          <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.14em', color: '#7A6E80' }}>TOTAL EM VENDAS</span>
            <span style={{ fontSize: '56px', fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {formatMoney(totalVendas)}
            </span>
            <span style={{ fontSize: '13px', color: '#7A6E80' }}>
              {sales.length} {sales.length === 1 ? 'encomenda registrada' : 'encomendas registradas'}
            </span>
          </div>
          <div style={{ flex: '2 1 460px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {caixaResumo('pagas', 'VENDAS PAGAS', totalPagas, `${pagosNoTotal} ${pagosNoTotal === 1 ? 'pedido pago' : 'pedidos pagos'}${comSinalNoTotal}`)}
            {caixaResumo('receber', 'A RECEBER (PENDENTES)', totalPendentes + totalAReceber, `${pendentesNoTotal} ${pendentesNoTotal === 1 ? 'pedido pendente' : 'pedidos pendentes'}${comSinalNoTotal}`)}
          </div>
        </section>

        {/* Controles numa linha: Proximos/Historico, status e busca. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px 24px' }}>
          <div
            role="group"
            aria-label="Próximos ou histórico"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '4px', width: '320px', maxWidth: '100%', padding: '4px', boxSizing: 'border-box', borderRadius: '999px', background: '#EDE5EC' }}
          >
            {([
              { id: 'proximos', label: 'Próximos', total: proximos.length },
              { id: 'historico', label: 'Histórico', total: historico.length },
            ] as const).map((op) => {
              const ligada = vista === op.id;
              return (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setVista(op.id)}
                  aria-pressed={ligada}
                  style={{
                    height: '40px',
                    border: 0,
                    borderRadius: '999px',
                    background: ligada ? '#FFFFFF' : 'transparent',
                    color: ligada ? '#3A2350' : '#6A5F70',
                    boxShadow: ligada ? '0 4px 10px rgba(58,35,80,0.1)' : 'none',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    fontWeight: ligada ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  {op.label} ({op.total})
                </button>
              );
            })}
          </div>

          <div role="group" aria-label="Filtrar por pagamento" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', color: '#7A6E80' }}>STATUS:</span>
            {filtrosStatus.map((f) => {
              const ligado = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  aria-pressed={ligado}
                  style={{
                    minHeight: '44px',
                    padding: '0 2px',
                    border: 0,
                    borderBottom: `2px solid ${ligado ? '#3A2350' : 'transparent'}`,
                    background: 'none',
                    color: ligado ? '#3A2350' : '#6A5F70',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    fontWeight: ligado ? 800 : 600,
                    cursor: 'pointer',
                  }}
                >
                  {f.rotulo} ({f.total})
                </button>
              );
            })}
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flex: '0 1 380px',
              height: '46px',
              boxSizing: 'border-box',
              padding: '0 18px',
              borderRadius: '999px',
              background: '#FFFFFF',
              boxShadow: '0 6px 14px rgba(58,35,80,0.07)',
              color: '#7A6E80',
            }}
          >
            <Search size={17} strokeWidth={1.9} aria-hidden="true" />
            <input
              type="search"
              aria-label="Buscar pedido"
              placeholder="Buscar por nome da cliente ou descrição do produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="busca-computador"
              style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', fontFamily: 'inherit', fontSize: '13px', color: '#241B2B' }}
            />
          </label>
        </div>

        {filteredSales.length === 0 && sales.length > 0 ? (
          <p style={{ margin: 0, padding: '40px 20px', borderRadius: '20px', background: '#FFFFFF', textAlign: 'center', fontSize: '14px', color: '#7A6E80' }}>
            {mensagemListaVazia}
          </p>
        ) : filteredSales.length === 0 ? (
          vazioSemPedidos
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
            {filteredSales.map((tx) => (
              <CartaoPedido
                key={tx.id}
                tx={tx}
                atrasado={!!tx.date && tx.date < hoje && faltaReceber(tx)}
                pc={pc}
                menuAberto={menuDoPedido === tx.id}
                formatMoney={formatMoney}
                onAlternarMenu={() => setMenuDoPedido((id) => (id === tx.id ? null : tx.id))}
                onEditar={() => onEditTransaction(tx)}
                onExcluir={() => onDeleteTransaction(tx)}
                onPdf={() => setQuoteTx(tx)}
                onPagamento={onTogglePaymentStatus ? () => onTogglePaymentStatus(tx) : undefined}
              />
            ))}
          </div>
        )}

        {modalPdf}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn pb-8">
      {/* Header Card — Flutuante com cabeçalho roxo */}
      <div
        className="overflow-hidden"
        style={{
          // Sem sombra aqui: este envolucro e a pagina inteira, nao um cartao. A
          // sombra roxa (0 30px 70px) caia logo abaixo da borda de baixo dele e,
          // no iPhone — onde 100vh e maior que a area visivel — essa borda fica
          // ACIMA do menu, entao a sombra aparecia como uma faixa roxa/rosa no
          // fim da tela. O Inicio nao tem envolucro nem sombra, e por isso o fim
          // dele e so o fundo da pagina. Aqui passa a ser igual.
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          background: '#F6F2F5',
          marginBottom: '-70px',
          paddingBottom: '70px',
          // Sangra para cima cobrindo a safe area, mesmo padrao do header do
          // Dashboard: o cabecalho roxo (primeiro filho, sem gap) preenche
          // esse espaco extra com o proprio paddingTop compensado, entao o
          // roxo vai ate a borda da tela no PWA instalado em vez de deixar a
          // safe area com o fundo claro por baixo.
          marginTop: 'calc(0px - env(safe-area-inset-top, 0px))',
        }}
      >
        {/* Header roxo: titulo+selo, total em vendas (texto, sem grafico) e
            os cards de Pagas/A Receber, tudo dentro do mesmo gradiente —
            como a referencia 6A. Antes "Total em Vendas" tinha um donut de
            progresso e os dois cards ficavam brancos soltos no corpo claro;
            a referencia nao tem grafico nenhum ali, e os dois cards vivem
            dentro do roxo com fundo translucido tingido (verde/areia). */}
        <div
          className="px-5 flex flex-col gap-4"
          style={{
            background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)',
            paddingTop: 'calc(24px + env(safe-area-inset-top, 0px) + var(--topo-ios27, 0px))',
            paddingBottom: '44px',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <span
              className="text-white leading-tight flex-1"
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: '29px',
                lineHeight: '1.1',
              }}
            >
              Pedidos &amp; Encomendas
            </span>

            {/* Selo translucido: contra o roxo do fundo, fica "roxo claro",
                nao mais o salmao solido de antes. */}
            <span
              className="uppercase font-black shrink-0 whitespace-nowrap"
              style={{
                background: 'rgba(255,255,255,.18)',
                border: '1px solid rgba(255,255,255,.28)',
                color: '#FFFFFF',
                fontSize: '10px',
                padding: '6px 12px',
                borderRadius: '999px',
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 800,
              }}
            >
              {sales.length} {sales.length === 1 ? 'Pedido' : 'Pedidos'}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                letterSpacing: '.14em',
                color: 'rgba(247,220,225,.8)',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              TOTAL EM VENDAS
            </span>
            <span
              style={{
                fontSize: '32px',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-.03em',
                lineHeight: 1,
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              {formatMoney(totalVendas)}
            </span>
            <span style={{ fontSize: '10px', color: 'rgba(247,220,225,.72)', fontFamily: "'Manrope', sans-serif" }}>
              {sales.length} {sales.length === 1 ? 'encomenda registrada' : 'encomendas registradas'}
            </span>
          </div>

          <div className="flex gap-2">
            {/* Vendas Pagas */}
            <div className="flex-1" style={{ background: 'rgba(169,216,184,.22)', borderRadius: '16px', padding: '11px 12px' }}>
              <div style={{ fontSize: '9px', color: '#CDEBD8', fontWeight: 800, letterSpacing: '.06em', fontFamily: "'Manrope', sans-serif" }}>
                ✓ VENDAS PAGAS
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginTop: '3px', fontFamily: "'Manrope', sans-serif" }}>
                {formatMoney(totalPagas)}
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(247,220,225,.7)', marginTop: '2px', fontFamily: "'Manrope', sans-serif" }}>
                {pagosNoTotal} {pagosNoTotal === 1 ? 'pedido pago' : 'pedidos pagos'}{comSinalNoTotal}
              </div>
            </div>

            {/* A Receber */}
            <div className="flex-1" style={{ background: 'rgba(228,217,195,.26)', borderRadius: '16px', padding: '11px 12px' }}>
              <div style={{ fontSize: '9px', color: '#F0E2C8', fontWeight: 800, letterSpacing: '.06em', fontFamily: "'Manrope', sans-serif" }}>
                ⏳ A RECEBER (PENDENTES)
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginTop: '3px', fontFamily: "'Manrope', sans-serif" }}>
                {formatMoney(totalPendentes + totalAReceber)}
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(247,220,225,.7)', marginTop: '2px', fontFamily: "'Manrope', sans-serif" }}>
                {pendentesNoTotal} {pendentesNoTotal === 1 ? 'pedido pendente' : 'pedidos pendentes'}{comSinalNoTotal}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-4"
          style={{
            marginTop: '-24px',
            background: '#F6F2F5',
            borderRadius: '28px 28px 0 0',
            position: 'relative',
            padding: '20px',
            marginLeft: 'calc(-0.5 * var(--app-bleed) + 50%)',
            marginRight: 'calc(-0.5 * var(--app-bleed) + 50%)',
            paddingLeft: 'calc(20px + max(0px, env(safe-area-inset-left)))',
            paddingRight: 'calc(20px + max(0px, env(safe-area-inset-right)))',
            flex: 1,
            paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          }}
        >

      {/* Proximos / Historico */}
      <div
        className="grid grid-cols-2"
        style={{ background: '#EDE5EC', borderRadius: '999px', padding: '4px', gap: '4px' }}
      >
        {([
          { id: 'proximos', label: 'Próximos', total: proximos.length },
          { id: 'historico', label: 'Histórico', total: historico.length },
        ] as const).map((op) => (
          <button
            key={op.id}
            type="button"
            onClick={() => setVista(op.id)}
            className="transition-all cursor-pointer"
            style={{
              fontSize: '12px',
              fontWeight: vista === op.id ? 800 : 600,
              fontFamily: "'Manrope', sans-serif",
              color: vista === op.id ? '#3A2350' : '#7A6E80',
              background: vista === op.id ? '#fff' : 'transparent',
              boxShadow: vista === op.id ? '0 4px 10px rgba(58,35,80,.1)' : 'none',
              border: 'none',
              borderRadius: '999px',
              padding: '9px 0',
            }}
          >
            {op.label} ({op.total})
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-[11px]">
        <div className="relative">
          <Search className="w-4 h-4 text-[#A096A6] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome da cliente ou descrição do produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 bg-white rounded-full text-[11px] text-[#A096A6] focus:outline-none focus:ring-2 focus:ring-neutral-charcoal/20"
            style={{
              fontFamily: "'Manrope', sans-serif",
              boxShadow: '0 6px 14px rgba(58,35,80,.07)',
            }}
          />
        </div>

        {/* Cada filtro numa linha so; se os quatro nao couberem, a faixa rola para o lado. */}
        <div className="flex items-center gap-[10px] overflow-x-auto no-scrollbar [&>*]:shrink-0 [&>*]:whitespace-nowrap" style={{ paddingBottom: '0.25rem', borderBottom: '1px solid rgba(36,27,43,.1)' }}>
          <span className="text-[10px] font-bold text-[#9A8FA0] uppercase flex items-center gap-1" style={{ fontFamily: "'Manrope', sans-serif", letterSpacing: '.06em' }}>
            STATUS:
          </span>

          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'todos'
                ? 'text-[#3A2350] border-b-2 border-[#3A2350]'
                : 'text-[#7A6E80] hover:text-[#3A2350]'
            }`}
            style={{
              fontSize: '12px',
              fontFamily: "'Manrope', sans-serif",
              fontWeight: statusFilter === 'todos' ? 800 : 600,
              background: 'none',
              border: 'none',
              padding: '8px 0',
              marginBottom: statusFilter === 'todos' ? '-1px' : '0',
            }}
          >
            Todos ({salesDaVista.length})
          </button>

          <button
            onClick={() => setStatusFilter('pago')}
            className={`text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'pago'
                ? 'text-[#3A2350] border-b-2 border-[#3A2350]'
                : 'text-[#7A6E80] hover:text-[#3A2350]'
            }`}
            style={{
              fontSize: '12px',
              fontFamily: "'Manrope', sans-serif",
              fontWeight: statusFilter === 'pago' ? 800 : 600,
              background: 'none',
              border: 'none',
              padding: '8px 0',
              marginBottom: statusFilter === 'pago' ? '-1px' : '0',
            }}
          >
            Pagos ({paidCount})
          </button>

          <button
            onClick={() => setStatusFilter('sinal')}
            className={`text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              statusFilter === 'sinal'
                ? 'text-[#3A2350] border-b-2 border-[#3A2350]'
                : 'text-[#7A6E80] hover:text-[#3A2350]'
            }`}
            style={{
              fontSize: '12px',
              fontFamily: "'Manrope', sans-serif",
              fontWeight: statusFilter === 'sinal' ? 800 : 600,
              background: 'none',
              border: 'none',
              padding: '8px 0',
              marginBottom: statusFilter === 'sinal' ? '-1px' : '0',
            }}
          >
            Sinal ({sinalCount})
          </button>

          <button
            onClick={() => setStatusFilter('pendente')}
            className={`text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'pendente'
                ? 'text-[#3A2350] border-b-2 border-[#3A2350]'
                : 'text-[#7A6E80] hover:text-[#3A2350]'
            }`}
            style={{
              fontSize: '12px',
              fontFamily: "'Manrope', sans-serif",
              fontWeight: statusFilter === 'pendente' ? 800 : 600,
              background: 'none',
              border: 'none',
              padding: '8px 0',
              marginBottom: statusFilter === 'pendente' ? '-1px' : '0',
            }}
          >
            <Clock className="w-3 h-3 text-semantic-warning" />
            Pendentes ({pendingCount})
          </button>
        </div>
      </div>

      {/* Orders List (grade no iPad: ver .lista-tablet em index.css) */}
      <div className="space-y-2.5 lista-tablet">
        {filteredSales.length === 0 && sales.length > 0 ? (
          // Ha pedidos, so nao nesta vista (ou na busca/filtro): o convite
          // "Lance seu primeiro pedido" abaixo seria falso aqui.
          <div
            className="text-center lista-vazia"
            style={{
              background: '#fff',
              border: '1px solid rgba(58,35,80,0.1)',
              borderRadius: '20px',
              padding: '28px 20px',
              fontSize: '13px',
              color: '#7A6E80',
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {mensagemListaVazia}
          </div>
        ) : filteredSales.length === 0 ? (
          vazioSemPedidos
        ) : (
          filteredSales.map((tx) => (
            <CartaoPedido
              key={tx.id}
              tx={tx}
              atrasado={!!tx.date && tx.date < hoje && faltaReceber(tx)}
              pc={pc}
              menuAberto={menuDoPedido === tx.id}
              formatMoney={formatMoney}
              onAlternarMenu={() => setMenuDoPedido((id) => (id === tx.id ? null : tx.id))}
              onEditar={() => onEditTransaction(tx)}
              onExcluir={() => onDeleteTransaction(tx)}
              onPdf={() => setQuoteTx(tx)}
              onPagamento={onTogglePaymentStatus ? () => onTogglePaymentStatus(tx) : undefined}
            />
          ))
        )}
      </div>

      {/* PDF QUOTE PREVIEW MODAL */}
      {modalPdf}
        </div>
      </div>
    </div>
  );
};
