# 🏠 TELA INÍCIO - Análise Bloco por Bloco

**Status:** 🔄 Análise Visual Em Progresso  
**Método:** Comparação lado-a-lado app vs guia

---

## BLOCOS DA PÁGINA INÍCIO

### BLOCO 1: HEADER + LOGO
```
┌─────────────────────────────────────┐
│  HEADER ROXO COM LOGO               │
│  - Carula CONFEITARIA               │
└─────────────────────────────────────┘
```

**Comparação:**
- [ ] Cor gradient roxo
- [ ] Altura do header
- [ ] Posição logo/texto
- [ ] Ícones (Profile, Mobile, Download)

---

### BLOCO 2: CARD OVERLAY + GAUGE PRINCIPAL
```
┌─────────────────────────────────────┐
│  SVG GAUGE 92px (LEFT)              │
│  └─ 59% margem                      │
│                                     │
│  COLUNA DIREITA:                    │
│  "Lucro Líquido do Mês"             │
│  "R$ 4.980,00"                      │
│  ✓ Badge "Positivo"                 │
└─────────────────────────────────────┘
```

**Verificar:**
- [ ] Gauge position (esquerda?)
- [ ] Tamanho gauge (92px?)
- [ ] Label + Valor tamanho/posição
- [ ] Badge positioning
- [ ] Border-radius do card

---

### BLOCO 3: 3 SUB-CARDS TRANSLÚCIDOS
```
┌──────────┬──────────┬──────────┐
│ Vendas   │ Saídas   │ A Receber│
│ Pagas    │          │          │
│ R$ 8.420 │ R$ 3.440 │ R$ 1.150 │
└──────────┴──────────┴──────────┘
```

**Verificar:**
- [ ] Número de colunas (3?)
- [ ] Espaçamento entre cards (gap)
- [ ] Background translúcido (rgba)
- [ ] Font sizes labels/valores
- [ ] Altura dos cards

---

### BLOCO 4: BOTÃO "VER DETALHAMENTO"
```
┌─────────────────────────────┐
│  VER DETALHAMENTO DAS VENDAS │
└─────────────────────────────┘
```

**Verificar:**
- [ ] Tamanho botão (full-width?)
- [ ] Cor (translúcido roxo?)
- [ ] Padding
- [ ] Texto/font

---

### BLOCO 5: BOTÃO COMANDA
```
┌────────────────────────────────┐
│ ● NOVA COMANDA    [+] Pedido ● │
│    + Lançar Pedido             │
└────────────────────────────────┘
```

**Verificar:**
- [ ] Notches circulares (left/right)
- [ ] Dashed line esquerda
- [ ] Gradiente roxo/rosa
- [ ] Seal quadrado rosa (top-right)
- [ ] Tamanho fonte "+ Lançar Pedido"
- [ ] SVG icon flutuando

---

### BLOCO 6: SEÇÃO "SALDOS & DIVISÃO DOS PEDIDOS"
```
┌────────────────────────────────────────┐
│ "Saldos & Divisão dos Pedidos"         │
│ "Entradas das vendas pagas − Compras..." │
└────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┐
│ 🔄 REPOSIÇÃO │ 🟣 MÃO OBRA  │ 📊 CUSTO+INV │
│    72%       │    48%       │    35%       │
│  R$ 1.240    │  R$ 860      │  R$ 620      │
│              │              │              │
│  [Gauge]     │  [Gauge]     │  [Gauge]     │
└──────────────┴──────────────┴──────────────┘
```

**Verificar:**
- [ ] Título + descrição (posição/tamanho)
- [ ] 3 cards (grid layout)
- [ ] **EMOJIS presentes?** 🔄 🟣 📊
- [ ] Label capitalization (REPOSIÇÃO vs Reposição?)
- [ ] Gauge SVG size (84px?)
- [ ] Porcentagem (72%, 48%, 35%)
- [ ] Valores (R$ X.XXX)
- [ ] Card padding/height
- [ ] Border-radius (22px vs 28px?)
- [ ] Card gap (12px vs 16px?)

---

### BLOCO 7: SEÇÃO "AGENDA DE PEDIDOS"
```
┌────────────────────────────────────┐
│ "Agenda de Pedidos"                │
│ AGOSTO (botões navegação)          │
├────────────────────────────────────┤
│ Dom Seg Ter Qua Qui Sex Sab        │
│  1   2   3   4   5   6   7   ...   │
│  8   9  10  11  12  13  14         │
│ ...                                │
└────────────────────────────────────┘
```

**Verificar:**
- [ ] Título "Agenda de Pedidos"
- [ ] Mês exibido (AGOSTO)
- [ ] Botões mês anterior/próximo
- [ ] Grid 7 colunas (Dom-Sab)
- [ ] Indicadores (Com Pedido / Livre / Hoje)
- [ ] Espaçamento entre dias
- [ ] Altura total do calendar

---

## 📝 GUIA DE ANÁLISE

**Para cada bloco, verificar:**

| Aspecto | Verificar |
|---------|-----------|
| **Layout** | Está no mesmo lugar? |
| **Tamanho** | Dimensões são iguais? |
| **Espaçamento** | Gap/padding similar? |
| **Cor** | RGB exato? |
| **Tipografia** | Font size, weight, family? |
| **Elementos** | Todos presentes? (ícones, badges, etc) |
| **Proporcionalidade** | Altura vs largura igual? |

---

## 🎯 PRÓXIMO PASSO

Vou navegar e fazer análise visual de cada bloco.  
**Você quer que eu:**

A) Comece pelo BLOCO 1 (Header) e vou indo?  
B) Analise TODOS de uma vez?  
C) Foque primeiro no BLOCO 6 (Saldos com emojis)?

Qual primeiro?

