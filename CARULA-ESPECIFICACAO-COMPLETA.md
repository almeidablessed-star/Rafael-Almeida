# CARULA REDESIGN — ESPECIFICAÇÃO VISUAL

## 1. PALETA DE CORES

### Marca (Gradiente)
- **Gradiente Principal**: `linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)`
- **Brand 900**: `#3A2350` → Cabeçalhos, sidebar, ação principal, aba ativa
- **Brand 700**: `#6E3F72` → Meio do degradê, ícones, rótulos fortes
- **Brand 500**: `#A85E86` → Fim do degradê, acentos

### Neutrals
- **Ink**: `#241B2B` → Títulos e valores
- **Ink Soft**: `#7A6E80` → Texto secundário
- **Text Secondary**: `#5A4E46` → Descrições, helper text

### Surface
- **Card**: `#FFFFFF` → Fundo dos cards
- **Surface**: `#F6F2F5` → Fundo do app
- **Sand 200**: `#E4D9C3` → A receber, datas, neutros quentes
- **Background Grid**: `#F3E9F3` → Fundo de grids, badges

### Accent
- **Rose 200**: `#F5B9C6` → Texto e ícones sobre roxo, selos
- **Rose 600**: `#C4626F` → Alertas, excluir, valores negativos
- **Mint 300**: `#A9D8B8` → Positivo, pago, apoio

---

## 2. TIPOGRAFIA

### Famílias
- **Instrument Serif** (serif) → Marca, títulos
- **Manrope** (sans-serif) → Body, UI, valores

### Hierarquia

#### Instrument Serif
- Marca (mobile): **32px**, line-height 1
- Marca (sidebar): **26px**, line-height 1
- Títulos de tela: **28–30px**, line-height 1.1, weight regular
- Títulos de card: **19–24px**, line-height 1.15, weight regular

#### Manrope
- Valores: **17px+**, weight **800**
- Rótulos: **9–11px**, weight **800**, letter-spacing `.05em`, text-transform uppercase
- Body: **11–13px**, weight **400–600**, line-height 1.5–1.6

---

## 3. COMPONENTES

### Card
```css
background: #FFFFFF
border-radius: 22px–26px
box-shadow: 0 8px 20px rgba(58, 35, 80, 0.09)
padding: 18px–22px

/* Hover */
transform: translateY(-5px)
box-shadow: 0 20px 36px rgba(58, 35, 80, 0.18)
transition: all 0.28s ease
```

### Botão Principal
```css
background: #3A2350
color: #F5B9C6
border-radius: 14px
padding: 12px 16px
font-weight: 800
font-size: 12px
box-shadow: 0 10px 20px rgba(58, 35, 80, 0.3)

/* Hover */
transform: translateY(-3px)
transition: all 0.22s ease
```

### Botão "Lançar Pedido" (Premium)
```css
background: linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)
color: #F5B9C6
border-radius: 16px
padding: 12px 20px
/* Recortes laterais: 2 círculos #F6F2F5 de 18px cada */
border: 2px dashed rgba(255, 255, 255, 0.3)
position: relative
```

### Selo / Pílula
```css
display: inline-block
padding: 5px 10px
border-radius: 999px
font-size: 9–10px
font-weight: 800
white-space: nowrap
letter-spacing: 0.04em

/* Variações de cor */
.positive { background: #A9D8B8; color: #2B2420; }
.pending { background: #E4D9C3; color: #5A4E46; }
.alert { background: #F5B9C6; color: #3A2350; }
.category { background: #F3E9F3; color: #6E3F72; }
```

### Medidor (SVG)
```css
stroke-linecap: round
stroke-width: 10px

/* Trilho */
stroke: #F1ECF2

/* Cores de preenchimento */
.segment-1 { stroke: #6E3F72; }
.segment-2 { stroke: #C4626F; }
.segment-3 { stroke: #B08D57; }
```

### Barra Inferior / Sidebar

#### Mobile (Bottom Nav)
```css
display: flex
justify-content: space-around
background: #FFFFFF
border-top: 1px solid rgba(36, 27, 43, 0.08)
padding: 8px 0
height: 60px

/* Item ativo */
.nav-item.active {
  background: linear-gradient(120deg, #F5B9C6, #C4626F)
  color: #3A2350
  border-radius: 14px
  padding: 8px 12px
  transform: translateY(-4px)
  transition: all 0.25s ease
}

/* Hover */
.nav-item:not(.active):hover {
  transform: translateY(-4px)
  background: rgba(58, 35, 80, 0.06)
}
```

#### Desktop (Sidebar)
```css
width: 236px
background: linear-gradient(180deg, #3A2350, #4A2C5C)
flex-direction: column
padding: 26px 18px
gap: 26px
/* Desliza 4px para direita no hover */
```

---

## 4. ANIMAÇÕES & TRANSIÇÕES

### Movimento Padrão

| Elemento | Propriedade | Valor | Duration | Timing |
|----------|------------|--------|----------|--------|
| Cards | `translateY` | `-5px` | `0.28s` | `ease` |
| Botões | `translateY` | `-2px to -3px` | `0.22s` | `ease` |
| Abas/Nav | `translateY` | `-4px` | `0.25s` | `ease` |
| List items | `translateX` | `+3px` | `0.25s` | `ease` |

### Keyframes

#### carFloat (Selo rosa flutuante)
```css
@keyframes carFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
/* Duration: 4.5s, infinite, ease-in-out */
```

#### carGlow (Halo do card de lucro)
```css
@keyframes carGlow {
  0%, 100% { opacity: 0.45; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.06); }
}
/* Duration: 6s, infinite, ease-in-out */
```

#### carSweep (Brilho do botão de comanda)
```css
@keyframes carSweep {
  0% { transform: translateX(-120%); }
  60%, 100% { transform: translateX(220%); }
}
/* Duration: 5s, infinite, ease-in-out */
```

---

## 5. ESPAÇAMENTO

### Padding/Margin Scale
```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 20px
xxl: 22px–26px
xxxl: 30px–40px
```

### Card Spacing
- Padding interno: `18px–22px`
- Gap entre elementos: `12px–14px`

### Grid Gaps
- Horizontal: `14px–20px`
- Vertical: `14px–20px`

---

## 6. SOMBRAS

### Drop Shadow Padrão
```css
box-shadow: 0 8px 20px rgba(58, 35, 80, 0.09)
```

### Drop Shadow no Hover
```css
box-shadow: 0 20px 36px rgba(58, 35, 80, 0.18)
```

### Button Shadow
```css
box-shadow: 0 10px 20px rgba(58, 35, 80, 0.3)
```

### Subtle
```css
box-shadow: 0 2px 6px rgba(58, 35, 80, 0.16)
```

---

## 7. BORDER RADIUS

- **Buttons**: `14px`
- **Cards**: `22px–26px`
- **Nav items**: `14px`
- **Inputs**: `12px–14px`
- **Small elements**: `6px–9px`
- **Pills/Badges**: `999px`

---

## 8. RESPONSIVIDADE

### Mobile (< 1024px)
- Bottom navigation bar
- Full-width cards
- Stack vertical

### Desktop (≥ 1024px)
- Fixed sidebar (236px)
- Top header with search/action
- Grid layout for content
- Multi-column cards

---

## 9. ESTADO DE ALERTAS

### Estoque Baixo / Saldo Negativo
- Não pisca nem pulsa
- Exibir como **selo estático** em `#C4626F`
- Peso 800, tamanho 11px

---

## 10. ORDEM DE IMPLEMENTAÇÃO

1. **CSS Base**: Tokens, fontes, keyframes
2. **Header & BottomNav**: Aparecem em todas as telas
3. **Dashboard**: Calendário, medidores, card de lucro
4. **Orders Module**: Cabeçalho em degradê, busca, filtros, comanda
5. **Fichas, Estoque, Clientes, Saldos**: Cards, anel de composição, datas
6. **App Shell**: Layout responsivo desktop/mobile
