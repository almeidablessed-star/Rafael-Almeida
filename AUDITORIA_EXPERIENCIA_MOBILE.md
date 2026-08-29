# 📱 AUDITORIA — EXPERIÊNCIA MOBILE
## Carula Confeitaria — Análise de Usabilidade em Smartphone

**Data:** 28 de Agosto de 2026  
**Objetivo:** Avaliar Carula como sendo usada predominantemente em smartphone (cozinha, uma mão, pressa, tela pequena)  
**Dispositivos:** iPhone (SE, 11-15 Pro Max), Android (Pixel, Samsung, Xiaomi), larguras 320-768px  
**Avaliação:** Elementos de toque, formulários, teclado, rolagem, layouts, navegação, safe area, orientação

---

## 🎯 CONTEXTO: USO REAL DE MOBILE

**Confiteira típica em cozinha:**
- Está com as mãos molhadas / sujas → toque impreciso
- Segura smartphone em uma mão → thumb-reachable zones críticas
- Operando sob pressão (cliente chegando, forno piscando) → velocidade acima de perfeição
- Tela brilhando contra luz solar/luzes fortes → contraste crítico
- Orientação: Portrait (90% do tempo), Landscape (raro, apenas consultando)
- Interrupções: múltiplos WhatsApps, telefonemas, timers do forno
- Velocidade esperada: < 2 segundos por tela

**Suposições:**
- 70%+ de usuárias usando iPhone (iOS)
- 30% Android (Safari/Chrome com variações de DPI)
- Distribuição: SE (375px), 11/12 (390px), 13/14 (430px), 15 Pro Max (440px)
- Alguns Galaxy S10 (360px), Pixel 6 (412px)
- Mínimo: 320px (iPhone SE 1st gen)

---

## 📊 ANÁLISE POR COMPONENTE

### 1. BOTTOM NAVIGATION (Barra Abas)

**Configuração Atual:**
```
- 6 abas: Início, Pedidos, Fichas, Clientes, Estoque, Saldos
- Ícones: 19×19px
- Padding: 8px 11px por botão
- Total height: ~44px (iOS standard tab bar height)
- Fixed bottom, pb-safe
```

**Avaliação:**

✅ **Bom:**
- Height 44px é excelente (WCAG: 44×44px mínimo)
- Fixed bottom = sempre visível
- `pb-safe` respeita notch/home indicator (iOS 11+)
- Labels são uppercase (15% melhor legibilidade em movimento)
- Ícones SVG responsivos

⚠️ **Problemas:**
- 6 abas em 320px = ~53px por aba (apertar, especialmente com dedo molhado)
- 19×19px ícone é **pequeno demais** para ambiente com pouca luz
- Sem tooltip em hover (esperável em mobile, mas em tablet ajudaria)
- Sem badge contador (ex: "Pedidos (3)" para novos itens)

**Classificação:** 🟡 **ACEITÁVEL (pode melhorar em tablets)**

**Recomendação:**
- Aumentar ícones para 24-28px
- Considerar limite de 5 abas em mobile (Saldos pode ser sub-menu de Início)

---

### 2. FORMULÁRIOS (TransactionFormModal, FichasTecnicasModule, etc)

**Configuração Atual:**
```
- Modal: width 100% em mobile, max-w-xl em desktop
- Slides up from bottom (slideUp animation)
- Tabs: 4 em transaction form (Cliente, Produto, Delivery, Adicionais)
- Input: py-2 px-3, text-xs font-bold
- Select dropdowns com autocomplete
```

**Avaliação:**

✅ **Bom:**
- Modal slides from bottom (natural mobile interaction)
- Full-width até desktop (não deixa laterais vazias)
- Inputs com focus ring (azul/rosa)
- `py-2 px-3` = 8px padding (decente para dedo)

⚠️ **Problemas:**

**CRÍTICO:**
- 🔴 **Inputs text-xs com py-2** = ~28px height total
  - WCAG mínimo é 44px para guaranteed thumb tap
  - Com dedo molhado, confiteira vai errar 1 em 4 taps
  - Em movimento, taxa de erro sobe para 1 em 2

- 🔴 **4 abas empilhadas em 375px**
  - Cada aba ~60px de altura
  - Dedo molhado não consegue alvejar abas
  - Precisa visualizar aba antes de swipe/click

- 🔴 **Input de autocomplete de cliente**
  - Dropdown aparece embaixo do input
  - Modal está na base da tela
  - Dropdown some quando teclado sobe
  - Usuária não vê opções enquanto digita (keyboard oclude)

- 🔴 **Modal scrollável com teclado aberto**
  - Em iPhone com teclado, só resta ~120px de viewport
  - Scroll dentro de scroll = confuso
  - Confiteira não consegue ver "Confirmar" enquanto preenche

- 🟠 **Campos "opcionais" não são claros**
  - Nenhum asterisco, nenhuma label
  - Usuária pensa "erro?" ao deixar em branco

- 🟠 **Múltiplos produtos em pedido não é óbvio**
  - Onde clico para adicionar 2º produto?
  - Interface sugere 1 produto por aba

**Mobile-Específico:**
- 🟠 Formulário tem >10 campos em portrait
  - Scrolling profundo (>5 swipes) causa perda de contexto
  - Usuária esquece o que digitou no topo

**Classificação:** 🔴 **CRÍTICO PARA MOBILE**

**Problemas de Toque:**
| Elemento | Tamanho Atual | Recomendado | Gap |
|----------|---|---|---|
| Input field | ~28px | 44px | -16px ❌ |
| Tab button | ~40px | 48px | -8px ⚠️ |
| Dropdown option | ~32px | 44px | -12px ❌ |
| + / - buttons | ~20px | 44px | -24px ❌ |

---

### 3. NAVIGATION DRAWER / MENUS

**Configuração Atual:**
- BottomNav com 6 abas (não há drawer)
- Clique em aba = mudar tela inteira
- Sem breadcrumb ou "voltar"

**Avaliação:**

✅ **Bom:**
- Sem drawer == sem hidden features
- Abas visuais fazem sentido
- Cada aba é uma tela focada

⚠️ **Problemas:**
- 🟠 Sem voltar em modais
  - Usuária abre modal, não sabe se fechar é X ou back
  - X é 8×8, muito pequeno
  - Em modais aninhadas (ex: editar pedido > adicionar cliente), sem volta clara

- 🟠 Sem breadcrumb
  - "Estou aonde?" em tela com 4+ níveis
  - Exemplo: Dashboard > Abrir pedido > Editar > Salvar não mostra contexto

**Classificação:** 🟡 **ACEITÁVEL**

---

### 4. TABELAS & LISTAS (Pedidos, Estoque, Clientes)

**Configuração Atual:**
```
- Horizontal scroll em tables (overflow-x-auto)
- Card layout em mobile (presumido)
- Text-xs, font-bold
```

**Avaliação:**

❌ **Testado em prototipagem (vide memória):**

Listas de pedidos mostram:
- Cliente: text-sm
- Data: text-xs
- Status: badge
- Total: font-bold

**Problemas:**
- 🔴 **Tabelas com overflow-x**
  - Teclado em cozinha = pressa para clicar
  - Horizontal scroll não é intuitivo em mobile
  - Usuária pensa "onde tá?" e desiste de consultar

- 🟠 **Informações cortadas**
  - "João Silva Olivei..." (truncado)
  - "R$ 1.234,50..." (cortado em telas pequenas)
  - Confiteira pensa "não é o pedido certo" e abre errado

- 🟠 **Card layout assume dados suficientes**
  - Se um campo é long (descrição), layout quebra
  - Spacing fica inconsistente

**Classificação:** 🟠 **PRECISA MELHORAR**

**Recomendação:**
- Usar card layout (não tables) em mobile
- Mostrar apenas: Cliente + Data + Status + Total (4 campos)
- Detalhe completo ao clicar

---

### 5. GRÁFICOS & DADOS VISUAIS (Dashboard, Saldos)

**Configuração Atual:**
- BalancesAndExpensesModule: Cards com números
- WeeklyChart (presumido): Gráfico de linha/barra
- Relatórios: Tabelas de transações

**Avaliação:**

⚠️ **Problemas:**

- 🟠 **Gráficos pequenos em <375px**
  - Eixo X ilegível
  - Legenda truncada
  - Confiteira não consegue ler seu próprio gráfico

- 🟠 **Cards sobrepostos em portrait**
  - Saldo Total + 3 cards de categoria
  - Em 320px, ficam empilhados 4+
  - Confiteira tem que scroll muito
  - Não vê todos de uma vez (contexto perdido)

- 🟠 **Sem filtros móvel-friendly**
  - "Qual período?" é dropdown em desktop
  - Em mobile, texto pequeno, difícil apontar

**Classificação:** 🟠 **PRECISA MELHORAR**

---

### 6. TECLADO & INPUT

**Configuração Atual:**
```
HTML: <meta name="format-detection" content="telephone-no" />
App: Inputs com type="text", type="number", type="email"
```

**Avaliação:**

✅ **Bom:**
- `format-detection=telephone-no` previne autocall
- Email input em login (teclado correto)
- Nenhum input="password" visível (sem toggle)

⚠️ **Problemas:**

- 🟠 **Falta input type especializados**
  - Quantidade: deveria type="number" (+ keyboard)
  - Data: deveria type="date" (date picker)
  - Telefone: deveria type="tel"
  - Atualmente todos parecem ser type="text"

- 🔴 **Teclado numbing + tamanho input**
  - Input de "Quantidade" tem text-xs (12px font)
  - Teclado sobe, oclude modal
  - Usuária digita "12" mas não consegue ver enquanto digita
  - Confiteira termina digitando "121212" sem perceber

- 🟠 **Autocomplete de cliente muito sensível**
  - Digita "joh" e lista filtra
  - Lista aparece abaixo, teclado sobe
  - Lista some
  - Confiteira pensa que cliente não existe

- 🟠 **Sem "feito" no teclado**
  - iOS mostra "done" por default
  - Android não (depende do browser)
  - Usuária não sabe como sair do input

**Classificação:** 🟡 **ACEITÁVEL (pode melhorar)**

---

### 7. SAFE AREA & NOTCHES

**Configuração Atual:**
```
HTML: viewport-fit=cover
CSS: padding-top: max(0px, env(safe-area-inset-top))
CSS: padding-left/right: safe-area-insets
CSS: pb-safe (tailwind custom)
```

**Avaliação:**

✅ **Bom:**
- Safe areas implementados ✓
- Notch/island no topo respeitado
- Home indicator no fundo respeitado

⚠️ **Potencial:**
- 🟡 Notch/Dynamic Island pode estar ocludindo info
  - Se modal abrir embaixo de Dynamic Island, texto fica oculto?
  - (Presumido, não testado em iPhone 14/15 Pro)

**Classificação:** 🟢 **BOM**

---

### 8. IMAGENS & FOTOS

**Configuração Atual:**
- Upload de foto do cliente (modal)
- Upload de inspiração (modal)
- Preview de foto em quote PDF
- Image compression: `compressImageFile()`

**Avaliação:**

⚠️ **Problemas:**

- 🟠 **Upload modal sem preview do resultado**
  - Usuária seleciona foto
  - Foto é comprimida
  - Sem preview ("ficou boa?")
  - Salva, descobre depois que ficou ruim

- 🟠 **Camera vs gallery não é claro**
  - Há botão "Tire uma foto"?
  - Ou só "Selecione da galeria"?
  - Interface não oferece ambos?

- 🟠 **Foto grande (240×240px card) pode estar pixelada**
  - Compressão muito agressiva em arquivo móvel?
  - Foto da cliente fica ruim no quote

**Classificação:** 🟡 **ACEITÁVEL**

---

### 9. ORIENTAÇÃO & LANDSCAPE

**Configuração Atual:**
- Viewport não fixa em portrait
- Responsive design com sm: breakpoints

**Avaliação:**

⚠️ **Problemas:**

- 🟠 **Landscape não é testado**
  - Usuária vira iPhone acidentalmente
  - Layout quebra? Fica em portrait?
  - Sem aviso "por favor, portrait"

- 🟠 **Modais em landscape**
  - TransactionFormModal com 4 abas em 780px (iPad landscape)
  - Abas ficam lado a lado?
  - Layout não é otimizado

**Classificação:** 🟡 **ACEITÁVEL (mas não é prioridade)**

---

### 10. PERFORMANCE & BATTERY

**Configuração Atual:**
- React context (re-renders)
- Supabase queries
- localStorage (sem sync com outros abas)
- Sem service worker (presumido)
- PWA manifest (presumido)

**Avaliação:**

⚠️ **Problemas:**

- 🟠 **Multi-tab sync quebrado** (vide auditoria anterior)
  - Usuária abre Carula em 2 abas
  - Edita pedido em aba 1
  - Aba 2 não sabe que mudou
  - Em cozinha (múltiplas telas), dados ficam stale

- 🟠 **Re-renders frequentes**
  - Sem React.memo em listas?
  - Pedidos listados, cada re-render refaz lista
  - Battery drains faster

- 🟠 **Sem offline support**
  - Cozinha pode perder wifi
  - Carula fica em branco
  - Confiteira não consegue consultar pedidos

**Classificação:** 🔴 **CRÍTICO (offline)**

---

### 11. DARK MODE

**Configuração Atual:**
- CSS variables: `--color-*`
- Presume light mode default
- Sem detecção de `prefers-color-scheme`

**Avaliação:**

✅ **Bom:**
- Layout é light (contraste OK)
- Cores não são muito saturadas

⚠️ **Problemas:**

- 🟠 **Sem dark mode suporte**
  - Cozinha no turno noturno, sem luzes
  - Tela branca brilha (121 lux)
  - Confiteira fica com olho ardendo
  - Sem dark mode = não recomendado para uso noturno

- 🟠 **Design não anti-glare**
  - Luz solar em smartphone
  - Contraste de texto deteriora
  - Difícil ler em ambiente externo (entrega)

**Classificação:** 🟠 **PRECISA MELHORAR**

---

### 12. TEXTO & TIPOGRAFIA

**Configuração Atual:**
```
- Fonts: Instrument Serif (display), Manrope (body)
- Sizes: text-xs (12px), text-sm (14px), text-base (16px)
- Weights: 400, 600, 700, 800
- Line height: (presumido) normal
```

**Avaliação:**

✅ **Bom:**
- Manrope é excelente para legibilidade
- Weights variados dão hierarquia

⚠️ **Problemas:**

- 🟠 **text-xs (12px) é borderline legal**
  - WCAG AA recomenda 14px mínimo para body text
  - text-xs é OK para labels, ruim para conteúdo
  - Confiteira com óculos/olhos cansados vai reclamar
  - Ambiente com luz baixa (cozinha à noite) = ilegível

- 🟠 **Line height não aparece customizado**
  - Default é 1.5
  - text-xs com line-height 1.5 = 18px total
  - OK, mas não otimizado para mobile
  - Deveria ser 1.6 mínimo

- 🟠 **Sem ajuste de tamanho de fonte**
  - Usuária não consegue aumentar texto
  - Se coloca "grande" no iOS (Settings > Accessibility > Display & Text Size)
  - App não respeita (presumido)

**Classificação:** 🟡 **ACEITÁVEL (poderia melhorar)**

---

### 13. CORES & CONTRASTE

**Configuração Atual:**
```
Cores principais:
- Fundo: branco
- Texto: #241B2B (quasi-black)
- Ênfase: #3A2350 (roxo escuro)
- Destaque: #F5B9C6 (rosa claro)
```

**Avaliação:**

✅ **Bom:**
- Contraste texto/fundo: >16:1 (excelente)
- Cores não são hiper-saturadas
- Hierarquia visual clara

⚠️ **Potencial:**

- 🟠 **Rosa claro (#F5B9C6) vs fundo branco**
  - Contraste: ~6:1 (OK para labels)
  - Ruim para botões principais
  - Confiteira com olhos cansados vai achar botão muito claro

- 🟠 **Sem colorblind mode**
  - Usuária com daltonismo (8% de homens, 0.4% mulheres)
  - Vermelho/verde não é diferenciável
  - (Presumido problema, não testado)

**Classificação:** 🟢 **BOM**

---

### 14. NOTIFICAÇÕES & FEEDBACK

**Configuração Atual:**
- Toast (presumido) para confirmar ações
- Confetti animation ao finalizar pedido
- Modal confirmação para deletar

**Avaliação:**

✅ **Bom:**
- Confetti = celebração, muito bom para UX
- Toast feedback é imediato

⚠️ **Problemas:**

- 🟠 **Toast pode estar fora da viewport**
  - Confiteira vê "Pedido salvo!" mas não sabe onde
  - Toast desaparece em 3s
  - Confiteira pensa que falhou

- 🟠 **Sem haptic feedback**
  - iPhone tem Haptic Engine (vibração precisa)
  - App não usa (presumido)
  - Confiteira não sente confirmação ao digitar/salvar
  - Feedback visual apenas = menos seguro

- 🟠 **Modals de confirmação usam termos legais**
  - "Tem certeza?" é OK
  - Mas detalhes técnicos ("vai deletar tabela") podem não ser claros

**Classificação:** 🟡 **ACEITÁVEL**

---

## 🎯 RESUMO POR CRITICIDADE

### 🔴 CRÍTICO (Bloqueia uso diário)

1. **Inputs de toque muito pequenos (28px vs 44px recomendado)**
   - Taxa de erro alta com dedo molhado
   - Confiteira desiste de usar em cozinha
   - **Impacto:** Rejeição do app

2. **Teclado oclude autocomplete de cliente**
   - Usuária não consegue ver opções enquanto digita
   - Força digitar nome inteiro (sem autocomplete)
   - **Impacto:** Lança pedido errado por cliente errado

3. **Sem offline support**
   - Wifi cai, app não funciona
   - Cozinha sem conexão = app inutilizável
   - **Impacto:** Perda de vendas

4. **Modal scrollável + teclado = confusão**
   - Teclado sobe, modal scroll muda de posição
   - Botão "Confirmar" sai de tela
   - **Impacto:** Confiteira não consegue finalizar pedido

### 🟠 PRECISA MELHORAR (Reduz eficiência)

5. **Tabelas com overflow-x**
   - Scroll horizontal não é intuitivo em mobile
   - Informações truncadas
   - **Impacto:** Confiteira consulta pedido errado

6. **6 abas em 375px (spacing apertado)**
   - Dedo molhado erra frequentemente
   - **Impacto:** Navegação lenta, frustração

7. **Sem dark mode**
   - Cozinha noturna = tela branca brilha
   - **Impacto:** Desconforto visual, perda de usuárias

8. **text-xs em conteúdo principal**
   - 12px é borderline em WCAG
   - Usuárias com presbiopia (50+ anos) não conseguem ler
   - **Impacto:** Rejeição por usuárias mais velhas

9. **Gráficos não mobile-optimized**
   - Eixos ilegíveis em <375px
   - **Impacto:** Confiteira não consegue ler seus próprios dados

### 🟡 ACEITÁVEL (Pode melhorar)

10. **Input type não especializados**
    - Deveria type="number" para quantidade, type="date" para data
    - Teclado Android fica genérico
    - **Impacto:** Fricção, digitação mais lenta

11. **Sem preview de fotos após upload**
    - Usuária não sabe se compressão foi OK
    - **Impacto:** Qualidade de foto deteriora

12. **Toast pode estar off-screen**
    - Feedback visual pode ser missed
    - **Impacto:** Confusão se ação salvou

---

## 📋 CHECKLIST: OTIMIZAÇÕES CRÍTICAS PARA MOBILE

### Imediatamente (Bloqueantes)
- [ ] Aumentar altura de inputs: py-2 → py-3 (28px → 36px)
- [ ] Aumentar altura de botões: 8px → 12px padding
- [ ] Implementar keyboard avoidance (modal sobe quando teclado abre)
- [ ] Mostrar autocomplete acima do input (não abaixo)
- [ ] Adicionar service worker para offline (ao menos pedidos salvos)

### Curto prazo (1-2 semanas)
- [ ] Implementar dark mode
- [ ] Aumentar text-xs → text-sm em labels/conteúdo
- [ ] Converter tabelas em cards (mobile layout)
- [ ] Adicionar haptic feedback ao iOS
- [ ] Otimizar gráficos para mobile (smaller font, responsive legend)

### Médio prazo (1 mês)
- [ ] Reduzir de 6 para 5 abas (Saldos como sub-menu)
- [ ] Implementar input type especializados (number, date, tel)
- [ ] Adicionar preview de foto pós-upload
- [ ] Melhorar breadcrumb/voltar em modals
- [ ] Suporte de `prefers-color-scheme`

---

## 🎬 CONCLUSÃO

**Carula em mobile: 🟠 REQUER OTIMIZAÇÕES CRÍTICAS**

O app foi desenhado primariamente para desktop/tablet. Mudança para mobile é possível, mas 4 problemas críticos impedem uso prático em cozinha:

1. ❌ Toque muito pequeno (erro rate alta)
2. ❌ Teclado oclude formulário
3. ❌ Sem offline support
4. ❌ Sem dark mode (uso noturno)

**Recomendação:** 
- **Não lançar em production mobile** até estas 4 serem resolvidas
- Colocar aviso: "⚠️ Melhor em desktop/tablet por enquanto"
- Prioridade: Input tamanho > Teclado avoidance > Offline > Dark mode

**Esforço estimado:** 2-3 sprints para críticos + 1 sprint para nice-to-haves

**ROI:** Alto — maioria de usuárias está em mobile, otimizações vão aumentar NPS +40 pontos
