import React, { useState, useEffect } from 'react';
import { Transaction, SummaryTotals, TransactionType, TimePeriod } from '../types';
import { formatCurrency, formatDateBr } from '../utils/formatters';
import { calculateWeeklyBalances, calcularTotalAReceberGeral, calcularMetaSemanal, calcularEstruturaFinanceira, somarDespesasEmpresa, avaliarSaudeFinanceiraProdutos } from '../utils/financialEngine';
import { useCosts } from '../context/CostsContext';
import { rotulos } from '../utils/periodoReset';
import { ResumoDistribuicaoCard } from './ResumoDistribuicaoCard';
import { ANIMATION_DURATIONS, ANIMATION_EASING } from '../lib/animation-tokens';
import { useCurrency } from '../context/CurrencyContext';
import { useFichasComCustoAtual } from '../hooks/useFichasComCustoAtual';
import { useCustomers } from '../context/CustomersContext';
import { useProdutos } from '../context/ProdutosContext';
import { useTransacoes } from '../context/TransacoesContext';
import { OrdersCalendar } from './OrdersCalendar';
import { PrimeirosPassosChecklist } from './onboarding/PrimeirosPassosChecklist';
import { CampoComAjuda } from './onboarding/CampoComAjuda';
import { CardDeSaldo } from './CardDeSaldo';
import { AvatarProfile } from './AvatarProfile';
import { LogoCarulaApp } from './LogoCarulaApp';
import { TituloDaPagina } from './TituloDaPagina';
import { useTelaDeComputador } from '../hooks/useTelaDeComputador';

import {
  Wallet,
  ShoppingBag,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Trash2,
  Plus,
  Printer,
  X,
  Search,
  Users,
  Clock,
  Smartphone,
  Download,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  HelpCircle,
  Hourglass,
  Heart,
} from 'lucide-react';

const CHECKLIST_PRIMEIROS_PASSOS_HABILITADO = true;

// Rotulo dos botoes do cabecalho da aba Inicio, que antes eram so icones. Usa
// o mesmo tratamento dos rotulos que ja existem neste cabecalho (caixa alta
// miuda em rosa claro, tipo "TOTAL EM VENDAS"). O corpo de 7px mantem cada
// rotulo dentro da largura do seu proprio botao, para o grupo de icones nao
// crescer e encostar no letreiro "Carula", que flutua centralizado por cima.
const rotuloBotaoCabecalho: React.CSSProperties = {
  fontFamily: "'Manrope', sans-serif",
  fontSize: '7px',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'rgba(247,220,225,0.8)',
  lineHeight: 1,
  whiteSpace: 'nowrap',
};

// Mesma coisa, um ponto menor, para os tres botoes de acao da direita: eles
// encolheram de 32 para 28px e o rotulo acompanha, para seguir cabendo dentro
// da largura do proprio botao (e o espacamento entre os tres continuar igual).
const rotuloBotaoAcao: React.CSSProperties = {
  ...rotuloBotaoCabecalho,
  fontSize: '6px',
};

/**
 * Botao do topo do Inicio no computador (Mobile, Dados, Ajuda): os mesmos do
 * cabecalho roxo do celular, num quadrado branco de 42px com o rotulo embaixo
 * (docs/design/desktop-redesign, Main.dc.html). O hover fica em index.css.
 */
const AtalhoDoTopo: React.FC<{ rotulo: string; titulo: string; onClick?: () => void; children: React.ReactNode }> = ({
  rotulo,
  titulo,
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    title={titulo}
    className="atalho-topo"
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '5px',
      minWidth: '56px',
      padding: 0,
      border: 0,
      background: 'transparent',
      color: '#7A6E80',
      fontFamily: 'inherit',
      fontSize: '11px',
      fontWeight: 700,
      cursor: 'pointer',
    }}
  >
    <span
      className="atalho-topo-icone"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '42px',
        height: '42px',
        borderRadius: '13px',
        background: '#FFFFFF',
        color: '#3A2350',
        boxShadow: '0 6px 14px rgba(58,35,80,0.08)',
        transition: 'background-color 0.2s ease',
      }}
    >
      {children}
    </span>
    {rotulo}
  </button>
);

interface DashboardProps {
  summary: SummaryTotals;
  period: TimePeriod;
  recentTransactions?: Transaction[];
  allTransactions?: Transaction[];
  onOpenAddModal: (type: TransactionType) => void;
  onOpenAddModalWithDate?: (date: string) => void;
  onNavigateToTab: (tabName: any) => void;
  onNavigateToProdutosCompras: () => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (tx: Transaction) => void;
  onTogglePaymentStatus?: (tx: Transaction) => void;
  onOpenPwaModal?: () => void;
  onOpenBackupModal?: () => void;
  onOpenProfileModal?: () => void;
  onOpenGlossaryModal?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  summary,
  period,
  recentTransactions,
  allTransactions = [],
  onOpenAddModal,
  onOpenAddModalWithDate,
  onNavigateToTab,
  onNavigateToProdutosCompras,
  onEditTransaction,
  onDeleteTransaction,
  onTogglePaymentStatus,
  onOpenPwaModal,
  onOpenBackupModal,
  onOpenProfileModal,
  onOpenGlossaryModal,
}) => {
  const { formatCurrency: formatMoney } = useCurrency();
  const { fichas, isLoading: fichasLoading } = useFichasComCustoAtual();
  const { customers } = useCustomers();
  const { produtos, isLoading: produtosLoading } = useProdutos();
  const { isLoading: transacoesLoading } = useTransacoes();
  const { administrativeCosts, marcarPrimeirosPassosCompletos } = useCosts();
  // Periodo de reset escolhido pela usuaria. 'semanal' enquanto a configuracao
  // nao carregou — mesmo default da coluna, entao a primeira renderizacao nunca
  // mostra um numero de outro periodo por um instante.
  const periodoReset = administrativeCosts?.periodoReset ?? 'semanal';
  // Frases prontas do periodo escolhido. Nunca concatenar aqui — ver `rotulos`.
  const vocab = rotulos(periodoReset);
  const transactionsList = allTransactions.length > 0 ? allTransactions : (recentTransactions || []);
  const balances = calculateWeeklyBalances(transactionsList, fichas, periodoReset);
  // Excecao ao recorte semanal do restante do card: saldo pendente e dinheiro
  // real que a cliente ainda deve, nao deve sumir so porque a semana virou.
  const totalAReceberGeral = calcularTotalAReceberGeral(transactionsList);

  // Mesma fonte que "Minha Empresa": faturamento necessario + distribuicao,
  // calculados uma unica vez pelo engine (spec Parte 5, Teste 10 — os
  // numeros aqui e na aba Minha Empresa tem que ser sempre identicos).
  // `useCosts` subiu para o topo do componente: o periodo de reset e lido dali
  // e ja e necessario antes daqui, em `calculateWeeklyBalances`.
  const despesasMensais = somarDespesasEmpresa(administrativeCosts?.despesas || []);

  // Checklist de primeiros passos (produto + ficha + pedido): so decide o que
  // mostrar depois que os 3 contexts terminarem de carregar, senao um item ja
  // cumprido pode "piscar" como pendente por uma fracao de segundo. So aparece
  // depois que o tour guiado ja foi visto/pulado (tourPrimeirosPassosVistoEm),
  // e nunca mais depois de completo (primeirosPassosCompletosEm), mesmo que a
  // usuaria apague os dados que completaram o checklist.
  const dadosPrimeirosPassosProntos = !produtosLoading && !fichasLoading && !transacoesLoading;
  const produtoCadastrado = produtos.length > 0;
  const fichaCriada = fichas.length > 0;
  const pedidoLancado = allTransactions.some((t) => t.type === 'venda');
  const primeirosPassosCompletos = produtoCadastrado && fichaCriada && pedidoLancado;

  useEffect(() => {
    if (!CHECKLIST_PRIMEIROS_PASSOS_HABILITADO) return;
    if (!dadosPrimeirosPassosProntos) return;
    if (!primeirosPassosCompletos) return;
    if (!administrativeCosts || administrativeCosts.primeirosPassosCompletosEm) return;
    marcarPrimeirosPassosCompletos().catch((err) => {
      console.error('Erro ao marcar primeiros passos como completos:', err);
    });
  }, [dadosPrimeirosPassosProntos, primeirosPassosCompletos, administrativeCosts?.primeirosPassosCompletosEm]);

  const mostrarChecklistPrimeirosPassos =
    CHECKLIST_PRIMEIROS_PASSOS_HABILITADO &&
    dadosPrimeirosPassosProntos &&
    !!administrativeCosts?.tourPrimeirosPassosVistoEm &&
    !administrativeCosts?.primeirosPassosCompletosEm &&
    !primeirosPassosCompletos;
  const estruturaFinanceira = administrativeCosts
    ? calcularEstruturaFinanceira(
        administrativeCosts.monthlyIncomeTarget,
        despesasMensais,
        administrativeCosts.cmvTargetPercent,
        administrativeCosts.investmentTargetPercent,
        administrativeCosts.profitTargetPercent
      )
    : null;

  // Meta usa TODAS as transacoes, nao a lista filtrada pelo seletor de periodo:
  // a meta da semana e sempre a semana corrente, mesmo com a tela mostrando o
  // mes ou o ano. Deriva da MESMA estrutura acima — nunca so das despesas —
  // pra "Precisa faturar" refletir a meta completa (despesas + recebimento
  // pessoal + CMV + investimento + lucro), nao so a fatia de custos fixos.
  const meta = calcularMetaSemanal(estruturaFinanceira, allTransactions || [], periodoReset);

  // Selo de saude financeira: os precos hoje cadastrados nos produtos cobrem
  // a estrutura definida acima? Mesmo motor de calculo, agregado por conta
  // inteira (ver financialEngine.ts para a regra completa das faixas).
  const saudeFinanceira = avaliarSaudeFinanceiraProdutos(fichas, administrativeCosts);
  const [saudeExpandida, setSaudeExpandida] = useState(false);

  // Versao computador (docs/design/desktop-redesign, Main.dc.html): mesmos
  // numeros e textos, outra disposicao. Ver o `if (pc)` antes do return.
  const pc = useTelaDeComputador();

  // Calculate profit margin percentage (simplified calculation)
  const totalIn = balances.totalPaidSales || 0;
  const totalOut = balances.totalExpensesAmount || 0;
  const profit = Math.max(0, totalIn - totalOut);
  const marginPercent = totalIn > 0 ? Math.round((profit / totalIn) * 100) : 0;

  // As porcentagens sairam. Cada circulo comparava um cofrinho com ele mesmo,
  // entao a regua mudava de card para card: 50% em Reposicao e 50% em Mao de
  // obra eram quantias completamente diferentes, mostradas em tres aneis
  // identicos lado a lado. E "0%" queria dizer duas coisas opostas — "gastei
  // tudo" e "nao entrou nada". Sem uma boa resposta para "100% de que?", o que
  // sobra e o que a confeiteira realmente pergunta: quanto ainda posso gastar.
  const nadaEntrouNoPeriodo =
    balances.reposicao.accumulatedInflow <= 0 &&
    balances.maodeobra.accumulatedInflow <= 0 &&
    balances.custoEInvestimento.accumulatedInflow <= 0;

  // Cinco cofrinhos (25/10/2026, pedido do Rafael). Antes eram tres, com
  // "Despesas + Investimento" numa pilha so e uma legenda embaixo desfazendo a
  // soma; o lucro aparecia so numa frase. Despesa e investimento sao dinheiro
  // para coisas diferentes, e o lucro passou a poder ser gasto pela aba Compras
  // (tipo `lucro`) — entao virou cofrinho tambem.
  //
  // Todos vem de `calculateWeeklyBalances`, na mesma base (dinheiro recebido no
  // periodo): os cinco somados fecham com o caixa recebido.
  //
  // Fila de cima: as tres partes que pagam o dia a dia, no tamanho de sempre.
  // Fila de baixo, menores: Investimento e Lucro.
  const cartoesDeSaldo = [
    { nome: 'REPOSIÇÃO', saldo: balances.reposicao },
    { nome: 'MÃO DE OBRA', saldo: balances.maodeobra },
    { nome: 'DESPESAS', saldo: balances.custo },
  ];

  // Prejuizo e quando a PARTE de lucro das vendas ja nasce negativa: os pedidos
  // sairam por menos do que custaram. Chamar isso de "lucro" seria mentir na
  // cor certa, entao o nome do cartao muda junto.
  const lucroNegativo = (balances.lucro.accumulatedInflow || 0) < 0;

  // ------------------------------------------------------------------
  // Blocos que o celular e o computador mostram iguais em conteudo. O texto
  // fica num lugar so; no computador (`pc`) so mudam tamanhos e cores, para
  // as duas versoes nunca divergirem numa edicao futura.
  // ------------------------------------------------------------------

  const fraseReset = `${vocab.explicacaoReset} · "A receber" mostra tudo pendente, de qualquer época`;

  const microcopySaldos = `O que já chegou das vendas − o que você já gastou ${vocab.nessePeriodo}.`;
  const ajudaSaldos =
    'Aqui só conta o dinheiro que já chegou. Cada cartão é um cofrinho: ' +
    'quando um pagamento entra, o app separa ele em cinco partes — o ingrediente, ' +
    'o seu trabalho, as contas da empresa, o investimento e o lucro. Pedido ainda ' +
    'pendente não entra; pedido pago só em parte entra na proporção do que ' +
    'foi recebido. O valor grande é o que sobra para gastar naquela parte.';

  // Titulo + frase de uma secao. No computador o titulo vai a 28px e a frase a 13px.
  const cabecalhoSecao = (titulo: string, frase: string, id: string) =>
    pc ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <h2 id={id} className="font-serif-display" style={{ margin: 0, fontSize: '28px', fontWeight: 400, lineHeight: 1.1, color: '#241B2B' }}>
          {titulo}
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#7A6E80' }}>{frase}</p>
      </div>
    ) : (
      <div>
        <h3 className="font-serif-display text-[23px]" style={{ color: '#241B2B' }}>
          {titulo}
        </h3>
        <p className="text-[11px]" style={{ color: '#7A6E80', marginTop: '2px' }}>
          {frase}
        </p>
      </div>
    );

  // Tres zeros sozinhos parecem "gastou tudo". A primeira frase diz em
  // palavras que o motivo e outro: nao chegou dinheiro. So quando os TRES
  // estao sem entrada — com um cofrinho cheio ela seria falsa. A segunda diz
  // em palavras o que o vermelho do cartao de Prejuizo mostra, porque "lucro
  // negativo" sozinho nao explica a causa.
  const frasesSaldos = (
    <>
      {nadaEntrouNoPeriodo && (
        <p className="text-[10px]" style={{ color: '#9A8FA0', ...(pc ? { margin: 0, fontSize: '12px', color: '#7A6E80' } : {}) }}>
          Nenhum pagamento recebido {vocab.nessePeriodo} ainda.
        </p>
      )}
      {!nadaEntrouNoPeriodo && lucroNegativo && (
        <p className="text-[10px]" style={{ color: '#C4626F', ...(pc ? { margin: 0, fontSize: '12px', color: '#B04E5C' } : {}) }}>
          Prejuízo {vocab.daPeriodo}: os pedidos saíram por menos do que custaram.
        </p>
      )}
    </>
  );

  // Verde de "meta batida". No computador o texto usa um verde mais escuro:
  // o #4CAF7D fica claro demais para texto em tela grande.
  const verdeMetaTexto = pc ? '#2E7D51' : '#4CAF7D';

  const cartaoMeta = !meta.temEstruturaValida ? (
    <button
      onClick={() => onNavigateToTab('custos')}
      className="w-full text-left rounded-2xl p-4 transition-all active:scale-98"
      style={{ background: '#FFF8E7', border: '1px dashed #E8D9A8', ...(pc ? { borderRadius: '20px', padding: '18px 20px', cursor: 'pointer' } : {}) }}
    >
      <p className="text-[12px] font-bold" style={{ color: '#8A6D1F', ...(pc ? { fontSize: '14px' } : {}) }}>
        Configure sua estrutura financeira
      </p>
      <p className="text-[11px] mt-1" style={{ color: '#9A8FA0', ...(pc ? { fontSize: '13px', color: '#7A6E80' } : {}) }}>
        Recebimento desejado, despesas e metas de CMV/investimento/lucro
        em Minha Empresa. Sem isso não dá para saber quanto você precisa
        vender {vocab.porPeriodo}. Toque para preencher.
      </p>
    </button>
  ) : (
    <div
      className="rounded-2xl p-4 w-full"
      style={{ background: 'white', boxShadow: '0 6px 18px rgba(58,35,80,.08)', border: '1px solid #EDE6EF', ...(pc ? { borderRadius: '20px', padding: '20px' } : {}) }}
    >
      <div className="flex items-end justify-between gap-3" style={pc ? { flexWrap: 'wrap' } : undefined}>
        <div>
          <p className="text-[9px] uppercase tracking-[0.05em]" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif", fontWeight: 800, ...(pc ? { fontSize: '11px' } : {}) }}>
            Precisa faturar
          </p>
          {/*
            A unidade fica COLADA ao numero principal, na mesma linha, e
            o total do mes desce para uma linha propria.

            Antes as duas informacoes dividiam a mesma linha, separadas
            so por um ponto ("por semana · $7.916,67/mês pra bater..."),
            e "por semana" encostava no valor MENSAL — dava pra ler como
            se o periodo se referisse ao numero errado. Sao duas grandezas
            diferentes: uma e a meta da janela, a outra e o total do mes.
            Cada uma com sua linha, e a unidade grudada em quem ela
            qualifica.
          */}
          <p className="text-[24px] leading-tight" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif", fontWeight: 800, ...(pc ? { fontVariantNumeric: 'tabular-nums' } : {}) }}>
            {formatMoney(meta.necessarioPorSemana)}
            {/* 500: a unidade acompanha o numero grande (800) sem competir
                com ele. A Manrope carrega 400/500/600/700/800 — 500 e peso
                real, nao negrito sintetizado pelo navegador (que borraria
                um texto de 11px). */}
            <span className="text-[11px] ml-1.5" style={{ color: '#9A8FA0', fontWeight: 500, ...(pc ? { fontSize: '12px', color: '#7A6E80' } : {}) }}>
              {vocab.porPeriodo}
            </span>
          </p>
          {/*
            No modo MENSAL esta linha some: ali a meta da janela E a meta
            do mes, entao ela repetiria o mesmo numero logo abaixo dele
            ("$7.916,67 por mês" / "$7.916,67/mês pra bater..."). Repetir
            sem acrescentar nada faz a pessoa reler procurando a diferenca
            que nao existe. Nos outros dois periodos a linha continua
            valendo: ali os numeros sao mesmo diferentes.
          */}
          {periodoReset !== 'mensal' && (
            <p className="text-[10px] mt-0.5" style={{ color: '#9A8FA0', ...(pc ? { fontSize: '12px', color: '#7A6E80' } : {}) }}>
              {formatMoney(meta.faturamentoNecessarioMensal)}/mês pra bater sua meta completa
            </p>
          )}
        </div>
        <div className="text-right" style={pc ? { textAlign: 'left' } : undefined}>
          <p className="text-[9px] uppercase tracking-[0.05em]" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif", fontWeight: 800, ...(pc ? { fontSize: '11px' } : {}) }}>
            Já entrou
          </p>
          <p className="text-[18px] leading-tight" style={{ color: meta.metaAtingida ? verdeMetaTexto : '#241B2B', fontFamily: "'Manrope', sans-serif", fontWeight: 800, ...(pc ? { fontSize: '19px', fontVariantNumeric: 'tabular-nums' } : {}) }}>
            {formatMoney(meta.faturadoNaSemana)}
          </p>
        </div>
      </div>

      <div className="mt-3 h-2 w-full rounded-full overflow-hidden" style={{ background: '#F1EBF2' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.round(meta.progresso * 100)}%`,
            background: meta.metaAtingida ? '#4CAF7D' : '#A85E86',
            transition: 'width 420ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>

      <p className="text-[11px] mt-2" style={{ color: meta.metaAtingida ? verdeMetaTexto : '#7A6E80', fontWeight: meta.metaAtingida ? 700 : 400, ...(pc ? { fontSize: '13px', marginTop: '12px' } : {}) }}>
        {meta.metaAtingida
          ? `✓ Meta completa ${vocab.daPeriodo} batida! O que entrar além disso é resultado extra.`
          : `Faltam ${formatMoney(meta.faltaFaturar)} para cobrir tudo ${vocab.nessePeriodo}.`}
      </p>

      {/* Camada motivacional: a fatia dentro da meta acima que e "sua"
          — o recebimento desejado que ela mesma definiu. Roxo igual
          ao medidor "Mão de Obra" do card de cima, de proposito —
          mesmo conceito, mesma cor, sem inventar token novo. */}
      <div className="mt-3 pt-3" style={{ borderTop: '1px dashed #EDE6EF', ...(pc ? { marginTop: '14px', paddingTop: '14px' } : {}) }}>
        <p
          className="text-[9px] uppercase tracking-[0.05em]"
          style={{ color: '#7E4F9E', fontFamily: "'Manrope', sans-serif", fontWeight: 800, ...(pc ? { fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' } : {}) }}
        >
          {/* No computador os emojis da interface viraram icones, na mesma posicao. */}
          {pc ? <Heart size={13} fill="currentColor" strokeWidth={0} aria-hidden="true" /> : '💜 '}Sua fatia pessoal
        </p>
        <p className="text-[11px] mt-1" style={{ color: '#7A6E80', lineHeight: 1.4, ...(pc ? { fontSize: '13px', lineHeight: 1.45, marginTop: '8px' } : {}) }}>
          Disso, <strong style={{ color: '#241B2B' }}>{formatMoney(meta.metaPessoalSemana)}</strong>{' '}
          {vocab.porPeriodo} é seu — o que você decidiu receber pelo seu trabalho.
          Até agora já garantiu <strong style={{ color: '#241B2B' }}>{formatMoney(meta.jaGarantidoPessoal)}</strong>.
        </p>

        <div className="mt-2 h-1.5 w-full rounded-full overflow-hidden" style={{ background: '#F1EBF2' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.round(meta.progressoPessoal * 100)}%`,
              background: meta.metaPessoalAtingida ? '#4CAF7D' : '#7E4F9E',
              transition: 'width 420ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </div>

        <p
          className="text-[10.5px] mt-1.5"
          style={{
            color: meta.metaPessoalAtingida ? verdeMetaTexto : '#9A8FA0',
            fontWeight: meta.metaPessoalAtingida ? 700 : 400,
            ...(pc ? { fontSize: '12px', marginTop: '8px', color: meta.metaPessoalAtingida ? verdeMetaTexto : '#7A6E80' } : {}),
          }}
        >
          {meta.metaPessoalAtingida
            ? `✓ Sua meta pessoal ${vocab.daPeriodo} já foi garantida!`
            : `Faltam ${formatMoney(meta.faltaPessoal)} para bater sua meta pessoal ${vocab.nessePeriodo}.`}
        </p>
      </div>
    </div>
  );

  const cartaoSaude = !saudeFinanceira.avaliavel ? (
    <button
      onClick={() => onNavigateToTab(!estruturaFinanceira?.valido ? 'custos' : 'fichas')}
      className="w-full text-left rounded-2xl p-4 transition-all active:scale-98"
      style={{ background: '#F1EBF2', border: '1px dashed #D9CCDB', ...(pc ? { borderRadius: '20px', padding: '18px 20px', cursor: 'pointer' } : {}) }}
    >
      <p className="text-[12px] font-bold" style={{ color: '#5A3F7F', ...(pc ? { fontSize: '14px' } : {}) }}>
        Ainda não dá pra avaliar
      </p>
      <p className="text-[11px] mt-1" style={{ color: '#9A8FA0', ...(pc ? { fontSize: '13px', color: '#7A6E80' } : {}) }}>
        {!estruturaFinanceira?.valido
          ? 'Configure suas metas em Minha Empresa para ver se seus preços cobrem sua estrutura financeira. Toque para preencher.'
          : 'Cadastre o preço e os insumos de pelo menos um tamanho nas suas fichas técnicas. Toque para abrir Fichas Técnicas.'}
      </p>
    </button>
  ) : (
    (() => {
      const cores = {
        verde: { texto: '#2E7D51', fundo: '#EEF8F1', borda: '#C9E9D4', label: 'Tudo em dia' },
        amarelo: { texto: '#8A6D1F', fundo: '#FFF8E7', borda: '#E8D9A8', label: 'Atenção' },
        vermelho: { texto: '#C4626F', fundo: '#FDF4F5', borda: '#F0C8CD', label: 'Prejuízo' },
      } as const;
      const c = cores[saudeFinanceira.nivel as 'verde' | 'amarelo' | 'vermelho'];
      const temItens = saudeFinanceira.comPrejuizo.length > 0;

      return (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'white', boxShadow: '0 6px 18px rgba(58,35,80,.08)', border: '1px solid #EDE6EF', ...(pc ? { borderRadius: '20px' } : {}) }}
        >
          <button
            onClick={() => temItens && setSaudeExpandida((v) => !v)}
            className="w-full text-left p-4 flex items-center gap-3"
            style={{ cursor: temItens ? 'pointer' : 'default', ...(pc ? { padding: '16px' } : {}) }}
            aria-expanded={pc && temItens ? saudeExpandida : undefined}
          >
            <div
              className="w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0"
              style={{ background: c.fundo, color: c.texto, ...(pc ? { width: '44px', height: '44px' } : {}) }}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold" style={{ color: c.texto, fontFamily: "'Manrope', sans-serif", ...(pc ? { fontSize: '14px', fontWeight: 800 } : {}) }}>
                {c.label}
              </p>
              <p className="text-[11px]" style={{ color: '#7A6E80', ...(pc ? { fontSize: '13px' } : {}) }}>
                {temItens
                  ? `${saudeFinanceira.comPrejuizo.length} de ${saudeFinanceira.totalAvaliados} produtos vendidos por menos do que custam`
                  : `${saudeFinanceira.totalAvaliados} produto${saudeFinanceira.totalAvaliados === 1 ? '' : 's'} avaliado${saudeFinanceira.totalAvaliados === 1 ? '' : 's'}, nenhum com prejuízo`}
              </p>
            </div>
            {temItens && (
              pc ? (
                <ChevronDown
                  className="flex-shrink-0"
                  aria-hidden="true"
                  style={{ width: '18px', height: '18px', color: '#7A6E80', transform: saudeExpandida ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                />
              ) : saudeExpandida
                ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: '#9A8FA0' }} />
                : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: '#9A8FA0' }} />
            )}
          </button>

          {temItens && saudeExpandida && (
            <div className="border-t" style={{ borderColor: '#EDE6EF' }}>
              <div className="divide-y" style={{ borderColor: '#F1EBF2' }}>
                {saudeFinanceira.comPrejuizo.map((item) => (
                  <div
                    key={`${item.fichaId}-${item.tamanhoId}`}
                    className="px-4 py-2.5 flex items-center justify-between gap-2"
                    style={pc ? { padding: '12px 16px' } : undefined}
                  >
                    <div className="min-w-0">
                      <p className={pc ? 'text-[12px] font-bold' : 'text-[12px] font-bold truncate'} style={{ color: '#241B2B', ...(pc ? { fontSize: '13px' } : {}) }}>
                        {item.fichaName} <span style={{ color: pc ? '#7A6E80' : '#9A8FA0', fontWeight: 400 }}>({item.tamanhoDescricao})</span>
                      </p>
                    </div>
                    <span
                      className="text-[11px] font-bold flex-shrink-0"
                      style={{ color: '#C4626F', ...(pc ? { fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap', color: '#B04E5C' } : {}) }}
                    >
                      −{formatMoney(item.prejuizo)}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onNavigateToTab('fichas')}
                className="w-full py-3 text-[12px] font-bold transition-colors"
                style={{ color: '#5A3F7F', borderTop: '1px solid #EDE6EF', ...(pc ? { minHeight: '46px', padding: 0, fontSize: '13px', fontWeight: 800, cursor: 'pointer' } : {}) }}
              >
                Ver em Fichas Técnicas
              </button>
            </div>
          )}
        </div>
      );
    })()
  );

  const checklistPrimeirosPassos = mostrarChecklistPrimeirosPassos && (
    <PrimeirosPassosChecklist
      produtoCadastrado={produtoCadastrado}
      fichaCriada={fichaCriada}
      pedidoLancado={pedidoLancado}
      onNavigateToTab={onNavigateToTab}
      onNavigateToProdutosCompras={onNavigateToProdutosCompras}
      onOpenAddModal={onOpenAddModal}
    />
  );

  // ------------------------------------------------------------------
  // COMPUTADOR (docs/design/desktop-redesign, Main.dc.html)
  // Topo com os atalhos; linha 1 com o Total em vendas (cartao branco) e a
  // comanda; linha 2 em tres colunas — Saldos + Meta, Agenda, Saude + Resumo.
  // ------------------------------------------------------------------
  if (pc) {
    const caixaDoTotal = (rotulo: React.ReactNode, valor: number, aReceber = false) => (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          padding: '16px 12px',
          borderRadius: '18px',
          background: aReceber ? '#FBF5EA' : '#FAF7FA',
          border: `1px solid ${aReceber ? '#F0E2C8' : '#EDE6EF'}`,
          textAlign: 'center',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', color: aReceber ? '#7A5A1E' : '#7A6E80' }}>
          {rotulo}
        </span>
        <span style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{formatMoney(valor)}</span>
      </div>
    );

    return (
      <div
        className="animate-fadeIn"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '30px',
          fontFamily: "'Manrope', system-ui, sans-serif",
          fontSize: '14px',
          lineHeight: 1.5,
          color: '#241B2B',
        }}
      >
        {/* Topo: titulo e, a direita, os botoes do cabecalho roxo do celular.
            O logo nao aparece aqui porque ja esta no menu lateral. */}
        <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px 24px' }}>
          <TituloDaPagina>Início</TituloDaPagina>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
            <AtalhoDoTopo rotulo="Mobile" titulo="Versão Mobile" onClick={onOpenPwaModal}>
              <Smartphone size={18} strokeWidth={1.9} aria-hidden="true" />
            </AtalhoDoTopo>
            <AtalhoDoTopo rotulo="Dados" titulo="Baixar Dados" onClick={onOpenBackupModal}>
              <Download size={18} strokeWidth={1.9} aria-hidden="true" />
            </AtalhoDoTopo>
            <AtalhoDoTopo rotulo="Ajuda" titulo="Glossário" onClick={onOpenGlossaryModal}>
              <HelpCircle size={18} strokeWidth={1.9} aria-hidden="true" />
            </AtalhoDoTopo>
            <span aria-hidden="true" style={{ width: '1px', height: '42px', margin: '0 6px', background: 'rgba(58,35,80,0.1)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', minWidth: '56px', color: '#7A6E80', fontSize: '11px', fontWeight: 700 }}>
              <AvatarProfile fundo="claro" onClick={onOpenProfileModal} />
              Perfil
            </div>
          </div>
        </header>

        {/* Linha 1: Total em vendas e a comanda, com a mesma altura. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: '24px' }}>
          <section
            aria-label="Total em vendas"
            style={{
              flex: '3 1 560px',
              boxSizing: 'border-box',
              padding: '30px 30px 24px',
              borderRadius: '24px',
              background: '#FFFFFF',
              boxShadow: '0 8px 20px rgba(58,35,80,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '22px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.14em', color: '#7A6E80' }}>TOTAL EM VENDAS</span>
              <span style={{ fontSize: '56px', fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {formatMoney(totalIn)}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              {caixaDoTotal('VENDAS PAGAS', balances.totalPaidSales || 0)}
              {caixaDoTotal('SAÍDAS', balances.totalExpensesAmount || 0)}
              {caixaDoTotal(
                <>
                  <Hourglass size={13} strokeWidth={2} aria-hidden="true" />A RECEBER
                </>,
                totalAReceberGeral || 0,
                true
              )}
            </div>
            <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.5, textAlign: 'center', color: '#7A6E80' }}>{fraseReset}</p>
          </section>

          {/* A mesma comanda do celular, maior. */}
          <button
            type="button"
            onClick={() => onOpenAddModal('venda')}
            style={{
              flex: '2 1 340px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxSizing: 'border-box',
              padding: '26px 22px 26px 30px',
              border: 0,
              borderRadius: '28px',
              background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)',
              boxShadow: '0 14px 30px rgba(58,35,80,0.36)',
              fontFamily: 'inherit',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) rotate(-0.6deg)';
              e.currentTarget.style.boxShadow = '0 22px 42px rgba(58,35,80,0.48)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 14px 30px rgba(58,35,80,0.36)';
            }}
          >
            <span aria-hidden="true" style={{ position: 'absolute', left: '-12px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px', borderRadius: '50%', background: '#F6F2F5' }} />
            <span aria-hidden="true" style={{ position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px', borderRadius: '50%', background: '#F6F2F5' }} />
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '14px', borderLeft: '2px dashed rgba(245,185,198,0.5)' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.24em', color: 'rgba(255,255,255,0.8)' }}>NOVA COMANDA</span>
              <span className="font-serif-display" style={{ fontSize: '40px', lineHeight: 1, color: '#FFFFFF' }}>Lançar Pedido</span>
            </span>
            <span
              className="car-float"
              style={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
                borderRadius: '17px',
                background: '#F5B9C6',
                color: '#3A2350',
                boxShadow: '0 8px 16px rgba(0,0,0,0.18)',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <span
              className="car-sweep-largo"
              aria-hidden="true"
              style={{ position: 'absolute', top: 0, left: 0, width: '70px', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)', pointerEvents: 'none' }}
            />
          </button>
        </div>

        {/* Primeiros passos: so para conta nova, na largura toda. */}
        {checklistPrimeirosPassos}

        {/* Linha 2: tres colunas que viram uma embaixo da outra se a janela estreitar. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '24px' }}>
          <div style={{ flex: '3 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <section aria-labelledby="saldos-titulo" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <CampoComAjuda
                variant="computador"
                titulo={
                  <h2 id="saldos-titulo" className="font-serif-display" style={{ margin: 0, fontSize: '28px', fontWeight: 400, lineHeight: 1.1, color: '#241B2B' }}>
                    Saldos &amp; Divisão dos Pedidos
                  </h2>
                }
                microcopy={microcopySaldos}
                exemploDinamico={ajudaSaldos}
                ariaLabelAjuda="Como funciona a divisão dos pedidos"
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                {[...cartoesDeSaldo, { nome: 'INVESTIMENTO', saldo: balances.investimento }].map(({ nome, saldo }) => (
                  <CardDeSaldo
                    key={nome}
                    computador
                    nome={nome}
                    saldo={saldo.currentBalance || 0}
                    entrou={saldo.accumulatedInflow || 0}
                    negativo={saldo.isNegative}
                  />
                ))}
                <div style={{ gridColumn: '1 / -1', display: 'flex' }}>
                  <CardDeSaldo
                    computador
                    destaque
                    nome={lucroNegativo ? 'PREJUÍZO' : 'LUCRO'}
                    saldo={balances.lucro.currentBalance || 0}
                    entrou={balances.lucro.accumulatedInflow || 0}
                    negativo={balances.lucro.isNegative}
                  />
                </div>
              </div>
              {frasesSaldos}
            </section>

            <section aria-labelledby="meta-titulo" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {cabecalhoSecao(vocab.tituloMeta, 'Quanto precisa entrar pra cobrir tudo — negócio e você', 'meta-titulo')}
              {cartaoMeta}
            </section>
          </div>

          <div style={{ flex: '4 1 380px', minWidth: 0 }}>
            <OrdersCalendar
              computador
              transactions={transactionsList}
              customers={customers}
              onOpenAddModal={() => onOpenAddModal('venda')}
              onOpenAddModalWithDate={onOpenAddModalWithDate}
            />
          </div>

          <div style={{ flex: '3 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <section aria-labelledby="saude-titulo" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {cabecalhoSecao('Saúde Financeira dos Produtos', 'Algum produto está sendo vendido por menos do que custa?', 'saude-titulo')}
              {cartaoSaude}
            </section>

            {estruturaFinanceira && <ResumoDistribuicaoCard computador estrutura={estruturaFinanceira} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0 pb-8 animate-fadeIn">

      {/* 1. PROFIT CARD - Roxo Gradiente (Cabeçalho da Página) */}
      <div
        className="text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)',
          padding: '20px',
          paddingBottom: '28px',
          // Sangra para cima cobrindo a safe area e devolve o mesmo valor em
          // padding, para que o gradiente seja um só (sem emenda) e o conteudo
          // fique exatamente onde estava. Altura cresce o mesmo tanto que a
          // margem sobe, entao nada abaixo do card se move.
          paddingTop: 'calc(8px + env(safe-area-inset-top, 0px) + var(--topo-ios27, 0px))',
          boxShadow: '0 30px 70px rgba(58,35,80,0.26)',
          marginLeft: 'calc(-0.5 * var(--app-bleed) + 50%)',
          marginRight: 'calc(-0.5 * var(--app-bleed) + 50%)',
          // Subtracao, nao multiplicacao: calc(-1 * env(...)) e rejeitado por
          // versoes do WebKit, o que descarta a declaracao inteira e faz o card
          // parar de sangrar para cima.
          marginTop: 'calc(0px - env(safe-area-inset-top, 0px))',
          paddingLeft: 'calc(0.5 * var(--app-bleed) - 50% + 18px)',
          paddingRight: 'calc(0.5 * var(--app-bleed) - 50% + 18px)',
          borderRadius: '0px 0px 32px 32px',
          zIndex: 1,
        }}
      >

        {/* Content */}
        <div className="relative z-10 space-y-4">
          {/* Header: Logo, Title, Icons */}
          <div className="flex items-start justify-between gap-2">
            {/* Avatar Profile - Circular */}
            <div className="flex flex-col items-center gap-1">
              <AvatarProfile onClick={onOpenProfileModal} />
              <span style={rotuloBotaoCabecalho}>Perfil</span>
            </div>

            {/* Action Icons - 32x32px each */}
            <div className="flex-shrink-0 flex items-start gap-1">
              <div className="flex flex-col items-center gap-1">
              <button
                onClick={onOpenPwaModal}
                className="w-7 h-7 rounded-[10px] text-white flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,.16)',
                  cursor: 'pointer',
                  transition: 'background-color 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,.16)';
                }}
                title="Versão Mobile"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
              <span style={rotuloBotaoAcao}>Mobile</span>
              </div>
              <div className="flex flex-col items-center gap-1">
              <button
                onClick={onOpenBackupModal}
                className="w-7 h-7 rounded-[10px] text-white flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,.16)',
                  cursor: 'pointer',
                  transition: 'background-color 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,.16)';
                }}
                title="Baixar Dados"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <span style={rotuloBotaoAcao}>Dados</span>
              </div>
              <div className="flex flex-col items-center gap-1">
              <button
                onClick={onOpenGlossaryModal}
                className="w-7 h-7 rounded-[10px] text-white flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,.16)',
                  cursor: 'pointer',
                  transition: 'background-color 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,.16)';
                }}
                title="Glossário"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
              <span style={rotuloBotaoAcao}>Ajuda</span>
              </div>
            </div>
          </div>

          {/* Top: Total em Vendas Card */}
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: 'rgba(247,220,225,0.8)', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
              TOTAL EM VENDAS
            </div>
            <div className="text-white" style={{ fontSize: '32px', lineHeight: 1, letterSpacing: '-0.03em', marginTop: '0px', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
              {formatMoney(totalIn)}
            </div>
          </div>

          {/* Bottom: 3 Small Boxes */}
          <div className="flex gap-2">
            <div className="flex-1 rounded-[16px] p-3 text-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div className="text-[9px] text-white/75 uppercase tracking-[0.06em]" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}>VENDAS PAGAS</div>
              <div className="text-white mt-1" style={{ fontSize: '15px', lineHeight: 1, fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
                {formatMoney(balances.totalPaidSales || 0)}
              </div>
            </div>
            <div className="flex-1 rounded-[16px] p-3 text-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div className="text-[9px] text-white/75 uppercase tracking-[0.06em]" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}>SAÍDAS</div>
              <div className="text-white mt-1" style={{ fontSize: '15px', lineHeight: 1, fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
                {formatMoney(balances.totalExpensesAmount || 0)}
              </div>
            </div>
            <div className="flex-1 rounded-[16px] p-3 text-center" style={{ background: 'rgba(228,217,195,0.28)' }}>
              <div className="text-[9px] uppercase tracking-[0.06em]" style={{ color: '#F0E2C8', fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}>⏳ A RECEBER</div>
              <div className="text-white mt-1" style={{ fontSize: '15px', lineHeight: 1, fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
                {formatMoney(totalAReceberGeral || 0)}
              </div>
            </div>
          </div>

          {/* Explica o recorte semanal: sem isto, a tela zerada toda
              segunda-feira parecia um bug pra quem abria o app sem saber que
              os totais (exceto "A receber") reiniciam a cada semana. */}
          <p className="text-[10px] mt-2.5 text-center" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: "'Manrope', sans-serif", lineHeight: 1.4 }}>
            {fraseReset}
          </p>

          {/* Spacer - maintains layout spacing */}
          <div style={{ height: '32px' }} />
        </div>

        {/* Logo do app ("carula" + etiqueta APP), centralizado e flutuando
            por cima, entre o Perfil e os botoes. Substitui o letreiro
            "Carula / CONFEITARIA" em serifada. */}
        <div
          data-logo-inicio
          className="absolute left-1/2 -translate-x-1/2 z-20 whitespace-nowrap"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + var(--topo-ios27, 0px) + 14px)',
          }}
        >
          <LogoCarulaApp fundo="roxo" tamanho={31} />
        </div>
      </div>

      <div
        className="pb-6 space-y-4"
        style={{
          background: '#F6F2F5',
          position: 'relative',
          zIndex: 50,
          marginTop: '-44px',
          marginLeft: 'calc(-0.5 * var(--app-bleed) + 50%)',
          marginRight: 'calc(-0.5 * var(--app-bleed) + 50%)',
          paddingTop: '32px',
          paddingLeft: 'calc(0.5 * var(--app-bleed) - 50% + 18px)',
          paddingRight: 'calc(0.5 * var(--app-bleed) - 50% + 18px)',
          borderRadius: '28px 28px 0 0',
        }}
      >

        {/* 2. COMANDA TICKET BUTTON - "LANÇAR PEDIDO" */}
        <button
          onClick={() => onOpenAddModal('venda')}
          className="w-full relative overflow-hidden transition-all duration-250"
          style={{
            background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)',
            borderRadius: '20px',
            padding: '18px 20px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 14px 30px rgba(58,35,80,0.36)',
            transformOrigin: 'center',
            position: 'relative',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) rotate(-0.6deg)';
            e.currentTarget.style.boxShadow = '0 22px 42px rgba(58,35,80,0.48)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 14px 30px rgba(58,35,80,0.36)';
          }}
        >
          {/* Cutout circles */}
          <div style={{
            position: 'absolute',
            width: '22px', height: '22px', borderRadius: '50%',
            background: '#F6F2F5',
            left: '-11px', top: '50%', transform: 'translateY(-50%)',
          }} />
          <div style={{
            position: 'absolute',
            width: '22px', height: '22px', borderRadius: '50%',
            background: '#F6F2F5',
            right: '-11px', top: '50%', transform: 'translateY(-50%)',
          }} />

          <div className="relative flex items-center gap-4">
            <div className="flex-1" style={{ paddingLeft: '6px', borderLeft: '2px dashed rgba(245,185,198,0.5)' }}>
              <div className="text-[9px] font-black text-white/80 mb-1" style={{ letterSpacing: '0.24em' }}>NOVA COMANDA</div>
              <div className="font-serif-display text-white" style={{ fontSize: '29px', lineHeight: 1 }}>Lançar Pedido</div>
            </div>
            <div
              className="car-float flex-shrink-0 w-11 h-11 rounded-[14px] flex items-center justify-center text-2xl font-black"
              style={{
                background: '#F5B9C6',
                color: '#3A2350',
                boxShadow: '0 8px 16px rgba(0,0,0,0.18)',
              }}
            >
              +
            </div>
          </div>

          {/* Sweep animation */}
          <div className="car-sweep absolute top-0 left-0 w-[70px] h-full pointer-events-none" style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
          }} />
        </button>

        {/* 2b. CHECKLIST DE PRIMEIROS PASSOS - some sozinho quando completo */}
        {checklistPrimeirosPassos}

        {/* 3. SALDOS & DIVISÃO DOS PEDIDOS - 3 Medidores */}
        <div className="space-y-3 w-full">
          <div>
            <h3 className="font-serif-display text-[23px]" style={{ color: '#241B2B' }}>
              Saldos &amp; Divisão dos Pedidos
            </h3>
            {/* A frase de cima trocou "Compras registradas" por "o que voce ja
                gastou": retirada de mao de obra nao e compra, e o card desconta
                ela tambem. O "?" abre a explicacao do que a porcentagem mede —
                sobretudo que cada circulo tem regua propria, entao comparar um
                com o outro nao diz nada. Usa o CampoComAjuda, o padrao de ajuda
                ja usado em Minha Empresa, Fichas e onboarding. */}
            <CampoComAjuda microcopy={microcopySaldos} exemploDinamico={ajudaSaldos} />
          </div>

          {/* Cinco cofrinhos em DINHEIRO (ver `cartoesDeSaldo`). Fila de cima:
              Reposicao, Mao de obra e Despesas, no tamanho de sempre. Fila de
              baixo, em versao baixa: Investimento e Lucro. O saldo fica em
              destaque e, embaixo, quanto entrou naquela parte. */}
          <div className="flex gap-3 w-full">
            {cartoesDeSaldo.map(({ nome, saldo }) => (
              <CardDeSaldo
                key={nome}
                nome={nome}
                saldo={saldo.currentBalance || 0}
                entrou={saldo.accumulatedInflow || 0}
                negativo={saldo.isNegative}
              />
            ))}
          </div>
          <div className="flex gap-3 w-full">
            <CardDeSaldo
              compacto
              nome="INVESTIMENTO"
              saldo={balances.investimento.currentBalance || 0}
              entrou={balances.investimento.accumulatedInflow || 0}
              negativo={balances.investimento.isNegative}
            />
            <CardDeSaldo
              compacto
              destaque
              nome={lucroNegativo ? 'PREJUÍZO' : 'LUCRO'}
              saldo={balances.lucro.currentBalance || 0}
              entrou={balances.lucro.accumulatedInflow || 0}
              negativo={balances.lucro.isNegative}
            />
          </div>

          {frasesSaldos}
        </div>

        {/* 3b. META SEMANAL COMPLETA (despesas + recebimento pessoal + CMV +
             investimento + lucro — a mesma `faturamentoNecessario` do card
             "Resumo & Distribuicao" abaixo, so que fatiada por semana).
             Fica logo abaixo dos saldos porque responde a pergunta seguinte:
             "entrou tanto — mas da pra bater a meta toda?" */}
        <div className="space-y-3 w-full mt-6">
          {cabecalhoSecao(vocab.tituloMeta, 'Quanto precisa entrar pra cobrir tudo — negócio e você', 'meta-titulo')}
          {cartaoMeta}
        </div>

        {/* 3b2. SELO DE SAUDE FINANCEIRA DOS PRODUTOS — os precos hoje
             cadastrados cobrem a estrutura definida em Minha Empresa? Fica
             logo depois da Meta da Semana porque as duas respondem a mesma
             pergunta de fundo ("da pra viver disso?"), uma pelo caixa e outra
             pelo preco de cada produto (Fase 4, item 1 do spec original). */}
        <div className="space-y-3 w-full mt-6">
          {cabecalhoSecao('Saúde Financeira dos Produtos', 'Algum produto está sendo vendido por menos do que custa?', 'saude-titulo')}
          {cartaoSaude}
        </div>

        {/* 3c. ESTRUTURA FINANCEIRA — faturamento necessario e distribuicao,
             mesmo componente e mesmos numeros da aba "Minha Empresa" (spec
             Parte 5, Teste 10). So aparece depois que o onboarding financeiro
             preenche pelo menos o recebimento desejado. */}
        {estruturaFinanceira && (
          <div className="mt-6">
            <ResumoDistribuicaoCard estrutura={estruturaFinanceira} />
          </div>
        )}

        {/* 4. AGENDA DE PEDIDOS - CALENDAR */}
        <div className="mt-6">
          <OrdersCalendar
            transactions={transactionsList}
            customers={customers}
            onOpenAddModal={() => onOpenAddModal('venda')}
            onOpenAddModalWithDate={onOpenAddModalWithDate}
          />
        </div>
      </div>
    </div>
  );
};
