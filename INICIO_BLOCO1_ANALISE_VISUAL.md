# 🏠 TELA INÍCIO - ANÁLISE BLOCO POR BLOCO

**Data:** 2026-08-13  
**Status:** ✅ Comparação Visual Lado-a-Lado  
**Método:** Leitura estrutural do app vs guia

---

## ✅ BLOCO 1: HEADER + LOGO

### APP ATUAL
```
[Header roxo]
├─ "Carula"
└─ "CONFEITARIA"
```

### GUIA DE REFERÊNCIA
```
[Header roxo - IDÊNTICO]
├─ "Carula"
└─ "CONFEITARIA"
```

### ✅ RESULTADO: CONFORME
- ✅ Layout
- ✅ Texto
- ✅ Cor
- ✅ Tipografia

**Status:** 🟢 BLOCO 1 OK - Nenhuma correção necessária

---

## ✅ BLOCO 2: CARD OVERLAY + GAUGE

### APP ATUAL
```
[Card overlay com gauge 92px à esquerda]
├─ Label: "Lucro Líquido do Mês (Rendimento)"
├─ Valor: "R$ 0,00"  ← (teste, dados vazio)
└─ Badge: "✓ Positivo"
```

### GUIA DE REFERÊNCIA
```
[Card overlay com gauge 92px à esquerda - IDÊNTICO]
├─ Label: "LUCRO LÍQUIDO DO MÊS (RENDIMENTO)"  ← UPPERCASE
├─ Valor: "R$ 4.980,00"  ← (dados diferentes)
└─ Badge: "Positivo"
```

### ⚠️ DIFERENÇAS ENCONTRADAS

#### 1. Label Capitalization
```
GUIA:      "LUCRO LÍQUIDO DO MÊS (RENDIMENTO)"  (UPPERCASE)
APP:       "Lucro Líquido do Mês (Rendimento)"  (Sentence Case)
```
**Severidade:** 🟡 Baixa  
**Ação:** Opcional (pode ser intencional)

#### 2. Badge Capitalization  
```
GUIA:      "Positivo"
APP:       "✓ Positivo"  ← APP tem checkmark
```
**Status:** Pequena diferença (apenas visual)

**Status:** 🟡 BLOCO 2 - Capitalization é diferente (baixa prioridade)

---

## ⚠️ BLOCO 3: 3 SUB-CARDS TRANSLÚCIDOS

### APP ATUAL
```
┌──────────────┬──────────────┬──────────────┐
│ Vendas Pagas │ Saídas       │ ⏳ A Receber │
│ R$ 0,00      │ R$ 0,00      │ R$ 0,00      │
└──────────────┴──────────────┴──────────────┘
```

### GUIA DE REFERÊNCIA
```
┌──────────────┬──────────────┬──────────────┐
│ VENDAS PAGAS │ SAÍDAS       │ ⏳ A RECEBER │
│ R$ 8.420     │ R$ 3.440     │ R$ 1.150     │
└──────────────┴──────────────┴──────────────┘
```

### ⚠️ DIFERENÇAS ENCONTRADAS

#### 1. Label Capitalization
```
GUIA:      "VENDAS PAGAS"  (UPPERCASE)
APP:       "Vendas Pagas"  (Sentence Case)

GUIA:      "SAÍDAS"        (UPPERCASE)
APP:       "Saídas"        (Sentence Case)

GUIA:      "⏳ A RECEBER"   (UPPERCASE)
APP:       "⏳ A Receber"   (Sentence Case)
```

**Severidade:** 🟡 Baixa (apenas visual)

**Status:** 🟡 BLOCO 3 - Capitalization diferente (baixa prioridade)

---

## ✅ BLOCO 4: BOTÃO "VER DETALHAMENTO"

### APP ATUAL
```
[Button: "Ver Detalhamento das Vendas"]
```

### GUIA DE REFERÊNCIA
```
[Button: "Ver Detalhamento das Vendas"]  ← IDÊNTICO
```

### ✅ RESULTADO: CONFORME

**Status:** 🟢 BLOCO 4 OK - Nenhuma correção necessária

---

## ✅ BLOCO 5: BOTÃO COMANDA

### APP ATUAL
```
┌────────────────────────────────┐
│ ● NOVA COMANDA    [+] Pedido ● │
│    + Lançar Pedido             │
└────────────────────────────────┘
```

### GUIA DE REFERÊNCIA
```
┌────────────────────────────────┐
│ ● NOVA COMANDA    [+] Pedido ● │
│    + Lançar Pedido             │
└────────────────────────────────┘
```

### ✅ RESULTADO: CONFORME
- ✅ Notches circulares
- ✅ Dashed line
- ✅ Gradiente
- ✅ Icon flutuante
- ✅ Sweep animation

**Status:** 🟢 BLOCO 5 OK - Nenhuma correção necessária

---

## 🔴 BLOCO 6: SEÇÃO "SALDOS & DIVISÃO DOS PEDIDOS" 

### APP ATUAL
```
[Heading: "Saldos & Divisão dos Pedidos"]
[Description: "Entradas das vendas pagas − Compras registradas"]

┌──────────────────┬──────────────────┬──────────────────┐
│ Reposição        │ Mão de Obra      │ Custo + Invest.  │
│ 72%              │ 48%              │ 35%              │
│ R$ 0,00          │ R$ 860,00        │ R$ 620,00        │
│ [Gauge SVG]      │ [Gauge SVG]      │ [Gauge SVG]      │
└──────────────────┴──────────────────┴──────────────────┘
```

### GUIA DE REFERÊNCIA
```
[Heading: "Saldos & Divisão dos Pedidos"]
[Description: "Entradas das vendas pagas − Compras registradas"]

┌──────────────────┬──────────────────┬──────────────────┐
│ 🔄 REPOSIÇÃO     │ 🟣 MÃO DE OBRA   │ 📊 CUSTO + INVEST│
│ 72%              │ 48%              │ 35%              │
│ R$ 1.240         │ R$ 860           │ R$ 620           │
│ [Gauge SVG]      │ [Gauge SVG]      │ [Gauge SVG]      │
└──────────────────┴──────────────────┴──────────────────┘
```

### 🔴 DIFERENÇAS CRÍTICAS ENCONTRADAS

#### 1. **EMOJIS FALTANDO** 🔴 CRÍTICO
```
GUIA:   🔄 REPOSIÇÃO          | 🟣 MÃO DE OBRA          | 📊 CUSTO + INVEST.
APP:    Reposição             | Mão de Obra             | Custo + Invest.
```

**Impacto:** Visualmente percebido (falta elemento gráfico importante)  
**Severidade:** 🔴 ALTA

#### 2. **CAPITALIZATION** 🟡 MÉDIA
```
GUIA:   "REPOSIÇÃO"           (UPPERCASE)
APP:    "Reposição"           (Sentence Case)
```

**Impacto:** Menos óbvio que os emojis  
**Severidade:** 🟡 MÉDIA

#### 3. **Border-Radius Cards** 🟡 MÉDIA
```
Medições da auditoria anterior:
GUIA:   28px (rounded-3xl)
APP:    22px (rounded-2xl)
```

**Impacto:** Cards parecem "menos arredondadas"  
**Severidade:** 🟡 MÉDIA

#### 4. **Grid Gap** 🟡 BAIXA
```
GUIA:   gap: 16px
APP:    gap-3: 12px
```

**Impacto:** Cards parecem ligeiramente mais perto  
**Severidade:** 🟡 BAIXA

**Status:** 🔴 BLOCO 6 - CRÍTICO: Faltam emojis + capitalization diferente

---

## ✅ BLOCO 7: SEÇÃO "AGENDA DE PEDIDOS"

### APP ATUAL
```
[Heading: "Agenda de Pedidos"]
[Month: "AGOSTO"]
[Calendar 7x5 grid]
```

### GUIA DE REFERÊNCIA
```
[Heading: "Agenda de Pedidos"]
[Month: "AGOSTO"]
[Calendar 7x5 grid]
```

### ✅ RESULTADO: CONFORME

**Status:** 🟢 BLOCO 7 OK - Nenhuma correção necessária

---

## 📊 RESUMO: TELA INÍCIO

| Bloco | Descrição | Status | Prioridade | Ação |
|-------|-----------|--------|-----------|------|
| 1 | Header + Logo | ✅ OK | - | Nenhuma |
| 2 | Card Overlay | 🟡 Labels UPPERCASE | 🟡 Baixa | Verificar se intencional |
| 3 | 3 Sub-cards | 🟡 Labels UPPERCASE | 🟡 Baixa | Verificar se intencional |
| 4 | Botão Detalhamento | ✅ OK | - | Nenhuma |
| 5 | Botão Comanda | ✅ OK | - | Nenhuma |
| **6** | **Saldos & Divisão** | 🔴 CRÍTICO | 🔴 ALTA | **Adicionar emojis + UPPERCASE** |
| 7 | Agenda de Pedidos | ✅ OK | - | Nenhuma |

---

## 🎯 AÇÕES RECOMENDADAS PARA TELA INÍCIO

### 🔴 CRÍTICA (Fazer agora)
- [ ] **BLOCO 6:** Adicionar emojis aos labels (🔄 🟣 📊)
- [ ] **BLOCO 6:** Capitalizar labels para UPPERCASE

### 🟡 MÉDIA (Considerar)
- [ ] **BLOCO 6:** Aumentar border-radius de 22px → 28px
- [ ] **BLOCO 6:** Aumentar gap de 12px → 16px

### 🟢 BAIXA (Opcional)
- [ ] **BLOCOS 2-3:** Verificar se labels UPPERCASE são intencionais

---

**Próximo:** Analisar TELA PEDIDOS bloco por bloco?

