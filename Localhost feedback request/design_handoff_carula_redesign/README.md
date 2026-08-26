# Handoff: Redesign visual do app Carula Confeitaria

## Visão geral

Redesign **puramente visual** do app Carula Confeitaria (React 19 + Vite + Tailwind CSS 4 + TypeScript, repo `almeidablessed-star/Rafael-Almeida`, branch `main`).

Regra central, definida pelo cliente: **não alterar** estrutura de navegação das abas, nomes, textos, rótulos, contagens nem lógica de negócio. Só a camada visual muda — paleta, tipografia, sombras, gradientes, forma dos indicadores e microanimações. Adicionalmente, foi desenhado um shell desktop (sidebar) que reaproveita a mesma lista de abas.

## Sobre os arquivos de design

Os arquivos deste pacote são **referências de design feitas em HTML** — protótipos que mostram aparência e comportamento pretendidos, **não código de produção para copiar**. A tarefa é **recriar esses designs no ambiente já existente do app** (React 19 + Tailwind 4 + TS), usando os padrões, componentes e utilitários que o projeto já tem. Nenhum handler, rota, cálculo, tipo ou string precisa mudar.

## Fidelidade

**Alta fidelidade (hifi).** Cores, tipografia, espaçamentos, raios, sombras e durações abaixo são finais e devem ser reproduzidos fielmente. Os dados exibidos nos protótipos são os dados reais lidos dos módulos do repositório (mesmos rótulos, mesmas categorias, mesmos textos de ajuda).

\---

## Design tokens

### Cores

|Token|Hex|Uso|
|-|-|-|
|`--color-brand-900`|`#3A2350`|Cabeçalhos, sidebar, ação principal, aba ativa|
|`--color-brand-700`|`#6E3F72`|Meio do degradê, ícones, rótulos fortes|
|`--color-brand-500`|`#A85E86`|Fim do degradê, acentos|
|`--color-rose-200`|`#F5B9C6`|Texto/ícones sobre roxo, selos, ícone do botão|
|`--color-rose-600`|`#C4626F`|Alertas, excluir, valores negativos|
|`--color-sand-200`|`#E4D9C3`|A receber, datas, neutros quentes|
|`--color-mint-300`|`#A9D8B8`|Positivo, pago, apoio|
|`--color-surface`|`#F6F2F5`|Fundo do app|
|`--color-card`|`#FFFFFF`|Cards e painéis|
|`--color-ink`|`#241B2B`|Títulos e valores|
|`--color-ink-soft`|`#7A6E80`|Texto secundário|

Cores auxiliares usadas em contexto: `#8F5A9C` (roxo claro em degradês de dia com pedido), `#7E4F9E` (mão de obra), `#B08D57` (custos operacionais), `#4C7358` (verde de texto “pago”), `#F3E9F3` (lavanda de fundo de selo), `#FAF7FA` (fundo interno de bloco), `#F0E2C8` (bege de destaque de data), `#F1ECF2` (trilho de medidor).

Degradê da marca (cabeçalho mobile, sidebar desktop, cards de destaque):

```css
linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%);
```

Degradê de dia com pedido / faixa de comanda: `linear-gradient(150deg, #8F5A9C, #C4626F)`.

### Tipografia

Duas famílias, carregadas via Google Fonts no `index.html`:

* **Instrument Serif** (regular) — marca e títulos. Marca 32px no mobile / 26px na sidebar; título de tela 28–30px; título de card 19–24px; line-height 1.1–1.15.
* **Manrope** (400/600/700/800) — todo o resto. Valores 17–42px peso 800 com `letter-spacing:-.02em` a `-.03em`; rótulos 9–11px peso 800 caixa alta com `letter-spacing:.05em–.14em`; corpo 11–13px peso 400/600, `line-height:1.5–1.6`.

Mínimos: valor 17px, rótulo 9px, corpo 11px, alvo de toque 44px.

### Raios

Tela/moldura 40px (mobile) e 26px (desktop) · card 22–26px · bloco interno 16–18px · botão 14–16px · ícone-botão 10–12px · pílula/selo 999px.

### Sombras

|Uso|Valor|
|-|-|
|Card em repouso|`0 8px 20px rgba(58,35,80,.09)`|
|Card em hover|`0 20px 36px rgba(58,35,80,.18)`|
|Botão principal|`0 10px 20px rgba(58,35,80,.3)`|
|Card de destaque (degradê)|`0 14px 30px rgba(58,35,80,.3)`|
|Barra inferior|`0 -8px 24px rgba(58,35,80,.07)`|
|Moldura de tela|`0 30px 70px rgba(58,35,80,.26)`|

### Espaçamento

Escala em uso: 4 · 5 · 6 · 7 · 8 · 9 · 10 · 11 · 12 · 13 · 14 · 16 · 18 · 20 · 22 · 24 · 26 · 30px. Padding de tela mobile 18px; padding de conteúdo desktop 22px 30px; gap entre cards 11–16px.

\---

## Padrões de componente

**Card.** Fundo `#FFFFFF`, raio 22–26px, sombra de repouso. Hover: `translateY(-5px)` + sombra de hover, `transition: transform .28s ease, box-shadow .28s ease`.

**Botão principal.** Fundo `#3A2350`, texto `#F5B9C6`, raio 14px, sombra de botão, hover `translateY(-3px)`, transição .22s.

**Botão “Lançar Pedido” (etiqueta de comanda).** Degradê da marca, raio 20px, padding 18px 20px. Dois círculos de 22px na cor do fundo (`#F6F2F5`) posicionados em `left:-11px` e `right:-11px`, `top:50%`, `translateY(-50%)`, criando o recorte. Bloco de texto com `border-left:2px dashed rgba(245,185,198,.5)`: sobre-rótulo “NOVA COMANDA” 9px/800/`letter-spacing:.24em` em `rgba(247,220,225,.8)`, e “+ Lançar Pedido” em Instrument Serif 29px `#FFFFFF`. À direita, selo de 44px raio 14px em `#F5B9C6` com ícone “+” `#3A2350` e animação `carFloat`. Faixa de brilho `carSweep` cruzando o botão. Hover: `translateY(-3px) rotate(-.6deg)`.

**Selo / pílula.** Padding 5px 10px, fonte 9–10px peso 800, raio 999px, `white-space:nowrap`, `flex-shrink:0`. Verde `#A9D8B8`/texto `#26402F` = pago ou positivo · bege `#E4D9C3`/texto `#5B4A2E` = pendente ou a receber · rosé `#C4626F`/texto `#FFF8F6` = alerta · lavanda `#F3E9F3`/texto `#3A2350` = categoria ou cliente. **Todos os selos de uma mesma linha usam exatamente o mesmo tamanho** (exigência explícita do cliente).

**Medidor.** SVG, trilho `#F1ECF2` ou `rgba(255,255,255,.18)` sobre roxo, `stroke-linecap:round`, `transform:rotate(-90deg)` no anel. Três variantes:

* *Anel de margem* (Início/Pedidos): r=38–43, stroke 9–10, traço `#F5B9C6` com `filter:drop-shadow(0 0 8px rgba(245,185,198,.6))`, percentual ao centro.
* *Anel de composição* (Fichas): três arcos consecutivos `#6E3F72` / `#C4626F` / `#B08D57` proporcionais a reposição, mão de obra e custos operacionais, com “SUGESTÃO” + valor ao centro. Circunferência base 220 para r=35.
* *Arco 0–100* (Estoque): `path d="M8 44a30 30 0 0 1 60 0"`, comprimento 126, stroke 9–10. **Escala: 100% = 4× o estoque mínimo do insumo**; cor `#6E3F72` normal, `#B08D57` abaixo de 45%, `#C4626F` quando `quantidade <= mínimo`.

**Barra inferior (mobile).** Fundo `#FFFFFF`, borda superior `rgba(36,27,43,.08)`, padding `12px 8px 22px`, `justify-content:space-around`. Item ativo: cápsula `#3A2350` raio 16px, ícone e rótulo `#F5B9C6`, rótulo 9px/800. Inativo: ícone e rótulo `#A096A6`, rótulo 9px/600. Todos: hover `translateY(-4px)`, transição .25s.

**Sidebar (desktop).** Largura 236px, fundo `linear-gradient(180deg,#3A2350,#4A2C5C)`, padding 26px 18px. Topo: avatar 40px + marca. Itens: padding 11px 13px, raio 14px; ativo com `linear-gradient(120deg,#F5B9C6,#C4626F)` e texto `#3A2350`; hover `translateX(4px)` + `rgba(255,255,255,.12)`. Rodapé: selo “VERSÃO MOBILE” e “Baixar dados”.

**Cabeçalho mobile (11a).** Degradê da marca, padding 18px 20px, três colunas: avatar 36px clicável (anel `linear-gradient(140deg,#F5B9C6,#C4626F)` de 2px em volta de círculo branco com “C” em Instrument Serif 16px `#6E3F72`) · marca centrada (“Carula” 32px + “CONFEITARIA” 8px/700/`letter-spacing:.44em`) · dois ícones de 32px raio 11px em `rgba(255,255,255,.16)`: versão mobile (retângulo arredondado 10×20 com risco de alto-falante) e baixar dados.

\---

## Telas

Todas as telas mobile são molduras de **390px** de largura; as desktop, **1280px**.

### 1\. Início — `3a`

* **Objetivo:** panorama do mês e agenda.
* **Layout mobile:** cabeçalho em degradê contendo, na ordem: barra da marca; medidor de margem 92px + “LUCRO LÍQUIDO DO MÊS (RENDIMENTO)” + valor 32px/800 + selo “Positivo”; frase “🎉 Resultado excelente! …”; três blocos `rgba(255,255,255,.12)` (VENDAS PAGAS, SAÍDAS, ⏳ A RECEBER — este em `rgba(228,217,195,.28)`); botão “Ver Detalhamento das Vendas” em `rgba(255,255,255,.12)` com borda. Abaixo, painel claro com `border-radius:28px 28px 0 0` e `margin-top:-14px` sobrepondo o cabeçalho.
* **Conteúdo do painel:** botão de comanda; “Saldos \& Divisão dos Pedidos” + subtítulo “Entradas das vendas pagas − Compras registradas” + três medidores circulares (72% Reposição R$ 1.240 · 48% Mão de Obra R$ 860 · 35% Custo + Invest. R$ 620) + nota “50% Custo (R$ 310,00) / 50% Invest.”; card “Agenda de Pedidos”.
* **Agenda:** calendário do **mês inteiro**, só os dias (sem lista de pedidos dentro), grade 7 colunas com `aspect-ratio:1` e gap 6px, raio 13px. Estados: fora do mês `#D3C9D6` sem fundo · livre `#F6F2F5` com hover `#EFE6F0` + `translateY(-2px)` · com pedido degradê `150deg,#8F5A9C,#C4626F` texto branco 800 · hoje fundo `#F6F2F5` com `border:1.5px solid #6E3F72` e texto `#6E3F72`. Cabeçalho com setas de mês e “AGOSTO”; legenda com os três estados.
* **Desktop (`13a`):** duas colunas — esquerda (flex 1.15) card de lucro grande (medidor 104px, valor 42px) + os três medidores em linha; direita (flex 1) calendário + card “Próximas entregas”. Botão de comanda no cabeçalho da página.

### 2\. Pedidos — `6a` / `13b`

* **Cabeçalho em degradê:** título “Pedidos \& Encomendas”, selo “12 Pedidos”, “TOTAL EM VENDAS” R$ 8.420,00 (32px/800), “12 encomendas registradas”, e dois blocos: “✓ VENDAS PAGAS R$ 7.270,00 / 9 pedidos pagos” em `rgba(169,216,184,.22)` e “⏳ A RECEBER (PENDENTES) R$ 1.150,00 / 3 pedidos pendentes” em `rgba(228,217,195,.26)`.
* **Busca:** placeholder “Buscar por nome da cliente ou descrição do produto...” com lupa a 13px da borda.
* **Filtros:** controle segmentado em `#EDE6EF` raio 12px padding 3px; ativo `#3A2350` texto branco raio 9px; rótulos “Todos (12)”, “Pagos (9)”, “Pendentes (3)”.
* **Card de pedido (comanda):** raio 22px, padding `16px 18px 16px 22px`, faixa vertical de 6px à esquerda (degradê roxo→rosé quando pago, bege→dourado quando pendente), dois recortes circulares de 18px nas laterais. Conteúdo: selo “👤 CLIENTE: NOME” + selo de status; linha “📅 Data: … • Pgto: …”; separador `1px dashed rgba(36,27,43,.14)`; rodapé com valor **17–18px/800, idêntico em pago e pendente**, e as ações: PDF (`#3A2350`/`#F5B9C6`), “Pendente” ou “Marcar PAGO”, e dois ícones circulares de 28px (editar, excluir). **Todas as ações com padding 5px 10px, fonte 9px/800, nowrap** — mesmo tamanho do selo de status. Fundo do card pendente: `#FFFCF6`.
* **Desktop:** coluna lateral de 290px com total em degradê + dois cards de resumo; grade de duas colunas para as comandas; a linha de ações usa `flex-wrap:wrap` com `row-gap:10px`.

### 3\. Fichas Técnicas — `7b` / `14a`

* **Cabeçalho:** “Fichas Técnicas” + botão “Nova Ficha”.
* **Categorias:** as cinco reais — “🎂 Bolos”, “🧁 Doces \& Sobremesas”, “🥟 Salgados”, “🥗 Saudáveis \& Fit”, “🧸 Kids Friendly” — dentro de um card branco raio 20px com `flex-wrap:wrap` e gap 7px, **em duas linhas, sem corte e sem rolagem**. Ativa: `#3A2350` texto branco; inativa: `#F6F2F5`/`#5B4A6B`. Hover: `translateY(-3px)` + sombra (efeito de “levantar/sobrepor”).
* **Card de ficha:** nome em Instrument Serif 21–23px; selo de rendimento (ex.: “10 fatias (Aproximadamente 1.5kg)”); foto 72–84px raio 18–20px com borda branca de 2px; **anel de composição** com legenda ao lado (Reposição / Mão de Obra / Custos Op. com valores em `$`); pílula “Ver N Insumos” com chevron; rodapé com Editar (degradê roxo, raio `20px 20px 6px 20px`), Duplicar (`#F3E9F3`, raio `20px 20px 20px 6px`) e Excluir (`#FBECEE`) — altura 38–40px.
* **Dados de referência:** Bolo Vulcão Ninho com Nutella (35.93 / 20.00 / 10.00 → 65.93, 7 insumos) · Bolo Red Velvet Especial Velvet (35.75 / 25.00 / 12.00 → 72.75, 5 insumos) · Bolo de Cenoura com Brigaderia (20.40 / 18.00 / 9.00 → 47.40, 5 insumos).
* **Desktop:** grade `repeat(auto-fill,minmax(400px,1fr))`.

### 4\. Estoque — `8a` / `14b`

* **Cabeçalho:** rótulo “Estoque de Insumos \& Ingredientes”, título “Controle de Estoque”, frase “Acompanhe suas quantidades em gramas, ml e unidades para nunca faltar ingredientes na produção.”, selo “⚠ 1 Estoque Baixo”.
* **Ações:** busca “Buscar insumo no estoque...” + botão “Adicionar Insumo”.
* **Card de insumo:** arco medidor 76–84px à esquerda com percentual embaixo; nome 13–14px/800; selo “⚠ Estoque Baixo” quando aplicável; “Alerta quando menor que: N un”; stepper − / valor / + (botões de 26–28px brancos raio 9px sobre trilho `#F6F2F5`); ícones editar e excluir. Card em `#FDF4F5` com borda `rgba(196,98,111,.35)` quando abaixo do nível. Hover: `translateY(-6px) scale(1.015)` com `cubic-bezier(.2,.8,.3,1)` e sombra `0 24px 40px rgba(58,35,80,.22)` — efeito “quase 3D”; o contêiner da lista usa `perspective:900px`.
* **Dados de referência:** Farinha de Trigo 5000g (mín. 1000) · Açúcar Refinado 3000g (mín. 1000) · **Cacau em Pó 100% 250g (mín. 300 — abaixo do nível)** · Leite Integral 2000ml (mín. 1000) · Ovos Grandes 30un (mín. 12) · Leite Condensado 8un (mín. 4).
* **Desktop:** grade `repeat(auto-fill,minmax(420px,1fr))`; a frase de ajuda e o selo de alerta vão para uma faixa em degradê no topo.

### 5\. Clientes — `9c` / `14c`

* **Cabeçalho:** ícone de clientes, “Clientes”, “2 clientes cadastradas”; busca “Buscar cliente por nome, telefone ou cidade...”; botão “Cadastrar Nova Cliente”.
* **Card de cliente:** capa em degradê da marca com avatar circular de 46–52px (`rgba(255,255,255,.16)` + borda), nome em Instrument Serif 21–24px branco, selo de cidade em **bege `#F0E2C8` com texto `#3A2350`** e botão de WhatsApp `#F5B9C6` de 34–38px. Corpo claro: pílulas “📞 telefone” e “🏠 endereço” em `#F6F2F5` com texto escuro, mais editar/excluir.
* **Datas:** cabeçalho “🗓️ Todas as Datas Comemorativas” + selo “N datas” + chevron, com `border-radius:16px 16px 0 0` e `border-bottom:none`; o painel “🗓️ Datas e Lembretes de <Nome>:” é **contíguo**, com `border-radius:0 0 16px 16px`, `border-top:none` e `margin-top:-11px` — os dois formam um bloco único. **Clicar no cabeçalho recolhe e expande o painel**; o chevron gira 180°, transição .25s. Cada data: “🎂 Título”, “Data: DD/MM” com o valor destacado em `#F0E2C8`, e botão “Avisar” com ícone de WhatsApp.
* **Rodapé:** card “Envio via WhatsApp / Modo atual: WhatsApp Business” + botão “Configurar WhatsApp” em `#4C7358`.
* **Dados de referência:** Camila Santos · (781) 420-6892 · Beverly · 103 Cabot St · 17 datas. Ana Paula Silva · (857) 310-9941 · Somerville · 45 Broadway St · 16 datas.
* **Legibilidade:** proibido rosa chapado com texto branco. Informação sempre em texto escuro (`#241B2B` / `#5B4A6B`) sobre superfície clara; roxo e rosé só em capas, avatares, selos e ações.
* **Desktop:** grade `repeat(auto-fill,minmax(470px,1fr))`; as datas em duas colunas dentro do painel.

### 6\. Saldos — `10b` / `14d`

* **Cabeçalho:** rótulo “Saldo”, selo “Gestão Real”, título “Saldo \& Compras”, frase “O dinheiro das vendas é acumulado automaticamente aqui no Saldo. Quando você faz uma compra, registre a despesa para descontar da categoria correta.”
* **Card de total:** degradê da marca, “SALDO TOTAL DISPONÍVEL” + `$ 2,720.00` (31–38px/800) e barra empilhada de 10–12px dividindo `#F5B9C6` 45,6% / `#D6B8E0` 31,6% / `#A9D8B8` 22,8%, com legenda dos três cofrinhos.
* **Cofrinhos (linhas compactas):** “🔄 REPOSIÇÃO `$ 1,240.00` — Para reposição de ingredientes e embalagens. — Entrou `+$ 3,180.00` · Gasto `-$ 1,940.00`” · “🟣 MÃO DE OBRA `$ 860.00` — Seu salário acumulado pelas produções. — Acumulado `+$ 860.00`” · “📊 CUSTO + INVESTIMENTO `$ 620.00` — Dividido por 2 (50% Custo e 50% Investimento). — 🔴 Custo `$ 310.00` · 📈 Invest. `$ 310.00`”.
* **Formulário “Lançar Compra Real / Despesa”:** subtítulo “Desconta automaticamente do cofrinho selecionado”; campo “O que você comprou? (Descrição)” com placeholder “Ex: 2 sacos de farinha, 2 formas e bicos”; escolha de categoria “🔄 Reposição” (selecionada: `#F3E9F3` com borda `#B892BE`) / “📈 Investimento”; “Valor Gasto (R$)” e “Data da Compra”; botão “Registrar Compra e Descontar do Cofrinho”.
* **Histórico:** “Histórico de Compras Realizadas (3)”, ajuda “Ajuste ou remova lançamentos se digitou algo errado”, filtros Todos / Reposição / Investimento, busca “Buscar compra...”, e linhas com selo de categoria, descrição, data, valor em `#C4626F` prefixado por `-`, e ícones editar/excluir. Hover da linha: `translateX(3px)` + fundo `#F3E9F3`.
* **Desktop:** total em faixa horizontal, três cofrinhos em colunas iguais, formulário (400px) ao lado do histórico.

\---

## Interações e comportamento

* **Hover de card:** `translateY(-5px)`, sombra dobra, .28s ease. Estoque usa `translateY(-6px) scale(1.015)` com `cubic-bezier(.2,.8,.3,1)`.
* **Hover de item de lista:** `translateX(3px)` + fundo mais claro, .25s.
* **Hover de botão/selo:** `translateY(-2px)` a `translateY(-3px)`, .22s.
* **Hover de aba:** `translateY(-4px)` (mobile) / `translateX(4px)` (sidebar), .25s.
* **Hover do botão de comanda:** `translateY(-3px) rotate(-.6deg)`.
* **Único estado com interação real nos protótipos:** o bloco de datas do cliente (expande/recolhe, chevron gira). Todo o resto é estático — os handlers existentes do app permanecem.
* **Animações contínuas** (declarar em `@keyframes`, respeitar `prefers-reduced-motion`):

  * `carSweep` — faixa de brilho atravessando o botão de comanda, 5s infinito: `0% { transform:translateX(-120%) } 60%,100% { transform:translateX(220%) }`.
  * `carGlow` — halo do card de lucro, 6s infinito: `0%,100% { opacity:.45; transform:scale(1) } 50% { opacity:.8; transform:scale(1.06) }`.
  * `carFloat` — selo rosa do botão, 4,5s infinito: `0%,100% { transform:translateY(0) } 50% { transform:translateY(-6px) }`.
* **Sem piscar em vermelho:** alerta de estoque baixo e saldo negativo são selos estáticos em `#C4626F`.

## Responsividade

* **< 1024px:** layout atual — cabeçalho no topo, barra inferior de 6 abas, conteúdo em coluna única, padding 18px.
* **≥ 1024px:** sidebar fixa de 236px (mesma lista de abas, mesma ordem), cabeçalho de página branco com título + subtítulo + busca e ação principal, conteúdo em grade com padding `22px 30px`. A marca e o avatar migram para o topo da sidebar; o selo de versão mobile vai para o rodapé dela.

## Estado

Nenhum estado novo é necessário. O único acréscimo opcional é um booleano por cliente para o bloco de datas (`datesOpen`), se hoje ele estiver sempre aberto.

## Assets

* **Fontes:** Instrument Serif e Manrope (Google Fonts).
* **Ícones:** todos desenhados como SVG inline com `stroke-width` 1.8–2.4 e `stroke-linecap:round` — casa com `lucide-react`, se o projeto já usa. O ícone de versão mobile foi refeito: retângulo arredondado 10×20 com risco de alto-falante e ponto do botão.
* **Emojis:** mantidos exatamente onde o app já os usa (rótulos de cofrinho, categorias, datas). Não introduzir novos.
* **Fotos das fichas:** placeholders do Unsplash nos protótipos — **substituir pelas fotos reais dos bolos**.

## Mapa arquivo → tela

|Arquivo|Tela|O que muda|
|-|-|-|
|`src/index.css`|—|Tokens, fontes e keyframes; remover a paleta âmbar/slate herdada|
|`src/components/Header.tsx`|`11a`|Marca centrada em serifa, avatar de 36px clicável, ícone de versão mobile refeito e reposicionado|
|`src/components/BottomNav.tsx`|`12a`|Cápsula roxa no ativo, rótulo rosé, hover −4px; vira sidebar no desktop|
|`src/components/Dashboard.tsx`|`3a` / `13a`|Calendário do mês inteiro, medidor de margem, três medidores nos saldos, botão em etiqueta|
|`src/components/OrdersModule.tsx`|`6a` / `13b`|Totais em degradê, filtros segmentados, comandas com ações de tamanho único|
|`src/components/FichasTecnicasModule.tsx`|`7b` / `14a`|Anel de composição no lugar dos quadrados, categorias em duas linhas, botões com personalidade|
|`src/components/EstoqueModule.tsx`|`8a` / `14b`|Arco medidor 0–100, cards em relevo, alerta em rosé|
|`src/components/CustomersModule.tsx`|`9c` / `14c`|Capa em degradê, dados legíveis, datas contíguas e recolhíveis|
|`src/components/BalancesAndExpensesModule.tsx`|`10b` / `14d`|Total em degradê com barra de divisão, cofrinhos compactos, formulário e histórico na paleta nova|
|`src/App.tsx`|`13a`|Shell responsivo: barra inferior abaixo de 1024px, sidebar acima|

## Ordem sugerida

1. Tokens e fontes · 2. `Header` e `BottomNav` (aparecem em todas as telas) · 3. `Dashboard` · 4. `OrdersModule` · 5. `Fichas`, `Estoque`, `Clientes`, `Saldos` · 6. shell desktop no `App`.

Cada etapa é puramente visual: nenhum handler, rota, cálculo, tipo ou string precisa mudar.

## Arquivos deste pacote

* `Carula Redesign.dc.html` — documento de design completo. Cada opção tem um id (`3a`, `6a`, `7b`, `8a`, `9c`, `10b`, `11a`, `12a`, `13a`, `13b`, `14a`–`14d`); abra no navegador e use `#id` na URL para ir direto a uma tela. As telas **aprovadas** são as listadas acima; as demais são histórico das explorações.
* `Carula Redesign (offline).html` — o mesmo documento em arquivo único, sem dependências externas.
* `github.md` — vínculo com o repositório, último sync e mapa de telas.

