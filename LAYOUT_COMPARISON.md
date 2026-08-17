# 📊 Comparação de Layout: Guia vs App Atual

**Data:** 2026-08-13  
**Status:** 🔄 Em Análise  
**Método:** Comparação visual tela por tela (layout, espaçamento, proporções)

---

## 📋 Estrutura de Análise

Para cada tela, vou verificar:
- ✅ Layout structure (grid, flex, posicionamento)
- ✅ Spacing (padding, margins, gaps)
- ✅ Card proportions (altura, largura)
- ✅ Element ordering (ordem dos componentes)
- ✅ Typography hierarchy (tamanhos, pesos)
- ✅ Visual hierarchy (destaque, profundidade)

---

## 🏠 INÍCIO (Dashboard)

### Guia de Referência
```
[Header roxo full-width com logo]
  └─ Gradient: roxo escuro → roxo médio → roxo claro
  └─ Logo + "Carula CONFEITARIA"
  
[Card overlay branco - sobreposto 30% do header]
  ├─ Gauge circular 92px (margem esquerda)
  ├─ Coluna direita: Label + Valor grande R$ X.XXX
  ├─ Submetrica: "Positivo" com badge
  ├─ Sub-cards translúcidos (3 cols): Vendas Pagas | Saídas | A Receber
  ├─ Botão "Ver Detalhamento"
  
[Button "Comanda" - Roxo Gradiente]
  ├─ Notches circulares left/right
  ├─ Dashed border esquerda
  ├─ Seal pink (R$) no canto superior direito
  ├─ Sweep animation ao hover
  
[Section "Saldos & Divisão dos Pedidos"]
  ├─ 3 Cards em grid (Reposição, MO, Custo+Inv)
  ├─ Ícones emoji + labels
  ├─ Gauge circular SVG em cada card
  
[Calendar "Agenda de Pedidos"]
  └─ Mês completo visível
```

### App Atual (localhost:3001)
```
[Header roxo - SIMILAR ✓]
  ├─ Logo + "CONFEITARIA" - OK
  └─ Gradient presente

[Card overlay - STRUCTURE OK ✓]
  ├─ Gauge + Valor - PRESENT
  ├─ Sub-cards translúcidos - PRESENT
  └─ Botão "Ver Detalhamento" - PRESENT

[Button Comanda - PRESENT ✓]
  ├─ Notches circulares - OK
  ├─ Sweep animation - OK
  └─ Visual structure OK

[Saldos Section - NEEDS CHECK]
  ├─ 3 cards grid - Present
  ├─ Labels - "Reposição", "Mão de Obra", "Custo + Invest." - OK
  └─ Gauge circles - Present

[Calendar - PRESENT]
  └─ Same layout
```

### ⚠️ Diferenças Potenciais (Início)
- [ ] Card overlay: distância/offset do header (verificar px)
- [ ] Spacing entre seções: gaps/margins
- [ ] Card props: altura dos 3 sub-cards translúcidos
- [ ] Saldos cards: padding interno, proporção

---

## 📦 PEDIDOS

### Guia de Referência
```
[Header: "Pedidos & Encomendas"]
[Stats cards - 3 colunas]
  ├─ 12 Pedidos | TOTAL EM VENDAS R$ 8.420
  ├─ ✓ VENDAS PAGAS 7.270 | 9 pedidos
  └─ ⏳ A RECEBER 1.150 | 3 pendentes

[Search + Filters section]
  ├─ Input: "Buscar por nome da cliente..."
  ├─ Segmented control: Todos (12) | Pagos (9) | Pendentes (3)

[Order tickets list]
  └─ Cada ticket:
      ├─ Left stripe: 6px roxo/bege
      ├─ Left notches: 2x circles 18px
      ├─ Card content: Nome cliente | Produtos | Valor
      ├─ Right notches: 2x circles 18px
      └─ Actions: Edit | Duplicate | Delete
```

### App Atual
- [ ] Verificar se stats cards têm mesmo layout/spacing
- [ ] Input search e segmented control - posicionamento
- [ ] Order ticket cards - stripe, notches, spacing

---

## 📋 FICHAS TÉCNICAS

### Guia de Referência
```
[Header: "Fichas Técnicas"]
[New Ficha button]
[List of recipes/fichas]
  └─ Cada ficha:
      ├─ Nome receita
      ├─ Foto
      ├─ Ingredientes collapsed/expandable
      ├─ Costs cards
      └─ Actions
```

### App Atual
- [ ] Verificar layout dos cards
- [ ] Verificar spacing entre seções
- [ ] Verificar proporções de cards

---

## 👥 CLIENTES

### Guia de Referência
```
[Header: "Clientes"]
[New Client button]
[Clients list with info cards]
  └─ Cards com nome, contato, total de pedidos
```

### App Atual
- [ ] Layout dos client cards
- [ ] Spacing/alignment
- [ ] Grid structure

---

## 📦 ESTOQUE

### Guia de Referência
```
[Header: "Estoque de Insumos"]
[New Item button]
[Stock items with 3D card effect]
  └─ Cards com foto, nome, quantidade, valor
```

### App Atual
- [ ] Verificar 3D effect (scale on hover)
- [ ] Card proportions
- [ ] Grid layout

---

## 💰 SALDOS

### Guia de Referência
```
[Header: "Saldos & Gastos"]
[Hero card com gauge]
[Balance cards - 3 categories]
[Expenses form]
[Expense list]
```

### App Atual
- [ ] Hero card layout/proportions
- [ ] Balance cards alignment
- [ ] Form layout
- [ ] List spacing

---

## 📝 PRÓXIMOS PASSOS

1. **Navegar screenshot por screenshot** nas duas versões
2. **Medir exatamente** (DevTools) as diferenças em:
   - Padding/margin dos cards
   - Gaps entre elementos
   - Font sizes (verificar se correspondem)
   - Heights (cards, buttons, inputs)
3. **Documentar mudanças necessárias**
4. **Priorizar por impacto visual**

---

**Status:** Aguardando análise visual detalhada
