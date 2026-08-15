# Auditoria — o que precisa existir no app

Use como checklist de conformidade. Cada linha é **verificável**: ou está exatamente assim, ou está errado.
Marque `[x]` só quando o valor no código bater com o valor aqui.

> Referência visual: abra `Carula Redesign (offline).html` e vá direto na tela pelo id
> (`#3a` Início · `#6a` Pedidos · `#7b` Fichas · `#8a` Estoque · `#9c` Clientes · `#10b` Saldos
> · `#11a` cabeçalho · `#12a` barra · `#13a` `#13b` `#14a`–`#14d` desktop).

---

## 0. Causa mais comum dos problemas relatados

**(a) Movimento sem suavidade.** Hover **não funciona em `style` inline** no React. Se o card tem
`onMouseEnter` mudando estado, ou não tem `transition`, o efeito fica seco ou trava.
Regra: o hover vem **sempre** de classe CSS (`.car-card--hover`, `.car-card--lift`, `.car-row`,
`.car-btn`, `.car-nav__item`), nunca de estado React nem de `style` inline.

Checklist de movimento — cada um destes tem que estar presente:

| Elemento | Classe | Transição | Hover |
| --- | --- | --- | --- |
| Card comum | `car-card car-card--hover` | `transform .28s ease, box-shadow .28s ease` | `translateY(-5px)` + sombra `0 20px 36px rgba(58,35,80,.18)` |
| Card de insumo | `car-card car-card--lift` | `.3s cubic-bezier(.2,.8,.3,1)` | `translateY(-6px) scale(1.015)` + `0 24px 40px rgba(58,35,80,.22)` |
| Linha de lista | `car-row` | `.25s ease` | `translateX(3px)` + fundo `#F3E9F3` |
| Botão | `car-btn` | `.22s ease` | `translateY(-3px)` |
| Selo clicável | `car-pill car-pill--action` | `.2s ease` | `translateY(-2px)` |
| Aba mobile | `car-nav__item` | `.25s ease` | `translateY(-4px)` |
| Item da sidebar | `car-side__item` | `.25s ease` | `translateX(4px)` |
| Dia do calendário | `car-day` | `.2s ease` | `translateY(-2px)` + `#EFE6F0` |
| Chip de categoria | `car-chip` | `.22s ease` | `translateY(-3px)` + sombra |
| Comanda / Lançar Pedido | `car-comanda` | `.25s ease` | `translateY(-3px) rotate(-.6deg)` |
| Ficha / cliente / cofrinho | `car-card--hover` | idem card comum | idem card comum |

**(b) Tailwind removendo classes.** Se as classes `.car-*` estiverem em `@layer` errada ou dentro de
um `@apply` mal formado, o Tailwind 4 pode não emiti-las. Elas devem estar em **CSS puro**, fora de
`@layer`, exatamente como em `01-index.css`.

**(c) Animações contínuas ausentes.** Confirmar os três `@keyframes`: `car-sweep` (brilho da comanda,
5s), `car-glow` (halo do card de lucro, 6s), `car-float` (selo rosa, 4,5s). Sem eles o app fica estático.

---

## 1. Cabeçalho (`#11a`)
- [ ] Degradê `linear-gradient(155deg,#3A2350,#6E3F72 60%,#A85E86)`, padding `18px 20px`.
- [ ] Avatar **36px**, circular, anel `linear-gradient(140deg,#F5B9C6,#C4626F)` de 2px, interior branco com "C" em Instrument Serif 16px `#6E3F72`. **Clicável** (abre perfil), hover `scale(1.08)`.
- [ ] Marca centrada: "Carula" Instrument Serif **32px** branco + "CONFEITARIA" 8px/700 `letter-spacing:.44em` em `rgba(247,220,225,.78)`.
- [ ] Dois botões 32px raio 11px em `rgba(255,255,255,.16)`: **versão mobile** (retângulo 10x20 rx 2.6 + risco + ponto) e **baixar dados**. Ícone antigo removido.

## 2. Barra inferior (`#12a`)
- [ ] Seis abas na ordem Início · Pedidos · Fichas · Clientes · Estoque · Saldos.
- [ ] Ativa: cápsula `#3A2350` raio 16px, ícone e texto `#F5B9C6`, texto 9px/800, sombra `0 8px 18px rgba(58,35,80,.3)`.
- [ ] Inativa: `#A096A6`, 9px/600. Todas com hover `translateY(-4px)`.
- [ ] Fundo branco, borda superior `rgba(36,27,43,.08)`, padding `12px 8px 22px`, sombra `0 -8px 24px rgba(58,35,80,.07)`.

## 3. Início (`#3a` / desktop `#13a`)
- [ ] Cabeçalho em degradê contém **tudo isto, nesta ordem**: barra da marca · medidor de margem · frase de resultado · três blocos de números · botão "Ver Detalhamento das Vendas".
- [ ] **Medidor de margem**: anel 92px stroke 9, traço `#F5B9C6` com `drop-shadow(0 0 8px rgba(245,185,198,.6))`, trilho `rgba(255,255,255,.18)`, percentual 19px + "margem" 8px ao centro.
- [ ] "LUCRO LÍQUIDO DO MÊS (RENDIMENTO)" 9px/800 `letter-spacing:.14em` + valor **32px/800** `letter-spacing:-.03em` + selo verde "Positivo".
- [ ] Frase "🎉 Resultado excelente! …" 12px `line-height:1.6` em `rgba(247,220,225,.84)`.
- [ ] **Três blocos**: VENDAS PAGAS e SAÍDAS em `rgba(255,255,255,.12)`; ⏳ A RECEBER em `rgba(228,217,195,.28)` com rótulo `#F0E2C8`. Raio 16px, padding `11px 12px`, rótulo 9px/800, valor 15px/800.
- [ ] Botão "Ver Detalhamento das Vendas": `rgba(255,255,255,.12)` + borda `rgba(255,255,255,.32)`, hover fundo branco / texto `#3A2350`.
- [ ] **Halo animado** (`car-glow`) no canto superior direito do card de lucro.
- [ ] Painel claro abaixo com `border-radius:28px 28px 0 0` e `margin-top:-14px` **sobrepondo** o degradê.
- [ ] Botão de comanda (ver §9) no topo do painel.
- [ ] "Saldos & Divisão dos Pedidos" Instrument Serif 23px + subtítulo "Entradas das vendas pagas − Compras registradas" 11px.
- [ ] **Três medidores circulares** lado a lado (56–66px, stroke 6–7): Reposição `#C4626F` · Mão de Obra `#7E4F9E` · Custo + Invest. `#B08D57`. Rótulo com `min-height` fixo para os valores alinharem.
- [ ] Nota "50% Custo (…) / 50% Invest." 10px `#9A8FA0`.
- [ ] **Agenda = calendário do mês inteiro**, só os dias. Grade 7 colunas, `aspect-ratio:1`, gap 6px, raio 13px. Setas de mês + "AGOSTO" 11px/800 `letter-spacing:.14em`. Legenda com Com pedido / Livre / Hoje.
- [ ] Estados do dia: fora do mês `#D3C9D6` sem fundo · livre `#F6F2F5` · com pedido `linear-gradient(150deg,#8F5A9C,#C4626F)` branco 800 + sombra · hoje borda `1.5px solid #6E3F72`.
- [ ] **Não** há lista de bolos dentro do calendário.
- [ ] Desktop: duas colunas (esquerda lucro + medidores; direita calendário + "Próximas entregas"), comanda no cabeçalho da página.

## 4. Pedidos (`#6a` / desktop `#13b`) — **aqui estava faltando conteúdo**
- [ ] **Card de totais em degradê** presente, com: título "Pedidos & Encomendas" Instrument Serif 29px · selo "N Pedidos" `car-pill--on-dark`.
- [ ] **"TOTAL EM VENDAS"** 9px/800 + valor **32px/800** + "N encomendas registradas" 10px.
- [ ] **Dois blocos de resumo** dentro do degradê:
      · "✓ VENDAS PAGAS" + valor 15px/800 + "N pedidos pagos", fundo `rgba(169,216,184,.22)`, rótulo `#CDEBD8`;
      · "⏳ A RECEBER (PENDENTES)" + valor + "N pedidos pendentes", fundo `rgba(228,217,195,.26)`, rótulo `#F0E2C8`.
- [ ] Busca com placeholder exato "Buscar por nome da cliente ou descrição do produto...".
- [ ] Filtros em **controle segmentado**: fundo `#EDE6EF` raio 12px padding 3px; ativo `#3A2350` branco 800 raio 9px com sombra; rótulos "Todos (N)", "Pagos (N)", "Pendentes (N)".
- [ ] **Comanda por pedido**: raio 22px, padding `16px 18px 16px 22px`, faixa vertical 6px à esquerda (`150deg,#8F5A9C,#C4626F` pago / `150deg,#E4D9C3,#B08D57` pendente), **dois recortes circulares de 18px** nas laterais na cor `#F6F2F5`.
- [ ] Card pendente com fundo `#FFFCF6`.
- [ ] Selo "👤 CLIENTE: NOME" (`car-pill--cat`) + selo de status ("✅ Pago" verde / "⏳ Pendente" bege).
- [ ] Linha "📅 Data: … • Pgto: …" 11px com valores em `strong` `#241B2B`.
- [ ] Separador `1px dashed rgba(36,27,43,.14)`.
- [ ] **Valor 17px/800, idêntico em pago e pendente**, com `white-space:nowrap` e `flex-shrink:0`.
- [ ] Ações: PDF (`#3A2350`/`#F5B9C6`), "Pendente" ou "Marcar PAGO", editar e excluir circulares 28px. **Todas com 9px/800 e padding 5px 10px — mesmo tamanho do selo de status.**
- [ ] Rodapé com `flex-wrap:wrap` e `row-gap:10px` (não deixa o valor quebrar).
- [ ] Desktop: coluna lateral 290px (total em degradê + dois cards) + grade de duas colunas para as comandas.

## 5. Fichas (`#7b` / desktop `#14a`)
- [ ] Botão "Nova Ficha" no cabeçalho.
- [ ] **As cinco categorias visíveis por inteiro**, em wrap de duas linhas dentro de card branco raio 20px: 🎂 Bolos · 🧁 Doces & Sobremesas · 🥟 Salgados · 🥗 Saudáveis & Fit · 🧸 Kids Friendly. **Sem corte, sem barra de rolagem.**
- [ ] Chip ativo `#3A2350` branco 800 com sombra; inativo `#F6F2F5`/`#5B4A6B`; hover `translateY(-3px)` + sombra.
- [ ] Nome da ficha Instrument Serif 21–23px; selo de rendimento (ex. "10 fatias (Aproximadamente 1.5kg)").
- [ ] Foto 72–84px raio 18–20px com borda branca 2px e sombra. (Trocar placeholders pelas fotos reais.)
- [ ] **Os 4 quadrados/triângulos foram removidos.** No lugar: anel de composição (3 arcos `#6E3F72` / `#C4626F` / `#B08D57`) com "SUGESTÃO" + valor ao centro, dentro de bloco `#FAF7FA` raio 18px.
- [ ] Legenda ao lado com Reposição / Mão de Obra / Custos Op. e valores alinhados à direita.
- [ ] Pílula "Ver N Insumos" com chevron.
- [ ] Botões: Editar (`#3A2350`, raio `20px 20px 6px 20px`) · Duplicar (`#F3E9F3`, raio `20px 20px 20px 6px`) · Excluir (`#FBECEE`). Altura 38–40px, hover `translateY(-3px)`.

## 6. Estoque (`#8a` / desktop `#14b`)
- [ ] Frase "Acompanhe suas quantidades em gramas, ml e unidades…" presente.
- [ ] Selo "⚠ N Estoque Baixo" no cabeçalho.
- [ ] Busca "Buscar insumo no estoque..." + botão "Adicionar Insumo".
- [ ] **Arco medidor** por insumo (`path d="M9 48a33 33 0 0 1 66 0"`, comprimento 126, stroke 10) com percentual embaixo.
- [ ] Escala **100% = 4x o mínimo**. Cor: `#6E3F72` normal · `#B08D57` abaixo de 45% · `#C4626F` quando `quantidade <= mínimo`.
- [ ] Card do item baixo: fundo `#FDF4F5`, borda `rgba(196,98,111,.35)`, selo "⚠ Estoque Baixo".
- [ ] Texto "Alerta quando menor que: N un".
- [ ] Stepper − / valor / + com botões brancos 28px raio 9px sobre trilho `#F6F2F5`.
- [ ] Hover 3D: `translateY(-6px) scale(1.015)` com `cubic-bezier(.2,.8,.3,1)`; container com `perspective:900px`.

## 7. Clientes (`#9c` / desktop `#14c`)
- [ ] **Capa em degradê** por cliente (`140deg,#3A2350,#6E3F72 60%,#A85E86`) com avatar circular 46–52px, nome Instrument Serif 21–24px branco, cidade em **bege `#F0E2C8` com texto `#3A2350`** e botão WhatsApp `#F5B9C6` 34–38px raio 12–13px.
- [ ] Corpo claro com telefone e endereço em pílulas `#F6F2F5` **texto escuro** + editar/excluir.
- [ ] **Nenhum rosa chapado com texto branco** em nenhum lugar da aba.
- [ ] Cabeçalho "🗓️ Todas as Datas Comemorativas" + selo "N datas" + chevron, com `border-radius:16px 16px 0 0` e `border-bottom:none`.
- [ ] Painel de datas **contíguo** (`border-radius:0 0 16px 16px`, `border-top:none`) — sem cartão solto.
- [ ] **Recolhe e expande ao clicar no cabeçalho**; chevron gira 180° em .25s; `aria-expanded` correto.
- [ ] Cada data: "🎂 Título", "Data: DD/MM" com valor destacado em `#F0E2C8`, botão "Avisar" com ícone WhatsApp.
- [ ] Rodapé "Envio via WhatsApp / Modo atual: …" + botão "Configurar WhatsApp" `#4C7358`.

## 8. Saldos (`#10b` / desktop `#14d`)
- [ ] Selo "Gestão Real" e a frase completa "O dinheiro das vendas é acumulado automaticamente aqui no Saldo. …".
- [ ] **Card de saldo total em degradê** com "SALDO TOTAL DISPONÍVEL" + valor 31–38px/800.
- [ ] **Barra empilhada** de 12px raio 999px dividindo os três cofrinhos: `#F5B9C6` / `#D6B8E0` / `#A9D8B8`, com legenda dos três.
- [ ] Três cofrinhos em linhas compactas, cada um com selo, valor, descrição e rodapé de entradas/gastos.
- [ ] Formulário "Lançar Compra Real / Despesa" com subtítulo, descrição, escolha Reposição / Investimento, valor, data e botão "Registrar Compra e Descontar do Cofrinho".
- [ ] Histórico com título "(N)", ajuda, filtros Todos / Reposição / Investimento, busca "Buscar compra...", e linhas com selo, descrição, data, valor `-$ …` em `#C4626F` e editar/excluir.
- [ ] Linha do histórico com hover `translateX(3px)` + `#F3E9F3`.

## 9. Botão "Lançar Pedido" (`#4c`)
- [ ] Degradê da marca, raio 20px, padding `18px 20px`.
- [ ] **Dois recortes circulares de 22px** em `left:-11px` e `right:-11px`, `top:50%`, na cor do fundo (`#F6F2F5`).
- [ ] Borda interna `2px dashed rgba(245,185,198,.5)` à esquerda do texto.
- [ ] Sobre-rótulo "NOVA COMANDA" 9px/800 `letter-spacing:.24em`.
- [ ] Título "+ Lançar Pedido" Instrument Serif **29px** branco.
- [ ] Selo 44px raio 14px `#F5B9C6` com "+" `#3A2350` e animação `car-float`.
- [ ] Faixa de brilho `car-sweep` atravessando.
- [ ] Hover `translateY(-3px) rotate(-.6deg)`.
- [ ] **Não** parece uma barra de espaço de teclado.

## 10. Desktop (`#13a`–`#14d`)
- [ ] A partir de 1024px: sidebar 236px `linear-gradient(180deg,#3A2350,#4A2C5C)`, marca e avatar no topo, seis abas, selo "VERSÃO MOBILE" e "Baixar dados" no rodapé.
- [ ] Item ativo da sidebar com `linear-gradient(120deg,#F5B9C6,#C4626F)` e texto `#3A2350`; hover `translateX(4px)`.
- [ ] Cabeçalho de página branco com título Instrument Serif 30px + subtítulo + busca + ação principal.
- [ ] Conteúdo com padding `22px 30px` e grades: Fichas `minmax(400px,1fr)` · Estoque `minmax(420px,1fr)` · Clientes `minmax(470px,1fr)`.
- [ ] Abaixo de 1024px: layout mobile com barra inferior, sem sidebar.

## 11. Tipografia e mínimos (todas as telas)
- [ ] Só duas famílias: Instrument Serif (marca e títulos) e Manrope (resto). Nenhuma fonte herdada.
- [ ] Valores em 800 com `letter-spacing` negativo; rótulos 9–11px/800 caixa alta.
- [ ] Nada abaixo de: valor 17px · rótulo 9px · corpo 11px · alvo de toque 44px.
- [ ] Nenhuma cor fora dos tokens `--car-*` (procure por `amber`, `slate`, `pink-500`, hex antigos).

---

## Prompt de auditoria para o Claude Code

> Leia `04-AUDITORIA.md`. Percorra **uma seção por vez**, na ordem. Para cada item:
> compare com o código atual e classifique em **OK**, **FALTANDO** ou **DIVERGENTE**
> (com o valor encontrado vs. o esperado).
>
> Não corrija nada nesta passada — só produza o relatório da seção, em lista, e pare.
> Quando eu disser "corrigir", aplique **apenas** os itens FALTANDO e DIVERGENTE daquela
> seção, usando somente tokens `--car-*`, classes `.car-*` e componentes de
> `carula-ui.tsx`. Não altere textos, contagens, cálculos nem handlers.
>
> Comece pela seção 0 (movimento) e pela seção 4 (Pedidos), que são as que eu já sei que estão erradas.
