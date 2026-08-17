# Carula App - Unified Application

## Overview
Complete functional application prototype with 6 integrated screens and working navigation. All visual designs preserved from approved reference. Mock data used throughout.

---

## Application Structure

### Screens
1. **Início** — Dashboard with profit metrics, sales summary, balance breakdown
2. **Pedidos** — Orders management with search, status filters, action buttons
3. **Fichas** — Recipe/technical cards with cost breakdown and category filters
4. **Clientes** — Client management with contact info and purchase history
5. **Estoque** — Inventory management with location and quantity tracking
6. **Saldos** — Financial summary with revenue, expenses, and transaction history

### Navigation
- Bottom nav bar with 6 tabs (always visible)
- Tap any tab to switch screens
- Active tab highlighted with dark purple background
- Smooth transitions between screens

---

## Technical Details

### Technology Stack
- **Framework**: Design Component (DC) — HTML + JavaScript
- **Styling**: Inline styles only
- **State Management**: React-like class component with `setState()`
- **Fonts**: Instrument Serif (headers), Manrope (body)
- **Color Scheme**: Purple gradient primary (#3A2350 → #A85E86), cream background (#F6F2F5)

### Key Files
- `Carula App - Unified.dc.html` — Full application

---

## Screens Detail

### 1. Início (Home Dashboard)
**Header**
- Logo: "Carula Confeitaria"
- Profile button
- Action buttons (app icon, download)

**Main Content**
- Profit metric: 59% margin, R$ 4.980,00 net profit
- Status badge: "Positivo"
- Sales summary cards:
  - Vendas Pagas: R$ 8.420
  - Saídas: R$ 3.440
  - A Receber: R$ 1.150

**Call-to-Action**
- "+ Lançar Pedido" button with floating animation
- Navigates to Pedidos screen

**Balance Section**
- 3 circular progress cards:
  - 🔄 Reposição (72%): R$ 1.240
  - 🟣 Mão de Obra (48%): R$ 860
  - ✨ Custo + Invest (35%): R$ 980

---

### 2. Pedidos (Orders)
**Header**
- Title: "Pedidos & Encomendas"
- Total count badge: "8 Pedidos"
- Total sales: R$ 12.500

**Summary Cards**
- ✓ Vendas Pagas: R$ 10.200 (6 pedidos)
- ⏳ A Receber: R$ 2.300 (2 pendentes)

**Filters**
- Search: "Buscar por nome da cliente ou descrição..."
- Status tabs: Todos (8), Pagos (6), Pendentes (2)

**Order Cards** (repeating list)
- Client name badge
- Payment status badge (green if paid, orange if pending)
- Date and payment method
- Order amount
- PDF export button

**Mock Data**
```
- Maria Silva | 15 de Ago | PIX | R$ 450,00 | Pago
- João Santos | 14 de Ago | PIX | R$ 320,00 | Pago
```

---

### 3. Fichas Técnicas (Recipes)
**Header**
- Title: "Fichas Técnicas"
- "+ Nova Ficha" button

**Category Filter**
- Bolos (active)
- Doces
- Salgados

**Recipe Cards** (repeating)
- Recipe name: "Bolo Chocolate"
- Size badge: "P (2kg)"
- Cost breakdown circular chart (59% margin)
- Line items:
  - Reposição: R$ 12
  - Mão de Obra: R$ 18
  - Custos Op.: R$ 15
- Suggested price: R$ 45
- Action buttons: Editar, Duplicar

---

### 4. Clientes (Clients)
**Header**
- Title: "Clientes"
- "+ Novo Cliente" button

**Search**
- "Buscar cliente por nome ou cidade..."

**Client Cards** (repeating)
- Purple gradient background
- Name: "Marina Duarte"
- Location: "São Paulo, SP"
- Phone: "(11) 99999-8888"
- Email: "marina@email.com"
- Total spent: "R$ 2.450,00"
- Order count: "5 pedidos"
- Action buttons: Editar, Deletar

---

### 5. Estoque (Inventory)
**Header**
- Title: "Estoque"
- "+ Novo Item" button

**Search**
- "Buscar item no estoque..."

**Inventory Items** (repeating)
- Item icon/emoji: 🥄
- Name: "Farinha de Trigo"
- SKU: "FAR-001"
- Quantity: 25kg
- Unit price: R$ 8,50
- Location badge: "Prateleira A"
- Status badge: "✓ Em Estoque"
- Action buttons: Editar, Deletar

---

### 6. Saldos (Balance & Transactions)
**Summary Cards**
- Receita Total: R$ 18.420 (+12% this month)
- Despesas: R$ 3.850 (Estoque + Fornecedores)
- Saldo Líquido: R$ 14.570

**Recent Transactions** (repeating)
- Transaction icon, description, timestamp
- Amount with color coding (green for income, red for expense)
- Examples:
  - "Venda - Marina Duarte" | Hoje às 14:30 | +R$ 450,00
  - "Compra - Fornecedor" | Ontem às 10:15 | -R$ 125,00

---

## Interactive Features

### Navigation
```javascript
switchScreen(screen) {
  // Switches currentScreen state
  // Updates active tab styling
  // Toggles screen visibility
}
```

### Actions Available
- **Toggle Payment Status**: Mark order as paid/pending
- **Delete Order**: Remove from pedidos list
- **Delete Client**: Remove from clientes list
- **Delete Stock Item**: Remove from estoque list

### State Management
- `currentScreen`: Active screen name (string)
- `totalPedidos`: Order count (number)
- `pedidos`: Array of order objects
- `fichas`: Array of recipe objects
- `clientes`: Array of client objects
- `estoque`: Array of inventory objects

---

## Color Palette

| Element | Color | Usage |
|---------|-------|-------|
| Primary Gradient | #3A2350 → #A85E86 | Headers, buttons, active states |
| Background | #F6F2F5 | Main app background |
| Card Background | #FFFFFF | Content cards |
| Text Primary | #241B2B | Main text |
| Text Secondary | #7A6E80 | Subtext |
| Success | #0D8659 | Positive indicators |
| Error | #E82C1B | Delete/danger actions |
| Accent Pink | #F5B9C6 | Icons, highlights |
| Accent Purple | #7E4F9E | Secondary elements |

---

## Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| App Title | Instrument Serif | 400 | 32px |
| Screen Titles | Instrument Serif | 400 | 29px |
| Card Titles | Instrument Serif | 400 | 21px |
| Body Text | Manrope | 400-600 | 12-13px |
| Labels | Manrope | 800 | 9-11px |
| Numbers | Manrope | 800 | 15-36px |

---

## Responsive Behavior

- **Fixed Width**: 390px (iPhone-sized)
- **Fixed Height**: 844px
- **Scrollable Regions**: Content areas with overflow-y: auto
- **Bottom Nav**: Always fixed at bottom with 22px padding

---

## Next Steps for Backend Integration

1. **API Endpoints** → Replace mock data with real API calls
2. **Form Modals** → Add create/edit dialogs for all entities
3. **Validation** → Add error handling and input validation
4. **Authentication** → Connect user login flow
5. **Real Data Binding** → Replace `this.state` with API responses
6. **Error States** → Handle API failures gracefully

---

## File Structure (Single DC)

```
Carula App - Unified.dc.html
├── <helmet>
│   └── Fonts + Base Styles
├── App Shell (390px × 844px)
│   ├── Content Area
│   │   ├── sc-if: Início Screen
│   │   ├── sc-if: Pedidos Screen
│   │   ├── sc-if: Fichas Screen
│   │   ├── sc-if: Clientes Screen
│   │   ├── sc-if: Estoque Screen
│   │   └── sc-if: Saldos Screen
│   └── Bottom Nav (6 buttons)
└── <script> Logic Class
    ├── state: All data
    ├── switchScreen(): Navigation
    ├── togglePaymentStatus(): Order actions
    ├── delete*(): Deletion handlers
    └── renderVals(): Template values
```

---

## Current Limitations

- ✅ **Visual Design**: 100% fidelity to reference
- ✅ **Navigation**: All 6 screens working
- ✅ **Mock Data**: Sample data for all screens
- ⚠️ **Actions**: Basic delete/toggle only
- ⚠️ **Persistence**: No data persistence (clears on refresh)
- ⚠️ **Backend**: Not connected (mock data only)
- ⚠️ **Forms**: No create/edit modals yet
- ⚠️ **Validation**: No input validation

---

## Export & Deployment

### As HTML
- Single `.dc.html` file — ready to deploy
- No build step required
- Works in any modern browser

### As PPTX/PDF
- Use ready_for_verification() to export

### To GitHub
- Integrate into React app via component extraction
- See `Dashboard-NewLayout.tsx` and `OrdersModule-NewLayout.tsx` for examples

---

**Created**: August 14, 2026  
**Status**: Functional Prototype  
**Next Phase**: Backend Integration