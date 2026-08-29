# 🎨 AUDITORIA — UX/UI
## Carula Confeitaria — Análise Visual de Design, Hierarquia, Espaçamento, Tipografia

**Data:** 28 de Agosto de 2026  
**Método:** Análise visual de screenshots, hierarquia, espaçamento, tipografia, contraste, consistência, navegação, estados

---

## 📐 ANÁLISE POR COMPONENTE

### 1. HEADER (Topo da Tela)

**Observação Visual:**
- Logo "Carula Confeitaria" centralizado em topo
- 3 ícones de ação no topo-direito (perfil, configurações, logout)
- Cor de fundo: roxo escuro (#3A2350)
- Texto: branco, fonte Instrument Serif (display)

**Avaliação:**

✅ **Bom:**
- Logo centralizado = identidade forte
- Espaçamento adequado
- Ícones claros

❌ **Problemas:**

**P1: Ícones muito pequenos (16-24px)**
- Difícil de clicar em mobile
- Especialmente ícone de "mais opções" (três pontinhos)
- Taxa erro aumentada em cozinha (dedo molhado)

**P1: Logo sem feedback visual**
- "Carula" parece clicável (logo tem tradição de levar a home)
- Não há indicação se clicável
- Confundidor em primeira vez

**P2: Falta breadcrumb em telas aninhadas**
- Usuária não sabe "aonde estou"
- Se abre modal > modal aninhado, sem volta clara

**Classificação Geral:** 🟡 **ACEITÁVEL, MAS COM FRIÇ ÃO**

---

### 2. BOTTOM NAVIGATION (Abas)

**Observação Visual:**
- 6 abas fixas: Início, Pedidos, Fichas, Clientes, Estoque, Saldos
- Ícones SVG 19×19px
- Padding: ~8px por lado
- Altura total: ~44px (iOS standard)
- Ativa tem background roxo escuro, ícone + texto rosa (#F5B9C6)
- Inativa: ícone cinza, texto cinza uppercase

**Avaliação:**

✅ **Bom:**
- 44px height é excelente (WCAG minimum)
- Cores bem diferenciadas (ativa vs inativa)
- Labels uppercase = legibilidade
- Fixed bottom = sempre visível
- Transição suave (hover efeito translateY)

⚠️ **Problemas:**

**P1: 6 abas em 375px = apertado**
- Cada aba ~53px de largura
- Com dedo molhado, taxa erro aumenta
- Em 320px (iPhone SE), fica crítico

**P1: Ícones 19×19px pequenos**
- Difíceis de ver em ambiente com pouca luz
- Deveriam ser 24-28px

**P2: Sem badge de notificação**
- "Você tem 3 pedidos pendentes" — não aparece
- Usuária precisa entrar em cada aba para verificar

**P2: Sem "mais opções"**
- Se tem mais de 6 abas, como adiciona?
- Design não escala

**Classificação Geral:** 🟡 **ACEITÁVEL (espacotem apertado)**

---

### 3. DASHBOARD (Tela Início)

**Observação Visual:**

**Seção 1: Total em Vendas**
- Background: roxo gradient
- Número grande: "R$ 341,00"
- Label: "TOTAL EM VENDAS" (pequeno, uppercase)
- Tipografia: Manrope, font-weight 800

**Seção 2: 3 Cards (VENDAS PAGAS, SALDOS, A RECEBER)**
- Cards empilhados horizontalmente
- Fundo: roxo mais claro (semi-transparente)
- Texto branco, números grandes
- Spacing adequado entre cards

**Seção 3: Botão "NOVA COMANDA - Lançar Pedido"**
- Fundo roxo escuro
- Texto em Instrument Serif (display)
- Ícone "+" rosa no lado direito (44×44px)
- Sombra suave

**Seção 4: "Saldos & Divisão dos Pedidos"**
- 3 círculos (gráficos de pizza/progresso)
- Labels: REPOSIÇÃO, MÃO DE OBRA, CUSTO+INV
- Números grandes em branco
- Spacing inadequado (3 círculos competem pela atenção)

**Seção 5: Agenda de Pedidos**
- Grid de calendário (simples)
- Mês atual, setas de navegação
- Styling minimalista

**Avaliação:**

✅ **Bom:**
- Hierarquia clara: Total > Cards > Ações > Detalhes
- Cores usadas consistentemente
- Botão "Lançar Pedido" é proeminente
- Espaçamento geral adequado

❌ **Problemas:**

**P0: "Saldos & Divisão" card é confuso visualmente**
- 3 círculos de tamanhos diferentes = caótico
- Números não batem com total de cima (R$ 341 vs R$ 2.371)
- Usuária não entende o que vê

**P1: Contraste texto/fundo em cards**
- "SALDOS" branco em roxo semi-transparente
- Pode ser difícil ler em luz solar
- WCAG AA recomenda contraste 4.5:1, pode estar abaixo

**P1: Espaçamento vertical inadequado**
- Card "3 Cards" tem espaçamento apertado
- Números grandes competem por espaço
- Parece congestionado em mobile

**P1: Tipografia inconsistente**
- Alguns números em Manrope, outros em Instrument Serif
- Sem padrão claro

**P2: Sem CTA claro além de "Lançar Pedido"**
- Usuária com zero pedidos: "e agora?"
- Não há "Próximas ações" sugeridas
- Sem onboarding visual

**Classificação Geral:** 🔴 **CRÍTICO — Card "Saldos & Divisão" é confuso**

---

### 4. FICHAS TÉCNICAS (Empty State)

**Observação Visual:**

- Título grande: "Fichas Técnicas"
- Abas de categoria: Bolos, Doces, Salgados, etc (pills)
- Aba ativa tem background roxo escuro
- Espaço central: Ícone livro (ilustração grande)
- Mensagem: "Nenhuma ficha técnica cadastrada neste setor."
- CTA: "+ Adicionar Primeira Ficha"

**Avaliação:**

✅ **Bom:**
- Empty state tem ícone (não é apenas texto)
- CTA é claro e convidativo
- Mensagem em português natural

❌ **Problemas:**

**P1: Empty state text muito pequeno (text-sm)**
- Fonte: ~14px
- Poderia ser maior para ler de longe

**P1: CTA "Adicionar Primeira Ficha" ambíguo**
- Confeiteira não sabe o que é "Ficha"
- Sem explicação anterior
- Deveria estar em "Por que criar uma ficha?" ou "O que é uma ficha técnica?"

**P2: Abas de categoria não explicadas**
- 5 abas diferentes
- Nenhuma diz "escolha uma"
- Usuária pode pensar "preciso preencher todas?"

**P2: Sem helper text ou tour visual**
- Usuária nova vê empty state
- Nenhuma ajuda contexual ("Dica: Crie sua primeira receita aqui")

**Classificação Geral:** 🟡 **ACEITÁVEL, MAS PODERIA AJUDAR MAIS**

---

### 5. FORMULÁRIOS (Novo Pedido Modal)

**Observação Visual:**

**Header do Modal:**
- Ícone pink/rose
- Título: "Lançar Novo Pedido"
- Ícone X para fechar (branco, fundo transparente)

**Seções:**
- TIPO DO LANÇAMENTO: 4 botões horizontais
- DADOS DA CLIENTE: Campos com background rosa claro (#F5B9C6)
- Labels com ícones (telefone, calendário, mapa, etc)
- Campo com cor diferente: pink/rose focus ring
- Botões de ação lado a lado: "+ Adicionar" (cor primária)

**Avaliação:**

✅ **Bom:**
- Modal desliza de baixo (natural em mobile)
- Ícones nos labels = visual clarity
- Focus ring visível (acessibilidade)
- Cores consistentes

❌ **Problemas:**

**P0: Modal MUITO LONGO (requer 5+ scrolls)**
- Seções empilhadas verticalmente
- Usuária perde contexto enquanto scrolls
- Em mobile com teclado aberto, é pior

**P1: Campos com background rosa demais**
- Todo input tem background rosa (#F5B9C6)
- Muito saturado, cansativo visualmente
- Deveria ser fundo branco com border

**P1: Labels sem asterisco (*) para campos obrigatórios**
- Alguns campos têm "*", outros não
- Inconsistência confunde
- Usuária não sabe qual é requerido

**P1: Espacamento entre seções inadequado**
- Seções juntadas demais
- Difícil separar visualmente
- Padding vertical insuficiente

**P2: Botões de ação (Adicionar) muito pequenos**
- "+ Adicionar" tem ~40px height
- Deveria ser 44px (WCAG)

**P2: Sem seção separada/visível de "Resumo"**
- Total aparece após scroll
- Usuária não sabe qual é o valor final enquanto preenche

**Classificação Geral:** 🔴 **CRÍTICO — Modal é confuso e cansativo**

---

### 6. CARDS (Pedidos, Clientes)

**Observação Visual:**

**Card de Pedido:**
- Border-left: cor de destaque (roxo)
- Header: Cliente + Badge de status
- Body: Data, valor
- Footer: Botões de ação (PDF, Editar, Deletar)

**Avaliação:**

✅ **Bom:**
- Border-left diferencia cards
- Status badge colorido (Pago = verde)
- Informações bem hierarquizadas

❌ **Problemas:**

**P1: Informação truncada em cards**
- Nome de cliente: "Maria Silva Olivei..." (truncado)
- Observação: "Entregar às 15h, sem glacê..." (truncado)
- Usuária pensa "é o pedido certo?" e abre errado

**P1: Ação de deletar visível demais**
- Ícone lixeira (vermelho) está lado a lado com Editar
- Fácil de clicar errado
- Não há confirmação dupla

**P2: Spacing entre cards adequado, mas poderia ser maior**
- Cards não têm espaçamento vertical suficiente
- Em lista longa, fica repetitivo

**Classificação Geral:** 🟡 **ACEITÁVEL, MAS COM RISCO DE ERROS**

---

### 7. TABELAS & LISTAS

**Observação Visual:**

- Não há tabelas propriamente ditas
- Tudo é em cards ou listados
- Headers de seção usam "uppercase tracking-wider"

**Avaliação:**

✅ **Bom:**
- Sem tables = melhor para mobile
- Cards são mais responsivos

⚠️ **Potencial:**
- Se tiver muitas colunas no futuro, pode ficar complicado

**Classificação Geral:** 🟢 **BOM**

---

### 8. TIPOGRAFIA

**Análise:**

```
Display (Headings):     Instrument Serif (serif elegante)
Body Text:              Manrope (sans-serif, legível)
Sizes:                  text-xs (12px), text-sm (14px), text-base (16px)
Weights:                400, 600, 700, 800
Line Height:            normal (não é customizado = pode ser tight)
```

**Avaliação:**

✅ **Bom:**
- Duas fontes bem complementares
- Manrope é excelente para legibilidade
- Weights permitem hierarquia visual

❌ **Problemas:**

**P1: text-xs (12px) é borderline WCAG**
- Recomendação: 14px mínimo para body text
- Alguns labels em 12px podem ser ilegíveis
- Pior em luz solar ou para usuárias com presbiopia (50+)

**P1: Line-height não customizado**
- Pode estar apertado em alguns textos
- Deveria ser 1.5–1.6 mínimo

**P2: Sem responsividade de tipografia**
- Tamanho não muda em mobile vs desktop
- Desktop poderia ter text-lg, mobile tem text-sm
- Atualmente uniforme

**Classificação Geral:** 🟡 **ACEITÁVEL, MAS COM PEQUENOS PROBLEMAS**

---

### 9. CORES & CONTRASTE

**Análise:**

```
Primária:       #3A2350 (roxo escuro)
Secundária:     #F5B9C6 (rosa claro)
Sucesso:        #10B981 (verde)
Erro:           #EF4444 (vermelho)
Background:     #FFFFFF (branco)
Text:           #241B2B (quasi-black)
```

**Avaliação:**

✅ **Bom:**
- Contraste texto/fundo: >16:1 (excelente)
- Paleta coerente
- Cores não são hiper-saturadas

❌ **Problemas:**

**P1: Rosa claro (#F5B9C6) vs branco (botões)**
- Contraste: ~6:1 (WCAG AA, mas borderline)
- Botões rosa em fundo branco podem desaparecer
- Pior em alta luminosidade (luz solar)

**P1: Roxo (#3A2350) vs branco (em cards)**
- Quando fundo roxo escuro + texto branco
- Pode ser cansativo após 10 minutos de uso
- Recomenda dark mode ou alternância

**P2: Sem suporte a colorblind**
- Alguns usuários (8% homens, 0.4% mulheres) têm daltonismo
- Vermelho/verde não diferenciável
- Design não oferece alternativa (ícone, padrão, etc)

**Classificação Geral:** 🟡 **ACEITÁVEL, MAS COM PEQUENAS FRAGILIDADES**

---

### 10. NAVEGAÇÃO & FLUXO

**Análise:**

- BottomNav com 6 abas (principal)
- Modals para ações (novo pedido, nova ficha)
- Sem drawer de menu
- Sem breadcrumb

**Avaliação:**

✅ **Bom:**
- BottomNav é clara
- Sem menu escondido (todas as features visíveis)

❌ **Problemas:**

**P0: Sem volta/back em modals**
- Usuária abre modal
- Quer fechar: X é muito pequeno (8×8px)
- Em mobile, difícil alvejar

**P1: Sem breadcrumb em telas aninhadas**
- "Estou aonde?"
- Se abre modal > modal aninhado
- Sem visualização de hierarquia

**P1: Sem indicação de página ativa**
- BottomNav mostra qual aba está ativa
- MAS se usuária está em submenu, não há indicação
- Confundidor

**Classificação Geral:** 🟡 **ACEITÁVEL, MAS COM PROBLEMAS DE VOLTA**

---

### 11. ESTADOS & FEEDBACK

**Análise:**

- Botões têm `active:scale-95` (visual feedback ao clicar)
- Hover states nas listas (background muda)
- Sem loading state explícito
- Sem error states visuais
- Sem empty states em algumas áreas

**Avaliação:**

✅ **Bom:**
- Feedback ao clicar (scale effect)
- Hover states ajudam

❌ **Problemas:**

**P0: Sem loading state**
- Quando salva um pedido: nada acontece visualmente
- Usuária pensa "funcionou ou não?"

**P1: Sem skeleton loading**
- Quando carrega dados: espaço em branco
- Deveria mostrar skeleton/placeholder

**P1: Sem error toast visível**
- Se falha operação: nada aparece
- Usuária pensa "funcionou?"

**P2: Sem confirmation toast para ações**
- "Pedido salvo com sucesso!" — não aparece
- Apenas mudança de tela = feedback tácito (pode não perceber)

**Classificação Geral:** 🔴 **CRÍTICO — Sem feedback claro**

---

## 📊 RESUMO: PROBLEMAS POR PRIORIDADE

### P0: CRÍTICO (Bloqueia UX)
1. "Saldos & Divisão" card confuso (Dashboard)
2. Modal muito longo, cansativo
3. Sem loading/error states
4. Volta/back em modals (X muito pequeno)

### P1: IMPORTANTE (Afeta experiência)
5. Ícones muito pequenos (header, bottomnav)
6. 6 abas apertadas em 375px
7. text-xs (12px) ilegível
8. Campos com background rosa demais
9. Labels sem asterisco (*) para obrigatórios
10. Informação truncada em cards
11. Contraste rosa vs branco borderline

### P2: DESEJÁVEL (Melhoria)
12. Sem breadcrumb
13. Sem badge de notificação
14. Tipografia não responsiva
15. Sem colorblind support
16. Abas de categoria não explicadas
17. Sem helper text em empty states

---

## 🎯 RECOMENDAÇÕES

### Fix Rápido (4h)
1. Aumentar X para fechar modal: 16×16px → 24×24px
2. Adicionar loading spinner ao salvar
3. Aumentar ícones header: 16px → 20px
4. Aumentar text-xs (labels) para text-sm em mobile

### Fix Médio (8h)
5. Refatorar "Saldos & Divisão" card (menos círculos, mais texto)
6. Mudar campos de background rosa para branco com border
7. Adicionar asterisco (*) para campos obrigatórios
8. Adicionar toast "Pedido salvo com sucesso"
9. Adicionar breadcrumb em modals

### Fix Grande (16h)
10. Simplificar modal "Lançar Pedido" (quebrar em steps ou abas)
11. Dark mode support
12. Tipografia responsiva
13. Colorblind mode (padrões em gráficos, não apenas cor)

---

**Classificação Geral:** 🔴 **Design tem fundação boa, mas 4 problemas P0 bloqueiam adoção.**
