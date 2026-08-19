# Carula Confeitaria — Product Context

**Product:** Carula Confeitaria — Financial management and ordering system for a small bakery business.

**Mode:** Operate (tool/dashboard)

**Platform:** Web (responsive), PWA-capable, iOS/Android optimized.

## Core Identity

**Brand:** Carula Confeitaria — elegant, sophisticated bakery management platform.

**Target User:** Small bakery owners/managers managing orders, inventory, finances, and customer relationships.

**Key Surfaces:**
- Dashboard (overview, summary metrics)
- Orders (Pedidos) — order management
- Customers (Clientes) — customer profiles with photos
- Fichas Técnicas (technical recipes/formulas)
- Estoque (inventory)
- Saldos (balances/expenses)
- Sales, Restock, Labor, Costs modules

## Visual System

### Color Palette

**Brand (Purple gradient):**
- `--car-brand-900: #3A2350` (darkest, headers)
- `--car-brand-800: #4A2A5C`
- `--car-brand-700: #6E3F72`
- `--car-brand-600: #A85E86` (medium, accents)

**Accent (Rose/Pink):**
- `--car-rose-200: #F5B9C6` (medium pink)
- `--car-rose-100: #F5CFD4` (light pink)
- `--car-rose-50: #FFF8F6` (very light pink)

**Neutral (Sand/Beige):**
- `--car-sand-200: #E4D9C3` (medium sand)
- `--car-sand-100: #EDE7DC` (light sand)
- `--car-sand-50: #F6F2F5` (very light, surfaces)

**Text:**
- `--car-text-900: #241B2B` (main text)
- `--car-text-800: #2B2420`
- `--car-text-700: #5A4E46`
- `--car-text-600: #7A6E80` (secondary text, labels)

**Semantic:**
- Green (paid): `#A9D8B8`
- Gold (pending): `#B08D57`

**Brand Gradient:**
- `linear-gradient(155deg, #3A2350, #6E3F72 55%, #A85E86)` (used in headers, backgrounds)

### Typography

**Serif (Display/Headings):**
- `Instrument Serif` — page titles, main headings
- `Playfair Display` — elegant secondary headings

**Sans-serif (Body/UI):**
- `Plus Jakarta Sans` — primary body font, UI text
- `Manrope` — labels, smaller UI elements
- `Fredoka` — occasional decorative/friendly text

**Font Stack:** `'Plus Jakarta Sans', 'Manrope', sans-serif` (body default)

### Spacing & Layout

**Responsive:**
- Mobile-first design
- Tablet and desktop support via Tailwind
- Safe area support (notch/status bar safe)

**Key Components:**
- Cards with rounded corners (3xl = 24px border-radius)
- Box shadows (card style with purple tint)
- Flex/grid layouts
- Bottom navigation bar (fixed, 5rem + safe area)

### Micro-interactions

**Animations:**
- `carFloat` — 4.5s ease-in-out vertical float
- `carGlow` — 3s scale + opacity pulse
- `carRise` — 0.6s entrance animation
- `carSweep` — 5s horizontal sweep
- Hover effects on buttons/cards (translate, shadow)

**Transitions:**
- `duration-300` for smooth state changes
- `active:scale-95` for button press feedback

### Component Patterns

- **Cards:** white bg, rounded-3xl, shadow-card, hover lift
- **Buttons:** rounded full/xl, brand color or contrasts, hover/active states
- **Inputs:** border-pink-300 focus, rounded-xl
- **Badges/Pills:** small rounded-full, inline-flex
- **Lists:** flex column with gap, items center/start
- **Modals:** fixed overlay, centered, max-width constraints
- **Headers:** gradient background (brand gradient), text white
- **Status indicators:** green (paid), gold/tan (pending)

## Content Principles

- Clear, action-oriented copy in Brazilian Portuguese
- Financial clarity (R$, totals, breakdown)
- Customer-centric language
- Emoji sparingly for affordance (👤, 💰, ✅, ⏳, etc.)

## Key Features (Reference)

1. **Order Management** — Create, edit, view orders with customer data
2. **Customer Profiles** — Store customer info, photos, preferences
3. **PDF Export** — Generate order/budget quotes as PDFs
4. **Financial Tracking** — Sales, costs, labor, inventory
5. **Weekly Archive** — Track by-week performance
6. **Backup & Restore** — Data persistence and recovery
7. **PWA** — Install as app on mobile

## Design Constraints

- No redesign needed — preserve existing look and identity
- Refinement focus: spacing, alignment, polishing details
- Maintain all existing colors, fonts, components
- Keep current layout structure (no card repositioning)
- Mobile-first, responsive
