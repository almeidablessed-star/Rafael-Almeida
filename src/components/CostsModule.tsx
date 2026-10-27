import React, { useState } from 'react';
import { Transaction, CostCategory } from '../types';
import { formatCurrency, formatDateBr, getCostCategoryLabel, getLaborPeriodLabel } from '../utils/formatters';
import { useCurrency } from '../context/CurrencyContext';
import { Receipt, Sparkles, Search, Calendar, Trash2, Edit3, Tag, Users, PlusCircle, ArrowRight } from 'lucide-react';
import { MinhaEmpresaCard } from './MinhaEmpresaCard';
import { useCosts } from '../context/CostsContext';
import { calculateWeeklyBalances } from '../utils/financialEngine';
import { rotulos } from '../utils/periodoReset';
import { TituloDaPagina } from './TituloDaPagina';
import { useTelaDeComputador } from '../hooks/useTelaDeComputador';

interface CostsModuleProps {
  transactions: Transaction[];
  onOpenAddModal: (type?: any) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  // Mesmo `handleLogout` do App.tsx que ja serve o modal de perfil: aqui ele
  // existe so para que sair da conta nao dependa de voltar a aba Inicio.
  onLogout?: () => void;
}

export const CostsModule: React.FC<CostsModuleProps> = ({
  transactions,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  onLogout,
}) => {
  const { formatCurrency: formatMoney } = useCurrency();
  const [activeTab, setActiveTab] = useState<'todos' | 'custos' | 'investimentos' | 'maodeobra'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  // Versao computador (docs/design/desktop-redesign, Empresa.dc.html). Ver o `if (pc)`.
  const pc = useTelaDeComputador();

  // Filter costs, investments, and labor
  const costAndInvTxs = transactions.filter(
    (t) => t.type === 'custo' || t.type === 'investimento'
  );
  const laborTxs = transactions.filter((t) => t.type === 'maodeobra');

  // A lista abaixo recebe TODOS os gastos avulsos. Antes ela vinha recortada
  // pelo mes da data ESCOLHIDA no lancamento, enquanto o Inicio desconta pela
  // data em que foi LANCADO: um gasto lancado hoje com data do mes que vem
  // tirava dinheiro do saldo e nao aparecia em lista nenhuma para conferir ou
  // editar.
  //
  // Os totais usam o mesmo calculo do Inicio (`calculateWeeklyBalances`, mesmo
  // periodo de reset), para que o numero daqui seja o mesmo que foi descontado
  // la — e nao uma segunda conta que pode discordar.
  const { administrativeCosts } = useCosts();
  const periodoReset = administrativeCosts?.periodoReset ?? 'semanal';
  const gastosDoPeriodo = calculateWeeklyBalances(transactions, [], periodoReset);
  const totalInvestimentos = gastosDoPeriodo.investimento.totalSpent;
  const totalCustos = gastosDoPeriodo.custoEInvestimento.totalSpent - totalInvestimentos;
  const totalLabor = gastosDoPeriodo.maodeobra.totalSpent;

  const filteredItems = (() => {
    if (activeTab === 'maodeobra') {
      return laborTxs.filter((item) =>
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getLaborPeriodLabel(item.laborPeriod).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const filtered = costAndInvTxs.filter((item) => {
      const matchesSearch =
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCostCategoryLabel(item.category).toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === 'custos') {
        return item.type === 'custo' || item.category === 'fixo' || item.category === 'variavel';
      }
      if (activeTab === 'investimentos') {
        return item.type === 'investimento' || item.category === 'investimento';
      }

      return true;
    });
    return filtered;
  })();

  // ------------------------------------------------------------------
  // Os pedacos dos gastos avulsos. O celular empilha tudo abaixo do
  // MinhaEmpresaCard, como sempre; o computador (`pc`) poe os gastos num
  // cartao na coluna da direita, embaixo do Resumo (ver `colunaDireita` em
  // MinhaEmpresaCard e docs/design/desktop-redesign/Empresa.dc.html).
  // ------------------------------------------------------------------
  const rotuloNovo = activeTab === 'maodeobra' ? 'Nova Mão de Obra' : 'Novo Custo / Investimento';

  /* Intro explicativa — pedido do Rafael em 2026-09-11: a secao tem
     funcao real (unica forma de registrar gasto avulso, alimenta o
     desconto de Saldos no Inicio), mas ninguem entendia pra que
     servia nem em que ela difere do Resumo/Distribuicao logo acima.
     Mesmo tom curto e direto do microcopy de onboarding
     (CampoComAjuda), cores literais em vez de var(--color-brand-*)
     porque essas variaveis nao existem em runtime (ver memoria
     carula-variaveis-css-orfas). */
  const introGastos = (
        <div style={pc ? { display: 'flex', flexDirection: 'column', gap: '4px' } : undefined}>
          {pc ? (
            <h2 id="avulsos-titulo" className="font-serif-display" style={{ margin: 0, fontSize: '26px', fontWeight: 400, lineHeight: 1.15, color: '#241B2B' }}>
              Gastos avulsos
            </h2>
          ) : (
            <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#241B2B', margin: '0 0 3px', fontFamily: "'Manrope', sans-serif" }}>
              Gastos avulsos
            </h4>
          )}
          <p style={{ fontSize: pc ? '13px' : '10.5px', color: '#7A6E80', margin: 0, lineHeight: 1.45, fontFamily: "'Manrope', sans-serif" }}>
            O resumo acima é sua meta planejada. Aqui embaixo você registra o que realmente gastou fora de uma venda — comprou um equipamento (investimento), pagou alguém avulso (mão de obra) ou teve um custo extra. Esse valor é descontado do seu saldo real lá no Início.
          </p>
        </div>
  );

  // Summary Cards - 3 columns
  const cartoesGastos = (
        <div style={{
          display: 'grid',
          gridTemplateColumns: pc ? 'repeat(3, minmax(0, 1fr))' : 'repeat(3, 1fr)',
          gap: '8px',
        }}>
          {[
            { mark: 'C', label: 'Custos', value: formatMoney(totalCustos) },
            { mark: 'I', label: 'Investimentos', value: formatMoney(totalInvestimentos) },
            { mark: 'M', label: 'Mão de Obra', value: formatMoney(totalLabor) },
          ].map((st) => (
            <div key={st.mark} style={pc ? {
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '12px',
              background: '#FAF7FA',
              borderRadius: '14px',
              border: '1px solid #EDE6EF',
              minWidth: 0,
            } : {
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '12px',
              background: '#fff',
              borderRadius: '12px',
              boxShadow: '0 8px 20px rgba(58,35,80,.09)',
            }}>
              <div style={{ display: 'flex', alignItems: pc ? 'center' : 'flex-start', gap: '6px' }}>
                <span style={{
                  display: 'flex',
                  flexShrink: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  background: '#F3E9F3',
                  color: '#6E3F72',
                  fontSize: pc ? '13px' : '11px',
                  fontWeight: 700,
                  fontFamily: "'Instrument Serif', serif",
                }}>
                  {st.mark}
                </span>
                <span style={{
                  fontSize: pc ? '11px' : '9px',
                  fontWeight: 700,
                  lineHeight: 1.3,
                  letterSpacing: pc ? '0.04em' : '0.06em',
                  textTransform: 'uppercase',
                  color: '#7A6E80',
                }}>
                  {st.label}
                </span>
              </div>
              <span className="font-serif-display" style={{ fontSize: pc ? '22px' : '18px', lineHeight: pc ? 1.1 : 1.2, color: '#3A2350' }}>
                {st.value}
              </span>
            </div>
          ))}
        </div>
  );

  const fraseGastos = (
        <p style={{ fontSize: pc ? '12px' : '10px', color: pc ? '#7A6E80' : '#9A8FA0', margin: 0 }}>
          Gasto {rotulos(periodoReset).nessePeriodo}, contando pelo dia em que foi lançado — o mesmo valor descontado no Início.
        </p>
  );

  // Action Button
  const botaoNovoGasto = (
        <button
          onClick={() => onOpenAddModal(activeTab === 'maodeobra' ? 'maodeobra' : 'custo')}
          {...(pc ? { type: 'button' as const } : {})}
          style={{
            width: '100%',
            background: '#fff',
            border: '1px solid #E6E1DB',
            borderRadius: '12px',
            padding: pc ? '0 16px' : '14px 16px',
            ...(pc ? { height: '52px' } : {}),
            boxShadow: '0 8px 20px rgba(58,35,80,.09)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            textAlign: 'left',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#FAF7FA';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PlusCircle style={{ width: '20px', height: '20px', color: '#3A2350' }} strokeWidth={2} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#3A2350', fontFamily: "'Manrope', sans-serif" }}>
              {rotuloNovo}
            </span>
          </div>
          <ArrowRight style={{ width: '18px', height: '18px', color: '#7A6E80', flexShrink: 0 }} strokeWidth={2} />
        </button>
  );

  // Filter Tabs
  const filtrosGastos = (
        <div
          style={{
            display: 'flex',
            gap: pc ? '3px' : '4px',
            background: '#F6F2F5',
            borderRadius: '12px',
            padding: '4px',
            overflowX: 'auto',
          }}
          {...(pc ? { role: 'group', 'aria-label': 'Filtrar gastos avulsos' } : {})}
        >
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'custos', label: 'Custos' },
            { id: 'investimentos', label: 'Investimentos' },
            { id: 'maodeobra', label: 'Mão de Obra' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              {...(pc ? { type: 'button' as const, 'aria-pressed': activeTab === tab.id } : {})}
              style={{
                flex: '1 1 0%',
                minWidth: 0,
                padding: pc ? '0 6px' : '9px 6px',
                ...(pc ? { height: '38px' } : {}),
                fontSize: pc ? '12px' : '11px',
                fontWeight: 700,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === tab.id ? '#3A2350' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#6E3F72',
                boxShadow: activeTab === tab.id ? '0 8px 16px rgba(58,35,80,0.3)' : 'none',
                whiteSpace: 'nowrap',
                fontFamily: "'Manrope', sans-serif",
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
  );

  // Search Bar
  const buscaGastos = pc ? (
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '44px', boxSizing: 'border-box', padding: '0 14px', borderRadius: '12px', border: '1px solid #E6E1DB', background: '#FFFFFF', boxShadow: '0 6px 14px rgba(58,35,80,0.07)', color: '#7A6E80' }}>
          <Search size={16} strokeWidth={1.9} aria-hidden="true" />
          <input
            type="search"
            aria-label="Buscar lançamento"
            placeholder="Buscar lançamento"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="busca-computador"
            style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', fontFamily: 'inherit', fontSize: '13px', color: '#241B2B' }}
          />
        </label>
  ) : (
        <div style={{ position: 'relative' }}>
          <Search style={{
            width: '14px',
            height: '14px',
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#A096A6',
          }} />
          <input
            type="text"
            placeholder="Buscar lançamento"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 12px 11px 34px',
              background: '#fff',
              border: '1px solid #E6E1DB',
              borderRadius: '12px',
              fontSize: '13px',
              color: '#241B2B',
              fontFamily: "'Manrope', sans-serif",
              boxShadow: '0 6px 14px rgba(58,35,80,.07)',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>
  );

  // Items List
  const listaGastos = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredItems.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2.5 text-center"
              style={pc ? {
                border: '1.5px dashed #E6E1DB',
                borderRadius: '16px',
                padding: '28px 20px',
              } : {
                background: '#fff',
                border: '1.5px dashed #E6E1DB',
                borderRadius: '16px',
                boxShadow: '0 8px 20px rgba(58,35,80,.09)',
                padding: '32px 20px',
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{ width: pc ? '52px' : '56px', height: pc ? '52px' : '56px', borderRadius: '16px', background: '#F3E9F3' }}
              >
                <Receipt className="w-[26px] h-[26px]" style={{ color: '#6E3F72' }} strokeWidth={2} />
              </div>
              {/* Com busca digitada, a lista vazia e "nada encontrado", nao "nenhum registro". */}
              <div className="font-serif-display" style={{ fontSize: pc ? '18px' : '16px', color: '#3A2350' }}>
                {searchTerm ? 'Nada encontrado' : 'Nenhum registro ainda'}
              </div>
              <div className="text-sm" style={{ color: '#7A6E80', maxWidth: '280px', ...(pc ? { fontSize: '13px' } : {}) }}>
                {searchTerm ? 'Nenhum lançamento encontrado com essa busca.' : <>Toque em "{rotuloNovo}" acima para registrar seu primeiro gasto avulso.</>}
              </div>
            </div>
          ) : (
            filteredItems.map((item) => pc ? (
              // Computador: linha maior, com a categoria num selo e botoes de 36px.
              <div
                key={item.id}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 10px 12px 14px', borderRadius: '14px', background: '#FAF7FA', border: '1px solid #EDE6EF' }}
              >
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#3A2350', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.description}
                  </span>
                  <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6E3F72' }}>
                    <span style={{ padding: '1px 7px', borderRadius: '5px', background: '#F3E9F3' }}>{getCostCategoryLabel(item.category)}</span>
                    {formatDateBr(item.date)}
                  </span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#3A2350', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                  -{formatMoney(item.totalValue)}
                </span>
                <button
                  type="button"
                  onClick={() => onEditTransaction(item)}
                  aria-label={`Editar ${item.description}`}
                  className="hover:bg-[#F3E9F3]"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: 0, borderRadius: '50%', background: '#FFFFFF', color: '#6E3F72', cursor: 'pointer', flexShrink: 0 }}
                >
                  <Edit3 style={{ width: '14px', height: '14px' }} />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTransaction(item)}
                  aria-label={`Excluir ${item.description}`}
                  className="hover:bg-[#FBE9EC]"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: 0, borderRadius: '50%', background: '#FFFFFF', color: '#B04E5C', cursor: 'pointer', flexShrink: 0 }}
                >
                  <Trash2 style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            ) : (
              <div
                key={item.id}
                style={{
                  background: 'white',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #E6E1DB',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '9px',
                    fontWeight: 'bold',
                    color: 'var(--color-brand-900)',
                    margin: '0 0 3px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {item.description}
                  </p>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{
                      fontSize: '7px',
                      color: 'var(--color-brand-700)',
                      background: '#F6F2F5',
                      padding: '1px 4px',
                      borderRadius: '2px',
                    }}>
                      {getCostCategoryLabel(item.category)}
                    </span>
                    <span style={{ fontSize: '7px', color: 'var(--color-brand-700)' }}>
                      {formatDateBr(item.date)}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                  <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--color-brand-900)' }}>
                    -{formatMoney(item.totalValue)}
                  </span>
                  <button
                    onClick={() => onEditTransaction(item)}
                    style={{
                      padding: '3px',
                      borderRadius: '3px',
                      color: 'var(--color-brand-700)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F6F2F5'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Edit3 style={{ width: '11px', height: '11px' }} />
                  </button>
                  <button
                    onClick={() => onDeleteTransaction(item)}
                    style={{
                      padding: '3px',
                      borderRadius: '3px',
                      color: 'var(--color-brand-700)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#dc2626';
                      e.currentTarget.style.background = '#F6F2F5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--color-brand-700)';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Trash2 style={{ width: '11px', height: '11px' }} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
  );

  /* Sair da conta — mesmo visual do link dentro do modal de perfil.
     Fica aqui porque a barra inferior alcanca esta aba de qualquer
     tela, entao sair deixa de exigir uma volta ate a aba Inicio. */
  const botaoSair = onLogout && (
          <div style={{ textAlign: 'center', paddingTop: '8px' }}>
            <button
              onClick={onLogout}
              style={{
                // Mesmo botao da tela de perfil: forma padrao do app (padding
                // 12, raio 12, Manrope 14/700) com o vermelho de acao
                // destrutiva.
                minWidth: '140px',
                padding: '12px 32px',
                borderRadius: '12px',
                background: '#C4626F',
                color: '#FFFFFF',
                border: 'none',
                fontFamily: "'Manrope', sans-serif",
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#E07080';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#C4626F';
              }}
              title="Sair da conta"
            >
              Sair da conta
            </button>
          </div>
  );

  // ------------------------------------------------------------------
  // COMPUTADOR (docs/design/desktop-redesign, Empresa.dc.html): titulo no
  // topo e duas colunas (ver MinhaEmpresaCard); os gastos avulsos num cartao
  // na coluna da direita, embaixo do Resumo. "Sair da conta" fica no fim.
  // ------------------------------------------------------------------
  if (pc) {
    return (
      <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '26px', fontFamily: "'Manrope', system-ui, sans-serif", color: '#241B2B' }}>
        <TituloDaPagina>Minha Empresa</TituloDaPagina>
        <MinhaEmpresaCard
          computador
          colunaDireita={
            <section
              aria-labelledby="avulsos-titulo"
              style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '22px', borderRadius: '22px', background: '#FFFFFF', boxShadow: '0 8px 20px rgba(58,35,80,0.08)' }}
            >
              {introGastos}
              {cartoesGastos}
              {fraseGastos}
              {botaoNovoGasto}
              {filtrosGastos}
              {buscaGastos}
              {listaGastos}
            </section>
          }
        />
        {botaoSair}
      </div>
    );
  }

  return (
    <div className="pb-12 animate-fadeIn" style={{ background: '#F6F2F5' }}>
      {/* Header Card — Flutuante com cabeçalho roxo, mesmo padrao das outras
          abas (Pedidos, Clientes, Fichas, Estoque, Compras). Antes esta aba
          tinha seu proprio layout de altura fixa (height:100%, overflow
          interno), cabecalho baixinho (12px de padding) e titulo pequeno
          (18px) — a unica que nao seguia o padrao "folha flutuante" com
          cabecalho de 40/120px de padding, titulo de 31px e cantos
          arredondados no card abaixo. */}
      <div
        className="overflow-hidden"
        style={{
          // Sem sombra: este envolucro e a pagina inteira, nao um cartao — a sombra
          // roxa caia abaixo da borda de baixo dele e aparecia como faixa no fim da
          // tela no iPhone. Mesma correcao da aba Pedidos.
          // Sangra para cima cobrindo a safe area, mesmo padrao do header do
          // Dashboard — ver comentario em OrdersModule.tsx.
          marginTop: 'calc(0px - env(safe-area-inset-top, 0px))',
        }}
      >
        {/* Header with Title only */}
        <div
          className="px-5 flex items-center justify-between gap-4"
          style={{
            background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)',
            borderRadius: '0px 0px 0px 0px',
            paddingTop: 'calc(40px + env(safe-area-inset-top, 0px) + var(--topo-ios27, 0px))',
            paddingBottom: '120px',
          }}
        >
          {/* Title */}
          <span
            className="text-white leading-tight flex-1 text-center"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: '31px',
              lineHeight: '1.1',
            }}
          >
            Minha Empresa
          </span>
        </div>

        {/* Content Section */}
        <div style={{
          marginTop: '-70px',
          background: '#F6F2F5',
          borderRadius: '28px 28px 0 0',
          position: 'relative',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginLeft: 'calc(-0.5 * var(--app-bleed) + 50%)',
          marginRight: 'calc(-0.5 * var(--app-bleed) + 50%)',
          paddingLeft: 'calc(20px + max(0px, env(safe-area-inset-left)))',
          paddingRight: 'calc(20px + max(0px, env(safe-area-inset-right)))',
          // Sem isso, todo texto aqui dentro que nao define fontFamily no
          // proprio elemento cai no sans-serif padrao do Tailwind (o v4 nao
          // le tailwind.config.ts), em vez da fonte da marca. Definido uma
          // vez aqui — herdado por tudo abaixo — em vez de repetir em cada
          // <span>/<p> do historico de lancamentos avulsos.
          fontFamily: "'Manrope', sans-serif",
        }}>

        {/* Minha Empresa — remuneracao, despesas, metas, resumo/distribuicao */}
        <MinhaEmpresaCard />

        {/* Divisor visual antes do historico de lancamentos avulsos abaixo,
            que e uma funcionalidade separada (ledger de transacoes de custo/
            investimento/mao de obra) e continua igual. */}
        <div style={{ borderTop: '1px dashed #E6E1DB', margin: '4px 0' }} />

        {introGastos}

        {cartoesGastos}
        {fraseGastos}

        {botaoNovoGasto}

        {filtrosGastos}

        {buscaGastos}

        {listaGastos}

        {botaoSair}

        </div>
      </div>
    </div>
  );
};
