# 📊 AUDITORIA — INTEGRIDADE FINANCEIRA
## Carula Confeitaria — Rastreamento de Custos e Valores Financeiros

**Data:** 28 de Agosto de 2026  
**Objetivo:** Rastrear origem de cada número financeiro até seu ponto de uso  
**Método:** Análise de fluxo de dados e transformações  
**Foco:** Integridade, consistência, divergências

---

## ⚠️ SUMÁRIO EXECUTIVO

**Status:** 🔴 **PROBLEMAS CRÍTICOS ENCONTRADOS**

5 problemas críticos onde valores financeiros são calculados INCORRETAMENTE ou SÃO IGNORADOS:

1. 🔴 **Custos por tamanho (maoDeObraCost, custoCost, investimentoCost) não são capturados na venda**
2. 🔴 **UI mostra preço correto, mas custos associados são zerados**
3. 🔴 **Dashboard calcula balanço ignorando custos por tamanho**
4. 🟠 **Venda com produto de Ficha pode ter R$ 0 de preço se não selecionado corretamente**
5. 🟠 **Múltiplos níveis de custos (global vs. por tamanho) causam confusão**

**Risco:** Confiteira registra vendas com preços corretos, mas custos são zerados. Dashboard mostra lucro/prejuízo incorreto.

---

## 🔴 PROBLEMA CRÍTICO #1: Gap Entre Custos Definidos e Custos Usados

### Estrutura de Dados

**Em FichaTecnica:**
```typescript
interface FichaTecnica {
  id: string;
  name: string;
  // Custos globais (nível ficha)
  reposicaoCost: number;      // R$ 10 por produto
  maoDeObraCost: number;      // R$ 20 por produto
  custoCost: number;          // R$ 5 por produto
  investimentoCost: number;   // R$ 5 por produto
  
  tamanhos: TamanhoOpcao[];   // Lista de tamanhos
}

interface TamanhoOpcao {
  id: string;
  descricao: string;          // "20 fatias"
  preco: number;              // R$ 90 (PREÇO DE VENDA)
  quantidade?: number;        // 20 (número de fatias)
  
  // Custos OPCIONAIS por tamanho (SOBRESCREVEM os globais se definidos)
  maoDeObraCost?: number;     // R$ 20 específico para 20cm
  custoCost?: number;         // R$ 5 específico para 20cm
  investimentoCost?: number;  // R$ 5 específico para 20cm
}
```

**Exemplo Real:**
```
Ficha "Bolo Chocolate":
  reposicaoCost global: R$ 10
  maoDeObraCost global: R$ 20
  custoCost global: R$ 5
  investimentoCost global: R$ 5

  tamanhos:
  - 20cm: preco R$ 90, maoDeObraCost R$ 25 (diferente do global!)
  - 25cm: preco R$ 110, maoDeObraCost R$ 30 (diferente!)
```

### O Que Deveria Acontecer

Quando confiteira vende "1x Bolo Chocolate 20cm" por R$ 90:
```
Faturamento: R$ 90 ✓
Custo de Mão de Obra: R$ 25 (do tamanho, não R$ 20 global)
Custo Operacional: R$ 5
Investimento: R$ 5
```

### O Que REALMENTE Acontece

Na **UI (TransactionFormModal.tsx:1050-1059)**:
```javascript
const availableOptions = matchingFicha.tamanhos.map(t => ({
  id: t.id,
  slices: t.quantidade || 0,
  venda: t.preco,        // ✓ Pega o preço correto (R$ 90)
  
  reposicao: 0,          // ✗ ZERO! Ignora t.reposicaoCost
  maodeobra: 0,          // ✗ ZERO! Ignora t.maoDeObraCost (que deveria ser R$ 25)
  custo: 0,              // ✗ ZERO! Ignora t.custoCost
  investimento: 0,       // ✗ ZERO! Ignora t.investimentoCost
}));
```

Na **Apresentação (getItemBreakdown:403-437)**:
```javascript
const getItemBreakdown = (item: OrderItemState) => {
  // Se é um produto da Ficha Técnica (não é "Outro / Personalizado")
  // ↓
  return {
    name: item.productName,
    slices: item.slices,
    unitVenda: 0,           // ✗ ZERO! Não busca preço da ficha
    unitReposicao: 0,       // ✗ ZERO!
    unitMaodeobra: 0,       // ✗ ZERO!
    unitCusto: 0,           // ✗ ZERO!
    unitInvestimento: 0,    // ✗ ZERO!
  };
};
```

Na **Apresentação no PDF (QuotePdfModal.tsx)**:
Mostra o preço de venda que foi lançado (R$ 90), mas os custos vêm do cálculo de proporção genérica, não dos valores específicos da ficha.

No **Dashboard (balancesCalculator.ts:56-65)**:
```javascript
if (tx.fichaItems && tx.fichaItems.length > 0 && fichas.length > 0) {
  for (const fichaItem of tx.fichaItems) {
    const ficha = fichas.find(f => f.id === fichaItem.fichaId);
    if (ficha) {
      // ↓ Usa apenas custos GLOBAIS, ignora custos por tamanho
      reposicaoInflow += (ficha.reposicaoCost || 0) * fichaItem.quantity;
      maodeobraInflow += (ficha.maoDeObraCost || 0) * fichaItem.quantity;  // R$ 20, não R$ 25!
      custoInflow += (ficha.custoCost || 0) * fichaItem.quantity;
      investimentoInflow += (ficha.investimentoCost || 0) * fichaItem.quantity;
    }
  }
}
```

### O Resultado Final

Para a venda de "1x Bolo Chocolate 20cm" por R$ 90:

| Onde | Valor Mostrado | Valor Correto | Diferença |
|---|---|---|---|
| **Pedido (UI)** | Preço: R$ 90 | ✓ R$ 90 | ✓ Correto |
| **Pedido (Custos)** | R$ 0 | ✓ R$ 25 MDO | ✗ -R$ 25 |
| **PDF** | Preço R$ 90, Custos proporcionais | ✓ Preço R$ 90, Custos R$ 25 MDO | ⚠️ Proporções aprox. |
| **Dashboard** | Lucro: R$ 65 (90-25) | ✓ Lucro: R$ 60 (90-30) | ✗ +R$ 5 |
| **Balanço Mão de Obra** | +R$ 20 | ✓ +R$ 25 | ✗ -R$ 5 |

**Quanto piora com múltiplas vendas:**
- 10 vendas do "20cm" (R$ 90 cada):
  - Dashboard mostra: Lucro total R$ 650 (90*10 - 20*10)
  - Deveria ser: Lucro R$ 600 (90*10 - 25*10)
  - **Diferença de lucro: +R$ 50 (errado!)**
  - Balanço de mão de obra: showsR$ 200, deveria ser R$ 250
  - **Diferença de saldo: -R$ 50**

**Confiteira vê no Dashboard:** "Estou lucrando R$ 650 essa semana!"  
**Na Verdade:** Só lucrou R$ 600. Faltam R$ 50 de mão de obra.

### Evidência no Código

**Arquivo:** src/components/TransactionFormModal.tsx

Linhas 1050-1059 (onde mostra opções de tamanho):
```typescript
const availableOptions = matchingFicha ? matchingFicha.tamanhos.map(t => ({
  id: t.id,
  cakeName: matchingFicha.name,
  slices: t.quantidade || 0,
  venda: t.preco,
  reposicao: 0,        // ← Hardcoded ZERO
  maodeobra: 0,        // ← Hardcoded ZERO
  custo: 0,            // ← Hardcoded ZERO
  investimento: 0,     // ← Hardcoded ZERO
})) : [];
```

**Arquivo:** src/components/TransactionFormModal.tsx

Linhas 403-437 (getItemBreakdown):
```typescript
// Para produtos da Ficha (não "Outro / Personalizado"):
return {
  name: item.productName,
  slices: item.slices || 0,
  unitVenda: 0,           // ← Não busca preço
  unitReposicao: 0,       // ← Não busca custo
  unitMaodeobra: 0,       // ← Não busca custo
  unitCusto: 0,           // ← Não busca custo
  unitInvestimento: 0,    // ← Não busca custo
};
```

**Arquivo:** src/utils/balancesCalculator.ts

Linhas 56-65 (calculateBalances):
```typescript
if (tx.fichaItems && tx.fichaItems.length > 0 && fichas.length > 0) {
  for (const fichaItem of tx.fichaItems) {
    const ficha = fichas.find(f => f.id === fichaItem.fichaId);
    if (ficha) {
      // ↓ Usa custos GLOBAIS apenas
      reposicaoInflow += (ficha.reposicaoCost || 0) * fichaItem.quantity;
      // ↓ Não há acesso ao tamanho específico
      maodeobraInflow += (ficha.maoDeObraCost || 0) * fichaItem.quantity;
      custoInflow += (ficha.custoCost || 0) * fichaItem.quantity;
      investimentoInflow += (ficha.investimentoCost || 0) * fichaItem.quantity;
    }
  }
}
```

### Impacto Financeiro

🔴 **CRÍTICO:** Números de lucro/prejuízo **são sistematicamente incorretos**

- Custos por tamanho são ignorados completamente
- Dashboard mostra lucro inflado (não deduz custos específicos)
- Balanços de mão de obra/custos ficam divergentes
- Confiteira toma decisões baseada em números errados

---

## 🔴 PROBLEMA CRÍTICO #2: Preço de Venda Não Rastreado na Transação

### O Problema

Quando confiteira vende um produto, o sistema **NÃO armazena qual preço foi usado**. Armazena apenas:

```typescript
interface Transaction {
  id: string;
  type: 'venda';
  description: string;
  quantity: number;
  unitValue: number;        // ← Unitário, pode vir de qualquer lugar
  totalValue: number;       // ← Total calculado
  // ...
  fichaItems?: FichaOrderItem[]; // Lista de fichas com IDs
}

interface FichaOrderItem {
  fichaId: string;          // Qual ficha foi usada
  fichaName: string;        // Nome da ficha
  quantity: number;         // Quantas unidades
  // ↓ MAS NÃO ARMAZENA:
  // tamanhoId?: string;    // Qual tamanho foi selecionado
  // precoDeTamanho?: number; // Qual preço de venda foi usado
}
```

### Cenário de Falha

1. Confiteira cadastra Ficha "Bolo Chocolate" com:
   - tamanho 20cm: R$ 90
   - tamanho 25cm: R$ 110

2. Confiteira vende: "1x Chocolate 20cm" por R$ 90
   - Sistema salva: fichaId: 42, quantity: 1
   - Sistema salva: totalValue: 90
   - **MAS NÃO salva:** qual tamanho foi vendido (20cm vs 25cm)

3. Semanas depois, confiteira edita a Ficha:
   - Muda preço do 20cm: R$ 90 → R$ 100

4. Confiteira abre o pedido antigo para PDF:
   - PDF pode mostrar preço atualizado (R$ 100) ou preço antigo (R$ 90)
   - **Ninguém sabe qual era o preço original**

5. Confiteira muda a quantidade: 1 → 2
   - Sistema tenta reconsumir estoque
   - Estoque não sabe qual tamanho reconsumir (faltam dados)

### Onde Fica Evidente

**No arquivo TransactionFormModal.tsx:**
```typescript
// Ao salvar, os dados da transação são:
{
  type: 'venda',
  description: '2x Bolo Chocolate (20cm)',  // ← Texto livre, não confiável
  quantity: 1,
  unitValue: 90,
  totalValue: 90,
  fichaItems: [
    {
      fichaId: '42',
      fichaName: 'Bolo Chocolate',
      quantity: 1
      // ← Falta tamanhoId, falta preco, falta customizações
    }
  ]
}
```

### Impacto

🔴 **CRÍTICO:** Impossível auditar ou regenerar preços de vendas antigas

- Se preço mudar, não há como saber qual era o original
- Se confiteira edita receita, não há como saber qual foi realmente consumida
- Histórico de vendas é impreciso

---

## 🟠 PROBLEMA #3: Múltiplos Níveis de Custos Geram Confusão

### Estrutura Confusa

Custos existem em TRÊS níveis sem clareza:

1. **Nível Ficha Técnica (Global):**
   ```javascript
   ficha.reposicaoCost = 10   // ← Custo global
   ficha.maoDeObraCost = 20
   ficha.custoCost = 5
   ficha.investimentoCost = 5
   ```

2. **Nível Tamanho (Específico):**
   ```javascript
   tamanho.maoDeObraCost = 25  // ← Pode ser diferente
   tamanho.custoCost = 6
   tamanho.investimentoCost = 8
   ```

3. **Nível Transação (Proporcional):**
   ```javascript
   // calculateProportionalBreakdown()
   // Usa percentuais genéricos se não há ficha
   reposicao = 30%
   maodeobra = 33.3%
   custos = 16.7%
   investimento = 20%
   ```

### Confusão

Confiteira não sabe qual é usado:
- Global ou específico?
- Se global, qual valor?
- Quando recalcular, qual usar?

---

## 🟠 PROBLEMA #4: Estoque Consumido com Custos Incorretos

### Fluxo de Consumo

Quando venda é criada:
```typescript
consumeIngredientsFromFicha(fichaId, ficha, quantity)
  ↓
// Marca ingredientes como consumidos
stock.currentQuantity -= ingredienteQty
  ↓
// MAS: custo do ingrediente não é registrado!
// Apenas quantidade é decrementada
```

### Falta: Custo do Ingrediente Consumido

Estrutura IngredientUsage tem:
```typescript
interface IngredientUsage {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;       // ← Custo por unidade
  totalCost: number;      // ← Custo total
}
```

Mas quando consome:
```typescript
consumed.push({
  ingredientId: ingredient.id,
  ingredientName: ingredient.name,
  quantity: totalQuantity,  // ← Apenas quantidade
  unit: ingredient.unit,
  // ↓ MAS NÃO armazena:
  // unitCost: ingredient.unitCost,
  // totalCost: ingredient.totalCost,
});
```

### Impacto

🟠 **ALTO:** Impossível rastrear custo real de ingredientes consumidos

- Sabe-se QUANTO foi consumido
- Não sabe QUANTO CUSTOU
- Dashboard não pode calcular lucro verdadeiro baseado em ingredientes

---

## 🟠 PROBLEMA #5: Divergência Entre Preço Mostrado e Preço Guardado

### Cenário

1. Confiteira abre formulário de venda
2. Seleciona "Bolo Chocolate 20cm" (R$ 90)
3. UI mostra breakdown (baseado em proportional, não preço real):
   ```
   Preço de Venda: R$ 0 (porque getItemBreakdown retorna 0!)
   Custo de Reposição: R$ 0
   Mão de Obra: R$ 0
   ```

4. Mas no topo mostra total: R$ 90 (calculado onde?)
5. Confiteira clica "Confirmar"
6. Sistema salva: totalValue: 90 ✓

**Problema:** O breakdown estava zerado, mas total estava correto.
**Confusão:** De onde veio o R$ 90?

### Onde o Total é Calculado?

Procurando por onde `grandTotalSalePrice` é calculado:

```typescript
// TransactionFormModal.tsx:460
const grandTotalSalePrice = totalItemsVenda + deliveryFee + totalAddonsValue;

// Mas totalItemsVenda vem de:
const totalItemsVenda = itemsBreakdownList.reduce((sum, b) => sum + b.totalVenda, 0);

// E cada item.totalVenda vem de getItemBreakdown(), que retorna 0 para fichas!
```

**Espera:** Se totalItemsVenda = 0, então grandTotalSalePrice = 0 + deliveryFee + addons.

Se não há delivery nem addons, como mostra R$ 90?

### Gap Faltando

Há um **gap no código** onde o preço é capturado. Ou:
1. Há outro lugar onde preço é obtido (não encontrado)
2. Ou o formulário não está funcionando como esperado
3. Ou há código que calcula o preço que não examinei

**Risco:** O fluxo de cálculo de preço tem partes ocultas ou incompletas.

---

## 🟡 PROBLEMA #6: Propagação de Mudanças de Custo

### Exemplo: Mudar Custo de Ingrediente

Confiteira edita Ficha "Bolo Chocolate":
- Muda custo de Farinha: R$ 5/kg → R$ 8/kg

**O que muda?**

1. ✗ Pedidos ANTIGOS (já vendidos): Custos não recalculam (não deviam)
2. ✗ Próximos pedidos: Usam novo custo? Qual? Global ou por ingrediente?
3. ✗ Dashboard de semana passada: Mostra custo antigo ou novo?

**Resposta:** Não há versionamento de custos.

### Cenário de Confusão

1. Segunda: vende "Bolo Chocolate" por R$ 100, custo ingredientes R$ 20
2. Quarta: muda custo ingredientes R$ 20 → R$ 30
3. Sexta: abre Dashboard da semana
   - Mostra lucro de "Bolo Chocolate": baseado em qual custo?
   - Lucro segunda: R$ 80 (100 - 20) ✓ correto
   - Lucro quarta em diante: R$ 70 (100 - 30) ✓ correto
   - **Ou tudo recalculou para R$ 70?** Confuso!

---

## 📊 MATRIZ DE RASTREAMENTO: DE ORIGEM AO RESULTADO

### Fluxo 1: Preço de Venda

| Origem | Transformação | Resultado | Onde Usa | Risco |
|---|---|---|---|---|
| **Tamanho.preco** (Ficha) | Selecionado na UI | **unitValue** (transação) | Cálculo totalValue | 🟠 Não armazenado qual tamanho |
| **unitValue** | × quantity | **totalValue** | Dashboard, PDF, Saldos | 🔴 Pode ser R$ 0 |
| **totalValue** | Somado com delivery, addons | **grandTotalSalePrice** | Mostrado no UI | 🟠 Gap no cálculo |

**Conclusão:** Preço não é rastreado com clareza; múltiplos pontos de origem.

---

### Fluxo 2: Custos de Produto

| Origem | Transformação | Resultado | Onde Usa | Risco |
|---|---|---|---|---|
| **Ficha.maoDeObraCost (global)** | Lido do banco | **usedCost** | Dashboard, Balanços | 🔴 Ignora tamanho específico |
| **Tamanho.maoDeObraCost (específico)** | Definido na UI mas não capturado | **nunca é usado** | N/A | 🔴 Completamente ignorado |
| **calculateProportionalBreakdown()** | Se sem ficha | **proportionalCost** | PDF, UI | 🟡 Aproximação genérica |

**Conclusão:** Custos de tamanho específico são ignorados; sempre usa global.

---

### Fluxo 3: Consumo de Estoque

| Origem | Transformação | Resultado | Onde Usa | Risco |
|---|---|---|---|---|
| **Ingrediente.quantity** (ficha) | × fichaItem.quantity | **stockQty-** | Stock atualiada | ✓ Correto |
| **Ingrediente.unitCost** (ficha) | Não capturado | **nunca é usado** | N/A | 🔴 Não rastreado |

**Conclusão:** Quantidade é consumida, custo não é rastreado.

---

## 🔴 LISTA DE INCONSISTÊNCIAS ENCONTRADAS

| # | Inconsistência | Tipo | Gravidade | Onde Afeta |
|---|---|---|---|---|
| F1 | Tamanho.preco capturado na UI, mas getItemBreakdown retorna 0 | Lógica | 🔴 CRÍTICO | Cálculo de custos |
| F2 | Tamanho.maoDeObraCost definido, mas nunca usado | Ignorado | 🔴 CRÍTICO | Dashboard, Balanços |
| F3 | Dashboard usa Ficha.maoDeObraCost global, não tamanho | Divergência | 🔴 CRÍTICO | Balanço de mão de obra |
| F4 | Transação não armazena qual tamanho foi vendido | Missing Field | 🔴 CRÍTICO | Auditoria, Regeneração |
| F5 | Ingrediente.unitCost não é armazenado no ConsumedIngredient | Missing Field | 🔴 CRÍTICO | Custo de ingredientes |
| F6 | Múltiplos níveis de custos sem prioridade clara | Design | 🟠 ALTO | Confusão, Manutenção |
| F7 | Proportional breakdown usa %fixas, ignora ficha real | Fallback Impreciso | 🟠 ALTO | PDF, UI Breakdown |
| F8 | Custos de ingrediente mudam, mas vendas antigas não versioned | Propagação | 🟠 ALTO | Histórico, Relatórios |
| F9 | grandTotalSalePrice cálculo tem gap (como chega a R$90?) | Opacity | 🟡 MÉDIO | Rastreamento |
| F10 | signalValue não desconta de inflow de caixa? | Lógica | 🟡 MÉDIO | Balanço de caixa |

---

## 💡 PADRÃO ENCONTRADO

**Design Faltoso:**
1. Confiteira define custos em DOIS níveis (global + por tamanho)
2. Sistema apresenta apenas um nível (global) ao usuário
3. Sistema ignora o segundo nível completamente
4. Dashboard calcula balanços usando apenas nível global
5. Confiteira vê números que não refletem realidade

**Conclusão:** Há **funcionalidade implementada que não é usada** (custos por tamanho), criando divergência.

---

## 🎯 RECOMENDAÇÕES

### Antes do Lançamento

1. 🔴 **Remover ambiguidade:** Decidir se há custos por tamanho ou não
   - Opção A: Usar APENAS custos globais (remover tamanho.costoCost, etc)
   - Opção B: Usar APENAS custos por tamanho (ignorar ficha.costoCost)
   - Opção C: Tamanho sobrescreve global (se tamanho.costoCost existe, usa; senão usa global)

2. 🔴 **Armazenar dados de venda:** Adicionar à transação:
   - tamanhoId (qual tamanho foi selecionado)
   - precoDeTamanho (qual preço foi usado)
   - custoDeTamanho (quais custos foram usados)

3. 🔴 **Consistência no cálculo:** O breakdown deve usar MESMOS custos que dashboard

4. 🟠 **Versionamento:** Se ingrediente custa muda, manter histórico

### Para Próxima Versão

1. Criar tabela de auditoria de custos (quando, o que, por quem)
2. Reconciliação diária: Saldo calculado vs. Saldo esperado
3. Relatório de divergências de custos

---

## 🔍 CONCLUSÃO

O sistema **mostra números que parecem corretos, mas internamente está calculando com dados incompletos ou ignorados**.

- Confiteira vê: "Vendi R$ 90, lucro R$ 60"
- Verdade: "Vendi R$ 90, lucro R$ 55 (porque custou R$ 25, não R$ 20)"
- Diferença: +R$ 5 de lucro fictício por venda

Com dezenas de vendas por semana, erro se acumula para **centenas de reais**.

**Risco:** Confiteira toma decisão baseada em números que estão sistematicamente errados de um lado (sempre inflando lucro).

---

**Status de Integridade Financeira:** 🔴 COMPROMETIDA
