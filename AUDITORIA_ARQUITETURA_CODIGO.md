# 🏗️ AUDITORIA — ARQUITETURA E CÓDIGO
## Carula Confeitaria — Análise Técnica de Senior Engineer

**Data:** 28 de Agosto de 2026  
**Método:** Análise de arquitetura, padrões, qualidade de código, organização, tipagem, dependências, duplicação, tratamento de erros.

---

## 📐 ARQUITETURA

### Visão Geral

**Stack:**
- Frontend: React 18 + TypeScript + Tailwind CSS
- State: React Context (Auth, FichasTecnicas, Customers, Currency)
- Persistence: localStorage (transactions) + Supabase (fichas, clientes)
- Build: Vite
- PDF: Probably jsPDF (via QuotePdfModal)

**Estrutura de Pastas:**
```
src/
  ├── components/        (45+ componentes)
  ├── context/          (4 contexts)
  ├── pages/            (Auth pages)
  ├── utils/            (helpers, calculators)
  ├── hooks/            (useUndo, useEstoque)
  ├── lib/              (supabase.ts, animation-tokens.ts)
  ├── data/             (presetData.ts)
  └── types.ts          (interfaces)
```

**Avaliação:** 🟡 **ACEITÁVEL, MAS COM PROBLEMAS**

---

## 🔴 PROBLEMAS CRÍTICOS

### 1. ARQUITETURA: localStorage-Only para Transactions

**Arquivo:** `src/utils/storage.ts:11`  
**Problema:**
```typescript
const STORAGE_KEY = 'carulaconfeitaria_transacoes_v3';
// Todas as transações são APENAS em localStorage
```

**Contexto:**
- Transactions (pedidos, vendas) = localStorage
- Fichas Técnicas = Supabase
- Clientes = Supabase
- **Resultado:** Dados divididos = risco de inconsistência

**Risco:** 🔴 **CRÍTICO**
- Sem backup automático de transações
- Se localStorage é limpado: dados perdidos
- Sem sincronização multi-tab
- Sem histórico/auditoria permanente

**Impacto:**
- Confiteira perde seus pedidos se tira cache
- Sem possibilidade de recuperação
- Não escalável para SaaS

**Recomendação:** 🔴 **P0**
- Migrar todas as transactions para Supabase (ou ao menos fazer backup)
- Implementar sincronização bi-direcional localStorage ↔ Supabase
- Adicionar queue para offline-first sync

---

### 2. TIPAGEM: Interfaces Sem Validação em Runtime

**Arquivo:** `src/types.ts:60-87`  
**Problema:**
```typescript
export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  // ... 20+ campos opcionais
  fichaId?: string; // Legado
  fichaItems?: FichaOrderItem[]; // Novo
  consumedIngredients?: ConsumedIngredient[]; // Novo
}
```

**Risco:** 🟠 **IMPORTANTE**
- TypeScript apenas em compile-time
- Em runtime, qualquer JSON pode chegar
- Supabase retorna dados sem validação
- `JSON.parse()` em storage.ts não valida

**Impacto:**
- Se API muda, código quebra silenciosamente
- localStorage corrompido pode travar app
- Dados antigos (legacy) causam confusion

**Recomendação:** 🟠 **P1**
- Usar Zod ou io-ts para validação runtime
- Validar dados ao carregar de Supabase
- Migration plan para dados antigos

---

### 3. ESTADO: Multi-Contexto Sem Sincronização

**Arquivo:** `src/context/`  
**Problema:**
```
AuthContext (usuário, login)
FichasTecnicasContext (fichas, Supabase)
CustomersContext (clientes, Supabase)
CurrencyContext (moeda, display-only)
+ localStorage (transações)
```

**Risco:** 🟠 **IMPORTANTE**
- 5 fontes de verdade diferentes
- Sem orquestração clara
- Supabase sync pode falhar silenciosamente
- localStorage como "source of truth" é anti-padrão

**Impacto:**
- Confiteira vê dado desatualizado
- Sem saber se é offline ou sync pendente
- Estado global inconsistente

**Recomendação:** 🟠 **P1**
- Usar lib de sincronização (SWR, TanStack Query)
- Centralizar state com Redux ou Zustand
- Implementar status de sync (loading/idle/error)

---

### 4. CÁLCULOS: Duplicação e Erros em balancesCalculator

**Arquivo:** `src/utils/balancesCalculator.ts`  
**Problema:** (Já identificado em auditoria anterior)
- Ignora tamanho-specific costs
- Multiplica quantidade pelo reposicaoCost global
- Resultado: lucro sistematicamente errado

**Risco:** 🔴 **CRÍTICO**
- Números financeiros incorretos
- Confiteira toma decisão baseada em lie
- Aceita produto com margem negativa (não percebe)

**Impacto:** Perda de confiança, churn

**Recomendação:** 🔴 **P0** — Corrigir cálculo, adicionar testes

---

## 🟠 PROBLEMAS IMPORTANTES

### 5. COMPONENTES: TransactionFormModal Muito Grande

**Arquivo:** `src/components/TransactionFormModal.tsx`  
**Problema:**
- ~1.500 linhas de código
- Lógica: form handling, validação, cálculos, PDF geração
- 4 abas internas, múltiplos estados
- State local com 10+ useStates

**Risco:** 🟠 **IMPORTANTE**
- Difícil de testar
- Difícil de manter
- Re-renders excessivos ao mudar estado
- Lógica misturada (UI + negócio)

**Impacto:**
- Performance em mobile (lento)
- Bugs difíceis de rastrear
- Código duplicado em outros formulários

**Recomendação:** 🟠 **P1**
- Quebrar em sub-componentes: FormCustomer, FormProducts, FormPayment, FormDelivery
- Extrair lógica para custom hook useTransactionForm
- Usar React.memo em sub-componentes

---

### 6. TRATAMENTO DE ERROS: Mínimo

**Arquivo:** `src/` (geral)  
**Problema:**
```typescript
// Típico no código
try {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
} catch (error) {
  console.error('Erro ao salvar no LocalStorage:', error);
  // Nada mais
}
```

**Risco:** 🟠 **IMPORTANTE**
- Falhas silenciosas (console.error apenas)
- Usuária não sabe se salvou ou não
- Sem retry logic
- Sem user-facing error UI

**Impacto:**
- Confiteira acha que salvou, mas perdeu dados
- Sem indicação de problema
- Difícil para suporte diagnosticar

**Recomendação:** 🟠 **P1**
- Toast/modal de erro visível
- Retry automático (com backoff)
- Logging estruturado (não console.error)

---

### 7. DEPENDÊNCIAS: Vite + Lucide + Canvas-Confetti

**Arquivo:** `package.json` (não visto, mas vídeo mostra uso)  
**Problema:**
- canvas-confetti: 50KB adicional
- Lucide icons: bom, mas talvez overkill para 45 ícones
- Tailwind: grande, mas padrão
- Sem package-lock visible

**Risco:** 🟡 **MÉDIO**
- Bundle size não otimizado
- Sem análise de dependências mortas
- npm deps podem ter vulnerabilidades

**Impacto:**
- Load time mais longo
- Mobile: dados gastos

**Recomendação:** 🟡 **P2**
- Usar `npm audit`
- Analisar bundle com `vite-plugin-visualizer`
- Tree-shake canvas-confetti (usar em modal apenas)

---

### 8. CÓDIGO: Duplicação Entre Componentes

**Exemplo:** `src/components/` (múltiplos modais)  
**Problema:**
- LoginModal.tsx, ProfileModal.tsx, UserProfileModal.tsx
- BackupModal.tsx, DeleteConfirmModal.tsx
- Mesmas estruturas: form header, buttons, close logic

**Risco:** 🟡 **MÉDIO**
- Bugs em um não são corrigidos em outro
- Esforço duplicado em mudanças
- Difícil aplicar estilo consistente

**Impacto:**
- Inconsistência visual/comportamental
- Manutenção mais lenta

**Recomendação:** 🟡 **P2**
- Extrair Modal base component
- Reutilizar form patterns

---

### 9. PERSISTÊNCIA: Sem Transações ACID

**Arquivo:** `src/utils/storage.ts` e `src/utils/stockManager.ts`  
**Problema:**
```typescript
// Sequência de passos sem garantia de sucesso conjunto
returnIngredientsToStock(...);  // Pode falhar
consumeIngredientsFromFicha(...); // Pode falhar
saveTransactions(...); // Pode falhar
```

**Risco:** 🟠 **IMPORTANTE**
- Se meio caminho falha, dados fica inconsistente
- Estoque pode não bater com transações
- Sem rollback

**Impacto:**
- Estoque fantasma (pedido foi salvo, ingredientes não foram consumidos)
- Confiteira vê "tem 500g de chocolate" mas já usou em 3 bolos

**Recomendação:** 🟠 **P1**
- Usar transações Supabase (começar com isso)
- Ou implementar retry + rollback local
- Adicionar validação de consistência periodicamente

---

## 🟡 PROBLEMAS DESEJÁVEIS

### 10. BUILD: Sem Análise de Bundle

**Risco:** 🟡 **MÉDIO**
- Não há `vite-plugin-visualizer` aparente
- Sem esbuild config otimizado
- Chunk splitting pode estar subótimo

**Recomendação:** 🟡 **P2**
- Adicionar análise de bundle em CI
- Codesplit: [main, shared, vendor]

---

### 11. TESTES: Nenhum Teste Visto

**Risco:** 🟡 **MÉDIO**
- Sem jest/vitest
- Sem testes unitários (utils)
- Sem testes de integração

**Impacto:**
- Regressões silenciosas
- Refactor perigoso

**Recomendação:** 🟡 **P3**
- Começar com testes de utils críticas (calculators, storage)
- Adicionar testes de componentes principais

---

### 12. DOCUMENTAÇÃO: Mínima

**Risco:** 🟡 **MÉDIO**
- Pouco JSDoc
- Sem ADR (Architecture Decision Records)
- Sem runbook de deploy

**Recomendação:** 🟡 **P3**
- Adicionar JSDoc em funções públicas
- Documentar fluxos de estado críticos

---

## 📊 RESUMO: PROBLEMAS CRÍTICOS

| # | Problema | Arquivo | Severidade | Impacto |
|---|---|---|---|---|
| 1 | localStorage-only transactions | storage.ts | 🔴 P0 | Perda de dados |
| 2 | Sem validação runtime | types.ts | 🟠 P1 | Dados corrompidos |
| 3 | Multi-contexto sem sync | context/ | 🟠 P1 | Dados desatualizado |
| 4 | Bug em balancesCalculator | balancesCalculator.ts | 🔴 P0 | Números errados |
| 5 | TransactionFormModal gigante | TransactionFormModal.tsx | 🟠 P1 | Performance |
| 6 | Sem tratamento de erro | (geral) | 🟠 P1 | Falhas silenciosas |
| 7 | Dependências não auditadas | package.json | 🟡 P2 | Bundle size |
| 8 | Duplicação de código | components/ | 🟡 P2 | Manutenção |
| 9 | Sem transações ACID | storage.ts | 🟠 P1 | Inconsistência |
| 10 | Sem análise de bundle | vite | 🟡 P2 | Performance |
| 11 | Sem testes | (geral) | 🟡 P3 | Regressões |
| 12 | Documentação mínima | (geral) | 🟡 P3 | Onboarding |

---

## 🎯 RECOMENDAÇÕES PRIORIZADAS

### P0 (CRÍTICO, BLOQUEIA LANÇAMENTO)
1. Migrar transactions para Supabase + sync offline
2. Corrigir bug em balancesCalculator
3. Implementar validação runtime com Zod

### P1 (IMPORTANTE, ANTES DE LANÇAR)
4. Refatorar TransactionFormModal
5. Implementar tratamento de erro com toast
6. Implementar transações ACID para estoque
7. Centralizar state management
8. Auditar dependências npm

### P2 (DESEJÁVEL, MÊS 1)
9. Remover duplicação de código
10. Análise de bundle size
11. Adicionar unit tests (utils críticas)

### P3 (NICE-TO-HAVE)
12. Documentação com JSDoc
13. Testes de componentes
14. ADR e runbooks

---

## 🔧 PRÓXIMOS PASSOS

1. **Sprint P0:** ~80h dev (arquitetura + fixing calculators)
2. **Sprint P1:** ~60h dev (refactoring + error handling + testing setup)
3. **Sprint P2:** ~40h dev (polish + optimization)

**Total para pronto para produção:** ~180h (4–5 sprints com 1 dev, ou 2 sprints com 2 devs)

---

**Classificação Geral:** 🟠 **ARQUITETURA FUNCIONA, MAS FRÁGIL PARA PRODUÇÃO. CRÍTICO MIGRAR PARA SUPABASE E CORRIGIR CÁLCULOS.**
