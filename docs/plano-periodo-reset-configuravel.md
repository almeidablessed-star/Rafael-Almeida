# PLANO DE ARQUITETURA: período de reset configurável (semanal/quinzenal/mensal)

> Escrito em 2026-09-25, a pedido do Rafael. Sucessor de
> [`pendencia-periodo-reset-configuravel.md`](./pendencia-periodo-reset-configuravel.md)
> (mapeamento de impacto, 2026-09-22). **Nada foi implementado** — este
> documento existe para ser revisado e aprovado antes de qualquer código.
>
> Revisão importante do mapeamento anterior: ele estimou "redesenho de
> navegação do Histórico" e "7 arquivos do núcleo com o ciclo embutido na
> própria forma da conta". Relendo o código agora, **os dois pontos são menos
> graves do que pareciam** — a razão está nas seções 2 e 5. A estimativa final
> continua sendo de porte médio, mas por motivos diferentes dos registrados
> antes.

## Decisões de produto que este plano precisa que você confirme

Estão detalhadas nas seções correspondentes; resumidas aqui para facilitar a
revisão:

1. **Convenção de quinzena**: dias 1–15 / 16–fim do mês (recomendado) ou
   janela rolante de 14 dias? → seção 2.
2. **Trocar o período é retroativo?** Recomendo sim — todo o histórico
   passado se reagrupa no novo período. → seção 1.
3. **A meta de horas segue o período?** Recomendo não — ela continua semanal.
   → seção 2.
4. **Meta da quinzena é mensal ÷ 2 fixo**, mesmo a 2ª quinzena tendo 13–16
   dias? Recomendo sim. → seção 2.

---

## 1. Onde o período escolhido fica guardado

Coluna nova em `administrative_costs`, exatamente no molde de
`working_days_per_week` (migration `20260906_minha_empresa_configuracao.sql`,
linhas 22–37):

```sql
ALTER TABLE public.administrative_costs
  ADD COLUMN IF NOT EXISTS periodo_reset text NOT NULL DEFAULT 'semanal';

ALTER TABLE public.administrative_costs
  DROP CONSTRAINT IF EXISTS administrative_costs_periodo_reset_check,
  ADD CONSTRAINT administrative_costs_periodo_reset_check
    CHECK (periodo_reset IN ('semanal', 'quinzenal', 'mensal'));
```

- **`text` + CHECK, não enum do Postgres** — nenhuma migration deste repo cria
  tipo enum; `text` com CHECK é o padrão da casa e é mais fácil de estender
  depois (ex: "a cada 10 dias") sem `ALTER TYPE`.
- **`DEFAULT 'semanal'` é a garantia de compatibilidade**: toda conta que já
  existe continua com exatamente o comportamento de hoje, sem nenhuma conta
  mudar de número no dia do deploy.

Camadas acima, seguindo o mesmo caminho que `workingDaysPerWeek` já percorre:

| Arquivo | O que muda |
|---|---|
| `src/types.ts` | `export type PeriodoReset = 'semanal' \| 'quinzenal' \| 'mensal'` e o campo `periodoReset: PeriodoReset` em `AdministrativeCosts` |
| `src/context/CostsContext.tsx` | `periodoReset` em `CamposOnboarding`, `CAMPOS_ONBOARDING_LABEL`, `CAMPOS_ONBOARDING_PARA_COLUNA` e `montarAdministrativeCosts` (`data?.periodo_reset \|\| 'semanal'`) |

⚠️ **Ponto de atenção**: hoje todos os campos de `CamposOnboarding` são
`number`. Este é o primeiro `string`. `salvarPassoOnboarding` /
`salvarConfiguracaoEmpresa` gravam o valor direto na coluna e registram
`valor_antigo`/`valor_novo` como `text` no histórico, então deve funcionar sem
mudança — mas é a primeira coisa a verificar na Etapa 2, não assumir.

### O período é uma lente, não um estado congelado

**Recomendação: trocar o período reagrupa todo o histórico retroativamente.**

Isso sai de graça por causa de uma escolha anterior: o card Histórico não lê
mais um arquivo congelado — ele **deriva** tudo de `transactions` a cada
render (ver o comentário longo em `weeklyArchiveUtils.ts`, linhas 141–152,
sobre a saída do `carula_weekly_archives` do localStorage). Ou seja: mudar o
período simplesmente muda como as mesmas transações são agrupadas.

A alternativa (período vale só dali pra frente, histórico antigo preservado no
período antigo) exigiria guardar o período vigente por janela, teria um
histórico com unidades misturadas no meio, e não traz benefício real —
nenhum número de venda muda, só o recorte.

---

## 2. Generalizar as funções que hoje assumem 7 dias

### A boa notícia: a lógica realmente semanal é menor do que parece

Auditando função por função em `weeklyArchiveUtils.ts`:

| Função | Situação real |
|---|---|
| `filterTransactionsByWeek(txs, start, end)` | **Já é genérica** — recebe um intervalo, não sabe o que é semana. Só renomear. |
| `calculateWeeklyTotals(txs)` | **Já é genérica** — nenhuma lógica de data. Só renomear. |
| `createdAtToLocalIso` | Genérica, não muda. |
| `getWeekMonday` / `getWeekSunday` | **Aqui mora a lógica semanal de verdade.** Viram o ramo `semanal` do novo `getPeriodoStart/End`. |
| `getCurrentWeekMonday` / `getCurrentWeekSunday` | Viram `getPeriodoAtual(periodo)`. |
| `getWeekNumberInMonth` | Generaliza para `getIndiceNoMes(data, periodo)`: semana → 1–5, quinzena → 1–2, mês → 1. |
| `getWeeksWithTransactions` | Agrupa por `getPeriodoStart` em vez de `getWeekMonday`. Uma linha. |
| `getHistoryYears` / `getHistoryMonthsByYear` / `getWeeklySummariesByYearMonth` | Passam a receber `periodo` e repassar. Estrutura igual. |

Em `financialEngine.ts`, os consumidores são só quatro pontos:
`getWeekRange()`, `calculateWeeklyBalances()`, `calcularMetaSemanal()` e
`calculateWeeklyClosing()` (legado inalcançável — ver seção 7).

E na camada de componente, só **4 call sites** no app inteiro:

```
Dashboard.tsx:81              calculateWeeklyBalances
Dashboard.tsx:135             calcularMetaSemanal
BalancesAndExpensesModule:56  calculateWeeklyBalances
WeeklyClosingModule.tsx:49    calculateWeeklyClosing   (legado)
```

**Conclusão:** a aritmética nova de calendário fica concentrada em UMA função
nova (`getPeriodoStart/End`, ~30 linhas com um `switch`). Todo o resto é
passar um parâmetro adiante. Isso muda a natureza do trabalho: não é
"reescrever 7 arquivos", é "criar um módulo e enfiar um parâmetro na cadeia".

### Módulo novo: `src/utils/periodoReset.ts`

Dono único de toda a aritmética de janela. Assinatura proposta:

```ts
export type PeriodoReset = 'semanal' | 'quinzenal' | 'mensal';

export interface JanelaPeriodo {
  inicioIso: string;   // YYYY-MM-DD
  fimIso: string;      // YYYY-MM-DD, inclusive
}

/** Janela que contém a data informada, no período escolhido. */
export function getJanela(dataIso: string, periodo: PeriodoReset): JanelaPeriodo;

/** Janela corrente (hoje). */
export function getJanelaAtual(periodo: PeriodoReset): JanelaPeriodo;

/** Quantas janelas cabem num mês — substitui SEMANAS_POR_MES na meta. */
export function janelasPorMes(periodo: PeriodoReset): number;

/** 1–5 (semana), 1–2 (quinzena), 1 (mês) — usado só como rótulo no Histórico. */
export function getIndiceNoMes(dataIso: string, periodo: PeriodoReset): number;
```

⚠️ **Regra inegociável de implementação**: usar a aritmética de data LOCAL do
`weeklyArchiveUtils.ts` (`new Date(ano, mes-1, dia)` + montagem manual da
string), **nunca `.toISOString()`**. Todo o comentário das linhas 35–52 daquele
arquivo documenta um bug de fuso já corrigido uma vez; repetir `toISOString`
no módulo novo o reintroduz. (Ver também o achado na seção 8.)

### A convenção de quinzena — a decisão central

| | (A) Calendário: 1–15 / 16–fim | (B) Rolante: 14 dias desde uma âncora |
|---|---|---|
| Encaixa dentro de mês/ano | **Sim, sempre** | Não — atravessa a virada do mês |
| Estado extra necessário | Nenhum | Uma data-âncora (outra coluna, e "o que acontece se ela mudar?") |
| Navegação do Histórico | Reaproveita ano → mês → lista | Quebra a hierarquia, exige redesenho |
| Como as pessoas pensam | Igual a pagamento quinzenal (dia 15 e fim do mês) | Exige explicar a âncora |
| Ponto fraco | Quinzenas desiguais (15 dias vs 13–16) | Nenhum ponto forte que compense |

**Recomendo (A), com folga.** O motivo decisivo é estrutural, não estético: com
(A), semanal/quinzenal/mensal todos se encaixam dentro de mês → ano, então a
tela de Histórico **não precisa de redesenho** (seção 5) — que era o item mais
caro da estimativa anterior. Com (B), ela precisaria.

Nota: **semanal continua segunda-a-domingo exatamente como hoje** — não vira
"7 dias rolantes". Semana é, ironicamente, o único dos três que *não* encaixa
limpo no mês (uma semana pode cruzar a virada); o código atual já resolve isso
agrupando pelo mês da segunda-feira, e esse comportamento fica igual.

### A conversão da meta (o problema do `SEMANAS_POR_MES`)

Hoje: meta mensal ÷ 4,333 = meta semanal. Generalizado via `janelasPorMes()`:

| Período | Divisor | Exatidão |
|---|---|---|
| semanal | 52/12 ≈ 4,3333 | aproximação (igual a hoje) |
| quinzenal | 2 | exato, por definição da convenção (A) |
| mensal | 1 | exato |

**Meta da quinzena = mensal ÷ 2 fixo**, mesmo a 2ª quinzena tendo 13–16 dias.
A alternativa (ratear por número de dias) faria a meta oscilar de quinzena
pra quinzena, o que confunde mais do que a pequena desigualdade resolve.
Recomendo o divisor fixo — mas é uma decisão sua.

### Os dois consumidores da constante — recomendação

O mapeamento anterior apontou que `SEMANAS_POR_MES` serve a dois propósitos
diferentes. Recomendação:

- **`calcularMetaSemanal` (meta financeira) → segue o período.** É o objetivo
  da feature. Passa a usar `janelasPorMes(periodo)`.
- **`calcularMetaHoras` (horas/dia de referência) → continua semanal, com a
  constante.** Ela é ancorada em `workingDaysPerWeek` — "dias por *semana*",
  um campo separado que a usuária configurou. Converter as horas pra "por
  quinzena" e depois dividir por "dias por semana" mistura unidades e produz
  um `horasPorDia` errado.

Efeito colateral bom: os dois deixam de compartilhar o mesmo símbolo, que era
exatamente a preocupação registrada no mapeamento.

---

## 3. Onde a pergunta entra no onboarding financeiro

**Passo novo** (não opção dentro de um passo existente): `TOTAL_PASSOS` vai de
8 para 9, com a pergunta entrando como **passo 4**, logo depois de "Quantos
dias por semana você quer trabalhar?" (passo 3) — as duas são sobre ritmo de
trabalho, e ficam juntas antes de o fluxo virar para despesas e percentuais.

Texto sugerido: *"Com que frequência você quer resetar suas metas?"* com as
três opções e uma linha de `CampoComAjuda` explicando que dá pra mudar depois.

⚠️ **Cuidado com quem está no meio do onboarding.**
`onboarding_financeiro_passo_atual` é persistido por conta. Inserir um passo no
meio faz o conteúdo "escorregar" para quem parou no passo 5 ou 6. A correção é
de três linhas, na mesma migration:

```sql
UPDATE public.administrative_costs
   SET onboarding_financeiro_passo_atual = onboarding_financeiro_passo_atual + 1
 WHERE onboarding_financeiro_passo_atual >= 4
   AND onboarding_financeiro_completo_em IS NULL;
```

Quem já concluiu não é tocado (fica com o default `'semanal'` e muda em Minha
Empresa se quiser). Quem está no meio pula a pergunta nova e também fica no
default — aceitável, já que o campo tem default válido.

---

## 4. Onde fica a opção de trocar depois, em Minha Empresa

`MinhaEmpresaCard.tsx` já tem o padrão exato (estado local → botão salvar →
`salvarConfiguracaoEmpresa`, que grava o antes/depois em
`configuracao_empresa_historico` sozinho). São três acréscimos mecânicos:
estado local `periodoReset`, um `<select>` de 3 opções junto dos outros campos,
e o campo no payload do save.

Junto, uma linha de microcopy avisando que a troca **reagrupa o histórico
inteiro** (decisão da seção 1) — não é destrutiva, mas a tela muda de cara e a
usuária merece saber por quê antes de clicar.

⚠️ **Gotcha real que esse caminho esconde:** `CostsContext` deriva
`ultimaMudancaMetas` da linha **mais recente** de
`configuracao_empresa_historico`, *qualquer que seja o campo*, e
`fichaDesatualizada` usa isso para pintar o selo **"⚠ Metas mudaram"** em cada
ficha técnica. Ou seja: se o período entrar no histórico como um campo
qualquer, **trocar o período marcaria todas as fichas como desatualizadas** —
um alarme falso, porque o custo de nenhuma ficha depende do período de reset.

Duas saídas:

- **(recomendada)** `salvarConfiguracaoEmpresa` não registra `periodoReset` no
  histórico — é preferência de recorte/exibição, não meta financeira. Uma
  condição e um comentário explicando o porquê.
- Alternativa: continuar registrando (auditoria completa) e filtrar o campo na
  query de `ultimaMudancaMetas`. Mais fiel, porém hoje o filtro teria que ser
  pelo rótulo humano em `campo`, o que é frágil.

---

## 5. Como o card "Histórico" se adapta

Hoje é `Ano → Mês → lista de semanas` (`WeeklyHistoryCard.tsx`). **Com a
convenção (A), essa hierarquia sobrevive nos três períodos** — porque quinzena
e mês encaixam dentro do mês por construção:

| Período | O que a lista mostra dentro do mês |
|---|---|
| semanal | 4–5 semanas (idêntico a hoje) |
| quinzenal | exatamente 2 — "1ª Quinzena" / "2ª Quinzena" |
| mensal | exatamente 1 — o próprio mês |

O único caso desconfortável é **mensal**: um seletor de mês cujo resultado é
uma lista de um item só é UI redundante. Proposta: **no modo mensal, o seletor
de mês some e a lista passa a ser a dos meses do ano** (`Ano: 2026` → lista de
Janeiro…Dezembro com os totais de cada um). É uma renderização condicional
(~20 linhas), não um redesenho — e provavelmente fica melhor do que hoje.

Junto disso, duas coisas menores:

- **Rótulo de cada item**: `Semana {n}: {início} - {fim}` vira um rótulo vindo
  do helper de vocabulário (seção 6) — `1ª Quinzena: …`, `Setembro: …`.
- **Tipo `WeeklySummary`** (`types.ts:377`): `weekNumber` passa a significar
  "índice dentro do mês". Renomear para `indiceNoMes` deixa mais honesto —
  mudança mecânica, verificada pelo compilador.

**Isto revisa o item 2 da estimativa antiga** ("a tela de Histórico é
estruturalmente semanal, precisaria de redesenho"). Ela é estruturalmente
*ano → mês → janelas*, e "janela" já é o conceito genérico — desde que a
convenção de quinzena encaixe no mês, que é justamente o argumento decisivo
pela opção (A).

---

## 6. Textos de UI que hoje dizem "semana"

Contagem real: **50 ocorrências em 9 arquivos**, mas quase metade é código
legado ou não relacionado. O que precisa virar dinâmico:

| Arquivo | Ocorrências relevantes |
|---|---|
| `Dashboard.tsx` | ~10 textos visíveis: "Meta da Semana", "por semana", "essa semana", "Números da semana atual (seg–dom) · reinicia toda segunda…", as duas frases de meta batida, a frase da meta pessoal |
| `WeeklyHistoryCard.tsx` | título dos itens + "Visualize o desempenho de semanas anteriores" |
| `MinhaEmpresaCard.tsx` | rótulo da meta de horas (*continua "semana"* — decisão da seção 2) |
| `TourPrimeirosPassos.tsx` | 1 tooltip |
| `financialEngine.ts` | `getWeekRange().formattedRange` → "Semana de X a Y" |

**Não** entram: `WeeklyClosingModule` (legado), `TransactionFormModal` /
`formatters` (`LaborPeriod`, outro conceito), `PeriodSelector` (import morto),
`ProfileModal` (comentário).

### Helper de vocabulário, não concatenação de string

```ts
// em periodoReset.ts
export const rotulos = (p: PeriodoReset) => ({
  substantivo: 'semana' | 'quinzena' | 'mês',
  adjetivo:    'semanal' | 'quinzenal' | 'mensal',
  tituloMeta:  'Meta da Semana' | 'Meta da Quinzena' | 'Meta do Mês',
  nessePeriodo:'essa semana' | 'essa quinzena' | 'esse mês',
  porPeriodo:  'por semana' | 'por quinzena' | 'por mês',
  explicacaoReset: '…(seg–dom) · reinicia toda segunda'
                 | '…(dias 1–15 e 16–fim) · reinicia dia 1 e dia 16'
                 | '…(mês cheio) · reinicia todo dia 1',
});
```

O motivo de guardar a **frase inteira** em vez de montar com
`"essa " + substantivo`: concordância de gênero em português — "essa semana"
e "essa quinzena", mas "**esse** mês". Montar por concatenação produz
exatamente o tipo de erro ("Já existe **um** ficha técnica") que apareceu no
modal de nomes duplicados nesta mesma sessão. O vocabulário carrega o artigo
pronto.

Opcional: renomear os campos de `MetaSemanal` (`necessarioPorSemana`,
`faturadoNaSemana`, `metaPessoalSemana`) para nomes neutros de período. É
mecânico e o compilador acha tudo, mas aumenta o diff — pode ficar de fora sem
prejuízo funcional.

---

## 7. Escopo, complexidade e sub-etapas

### Arquivos tocados: ~12 (1 novo + 1 migration nova)

| Camada | Arquivos | Complexidade |
|---|---|---|
| Schema/modelo | migration nova, `types.ts`, `CostsContext.tsx` | **Baixa** — molde do `working_days_per_week` já existe |
| Núcleo do cálculo | **`periodoReset.ts` (novo)**, `weeklyArchiveUtils.ts`, `financialEngine.ts` | **Alta** — é o coração; a aritmética de calendário e o risco de fuso moram aqui |
| Config (UI) | `EmpresaOnboardingFlow.tsx`, `MinhaEmpresaCard.tsx` | **Baixa** — padrão idêntico já existe |
| Consumo (UI) | `Dashboard.tsx`, `BalancesAndExpensesModule.tsx`, `WeeklyHistoryCard.tsx` | **Média** — muitos textos + a condicional do modo mensal |
| Legado | `WeeklyClosingModule.tsx` | **Decisão, não trabalho** — ver Etapa 5 |

### Sub-etapas propostas (com aprovação em cada uma)

A divisão foi escolhida para que **as duas etapas mais arriscadas não mudem
nada visível** — se algo quebrar no refactor, quebra antes de qualquer feature
estar exposta.

| Etapa | O que faz | Mudança visível? | Como testar |
|---|---|---|---|
| **1. Fundação invisível** | Cria `periodoReset.ts` e faz `weeklyArchiveUtils`/`financialEngine` consumirem ele, com `'semanal'` fixo no código | **Nenhuma** — comportamento idêntico | Confirmar na tela que Início, Compras e Histórico mostram exatamente os mesmos números de antes |
| **2. Schema + leitura** | Migration, `types.ts`, `CostsContext`; o valor chega ao engine, mas todo mundo ainda é `'semanal'` | **Nenhuma** | Conferir que conta existente continua igual; verificar o campo `string` no upsert/histórico |
| **3. Onboarding + Minha Empresa** | A pergunta aparece e o valor pode virar quinzenal/mensal pela primeira vez | **Sim** — primeira etapa com efeito real | Testar os 3 modos ao vivo: metas, saldos e janela de cada um |
| **4. Textos + Histórico** | Helper de vocabulário, textos do Dashboard, rótulos e o modo mensal do Histórico | **Sim** — acabamento | Os 3 modos de novo, olhando texto e navegação |
| **5. Legado (opcional)** | Decidir `WeeklyClosingModule`: congelar em `'semanal'` ou remover junto com o cluster de `pendencia-redesign-compras.md` | Nenhuma (inalcançável) | — |

Etapas 1 e 2 podem inclusive ir pra produção com segurança antes de a feature
existir, já que são no-ops por construção.

### Riscos principais

1. **Fuso horário** — o risco técnico número um. O módulo novo precisa herdar
   a aritmética local do `weeklyArchiveUtils`, não a de `getWeekRange`.
2. **Falso "Metas mudaram"** nas fichas ao trocar o período (seção 4).
3. **Passo do onboarding escorregando** para quem está no meio (seção 3).
4. **Reagrupamento retroativo do histórico** — não é bug, é a decisão da seção
   1, mas precisa estar consciente antes de a usuária real ver.

---

## 8. Achado fora do escopo, durante este planejamento

`financialEngine.getWeekRange()` (linhas 266–267) monta o resultado com
`.toISOString()`:

```ts
const startIso = monday.toISOString().split('T')[0];
const endIso   = sunday.toISOString().split('T')[0];
```

Esse é exatamente o padrão que `weeklyArchiveUtils.getWeekMonday` abandonou de
propósito, com um comentário longo explicando o bug de fuso. Aqui ele ainda
está vivo: como `monday` é meia-noite **local**, em fusos **positivos**
(UTC+1 em diante) meia-noite local é o dia *anterior* em UTC, e a janela
inteira anda um dia pra trás.

Impacto hoje: **nenhum na prática** — Brasil (UTC−3) e a confeitaria de teste
em Massachusetts (UTC−4/−5) são fusos negativos, onde a conversão cai no mesmo
dia. Seria um bug real só para uma usuária na Europa/Ásia. E como
`getWeekRange` alimenta `calcularMetaSemanal` enquanto `calculateWeeklyBalances`
usa a versão local corrigida, nesse cenário os dois cards do Início
discordariam em um dia.

Não corrigi nada — só registro. A Etapa 1 deste plano o eliminaria
naturalmente, já que passaria a existir uma única fonte de aritmética de
janela. Se preferir, dá pra corrigir antes, isolado, como fix de uma linha.
