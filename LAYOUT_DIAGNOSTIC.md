# 🔍 DIAGNÓSTICO COMPLETO: Layout Guia vs App Atual

**Data:** 2026-08-13  
**Método:** Comparação visual tela-por-tela + análise de elemento estruturais  
**Status:** ⏳ Em Progresso (Tela por tela)

---

## 📌 ACHADO IMPORTANTE

O arquivo de referência (`Carula final.html`) contém:
- **Mockups visuais** de 3 variações de design para cada tela
- **Mesma estrutura de dados** que o app atual (provavelmente export ou design system docs)
- **Múltiplas direções** (2a, 2b, 2c) para Início, Pedidos, Estoque, etc.

O app atual implementa **uma das variações**. Preciso identificar qual e o que falta.

---

## 🏠 TELA: INÍCIO

### Variações no Guia
- **2a, 2b, 2c** - Três direções de design para a mesma tela

### Estrutura Esperada (Guia)
```
┌─────────────────────────────────────┐
│  HEADER ROXO GRADIENTE              │  ← Gradient: roxo-escuro → roxo-claro
├─────────────────────────────────────┤
│  CARD OVERLAY (branco)              │  ← Sobreposto ~30% do header
│  ├─ SVG Gauge: 92px circular        │  ← À esquerda
│  ├─ Label + Valor grande            │  ← Direita (R$ X.XXX)
│  ├─ 3 Sub-cards translúcidos        │  ← [Vendas] [Saídas] [A Receber]
│  └─ Botão "Ver Detalhamento"        │
├─────────────────────────────────────┤
│  BUTTON COMANDA (Roxo Gradiente)    │  ← Notches left/right + Dashed line
├─────────────────────────────────────┤
│  SEÇÃO "Saldos & Divisão"           │
│  ├─ Título + Descrição              │
│  ├─ 3 Cards grid                    │  ← [Reposição] [MO] [Custo+Inv]
│  │  ├─ Gauge SVG circular           │  
│  │  ├─ Label + emoji                │  
│  │  └─ Valor principal              │
└─────────────────────────────────────┘
│  SEÇÃO "Agenda de Pedidos"          │
│  └─ Calendar full-month             │
└─────────────────────────────────────┘
```

### App Atual (localhost:3001)
```
✅ HEADER - Present e correto
✅ CARD OVERLAY - Structure OK
✅ GAUGE + VALOR - Present
✅ 3 SUB-CARDS - Present
✅ BUTTON COMANDA - Present com notches e sweep
✅ SALDOS SECTION - Present com 3 cards
✅ GAUGE CIRCLES - Present em cada card
✅ CALENDAR - Present
```

### ⚠️ Diferenças Potenciais (Início)
- **Labels com emojis?** 
  - Guia: "🔄 REPOSIÇÃO", "🟣 MÃO DE OBRA", "📊 CUSTO + INVEST."
  - App: "Reposição", "Mão de Obra", "Custo + Invest."
  - ❓ **Emoji missing no app?**

- **Spacing/Padding** - Precisa de medição exata com DevTools
- **Card heights** - Precisa verificar proporções
- **Font sizes** - Títulos, labels, valores - devem ser iguais

---

## 📦 TELA: PEDIDOS

### Estrutura Esperada (Guia)
```
┌────────────────────────────────────┐
│ HEADER: "Pedidos & Encomendas"     │
├────────────────────────────────────┤
│ STATS - 3 Cards                    │
│  ├─ 12 Pedidos | TOTAL: R$ 8.420  │
│  ├─ ✓ VENDAS PAGAS: R$ 7.270      │
│  └─ ⏳ A RECEBER: R$ 1.150         │
├────────────────────────────────────┤
│ SEARCH + FILTERS                   │
│  ├─ Input: "Buscar por..."         │
│  └─ Segmented: [Todos] [Pagos] [Pendentes]
├────────────────────────────────────┤
│ ORDER LIST                         │
│  ├─ Stripe left (6px)              │
│  ├─ Notches left/right (circles)   │
│  ├─ Content: Client | Products | R$│
│  └─ Actions: Edit | Duplicate | Delete
```

### App Atual
- ✅ Mesma estrutura?
- ❓ Stats cards - layout identico?
- ❓ Order ticket cards - notches presentes?
- ❓ Search + filter - mesmo layout?

---

## 📋 TELA: FICHAS TÉCNICAS

### Estrutura Esperada
```
┌────────────────────────────────────┐
│ HEADER: "Fichas Técnicas"          │
├────────────────────────────────────┤
│ BUTTON: "Nova Ficha"               │
├────────────────────────────────────┤
│ RECIPE CARDS GRID                  │
│  └─ Cada ficha:
│     ├─ Foto
│     ├─ Nome receita
│     ├─ Tamanho/Rendimento
│     ├─ Cost breakdown (Reposição | MO | Custos)
│     ├─ "Ver Insumos" button
│     └─ Actions: Edit | Duplicate | Delete
```

### App Atual
- ❓ Card layout
- ❓ Cost breakdown positioning
- ❓ Button positioning

---

## 👥 TELA: CLIENTES

### App Atual
- ❓ Verificar layout dos client cards

---

## 📦 TELA: ESTOQUE

### Estrutura Esperada (com Gauge)
```
STOCK ITEM:
├─ SVG Gauge arc (esquerda)
├─ Nome insumo
├─ Quantidade + Unidade
├─ Alerta threshold
└─ "3D card" effect on hover
```

### App Atual
- ✅ 3D card effect?
- ❓ Gauge arc positioning?

---

## 💰 TELA: SALDOS

### App Atual
- ❓ Hero card layout
- ❓ Balance cards
- ❓ Expense form
- ❓ Expense list

---

## 🎯 CHECKLIST: O QUE VERIFICAR AGORA

### PRÓXIMA AÇÃO: Comparação Visual Lado-a-Lado

Preciso fazer **screenshot side-by-side** de:
1. ✅ Início (app) vs Início (guia 2a/2b/2c)
2. ✅ Pedidos (app) vs Pedidos (guia 5a/5b/5c)
3. ✅ Fichas (app) vs Fichas (guia)
4. ✅ Estoque (app) vs Estoque (guia)
5. ✅ Clientes (app) vs Clientes (guia)
6. ✅ Saldos (app) vs Saldos (guia)

**Diferenças a procurar:**
- ✏️ Spacing (padding, margins, gaps)
- ✏️ Card heights/widths
- ✏️ Font sizes & weights
- ✏️ Element positioning
- ✏️ Icon/emoji presence
- ✏️ Color exactness
- ✏️ Label capitalization

---

## 🔄 STATUS

- [x] Arquivo de referência aberto
- [x] App atual aberto
- [ ] Screenshots comparativos (tela por tela)
- [ ] Medições exatas (DevTools)
- [ ] Lista final de diferenças
- [ ] Priorização de correções

**Aguardando próxima fase:** Análise visual com screenshots lado-a-lado

