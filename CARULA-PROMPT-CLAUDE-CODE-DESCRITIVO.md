# CARULA REDESIGN — PROMPT PARA CLAUDE CODE
## DESCRIÇÃO VISUAL COMPLETA (SEM IMAGENS)

---

## LAYOUT & ESTRUTURA

### Tela Principal (Dashboard/Início)

**Header**
- Fundo: gradiente marca `linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)`
- Altura: 64px
- Centralizado: Logo "Carula" em Instrument Serif 26px branco/rosa claro
- Esquerda: Avatar 36px clicável
- Direita: Ícone de versão + download

**Card Principal (Grande, no topo)**
- Fundo: gradiente marca (mesmo do header)
- Border-radius: 26px
- Padding: 22px
- Sombra: `0 8px 20px rgba(58,35,80,.09)`
- Conteúdo:
  - Título "LUCRO LÍQUIDO DO MÊS (RENDIMENTO)" em Manrope 9px uppercase, branco/rosa
  - Valor grande "R$ 4.980,00" em Manrope 800 weight, 42px, rosa (#F5B9C6)
  - Seal pequena "Positivo" em verde (#A9D8B8) com border-radius 999px
  - Texto descritivo: "Resultado excelente! Suas vendas superaram todas as despesas..."
  - 3 cards menores em linha:
    - "VENDAS PAGAS: R$ 8.420" (Manrope 800, 18px)
    - "SALDOS: R$ 3.440" (idem)
    - "A RECEBER: R$ 1.150" (idem)
  - Botão "Ver Detalhamento das Vendas" (border roxo #3A2350, texto roxo, radius 14px)

**Card "Nova Comanda"**
- Fundo: gradiente marca
- Forma especial: botão com recortes circulares de 18px nos lados esquerdo/direito
- Texto: "+ Lançar Pedido" em Instrument Serif 32px branco
- Ícone: "+" em rosa (#F5B9C6) à direita, 44px
- Bordo pontilhado interno: `2px dashed rgba(255,255,255,.3)`
- Selo rosa flutuante no canto superior direito (animação `carFloat` 4.5s)
- Hover: sobe -3px em 0.22s

---

### Bottom Navigation (Mobile)

**5 itens em linha horizontal:**
1. "Início" - ícone casinha
2. "Pedidos" - ícone comanda
3. "Fichas" - ícone receita
4. "Estoque" - ícone caixa
5. "Clientes" - ícone pessoa

**Estado ativo:**
- Item "Início" com fundo gradiente rosa (#F5B9C6 a #C4626F)
- Rótulo em roxo (#3A2350)
- Radius 14px
- Sobe -4px em hover com transição 0.25s

**Estado hover:**
- Itens não-ativos sobem -4px
- Fundo clareia para rgba(58,35,80,.06)

---

## CORES USADAS

### Roxos (Marca)
- #3A2350 - Brand 900 (headers, botões principal)
- #6E3F72 - Brand 700 (ícones, midtones do gradiente)
- #A85E86 - Brand 500 (acentos, fim do gradiente)

### Roses/Pinks
- #F5B9C6 - Rose 200 (texto sobre roxo, selos claros)
- #C4626F - Rose 600 (alertas, negativos)

### Neutros
- #241B2B - Ink (títulos)
- #7A6E80 - Ink Soft (texto secundário)
- #5A4E46 - Gray médio (descrições)
- #F6F2F5 - Surface (fundo da app)
- #FFFFFF - Card (cards e painéis)

### Accent
- #A9D8B8 - Mint (positivo, pago) - usado no seal "Positivo"
- #E4D9C3 - Sand (pendente)

---

## TIPOGRAFIA

### Instrument Serif (Serifa elegante)
- Arquivo: Google Fonts
- Uso:
  - Títulos de tela (28–30px)
  - Logo/marca (26–32px)
  - Títulos de cards (19–24px)
  - Sempre weight regular (não bold)

### Manrope (Sans moderna)
- Arquivo: Google Fonts
- Pesos: 400, 600, 700, 800
- Uso:
  - Valores monetários: weight 800, size 18–42px
  - Rótulos: weight 800, size 9–11px, letter-spacing 0.05em, uppercase
  - Descrições: weight 400–600, size 11–13px, line-height 1.5–1.6

---

## ANIMAÇÕES & TRANSIÇÕES

### Hover Padrão
**Cards**: translateY(-5px), duração 0.28s, sombra dobra
**Botões**: translateY(-3px), duração 0.22s
**Nav items**: translateY(-4px), duração 0.25s
**List items**: translateX(+3px), duração 0.25s

### Keyframes Contínuas

**carFloat** (Selo rosa flutuante no botão "Lançar Pedido")
```
0%, 100%: translateY(0)
50%: translateY(-6px)
Duration: 4.5s, infinite, ease-in-out
```

**carGlow** (Halo pulsante no card de lucro)
```
0%, 100%: opacity 0.45, scale 1
50%: opacity 0.8, scale 1.06
Duration: 6s, infinite, ease-in-out
```

**carSweep** (Brilho varrendo o botão de comanda)
```
0%: translateX(-120%)
60%, 100%: translateX(220%)
Duration: 5s, infinite, ease-in-out
```

---

## COMPONENTES DETALHADOS

### Card
```
background: #FFFFFF
border-radius: 22px–26px
box-shadow: 0 8px 20px rgba(58,35,80,.09)
padding: 18px–22px
transition: all 0.28s ease

Hover:
  transform: translateY(-5px)
  box-shadow: 0 20px 36px rgba(58,35,80,.18)
```

### Botão Principal (Padrão)
```
background: #3A2350
color: #F5B9C6
border-radius: 14px
padding: 12px 16px
font-weight: 800 (Manrope)
font-size: 12px
box-shadow: 0 10px 20px rgba(58,35,80,.3)
transition: all 0.22s ease

Hover:
  transform: translateY(-3px)
```

### Botão "Lançar Pedido" (Premium)
```
background: linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)
color: #F5B9C6
border-radius: 16px
padding: 12px 20px
border: 2px dashed rgba(255,255,255,.3)
font-family: Instrument Serif
font-size: 32px

Detalhe visual: 2 círculos de 18px (#F6F2F5) nos lados (efeito de recorte)
Selo rosa flutuante no canto superior direito (animação carFloat)
```

### Selo / Pílula
```
display: inline-block
padding: 5px 10px
border-radius: 999px
font-size: 9–10px
font-weight: 800 (Manrope)
white-space: nowrap
letter-spacing: 0.04em

Variações por status:
  .positive: bg #A9D8B8, text #2B2420 (verde claro com texto escuro)
  .pending: bg #E4D9C3, text #5A4E46 (bege claro com texto escuro)
  .alert: bg #F5B9C6, text #3A2350 (rosa claro com roxo)
  .category: bg #F3E9F3, text #6E3F72 (lavanda com roxo)
```

### Medidor SVG (Circular Progress)
```
stroke-linecap: round
stroke-width: 10px
stroke (trilho/background): #F1ECF2

Segmentos com cores diferentes conforme o tipo:
  Estoque baixo: vermelho/rosa #C4626F
  Normal: roxo #6E3F72
  Positivo: verde #A9D8B8

Valor no centro em Manrope 800, size variável conforme contexto
```

### Bottom Nav Item
```
.nav-item {
  padding: 8px 12px
  border-radius: 14px
  transition: all 0.25s ease
  font-size: 11px
  font-weight: 800 (Manrope)
}

.nav-item.active {
  background: linear-gradient(120deg, #F5B9C6, #C4626F)
  color: #3A2350
  transform: translateY(-4px)
}

.nav-item:not(.active):hover {
  transform: translateY(-4px)
  background: rgba(58,35,80,.06)
}
```

---

## ESPAÇAMENTO PADRÃO

```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 20px
xxl: 22px
xxxl: 26px–30px
```

Cards internos: gap 12px–14px entre elementos
Cards ao vivo: gap 14px–20px

---

## SOMBRAS PADRÃO

```
box-shadow: 0 8px 20px rgba(58,35,80,.09)        // padrão
box-shadow: 0 20px 36px rgba(58,35,80,.18)       // hover
box-shadow: 0 10px 20px rgba(58,35,80,.3)        // botão
box-shadow: 0 2px 6px rgba(58,35,80,.16)         // sutil
```

---

## RESPONSIVIDADE

### Mobile (< 1024px)
- Bottom nav fixa na base
- Cards full-width com padding 12px–16px
- Stack vertical
- Header sticky no topo

### Desktop (≥ 1024px)
- Sidebar fixa esquerda (236px, mesmo gradiente marca)
- Header top com espaço pra ações
- Layout em grid/flex
- Nav items transformam em coluna vertical

---

## ALERTAS E ESTADOS ESPECIAIS

### Estoque Baixo / Saldo Negativo
- Não pisca nem pulsa
- Exibir como **selo estático** em #C4626F (rose 600)
- Manrope 800, 11px
- Sem animação

### Valores Positivos
- Seal verde #A9D8B8
- Manrope 800, 10px

### Datas e Pendentes
- Seal bege #E4D9C3
- Texto #5A4E46

---

## ORDEM SUGERIDA DE IMPLEMENTAÇÃO

1. **Tokens CSS**: cores, fontes, keyframes, sombras
2. **Header & Bottom Nav**: aparecem em todas as telas
3. **Dashboard Principal**: card de lucro, cards de valores, botão comanda
4. **Outros módulos**: pedidos, fichas, estoque, clientes, saldos
5. **Layout Responsivo**: aplicar media queries para desktop/mobile

---

## INSTRUÇÕES FINAIS

✅ Usar **exatamente** as cores hex listadas acima
✅ Usar **Google Fonts** para Instrument Serif e Manrope
✅ Implementar **todas as animações** com os valores de duração corretos
✅ Testar em **mobile** (< 1024px) e **desktop** (≥ 1024px)
✅ Nenhum handler, rota ou lógica de negócio muda — apenas UI/visual
✅ Verificar **hover states** de todos os componentes interativos
