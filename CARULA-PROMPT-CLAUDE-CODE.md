# CARULA REDESIGN — PROMPT PARA CLAUDE CODE

## VISUAL APROVADO
[Ver screenshot: `screenshots/carula-visual-final.png`]

---

## ESPECIFICAÇÃO VISUAL COMPLETA

### 1. PALETA DE CORES

#### Marca (Gradiente Principal)
```
linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)
```

#### Cores Solidas
- **#3A2350** - Brand 900 (Cabeçalhos, sidebar, ação principal, aba ativa)
- **#6E3F72** - Brand 700 (Meio degradê, ícones, rótulos)
- **#A85E86** - Brand 500 (Fim degradê, acentos)
- **#F5B9C6** - Rose 200 (Texto sobre roxo, selos)
- **#C4626F** - Rose 600 (Alertas, excluir, negativos)
- **#E4D9C3** - Sand 200 (A receber, datas, neutros)
- **#A9D8B8** - Mint 300 (Positivo, pago, apoio)
- **#F6F2F5** - Surface (Fundo do app)
- **#FFFFFF** - Card (Cards e painéis)
- **#241B2B** - Ink (Títulos e valores)
- **#7A6E80** - Ink Soft (Texto secundário)
- **#F3E9F3** - Background Grid

---

### 2. TIPOGRAFIA

#### Instrumento Serif (Marca & Títulos)
- Google Font: `Instrument Serif`
- Uso:
  - Marca (mobile): **32px**, line-height 1
  - Marca (sidebar): **26px**, line-height 1
  - Títulos de tela: **28–30px**, weight regular
  - Títulos de card: **19–24px**, weight regular

#### Manrope (Body & UI)
- Google Font: `Manrope`
- Pesos: 400, 600, 700, 800
- Uso:
  - Valores: **17px+**, weight **800**
  - Rótulos: **9–11px**, weight **800**, letter-spacing `.05em`, uppercase
  - Body: **11–13px**, weight **400–600**, line-height 1.5–1.6

---

### 3. COMPONENTES

#### Card
```css
background: #FFFFFF
border-radius: 22px–26px
box-shadow: 0 8px 20px rgba(58, 35, 80, 0.09)
padding: 18px–22px
transition: all 0.28s ease

/* Hover */
transform: translateY(-5px)
box-shadow: 0 20px 36px rgba(58, 35, 80, 0.18)
```

#### Botão Principal
```css
background: #3A2350
color: #F5B9C6
border-radius: 14px
padding: 12px 16px
font-weight: 800
box-shadow: 0 10px 20px rgba(58, 35, 80, 0.3)
transition: all 0.22s ease

/* Hover */
transform: translateY(-3px)
```

#### Botão "Lançar Pedido" (Premium)
```css
background: linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)
color: #F5B9C6
border-radius: 16px
padding: 12px 20px
border: 2px dashed rgba(255, 255, 255, 0.3)

/* Detalhe: 2 círculos #F6F2F5 de 18px nos lados (recorte) */
/* Selo rosa flutuante no canto superior direito */
```

#### Selo / Pílula
```css
display: inline-block
padding: 5px 10px
border-radius: 999px
font-size: 9–10px
font-weight: 800
white-space: nowrap
letter-spacing: 0.04em

/* Variações */
.positive { background: #A9D8B8; color: #2B2420; }
.pending { background: #E4D9C3; color: #5A4E46; }
.alert { background: #F5B9C6; color: #3A2350; }
.category { background: #F3E9F3; color: #6E3F72; }
```

#### Medidor (SVG)
```css
stroke-linecap: round
stroke-width: 10px
stroke: #F1ECF2 (trilho)

/* Cores dos segmentos */
.segment { stroke: varies-by-type }
```

#### Nav Item
```css
.active {
  background: linear-gradient(120deg, #F5B9C6, #C4626F)
  color: #3A2350
  border-radius: 14px
  padding: 8px 12px
  transform: translateY(-4px)
  transition: all 0.25s ease
}

.hover:not(.active) {
  transform: translateY(-4px)
  background: rgba(58, 35, 80, 0.06)
}
```

---

### 4. ANIMAÇÕES

| Elemento | Propriedade | Valor | Duration | Timing |
|----------|-------------|-------|----------|--------|
| Cards | `translateY` | `-5px` | `0.28s` | `ease` |
| Botões | `translateY` | `-2px to -3px` | `0.22s` | `ease` |
| Nav | `translateY` | `-4px` | `0.25s` | `ease` |
| List items | `translateX` | `+3px` | `0.25s` | `ease` |

#### Keyframes Especiais

**carFloat** (Selo rosa flutuante)
```css
@keyframes carFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
/* Duration: 4.5s, infinite, ease-in-out */
```

**carGlow** (Halo do card)
```css
@keyframes carGlow {
  0%, 100% { opacity: 0.45; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.06); }
}
/* Duration: 6s, infinite, ease-in-out */
```

**carSweep** (Brilho do botão)
```css
@keyframes carSweep {
  0% { transform: translateX(-120%); }
  60%, 100% { transform: translateX(220%); }
}
/* Duration: 5s, infinite, ease-in-out */
```

---

### 5. ESPAÇAMENTO

```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 20px
xxl: 22px–26px
xxxl: 30px–40px
```

---

### 6. SOMBRAS

```css
/* Padrão */
box-shadow: 0 8px 20px rgba(58, 35, 80, 0.09)

/* Hover */
box-shadow: 0 20px 36px rgba(58, 35, 80, 0.18)

/* Botão */
box-shadow: 0 10px 20px rgba(58, 35, 80, 0.3)

/* Sutil */
box-shadow: 0 2px 6px rgba(58, 35, 80, 0.16)
```

---

### 7. RESPONSIVIDADE

#### Mobile (< 1024px)
- Bottom navigation bar
- Full-width cards
- Stack vertical

#### Desktop (≥ 1024px)
- Fixed sidebar (236px)
- Top header
- Grid layout

---

## ORDEM DE IMPLEMENTAÇÃO

1. **CSS Base**: Tokens, fontes, keyframes
2. **Header & BottomNav**: Aparecem em todas as telas
3. **Dashboard**: Calendário, medidores, card de lucro
4. **Orders Module**: Cabeçalho em degradê, comanda
5. **Fichas, Estoque, Clientes, Saldos**: Componentes específicos
6. **App Shell**: Layout responsivo

---

## INSTRUÇÕES FINAIS

✅ Implemente exatamente as cores, fontes, espacamentos e animações acima
✅ Nenhum handler, rota ou lógica de negócio muda
✅ Apenas visual e comportamento de UI
✅ Teste em mobile (< 1024px) e desktop (≥ 1024px)
