# 📋 Proposta de Melhorias Visuais — Carula Confeitaria

**Status:** Aguardando aprovação antes de aplicar definitivamente

---

## 🔍 Diagnóstico Executivo

A aba **Início (Dashboard)** tem o padrão visual premium desejado. As outras abas precisam ser alinhadas com esse padrão. Aqui estão as propostas:

---

## 1️⃣ BUG VISUAL — Aba Estoque

### Problema
O card do **Cacau em Pó 100%** está com cor igual ao background (`bg-[var(--color-neutral-cream)]`), ficando invisível.

### Causa
Está na seção "Alerta Baixo" (low stock), mas usa a mesma classe de background do header.

### Solução Proposta
```
✅ Alterar card de baixo estoque:
  - Manter: bg-[var(--color-neutral-cream)] + border-2 border-[var(--color-semantic-coral)]
  - Adicionar: sombra sutil + contraste visual
  - Resultado: Card fica visível com destaque em vermelho/coral
```

---

## 2️⃣ INFOGRÁFICOS — Aba Estoque

### Visão Atual
- Cards listam apenas: nome, quantidade, threshold, botões de ajuste
- Totalmente baseado em texto/números

### Padrão Desejado (inspirado no Início)
Adicionar **indicadores visuais** de nível de estoque:

#### **Opção A: Barra de Progresso Horizontal** (recomendado)
```
┌─────────────────────────┐
│ Açúcar Refinado          │
│ ████████████░░░░░░░░░░░ │ 60% cheio
│ 3000g / 5000g (threshold) │
└─────────────────────────┘

Implementação:
- Cor verde (#C8E6D7) para estoque saudável
- Cores quentes (#E8B4B8) para baixo estoque
- Animação suave ao carregar
```

#### **Opção B: Círculo de Progresso** (alternativa)
```
        60%
    ●●●●●○○○○○
    
Implementação:
- Círculo SVG animado
- Tamanho: 48px
- Mostra: nível vs. mínimo
```

### Implementação Detalhada (Opção A - Barra)

**Para cada card de estoque:**
1. Após o nome do item → Adicionar barra de progresso
2. Cores dinâmicas:
   - **Verde** (#C8E6D7): Estoque > 70% da capacidade
   - **Amarelo** (#F5D4A8): Estoque entre 30-70%
   - **Vermelho** (#E8B4B8): Estoque < 30% (já em baixo estoque)
3. Label: "500g / 5000g (10%)"

**Exemplo visual:**
```
┌─────────────────────────────────────┐
│ 🥄 Açúcar Refinado                   │
│                                       │
│ Barra: ████████████░░░░░░░░░░░░░░░░ │
│        3000g / 5000g (60% cheio)     │
│ Mín: 1000g                           │
│                                       │
│ [- 100] [+ 100]  [✎ Editar] [🗑]    │
└─────────────────────────────────────┘
```

---

## 3️⃣ FICHAS TÉCNICAS — Seção de Custos

### Visão Atual (Linhas 864-885)
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│   Reposição     │  Mão de Obra    │  Custos Op.     │   Sugestão      │
│   R$ 35,00      │   R$ 20,00      │   R$ 10,00      │  R$ 65,00       │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```
Cards muito simples, com bg-white/80.

### Padrão Premium Proposto
Aplicar o **padrão da aba Início** (Dashboard):
- Cards com cores seção-específicas
- Ícones visuais para cada custo
- Sombras e espaçamento refinados
- Tipografia com mais hierarquia

#### **Nova Estrutura Visual:**

```
┌──────────────────────────────────────────────────────────────┐
│ 🧂 Reposição          │ 👷 Mão de Obra    │ ⚙️ Custos       │
│ R$ 35,00             │ R$ 20,00          │ R$ 10,00        │
│ Ingredientes usados  │ Mão de obra      │ Custo/Investim  │
└──────────────────────────────────────────────────────────────┘
```

**Detalhes de Design:**
1. **Cores:**
   - Reposição: Verde menta (#C8E6D7) — insumos
   - Mão de Obra: Rosa (#E8B4B8) — labor
   - Custos Operacionais: Azul-cinza (#B8D4E8) — dados/finanças
   - Sugestão (destacado): Charcoal (#3E3430) + texto gold

2. **Cards:**
   - Padding: 16px (md)
   - Sombra sutil
   - Borda: 1px subtle
   - Hover: elevation + opacidade reduzida

3. **Tipografia:**
   - Label: 10px bold uppercase
   - Valor: 16px bold (números tabulares)
   - Descrição: 12px secondary color

4. **Ícones:**
   - Antes do label (pequeno, 16px)
   - Cor herdada do card
   - Lucide React ou Emoji

---

## 4️⃣ ABAS CLIENTES & PEDIDOS

### Status Atual
- Visualmente satisfatórias, mas com pequenas inconsistências

### Ajustes Propostos (Pequenos Detalhes)

#### **Aba Pedidos (Orders Module)**
```
✅ Consistência de Cores:
   - Header: Usar --color-destaque (#F5D4A8) em vez de --color-semantic-warning
   - Cards de resumo: Alinhar com cores da Pastel Harmonic
   - Hover states: +shadow, não scale

✅ Detalhes de Estilo:
   - Border radius: Uniformizar para 12px (md)
   - Shadows: Usar card-shadow-xs padrão
   - Spacing: Gap 16px (md) entre sections
```

#### **Aba Clientes (Customers Module)**
```
✅ Pequenos refinamentos:
   - Typography: Alinhar h2/h3 com padrão do Dashboard
   - Cards de cliente: Adicionar subtle border-left com cor de seção
   - Search input: Aplicar estilo padrão com ícone
   - Tags/badges: Usar cores da Pastel Harmonic
```

---

## 📊 Resumo de Implementação

| Aba | Tipo de Mudança | Prioridade | Esforço |
|-----|-----------------|-----------|---------|
| **Estoque** | Bug visual (Cacau) + Infográficos (barras) | 🔴 Alta | Médio |
| **Fichas Técnicas** | Redesign de cards de custo | 🟡 Média | Médio |
| **Pedidos** | Alinhamento de cores + pequenos ajustes | 🟢 Baixa | Baixo |
| **Clientes** | Pequenos refinamentos de estilo | 🟢 Baixa | Baixo |

---

## 🎨 Variações Técnicas — Qual Escolher para Estoque?

### Opção A: Barra Horizontal (RECOMENDADO)
```
Vantagens:
✅ Fácil ler em mobile
✅ Compatível com qualquer resolução
✅ Similar ao padrão do Início (infografias)
✅ Menos complexo que círculos

Implementação: Tailwind + simples elemento <div>
```

### Opção B: Círculo de Progresso
```
Vantagens:
✅ Mais premium/design
✅ Uso menor de espaço

Desvantagens:
❌ Mais complexo (SVG ou library)
❌ Precisa de mais espaço horizontal
```

**Recomendação:** Opção A (Barra) = simplicidade + efetividade

---

## ✅ Próximos Passos Após Aprovação

1. **Fase 1 — Bug + Estoque:**
   - Corrigir Cacau em Pó (1 linha)
   - Adicionar barras de progresso a todos os cards (lógica + renderização)

2. **Fase 2 — Fichas Técnicas:**
   - Redesenhar seção de custos com cores + ícones
   - Aplicar padrão visual premium

3. **Fase 3 — Ajustes Globais:**
   - Pedidos: Alinhamento de cores
   - Clientes: Pequenos refinamentos

---

## 🎯 Critério de Sucesso

Ao final, **todas as abas terão:**
- ✅ Contraste visual suficiente
- ✅ Indicadores gráficos (não apenas números)
- ✅ Hierarquia tipográfica clara
- ✅ Cores da Pastel Harmonic aplicadas
- ✅ Sombras e espaçamento uniforme
- ✅ Sem mudanças de conteúdo/funcionalidade

---

## 💬 Aguardando seu Feedback

**Você aprova essa direção?** Se sim, qual prioridade?

- [ ] Sim, aplica tudo na ordem proposta (Estoque → Fichas → Pedidos/Clientes)
- [ ] Sim, mas comece apenas por Estoque + Fichas Técnicas
- [ ] Quero ajustar algo antes — qual parte?
- [ ] Outra sugestão...
