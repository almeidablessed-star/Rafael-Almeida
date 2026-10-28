import React, { useState, useRef } from 'react';
import { avisar } from './AvisoApp';
import { Transaction, TransactionType, StockItem } from '../types';
import { calculateWeeklyBalances } from '../utils/financialEngine';
import { WeeklyHistoryCard } from './WeeklyHistoryCard';
import { FieldValidationError } from './FieldValidationError';
import { StockItemAutocomplete } from './StockItemAutocomplete';
import { formatCurrency, formatDateBr, getTodayIso, parseNumeroDigitado } from '../utils/formatters';
import { useCurrency } from '../context/CurrencyContext';
import { useFichasTecnicas } from '../context/FichasTecnicasContext';
import { useProdutos } from '../context/ProdutosContext';
import { useCosts } from '../context/CostsContext';
import { normalizeName } from '../utils/fichaMatcher';
import { CardDeSaldo } from './CardDeSaldo';
import { rotulos } from '../utils/periodoReset';
import { convertQuantity } from '../utils/units';
import { CustomSelect } from './CustomSelect';
import { useTelaDeComputador } from '../hooks/useTelaDeComputador';
import {
  Wallet,
  ShoppingBag,
  Sparkles,
  Plus,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Edit3,
  Trash2,
  Calendar,
  DollarSign,
  Tag,
  Search,
  CheckCircle2,
  Package,
} from 'lucide-react';
import CampoData from './CampoData';

/**
 * Os cofrinhos de onde uma compra desta tela pode sair. O valor e o proprio
 * `tipo` gravado no lancamento. `lucro` entrou em 25/10/2026: quem gastou o
 * investimento e esta com pouca reposicao pode pagar com o que sobrou do lucro.
 */
type CofrinhoDeCompra = 'reposicao' | 'investimento' | 'lucro';

// `seloComputador`: o mesmo selo sem o emoji, para a versao computador (la os
// emojis da interface sairam, como no desenho de docs/design/desktop-redesign).
// No botao o computador usa o `filtro`, que ja e o nome sem emoji.
const COFRINHOS_DE_COMPRA: { id: CofrinhoDeCompra; botao: string; filtro: string; selo: string; seloComputador: string; corSelo: string; fundoSelo: string }[] = [
  { id: 'reposicao', botao: '🔄 Reposição', filtro: 'Reposição', selo: '🔄 Reposição', seloComputador: 'Reposição', corSelo: '#4A3556', fundoSelo: '#F3E9F3' },
  { id: 'investimento', botao: '📈 Investimento', filtro: 'Investimento', selo: '📈 Investimento', seloComputador: 'Investimento', corSelo: '#2F4A6B', fundoSelo: '#E9EFF7' },
  { id: 'lucro', botao: '💰 Lucro', filtro: 'Lucro', selo: '💰 Pago com o lucro', seloComputador: 'Pago com o lucro', corSelo: '#26402F', fundoSelo: '#E3F2E7' },
];

const NOTA_POR_COFRINHO: Record<CofrinhoDeCompra, string> = {
  reposicao: 'Reposição de Insumos',
  investimento: 'Investimento',
  lucro: 'Lucro',
};

interface BalancesAndExpensesModuleProps {
  transactions: Transaction[];
  /** Devolve se gravou: so com `true` o formulario limpa e mostra sucesso. */
  onAddTransaction: (txData: Omit<Transaction, 'id' | 'createdAt'>) => Promise<boolean>;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  /**
   * true quando renderizado dentro de Produtos > Compras (spec Modulo
   * Produtos): pula o cabecalho gradiente proprio "Saldos" e o wrapper de
   * largura total, que duplicariam o cabecalho "Produtos" que ja existe ali
   * em cima. A aba "Compras" separada do rodape continua usando a versao
   * completa, com cabecalho — ela existe por enquanto pela mesma cautela
   * incremental do resto da migracao.
   */
  embedded?: boolean;
}

export const BalancesAndExpensesModule: React.FC<BalancesAndExpensesModuleProps> = ({
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  embedded = false,
}) => {
  const { formatCurrency: formatMoney, symbol } = useCurrency();
  // Versao computador (docs/design/desktop-redesign, Produtos.dc.html, aba
  // Compras): mesmos numeros, formulario e historico, outra disposicao.
  const pc = useTelaDeComputador();
  const { fichas } = useFichasTecnicas();
  const { administrativeCosts } = useCosts();
  const periodoReset = administrativeCosts?.periodoReset ?? 'semanal';
  const balances = calculateWeeklyBalances(transactions, fichas, periodoReset);
  // Frases prontas do periodo escolhido, mesma fonte do Inicio. Nunca
  // concatenar aqui — portugues tem concordancia ("essa semana", mas "esse mes").
  const vocab = rotulos(periodoReset);
  // Soma dos DOIS cartoes abaixo, e nao dos tres cofrinhos como antes.
  //
  // Nesta tela so se gasta de Reposicao e de Investimento — a categoria do
  // formulario tem exatamente essas duas opcoes. Entao "disponivel" aqui quer
  // dizer "o que da pra gastar nesta tela", e o numero grande passa a ser a
  // soma do que esta logo abaixo dele, conferivel a olho.
  //
  // O que saiu da conta: mao de obra (gasta pela aba Empresa) e a parte de
  // despesas fixas. Esse dinheiro continua existindo, so nao e gasto por aqui.
  //
  // Desde 25/10/2026 o Lucro tambem e gasto por aqui (terceira opcao do
  // formulario), entao entra na soma junto com os outros dois.
  const saldoTotalDisponivel =
    (balances.reposicao.currentBalance || 0) +
    (balances.investimento.currentBalance || 0) +
    (balances.lucro.currentBalance || 0);
  // Compras agora referencia o catalogo Produtos (spec Modulo Produtos, secao
  // 2.2) em vez de Estoque diretamente. `estoque`/`registrarEntrada` nao sao
  // mais chamados aqui — o rastro de entrada por compra fica na propria
  // transacao (`produto_id`), sem duplicar num `estoque_movimentos` que agora
  // pertence a um sistema paralelo em fase de aposentadoria.
  const { produtos, addProduto, updateProduto, deleteProduto, custoPorUnidade } = useProdutos();

  const produtosParaAutocomplete: StockItem[] = produtos.map((p) => ({
    id: String(p.id),
    name: p.nome,
    quantity: p.quantidadeAtual || 0,
    unit: p.unidadeEmbalagem,
    minThreshold: p.nivelMinimo || 0,
    minThresholdUnit: p.nivelMinimoUnidade || p.unidadeEmbalagem,
    costPerUnit: custoPorUnidade(p),
    fullQuantity: p.quantidadeReferencia || 0,
  }));

  // Form state for quick expense logging
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CofrinhoDeCompra>('reposicao');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayIso());
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const expenseFormRef = useRef<HTMLFormElement>(null);
  /** Id do campo obrigatorio vazio, pra mostrar o card de erro custom no lugar do balao nativo do navegador. */
  const [invalidFieldId, setInvalidFieldId] = useState<string | null>(null);

  // Stock item state (optional)
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnit, setItemUnit] = useState<'g' | 'kg' | 'ml' | 'L' | 'un' | 'pacote'>('g');

  // History filtering
  const [selectedFilter, setSelectedFilter] = useState<'todos' | CofrinhoDeCompra>('todos');
  const [searchTerm, setSearchTerm] = useState('');


  const findExistingProduto = (itemName: string) => {
    const alvo = normalizeName(itemName);
    return produtos.find((p) => normalizeName(p.nome) === alvo);
  };

  // A conversao mora em utils/units.ts. A copia que existia aqui mapeava todas
  // as unidades para uma base so, entao g -> ml devolvia um numero em vez de
  // recusar. Ver [[units]].

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    // Substitui o balao de validacao nativo do navegador (form ganhou
    // `noValidate`) — mesmo padrao usado em Ficha Tecnica e Pedido.
    const form = expenseFormRef.current;
    if (form && !form.checkValidity()) {
      const invalidField = form.querySelector<HTMLElement>(':invalid');
      setInvalidFieldId(invalidField?.id || null);
      requestAnimationFrame(() => invalidField?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }
    setInvalidFieldId(null);

    const valNum = parseNumeroDigitado(amount);
    if (!description.trim() || isNaN(valNum) || valNum <= 0) {
      return;
    }

    // Validate stock item fields: if quantity is filled, description is used as item name
    const itemQtyNum = itemQuantity ? parseNumeroDigitado(itemQuantity) : 0;
    const hasItemQty = itemQtyNum > 0;

    if (hasItemQty && itemQtyNum <= 0) {
      avisar('Quantidade deve ser maior que zero', { titulo: 'Falta a quantidade' });
      return;
    }

    // Referencia (ou cria) o Produto do catalogo. So ATUALIZA quantidade
    // quando o produto tem `controlaEstoque` ativado — itens de referencia de
    // preco (ex: fruta fresca) recebem so o preco atualizado.
    let produtoIdParaTransacao: number | undefined;
    // Como voltar o catalogo ao que era se a COMPRA nao gravar. O produto e
    // atualizado antes do lancamento (o lancamento precisa do id dele), entao
    // uma compra recusada pelo banco deixava o estoque somado sem compra
    // nenhuma registrada.
    let desfazerProduto: (() => Promise<unknown>) | null = null;

    if (hasItemQty) {
      try {
        const itemNameFromDescription = description.trim();
        const existing = findExistingProduto(itemNameFromDescription);

        if (existing) {
          produtoIdParaTransacao = existing.id;

          if (existing.controlaEstoque) {
            // Converte o SALDO JA EXISTENTE para a unidade desta compra — nao
            // o contrario. Assim `quantidadeEmbalagem`/`unidadeEmbalagem`
            // gravados sao exatamente os desta compra ("1kg por R$60"), sem
            // normalizar para "1 unidade base" e perder a embalagem real que
            // a usuaria realmente compra.
            const saldoConvertido = convertQuantity(existing.quantidadeAtual || 0, existing.unidadeEmbalagem, itemUnit);

            if (saldoConvertido === null) {
              // Comprar 2 L de um item cadastrado em gramas nao tem conversao
              // possivel. Somar assim mesmo corromperia o saldo em silencio.
              avisar(
                `"${existing.nome}" está cadastrado em "${existing.unidadeEmbalagem}" e você informou "${itemUnit}".\n\n` +
                  `Essas unidades não se convertem. A despesa foi registrada, mas o estoque não foi alterado.\n\n` +
                  `Ajuste a unidade na aba Produtos ou informe a compra na mesma unidade do cadastro.`,
                { titulo: 'Unidades diferentes' }
              );
            } else {
              desfazerProduto = () => updateProduto(existing.id, existing);
              await updateProduto(existing.id, {
                ...existing,
                quantidadeAtual: saldoConvertido + itemQtyNum,
                precoPago: valNum,
                quantidadeEmbalagem: itemQtyNum,
                unidadeEmbalagem: itemUnit,
              });
            }
          } else {
            // Sem controle de estoque: so atualiza o preco de referencia, no
            // mesmo formato desta compra (ex: "R$15 a bandeja de 500g").
            desfazerProduto = () => updateProduto(existing.id, existing);
            await updateProduto(existing.id, {
              ...existing,
              precoPago: valNum,
              quantidadeEmbalagem: itemQtyNum,
              unidadeEmbalagem: itemUnit,
            });
          }
        } else {
          const novo = await addProduto({
            nome: itemNameFromDescription,
            categoria: null,
            precoPago: valNum,
            quantidadeEmbalagem: itemQtyNum,
            unidadeEmbalagem: itemUnit,
            controlaEstoque: true,
            quantidadeAtual: itemQtyNum,
            quantidadeReferencia: null,
            nivelMinimo: 0,
            nivelMinimoUnidade: itemUnit,
          });
          produtoIdParaTransacao = novo.id;
          desfazerProduto = () => deleteProduto(novo.id);
        }
      } catch (err) {
        console.error('Erro ao atualizar produto:', err);
        avisar('Erro ao registrar item no catálogo de Produtos. Despesa registrada, mas verifique em Produtos.', { titulo: 'Confira em Produtos' });
      }
    }

    const gravou = await onAddTransaction({
      type: category as TransactionType,
      description: description.trim(),
      quantity: 1,
      unitValue: valNum,
      totalValue: valNum,
      date: date || getTodayIso(),
      paymentStatus: 'pago',
      notes: `Compra registrada em ${NOTA_POR_COFRINHO[category]}${hasItemQty ? ` - Item: ${description.trim()} (${itemQtyNum}${itemUnit})` : ''}`,
      produtoId: produtoIdParaTransacao,
    });

    if (!gravou) {
      // O alerta com o motivo ja apareceu (App.handleAddCompra). Aqui: devolve
      // o produto ao que era e mantem o que foi digitado, para tentar de novo
      // sem redigitar. Sem "Despesa lancada!".
      if (desfazerProduto) {
        try {
          await desfazerProduto();
        } catch (err) {
          console.error('Erro ao desfazer o produto da compra que falhou:', err);
          avisar('A compra não foi salva, e o estoque deste item pode ter mudado. Confira na aba Produtos.', { titulo: 'Confira em Produtos' });
        }
      }
      return;
    }

    // Reset form
    setDescription('');
    setAmount('');
    setDate(getTodayIso());
    setItemQuantity('');
    setItemUnit('g');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Filter expenses list (only real expenses under reposicao, investimento or lucro)
  const expenseTransactions = transactions.filter(
    (tx) => tx.type === 'reposicao' || tx.type === 'investimento' || tx.type === 'lucro'
  );

  const filteredExpenses = expenseTransactions.filter((tx) => {
    const matchesCategory = selectedFilter === 'todos' || tx.type === selectedFilter;
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Os pedacos da tela. O celular empilha todos; o computador poe o total e
  // os tres cofrinhos numa linha, o formulario e o historico lado a lado e o
  // historico semanal embaixo (docs/design/desktop-redesign, Produtos.dc.html,
  // aba Compras).
  const totalDisponivel = (
    <>
    {/* Total em LINHA, e nao num terceiro cartao: ele nao e um cofrinho, e a
        soma dos dois que vem logo abaixo. Em formato de cartao, lado a lado
        com os outros, pareceria um terceiro cofrinho — e a pessoa somaria
        tres numeros onde so existem dois.

        O roxo antigo saiu: aqui ele destoava dos cartoes claros e puxava a
        atencao para o total em vez de para os saldos que se gasta. */}
    <div
      className={pc ? undefined : 'mx-5'}
      style={pc
        ? { flex: '1.4 1 260px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px', padding: '4px', fontFamily: "'Manrope', sans-serif" }
        : { fontFamily: "'Manrope', sans-serif" }}
    >
      <div className="text-[9px] uppercase tracking-[0.05em]" style={{ color: '#7A6E80', fontWeight: 800, ...(pc ? { fontSize: '11px' } : {}) }}>
        Total disponível
      </div>
      <div
        className="text-[24px]"
        style={{
          color: saldoTotalDisponivel < 0 ? '#C4626F' : '#241B2B',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: pc ? 1.15 : 1.1,
          marginTop: pc ? 0 : '2px',
          ...(pc ? { fontSize: '34px', fontVariantNumeric: 'tabular-nums' } : {}),
        }}
      >
        {formatMoney(saldoTotalDisponivel)}
      </div>
      <div className="text-[10px]" style={{ color: pc ? '#7A6E80' : '#9A8FA0', marginTop: pc ? 0 : '3px', ...(pc ? { fontSize: '12px' } : {}) }}>
        O que já chegou das vendas − o que você já gastou {vocab.nessePeriodo}.
      </div>
    </div>
    </>
  );

  // Computador: os tres cofrinhos lado a lado, na mesma linha do total.
  const cofrinhosComputador = (
    <>
      {([
        { nome: 'REPOSIÇÃO', saldo: balances.reposicao, destaque: false },
        { nome: 'INVESTIMENTO', saldo: balances.investimento, destaque: false },
        { nome: 'LUCRO', saldo: balances.lucro, destaque: true },
      ]).map(({ nome, saldo, destaque }) => (
        <div key={nome} style={{ flex: '1 1 180px', display: 'flex' }}>
          <CardDeSaldo
            computador
            destaque={destaque}
            nome={nome}
            saldo={saldo.currentBalance || 0}
            entrou={saldo.accumulatedInflow || 0}
            negativo={saldo.isNegative}
          />
        </div>
      ))}
    </>
  );

  const cofrinhosCelular = (
    <>
    {/* Os dois cofrinhos que ESTA tela desconta: escolher "Reposição" ou
        "Investimento" no formulario abaixo tira daqui. Mao de obra tambem e
        um cofrinho, mas quem gasta dela e a aba Empresa — por isso ela nao
        ganha cartao aqui, so entra no total acima.

        Mesmo componente dos cartoes do Inicio (CardDeSaldo) de proposito:
        sao os mesmos cofrinhos, e duas copias do estilo iam divergir na
        primeira edicao de qualquer uma das duas telas.

        Saiu daqui a barrinha de proporcoes 45,6% / 31,6% / 22,8%: os tres
        numeros eram fixos no codigo, sem nenhuma relacao com o dinheiro da
        conta — desenho com cara de dado. */}
    <div className="flex gap-3 mx-5" style={{ marginTop: '10px' }}>
      <CardDeSaldo
        nome="REPOSIÇÃO"
        saldo={balances.reposicao.currentBalance || 0}
        entrou={balances.reposicao.accumulatedInflow || 0}
        negativo={balances.reposicao.isNegative}
      />
      <CardDeSaldo
        nome="INVESTIMENTO"
        saldo={balances.investimento.currentBalance || 0}
        entrou={balances.investimento.accumulatedInflow || 0}
        negativo={balances.investimento.isNegative}
      />
    </div>
    {/* Lucro na versao baixa, embaixo dos dois: tres cartoes grandes lado a
        lado nao cabem nesta tela em 360px (o terceiro saia pela direita). */}
    <div className="flex mx-5" style={{ marginTop: '10px' }}>
      <CardDeSaldo
        compacto
        destaque
        nome="LUCRO"
        saldo={balances.lucro.currentBalance || 0}
        entrou={balances.lucro.accumulatedInflow || 0}
        negativo={balances.lucro.isNegative}
      />
    </div>
    </>
  );

  const formularioCompra = (
    <>
    {/* REGISTRATION FORM FOR REAL PURCHASES / EXPENSES */}
    <div
      className={pc ? 'bg-white' : 'bg-white mx-5'}
      style={{ borderRadius: '24px', padding: pc ? '22px' : '16px', display: 'flex', flexDirection: 'column', gap: pc ? '16px' : '13px', boxShadow: '0 8px 20px rgba(58,35,80,.09)', marginTop: pc ? 0 : '20px', ...(pc ? { flex: '1 1 380px', minWidth: 0, boxSizing: 'border-box' as const } : {}) }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: pc ? '12px' : '10px', borderBottom: '1px solid rgba(36,27,43,.07)', paddingBottom: pc ? '14px' : '11px' }}>
        <span style={{ width: pc ? '40px' : '34px', height: pc ? '40px' : '34px', borderRadius: '12px', background: '#6E3F72', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Plus className="w-4 h-4" style={{ stroke: '#FFFFFF', strokeWidth: 3 }} />
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: pc ? '1px' : '2px' }}>
          <span style={{ fontSize: pc ? '15px' : '13px', fontWeight: 800, color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>
            Lançar Compra Real / Despesa
          </span>
          <span style={{ fontSize: pc ? '12px' : '10px', color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>
            Desconta automaticamente do cofrinho selecionado
          </span>
        </div>
        {showSuccessToast && (
          <span className="bg-[#F3E9F3] text-[#6E3F72] border border-[#6E3F72] font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1 animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#6E3F72]" />
            Despesa lançada!
          </span>
        )}
      </div>

      <form ref={expenseFormRef} onSubmit={handleSaveExpense} noValidate style={{ display: 'flex', flexDirection: 'column', gap: pc ? '16px' : '13px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: pc ? '12px' : '10.5px', fontWeight: 800, color: '#5B4A6B', fontFamily: "'Manrope', sans-serif" }}>
            O que você comprou? (Descrição)
          </label>
          <StockItemAutocomplete
            value={description}
            onChange={setDescription}
            onSelect={() => {}}
            stockItems={produtosParaAutocomplete}
            isEnabled={itemQuantity.trim().length > 0}
            placeholder={itemQuantity ? "Nome do item (ex: Farinha, Açúcar, Caixa, Pote)" : "Ex: 2 sacos de farinha, 2 formas e bicos"}
            {...(pc ? { inputStyle: { height: '46px', minHeight: '46px', padding: '0 14px', fontSize: '14px', fontWeight: 500 } } : {})}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: pc ? '12px' : '10.5px', fontWeight: 800, color: '#5B4A6B', fontFamily: "'Manrope', sans-serif" }}>
            De onde sai o dinheiro
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {COFRINHOS_DE_COMPRA.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: pc ? '0 4px' : '10px 4px',
                  ...(pc ? { height: '44px' } : {}),
                  borderRadius: '14px',
                  background: category === c.id ? '#F3E9F3' : '#FAF7FA',
                  border: category === c.id ? '1.5px solid #B892BE' : '1.5px solid rgba(36,27,43,.1)',
                  color: category === c.id ? '#4A3556' : (pc ? '#6A5F70' : '#7A6E80'),
                  fontSize: pc ? '13px' : '11px',
                  fontWeight: category === c.id ? 800 : 700,
                  cursor: 'pointer',
                  transition: 'transform .2s ease',
                  fontFamily: "'Manrope', sans-serif",
                  whiteSpace: 'nowrap',
                }}
              >
                {pc ? c.filtro : c.botao}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: pc ? '10px' : '9px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: pc ? '12px' : '10.5px', fontWeight: 800, color: '#5B4A6B', fontFamily: "'Manrope', sans-serif" }}>
              Valor Gasto ({symbol})
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', fontSize: pc ? '12px' : '11px', fontWeight: 800, color: '#5B4A6B', fontFamily: "'Manrope', sans-serif", pointerEvents: 'none' }}>
                {symbol}
              </span>
              <input
                id="compra-valor"
                type="text"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (invalidFieldId === 'compra-valor') setInvalidFieldId(null);
                }}
                placeholder="0,00"
                style={{ paddingLeft: pc ? '36px' : '32px', paddingRight: '13px', paddingTop: pc ? 0 : '11px', paddingBottom: pc ? 0 : '11px', ...(pc ? { height: '46px' } : {}), background: '#FAF7FA', border: '1px solid rgba(36,27,43,.08)', borderRadius: '14px', fontSize: pc ? '14px' : '11px', color: '#241B2B', fontFamily: "'Manrope', sans-serif", width: '100%', boxSizing: 'border-box' }}
                required
              />
            </div>
            {invalidFieldId === 'compra-valor' && <FieldValidationError />}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: pc ? '12px' : '10.5px', fontWeight: 800, color: '#5B4A6B', fontFamily: "'Manrope', sans-serif" }}>
              Data da Compra
            </label>
            <CampoData
              id="compra-data"
              value={date}
              onChange={(v) => {
                setDate(v);
                if (invalidFieldId === 'compra-data') setInvalidFieldId(null);
              }}
              style={pc
                ? { height: '46px', boxSizing: 'border-box', padding: '0 14px', background: '#FAF7FA', border: '1px solid rgba(36,27,43,.08)', borderRadius: '14px', fontSize: '14px', color: '#241B2B', fontFamily: "'Manrope', sans-serif" }
                : { padding: '11px 13px', background: '#FAF7FA', border: '1px solid rgba(36,27,43,.08)', borderRadius: '14px', fontSize: '11px', color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}
              required
            />
            {invalidFieldId === 'compra-data' && <FieldValidationError />}
          </div>
        </div>

        {/* Quantidade e Unidade da compra atual (Opcional) — o rotulo
            antigo ("...no Estoque") lia como se perguntasse o que ja
            tinha em estoque; e o oposto: e o quanto foi comprado AGORA,
            somado ao estoque existente daquele item. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: pc ? '6px' : '5px', paddingTop: pc ? '12px' : '8px', borderTop: '1px solid rgba(36,27,43,.08)' }}>
          <label style={{ fontSize: pc ? '11px' : '9.5px', fontWeight: 800, color: '#5B4A6B', fontFamily: "'Manrope', sans-serif", letterSpacing: '0.05em', ...(pc ? { textTransform: 'uppercase' as const } : {}) }}>
            {/* No computador o emoji da interface sai (como no desenho). */}
            {pc ? 'Quantidade Comprada (Opcional)' : '📦 Quantidade Comprada (Opcional)'}
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              inputMode="decimal"
              value={itemQuantity}
              onChange={(e) => setItemQuantity(e.target.value)}
              placeholder="Quantidade"
              style={{ flex: 1, padding: pc ? '0 14px' : '11px 13px', ...(pc ? { height: '46px', minWidth: 0, boxSizing: 'border-box' as const } : {}), background: '#FAF7FA', border: '1px solid rgba(36,27,43,.08)', borderRadius: '14px', fontSize: pc ? '14px' : '11px', color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}
            />
            <CustomSelect
              value={itemUnit}
              onChange={(v) => setItemUnit(v as any)}
              compacto={!pc}
              ariaLabel="Unidade do item comprado"
              style={pc ? { width: '130px', height: '46px', flexShrink: 0 } : { width: '120px', flexShrink: 0 }}
              options={[
                { value: 'un', label: 'Unidade' },
                { value: 'kg', label: 'kg' },
                { value: 'g', label: 'g' },
                { value: 'L', label: 'L' },
                { value: 'ml', label: 'ml' },
                { value: 'pacote', label: 'Pacote' },
              ]}
            />
          </div>
        </div>

        <button
          type="submit"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: pc ? '0 13px' : '13px',
            ...(pc ? { height: '52px' } : {}),
            borderRadius: '16px',
            background: '#3A2350',
            color: '#F5B9C6',
            fontSize: pc ? '13px' : '11.5px',
            fontWeight: 800,
            cursor: 'pointer',
            border: 'none',
            boxShadow: '0 10px 20px rgba(58,35,80,.3)',
            transition: 'transform .22s ease',
            fontFamily: "'Manrope', sans-serif",
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Plus className="w-4 h-4" style={{ stroke: '#F5B9C6', strokeWidth: 3, flexShrink: 0 }} />
          Registrar Compra e Descontar do Cofrinho
        </button>
      </form>
    </div>
    </>
  );

  const historicoCompras = (
    <>
    {/* 4. EXPENSES HISTORY */}
    <div
      className={pc ? 'bg-white' : 'bg-white mx-5'}
      style={{ borderRadius: '24px', padding: pc ? '22px' : '16px', display: 'flex', flexDirection: 'column', gap: pc ? '14px' : '12px', boxShadow: '0 8px 20px rgba(58,35,80,.09)', marginTop: pc ? 0 : '20px', ...(pc ? { flex: '1.4 1 460px', minWidth: 0, boxSizing: 'border-box' as const } : {}) }}
    >
      <div style={pc ? { display: 'flex', flexDirection: 'column', gap: '14px' } : { display: 'flex', flexDirection: 'column', gap: '10px', borderBottom: '1px solid rgba(36,27,43,.07)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: pc ? '24px' : '19px', color: '#241B2B', lineHeight: 1.15 }}>
            Histórico de Compras Realizadas ({expenseTransactions.length})
          </span>
          <span style={{ fontSize: pc ? '12px' : '10px', color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>
            Ajuste ou remova lançamentos se digitou algo errado
          </span>
        </div>

        <div style={{ display: 'flex', background: '#EDE6EF', borderRadius: '12px', padding: '3px' }}>
          <button
            onClick={() => setSelectedFilter('todos')}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: pc ? '12px' : '10.5px',
              fontWeight: selectedFilter === 'todos' ? 800 : 600,
              color: selectedFilter === 'todos' ? '#FFFFFF' : (pc ? '#5E5266' : '#6B5F71'),
              background: selectedFilter === 'todos' ? '#3A2350' : 'transparent',
              borderRadius: '9px',
              padding: pc ? 0 : '7px 0',
              ...(pc ? { height: '38px' } : {}),
              border: 'none',
              boxShadow: selectedFilter === 'todos' ? '0 4px 10px rgba(58,35,80,.28)' : 'none',
              cursor: 'pointer',
              transition: 'background .2s ease',
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            Todos ({expenseTransactions.length})
          </button>
          {COFRINHOS_DE_COMPRA.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedFilter(c.id)}
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: pc ? '12px' : '10.5px',
                fontWeight: selectedFilter === c.id ? 800 : 600,
                color: selectedFilter === c.id ? '#FFFFFF' : (pc ? '#5E5266' : '#6B5F71'),
                background: selectedFilter === c.id ? '#3A2350' : 'transparent',
                borderRadius: '9px',
                padding: pc ? 0 : '7px 0',
                ...(pc ? { height: '38px' } : {}),
                border: 'none',
                boxShadow: selectedFilter === c.id ? '0 4px 10px rgba(58,35,80,.28)' : 'none',
                cursor: 'pointer',
                transition: 'background .2s ease',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              {c.filtro}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      {expenseTransactions.length > 0 && (pc ? (
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '44px', boxSizing: 'border-box', padding: '0 14px', borderRadius: '14px', border: '1px solid rgba(36,27,43,0.08)', background: '#FAF7FA', color: '#7A6E80' }}>
          <Search size={16} strokeWidth={1.9} aria-hidden="true" />
          <input
            type="search"
            aria-label="Buscar compra"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar compra..."
            className="busca-computador"
            style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', fontFamily: 'inherit', fontSize: '13px', color: '#241B2B' }}
          />
        </label>
      ) : (
        <div style={{ position: 'relative' }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#A096A6' }} />
          <div style={{ padding: '11px 12px 11px 34px', background: '#FAF7FA', border: '1px solid rgba(36,27,43,.08)', borderRadius: '14px', fontSize: '11px', color: '#A096A6', fontFamily: "'Manrope', sans-serif" }}>
            Buscar compra...
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar compra..."
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'transparent', border: 'none', paddingLeft: '34px', fontSize: '11px', color: '#241B2B', fontFamily: "'Manrope', sans-serif", borderRadius: '14px', outline: 'none' }}
          />
        </div>
      ))}

      {filteredExpenses.length === 0 ? (
        <div className="flex flex-col items-center gap-2.5 text-center" style={{ padding: '28px 20px' }}>
          <div className="flex items-center justify-center" style={{ width: '56px', height: '56px', borderRadius: '18px', background: '#F3E9F3' }}>
            <Package className="w-6 h-6" style={{ color: '#6E3F72' }} strokeWidth={2} />
          </div>
          <span className="font-serif-display" style={{ fontSize: pc ? '20px' : '18px', color: '#3A2350' }}>
            Nenhuma compra registrada
          </span>
          <span style={{ fontSize: pc ? '13px' : '12px', color: '#7A6E80', maxWidth: '260px', fontFamily: "'Manrope', sans-serif" }}>
            Nenhum lançamento encontrado nesta categoria.
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: pc ? '8px' : '9px' }}>
          {filteredExpenses.map((tx) => {
            const cofrinho = COFRINHOS_DE_COMPRA.find((c) => c.id === tx.type) ?? COFRINHOS_DE_COMPRA[0];

            return (
              <div
                key={tx.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: pc ? '12px' : '10px',
                  padding: pc ? '12px 12px 12px 14px' : '12px',
                  borderRadius: '16px',
                  background: '#FAF7FA',
                  border: pc ? '1px solid transparent' : '1px solid rgba(36,27,43,.06)',
                  cursor: 'pointer',
                  transition: 'transform .25s ease, background .25s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(3px)';
                  e.currentTarget.style.background = '#F3E9F3';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.background = '#FAF7FA';
                }}
              >
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: pc ? '8px' : '6px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: pc ? '11px' : '9px',
                        fontWeight: 800,
                        color: cofrinho.corSelo,
                        background: cofrinho.fundoSelo,
                        padding: pc ? '2px 8px' : '3px 8px',
                        borderRadius: pc ? '6px' : '999px',
                        textTransform: pc ? 'none' : 'uppercase',
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      {pc ? cofrinho.seloComputador : cofrinho.selo}
                    </span>
                    <span style={{ fontSize: pc ? '13px' : '12px', fontWeight: 800, color: '#241B2B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Manrope', sans-serif", ...(pc ? { minWidth: 0 } : {}) }}>
                      {tx.description}
                    </span>
                  </div>
                  <span style={{ fontSize: pc ? '12px' : '10px', color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>
                    Data: {formatDateBr(tx.date)}
                  </span>
                </div>

                <div style={pc ? { display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 } : { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
                  <span style={{ fontSize: pc ? '14px' : '13px', fontWeight: 800, color: pc ? '#B04E5C' : '#C4626F', fontFamily: "'Manrope', sans-serif", ...(pc ? { whiteSpace: 'nowrap' as const, fontVariantNumeric: 'tabular-nums' } : {}) }}>
                    -{formatMoney(tx.totalValue)}
                  </span>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => onEditTransaction(tx)}
                      {...(pc ? { type: 'button' as const, 'aria-label': `Editar compra ${tx.description}` } : {})}
                      style={{
                        width: pc ? '36px' : '26px',
                        height: pc ? '36px' : '26px',
                        borderRadius: pc ? '50%' : '9px',
                        background: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(58,35,80,.1)',
                        border: 'none',
                      }}
                      title="Editar Compra"
                    >
                      <Edit3 className="w-3 h-3" style={{ color: '#7A6E80', ...(pc ? { width: '14px', height: '14px' } : {}) }} />
                    </button>
                    <button
                      onClick={() => onDeleteTransaction(tx)}
                      {...(pc ? { type: 'button' as const, 'aria-label': `Excluir compra ${tx.description}` } : {})}
                      style={{
                        width: pc ? '36px' : '26px',
                        height: pc ? '36px' : '26px',
                        borderRadius: pc ? '50%' : '9px',
                        background: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(58,35,80,.1)',
                        border: 'none',
                      }}
                      title="Excluir Compra"
                    >
                      <Trash2 className="w-3 h-3" style={{ color: '#C4626F', ...(pc ? { width: '14px', height: '14px' } : {}) }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </>
  );

  const historicoSemanal = (
    <>
    {/* Weekly History Card */}
    <div style={{ marginTop: '20px' }}>
      <WeeklyHistoryCard transactions={transactions} />
    </div>
    </>
  );

  const conteudo = pc ? (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: '14px' }}>
        {totalDisponivel}
        {cofrinhosComputador}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '24px' }}>
        {formularioCompra}
        {historicoCompras}
      </div>
      {historicoSemanal}
    </>
  ) : (
    <>
      {totalDisponivel}
      {cofrinhosCelular}
      {formularioCompra}
      {historicoCompras}
      {historicoSemanal}
    </>
  );

  if (embedded) {
    return pc
      ? <div className="flex flex-col" style={{ gap: '24px', fontFamily: "'Manrope', system-ui, sans-serif" }}>{conteudo}</div>
      : <div className="flex flex-col gap-5">{conteudo}</div>;
  }

  return (
    <div className="pb-12 animate-fadeIn" style={{ background: '#F6F2F5' }}>
      {/* Header Card — Flutuante com cabeçalho roxo */}
      <div
        className="overflow-hidden"
        style={{
          // Sem sombra: este envolucro e a pagina inteira, nao um cartao — a sombra
          // roxa caia abaixo da borda de baixo dele e aparecia como faixa no fim da
          // tela no iPhone. Mesma correcao da aba Pedidos.
        }}
      >
        {/* Header with Title only */}
        <div
          className="px-5 flex items-center justify-between gap-4"
          style={{
            background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)',
            borderRadius: '0px 0px 0px 0px',
            paddingTop: '40px',
            paddingBottom: '120px',
          }}
        >
          {/* Title */}
          <span
            className="text-white leading-tight flex-1"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: '31px',
              lineHeight: '1.1',
            }}
          >
            Saldos
          </span>

          {/* Button */}
          <button
            onClick={() => {}}
            className="px-3 py-2 rounded-xl text-[10px] font-black cursor-pointer transition-all active:scale-95 shrink-0"
            style={{
              background: '#F5B9C6',
              color: '#3A2350',
              fontFamily: "'Manrope', sans-serif",
            }}
            title="Gestão de saldos"
          >
            Gestão
          </button>
        </div>

        {/* Content Section — mesmo wrapper de largura total usado em
            Pedidos/Clientes/Fichas/Estoque: sobrepoe o cabecalho subindo 70px
            e arredonda os dois cantos superiores, revelando o roxo so na
            curva. Antes esta aba nao tinha esse wrapper: o card de Saldo
            fazia sua propria sobreposicao sozinho (mx-5, mais estreito que a
            tela), e a transicao do roxo pro fundo da pagina virava uma linha
            reta de ponta a ponta, em vez da curva das outras abas. */}
        <div
          style={{
            marginTop: '-70px',
            background: '#F6F2F5',
            borderRadius: '28px 28px 0 0',
            position: 'relative',
            paddingTop: '20px',
            marginLeft: 'calc(-0.5 * var(--app-bleed) + 50%)',
            marginRight: 'calc(-0.5 * var(--app-bleed) + 50%)',
            paddingLeft: 'max(0px, env(safe-area-inset-left))',
            paddingRight: 'max(0px, env(safe-area-inset-right))',
          }}
        >
          {conteudo}
        </div>
      </div>
    </div>
  );
};
