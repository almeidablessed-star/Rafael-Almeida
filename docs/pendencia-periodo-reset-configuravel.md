# PENDENTE: período de reset configurável (semanal/quinzenal/mensal)

> Registrado em 2026-09-22, a pedido do Rafael — ideia de produto trazida
> pela dona real da confeitaria (cliente dele), que sugeriu escolher entre
> semanal, quinzenal ou mensal como período de reset das metas, dependendo
> do ritmo de cada negócio. Só mapeamento de impacto e estimativa de
> escopo — **nada foi implementado**.

## A ideia de produto (ainda não é plano técnico)

- Pergunta nova no onboarding financeiro: "Com que frequência você quer
  resetar suas metas — semanal, quinzenal ou mensal?"
- Opção de trocar depois em Minha Empresa, se o período escolhido não
  funcionar bem na prática.

## Mapeamento: tudo que assume "semana fixa" hoje

### Núcleo do recorte semanal (o que precisaria generalizar de verdade)

- **`src/utils/weeklyArchiveUtils.ts`** — arquivo inteiro é aritmética de
  segunda-a-domingo: `getCurrentWeekMonday`/`getCurrentWeekSunday`,
  `getWeekMonday`/`getWeekSunday`, `getWeekNumberInMonth`,
  `filterTransactionsByWeek`, `calculateWeeklyTotals`,
  `getWeeksWithTransactions`, `getHistoryYears`, `getHistoryMonthsByYear`,
  `getWeeklySummariesByYearMonth`. Nove funções, todas com o ciclo de 7 dias
  embutido na lógica (não é um parâmetro, é a própria forma da conta).

- **`src/utils/financialEngine.ts`**:
  - `getWeekRange()` — intervalo segunda/domingo para uma data de
    referência.
  - `calculateWeeklyBalances()` — a função por trás do card "Saldos &
    Divisão" (Reposição/Mão de Obra/Custo+Inv) no Início **e** da barra
    "Saldo Total Disponível" na aba Compras
    (`BalancesAndExpensesModule.tsx`). Filtra transações usando
    `getCurrentWeekMonday`/`getCurrentWeekSunday`.
  - `calcularMetaSemanal()` — a função por trás do card "Meta da Semana".
    Usa `getWeekRange()` + a constante `SEMANAS_POR_MES` (52/12 ≈ 4,333)
    pra converter a meta mensal num alvo semanal.
  - `SEMANAS_POR_MES` — usada em **dois** lugares com propósitos
    diferentes: `calcularMetaSemanal` (a meta em si) e `calcularMetaHoras`
    (estimativa de horas/dia, usada no onboarding e em Minha Empresa). Uma
    generalização precisa decidir se as duas devem seguir o período
    escolhido, ou só a meta financeira.
  - `calculateWeeklyClosing()` — por trás de `WeeklyClosingModule.tsx` (ver
    nota sobre código legado abaixo).

- **`src/components/Dashboard.tsx`** — acoplamento pesado de texto/UI: título
  "Meta da Semana", "por semana", "essa semana", e o texto explicativo
  adicionado nesta sessão ("Números da semana atual (seg–dom) · reinicia
  toda segunda..."). Tudo isso precisaria virar texto dinâmico conforme o
  período escolhido ("semana"/"quinzena"/"mês").

- **`src/components/BalancesAndExpensesModule.tsx`** (aba Compras) — mesma
  `calculateWeeklyBalances`, mais o card **"📊 Histórico"**
  (`WeeklyHistoryCard.tsx`), que é uma tela de navegação **inteiramente**
  organizada por semana: ano → mês → lista de semanas daquele mês. Quinzenal
  ou mensal como período de reset provavelmente exigiria uma estrutura de
  navegação diferente aqui (não dá só pra trocar um número), já que "semana
  3 de setembro" deixa de fazer sentido como unidade de navegação se o
  reset for mensal.

### Onde a nova pergunta/config provavelmente entraria

- **`src/components/onboarding/EmpresaOnboardingFlow.tsx`** e
  **`src/components/MinhaEmpresaCard.tsx`** — já têm o padrão exato pedido
  (pergunta no onboarding + campo editável depois em Minha Empresa) para
  `workingDaysPerWeek` ("Quantos dias por semana você quer trabalhar?").
  Um campo novo `periodoReset` seguiria a mesma estrutura: coluna nova em
  `administrative_costs` (não existe hoje — precisaria de migration, no
  mesmo formato de `working_days_per_week`), campo em
  `CamposOnboarding`/`AdministrativeCosts` (`types.ts`,
  `CostsContext.tsx`), pergunta no `EmpresaOnboardingFlow` e edição em
  `MinhaEmpresaCard`.

- **Precedente de cautela**: já existiu um seletor parecido — "periodicidade"
  no Perfil — removido nesta mesma sessão (`ProfileModal.tsx`, comentário
  na linha 287) por ser **puramente cosmético**: só pré-preenchia um campo
  do formulário de Despesa, sem afetar nenhum cálculo real. A nova feature
  só vale a pena se realmente mover a agulha do motor de cálculo
  (`calculateWeeklyBalances`/`calcularMetaSemanal`), não repetir esse
  padrão.

### Achados relacionados, mas que NÃO fazem parte deste recorte

Pra não reabrir essa investigação por engano no futuro:

- **`TimePeriod`** (`'hoje' | 'semana' | 'mes' | 'ano' | 'tudo' |
  'personalizado'`), `filterTransactionsByPeriod` e `PeriodSelector.tsx` são
  um filtro **manual** de relatório (a pessoa escolhe o período pra
  visualizar), completamente separado do ciclo automático de reset. Nem é
  código realmente ativo: `PeriodSelector` é importado em `App.tsx` mas
  **nunca renderizado** — import morto.
- **`LaborPeriod`** (`'diaria' | 'semanal' | 'mensal' | ...`, em
  `TransactionFormModal.tsx` e `formatters.ts`) é o campo "Período" de uma
  Mão de Obra individual lançada em Compras/Despesas — não tem relação com
  o ciclo de reset das metas.
- **`WeeklyClosingModule.tsx`** (aba `'semana'`) e o cluster
  `HistoryModule`/`SalesModule`/`RestockModule` (abas `'historico'`,
  `'vendas'`, `'reposicao'`) não são alcançáveis pela navegação atual
  (`BottomNav.tsx` só tem Início/Pedidos/Fichas/Clientes/Produtos/Empresa)
  — código legado, mesmo cluster já registrado em
  `docs/pendencia-redesign-compras.md`. Ainda dependem de
  `calculateWeeklyClosing`, mas por estarem inalcançáveis, uma
  generalização poderia optar por não estender esse código morto (ou
  removê-lo primeiro, decisão separada).
- `OrdersCalendar.tsx` ("D S T Q Q S S") é só o cabeçalho de dias da semana
  de um calendário mensal comum — sem relação com o período de reset.

## Estimativa de escopo/complexidade

**Não é uma mudança pequena** (trocar um número de dias) — é generalizar
uma abstração de "período" que hoje está espalhada e hardcoded em pelo
menos 7 arquivos do núcleo, mais schema novo. Motivos principais:

1. **Quinzena e mês não têm um âncora tão limpo quanto "segunda a
   domingo".** Semana sempre tem 7 dias fixos; quinzena precisa de uma
   convenção (dia 1–15/16–fim do mês? janela rolante de 14 dias a partir de
   uma data escolhida?) e mês tem duração variável (28–31 dias) — o truque
   atual de `SEMANAS_POR_MES` (uma constante de conversão) não generaliza
   de graça para quinzena sem uma decisão de produto sobre o que "quinzena"
   significa no calendário.
2. **A tela de Histórico é estruturalmente semanal**, não paramétrica —
   navegar por "semana do mês" é a própria interface, não um detalhe de
   implementação. Precisaria de redesenho de navegação pra quinzena/mês, não
   só ajuste de cálculo.
3. **Múltiplos consumidores da mesma constante** (`SEMANAS_POR_MES`) com
   propósitos diferentes (meta financeira vs. estimativa de horas/dia) —
   decisão de produto sobre se os dois devem seguir o período escolhido.
4. **Precisa de migration** — não existe hoje nenhuma coluna pra guardar o
   período escolhido; seria uma coluna nova em `administrative_costs`,
   além de UI de onboarding e de edição pós-onboarding.
5. **Texto de UI hardcoded em "semana"** em vários pontos (título "Meta da
   Semana", texto explicativo do Início, tooltip do tour guiado, labels de
   Minha Empresa) precisaria virar texto dinâmico conforme o período.
6. **Código legado (`WeeklyClosingModule`) compartilha as mesmas funções**
   — generalizar tudo incluiria esse cluster inalcançável, ou exigiria
   decidir excluí-lo/removê-lo antes.

Resumo: **generalização de porte médio-grande**, não um ajuste pontual —
envolve escolher convenções de calendário para quinzena/mês, redesenhar a
navegação do Histórico, adicionar schema novo, e revisar texto de UI em
vários arquivos. Vale planejar como uma tarefa própria quando for priorizada,
não encaixar de última hora em outra tarefa.
