# Versão desktop do Carula App — redesign aprovado

Aprovado pelo Rafael em 27/10/2026, tela por tela. Este documento é a
referência para aplicar o layout desktop no app.

- **Fonte viva (Claude Design):** <https://claude.ai/artifact/JwwqZTAgvLzCZayENyFTLR>
  (privado: abre só logado na conta dona).
- **Cópia local:** os arquivos `.dc.html` desta pasta, com todas as medidas e
  cores escritas nos `style` de cada elemento. Para abrir no navegador, usam o
  `support.js` da raiz do repo (copiado aqui). Se algum não renderizar,
  use o link acima, que é a versão de referência.

| Arquivo | Tela | Componentes do app |
|---|---|---|
| `Main.dc.html` | Início | `Dashboard.tsx`, `CardDeSaldo.tsx`, `OrdersCalendar.tsx`, `ResumoDistribuicaoCard.tsx` |
| `Pedidos.dc.html` | Pedidos | `OrdersModule.tsx` |
| `Fichas.dc.html` | Fichas Técnicas | `FichasTecnicasModule.tsx` |
| `Clientes.dc.html` | Clientes | `CustomersModule.tsx` |
| `Produtos.dc.html` | Produtos (abas Todos / Estoque / Compras) | `ProdutosModule.tsx`, `StockMovementsHistory.tsx`, `BalancesAndExpensesModule.tsx` (embedded) |
| `Empresa.dc.html` | Minha Empresa | `CostsModule.tsx`, `MinhaEmpresaCard.tsx`, `ResumoDistribuicaoCard.tsx` |

A aba Produtos tem uma prancheta só, com as três abas. Para ver Estoque e
Compras, clique nas abas (ou mude o Tweak `aba` no Claude Design).

## Regras do redesign

1. **Só desktop.** O celular não muda nada. O tablet com toque
   (`html.tela-de-toque`) também continua como está.
2. **O conteúdo de cada tela é o mesmo do app.** Nada foi puxado de uma aba
   para outra; só a disposição mudou. Onde o celular usa um modal ou um
   cabeçalho que não cabe bem no desktop, a mesma informação foi realocada
   na própria página (ver cada tela).
3. **Os números e nomes dos `.dc.html` são exemplos.** Use os dados reais
   dos contexts, os mesmos cálculos e os mesmos textos do app.
4. **O visual é o design system atual:** Manrope (UI e números), Instrument
   Serif (títulos), Inter 500 no preço das fichas, e as cores de `src/index.css`.
5. **Nenhuma regra de negócio muda:** filtros, ordenações, cálculos,
   validações e modais continuam os mesmos. O formulário de pedido, de ficha,
   de cliente etc. continuam como modais.

## Estrutura comum (todas as telas)

Substitui no desktop a coluna de 480px de `index.css` (`#root` com
`--app-col`) e o menu de baixo (`BottomNav`).

- **Página:** fundo `#F6F2F5`. Menu lateral à esquerda e conteúdo à direita.
- **Menu lateral** (248px, branco, `box-shadow: 1px 0 0 rgba(58,35,80,.06)`,
  padding `30px 18px 24px`, gap 28px):
  - `LogoCarulaApp` fundo claro, `tamanho` 40.
  - Botão **Lançar Pedido**: degradê `150deg, #3A2350, #6E3F72 55%, #A85E86`,
    raio 18, altura mínima 58px, texto Instrument Serif 23px branco e
    quadrado rosé `#F5B9C6` com "+" à direita. Abre o mesmo modal de novo
    pedido (`onOpenAddModal('venda')`).
  - Itens: Início, Pedidos, Fichas, Clientes, Produtos, Empresa, com os
    mesmos ícones do `BottomNav`. Texto em CAIXA ALTA, 12px, peso 700,
    `letter-spacing .1em`, cor `#6A5F70`, ícone `#8E8496`, altura 46px,
    raio 14. Hover: fundo `#F6F2F5`.
  - Ativo: fundo `#3A2350`, texto e ícone `#F5B9C6`, peso 800, sombra
    `0 8px 18px rgba(58,35,80,.3)`, `aria-current="page"`.
- **Conteúdo:** padding `30px 40px 56px`; container `max-width: 1200px`
  centralizado.
- **Título da página:** Instrument Serif 42px, `#241B2B`, alinhado à esquerda.
  No desktop ele **substitui a faixa roxa com o título centralizado** que as
  abas têm no celular.
- **Cartões:** branco, raio 20–24, sombra `0 8px 20px rgba(58,35,80,.08)`.
- **Rótulos pequenos:** 11px, peso 800, caixa alta, `letter-spacing .05em`,
  `#7A6E80`.
- **Texto secundário:** no mínimo 12px e cor `#7A6E80` (o `#9A8FA0` do celular
  fica claro demais em tela grande).
- **Negativo:** `#C4626F`. Em texto pequeno sobre fundo claro, usar `#B04E5C`
  para dar leitura.
- **Botões:** pelo menos 40–44px de altura no desktop.
- **Emojis:** os da interface (🗓️ 📍 ⏳ 💜 🎂…) viraram ícones (lucide), na
  mesma posição.

## Tela por tela

### Início (`Main.dc.html`)

- **Topo:** título "Início" à esquerda. À direita, os botões que no celular
  ficam no cabeçalho roxo: Mobile, Dados, Ajuda e Perfil (ícone em quadrado
  branco de 42px com o rótulo embaixo). O logo do cabeçalho não aparece aqui,
  porque já está no menu.
- **Linha 1, duas peças com a mesma altura:**
  - **Total em vendas** (flex 3): cartão **BRANCO** (aprovado, não é mais
    roxo). Rótulo "TOTAL EM VENDAS", valor 56px/800 e três caixinhas em
    grade:
    - Vendas pagas e Saídas: fundo `#FAF7FA`, borda `#EDE6EF`;
    - A receber: fundo `#FBF5EA`, borda `#F0E2C8`, rótulo `#7A5A1E` com
      ícone de ampulheta.

    Embaixo, a frase do período (`vocab.explicacaoReset` + "“A receber”
    mostra tudo pendente…").
  - **Comanda "Nova comanda / Lançar Pedido"** (flex 2): a mesma do celular
    (degradê, recortes laterais, borda tracejada, "+" rosé flutuando, brilho
    passando), maior: título 40px, "+" de 56px.
- **Linha 2, três colunas** (flex 3 / 4 / 3, gap 24):
  1. **Saldos & Divisão dos Pedidos** (com o "?" do `CampoComAjuda`): grade
     de 2 colunas, Reposição, Mão de obra, Despesas e Investimento, e Lucro
     (ou Prejuízo) ocupando a linha inteira. Embaixo, a **Meta da Semana**,
     com a "Sua fatia pessoal".
  2. **Agenda de Pedidos** (`OrdersCalendar`): mês com setas, grade de dias
     com as mesmas cores (com pedido em degradê, livre `#B4E7B4`, hoje com
     contorno), legenda que filtra e "Datas Comemorativas do Mês". **Desktop:**
     o conteúdo do modal "Pedidos de dd/mm" (e do "Gostaria de lançar um
     pedido para…?") aparece num painel logo abaixo do calendário, atualizado
     ao clicar num dia (começa no dia de hoje). O dia escolhido ganha um anel
     roxo. O número do dia de hoje fica branco sobre o degradê (o roxo sobre
     o degradê não dava leitura).
  3. **Saúde Financeira dos Produtos** (abre e fecha como hoje) e, embaixo,
     **Resumo & Distribuição** (`ResumoDistribuicaoCard`).
- **Primeiros passos** (`PrimeirosPassosChecklist`): não está no desenho
  porque só aparece para conta nova. Quando aparecer, colocar entre a linha 1
  e a linha 2, na largura toda.

### Pedidos (`Pedidos.dc.html`)

- **Topo:** título "Pedidos & Encomendas" + selo "N PEDIDOS" (`#F3E9F3` /
  `#3A2350`).
- **Resumo, cartão BRANCO** (aprovado):
  - à esquerda, Total em vendas (56px) e "N encomendas registradas";
  - à direita, duas caixas:
    - **Vendas pagas:** fundo `#EEF7F0`, borda `#CBE6D3`, rótulo `#2E6B45`
      com ✓, contagem embaixo;
    - **A receber (pendentes):** fundo `#FBF5EA`, borda `#F0E2C8`, rótulo
      `#7A5A1E`, contagem embaixo.
- **Barra de controles numa linha:** Próximos / Histórico (pílula, fundo
  `#EDE5EC`), "STATUS:" Todos · Pagos · Pendentes (sublinhado) e busca à
  direita.
- **Cartões de comanda em grade** (`repeat(auto-fill, minmax(420px, 1fr))`,
  2 colunas a 1440px), com a mesma estrutura do celular:
  - faixa lateral de 6px e recortes;
  - chip "CLIENTE: NOME" e selo Pago/Pendente (e "Atrasado · falta receber");
  - "Data • Pgto" e a linha tracejada;
  - o valor e os botões PDF, Pago/Pendente, editar e excluir, com 44px;
  - a linha de "Sinal | Restante", quando houver;
  - pedido pendente com fundo `#FFFCF6` e faixa dourada.

### Fichas (`Fichas.dc.html`)

- **Topo:** título "Fichas Técnicas" e o botão **Nova ficha** à direita (no
  celular ele é o botão largo embaixo dos chips).
- **Chips das 5 categorias** numa linha, com a contagem (sem os emojis).
- **Cartões em grade** `repeat(auto-fill, minmax(340px, 1fr))` com
  `align-items: stretch`. Os cartões de uma mesma linha têm **a mesma
  altura**: a fileira Editar / Duplicar / Excluir vai para o fim com
  `margin-top: auto` (ajuste pedido na aprovação).
- **O cartão é o mesmo do celular:** nome em Instrument Serif 24px + "Metas
  mudaram", tamanhos (botões de 36px), foto de 84px, bloco "Preço de venda"
  (Inter 500, 20px), anel de 92px com a legenda Reposição / Mão de Obra /
  Custos Op. / Lucro ou Prejuízo, "Ver N Insumos" + "Rende…", lista de
  insumos ao expandir, e os botões com 44px.

### Clientes (`Clientes.dc.html`)

- **Topo:** título "Clientes" e, à direita, a busca e o botão
  "Cadastrar Nova(o) Cliente".
- **Envio via WhatsApp:** no desktop sobe para logo abaixo do topo, como uma
  faixa branca (ícone verde, "Modo atual: …", botão "Configurar WhatsApp"
  `#4C7358`).
- **Cartões em grade** `repeat(auto-fill, minmax(340px, 1fr))`, A–Z, com
  `align-items: stretch`:
  - topo em degradê com a inicial ou foto, o nome em Instrument Serif 24px,
    a cidade (etiqueta areia) e o botão rosé do WhatsApp;
  - telefone e endereço, editar e excluir;
  - as observações;
  - a barra "Todas as Datas Comemorativas" presa ao fim do cartão
    (`margin: auto 14px 14px`).
- **Datas abertas:** a lista rola dentro do cartão (`max-height: 330px`), com
  marca-texto rosa nas datas pessoais e o botão "Avisar".

### Produtos (`Produtos.dc.html`)

- **Topo:** título "Produtos". Abaixo, as abas (trilha branca, ativa
  `#3A2350` / `#F5B9C6`) e, à direita, a busca e "Adicionar Produto". Na aba
  Compras, a busca e o botão somem, como hoje.
- **Todos os Produtos:** cartões em grade de 3 colunas (`minmax(340px, 1fr)`).
- **Estoque:** duas colunas.
  - Esquerda (flex 2): o selo "N Estoques Baixos" e os cartões em grade de
    2 colunas, em ordem de urgência, com o medidor, a situação, "Avisar abaixo
    de − / +" e a frase.
  - Direita (flex 1): **Histórico de Movimentações** num cartão próprio.
- **Compras:**
  - em cima, uma linha com o Total disponível e os cartões Reposição,
    Investimento e Lucro (destaque verde);
  - embaixo, lado a lado, o formulário "Lançar Compra Real / Despesa" (flex 1)
    e o "Histórico de Compras Realizadas" (flex 1.4), com filtro e busca.

### Minha Empresa (`Empresa.dc.html`)

- **Duas colunas.**
- **Esquerda (flex 3):**
  - **Sua Remuneração** (grade de 2 + "Meta de horas" na largura toda);
  - **Período das Metas** e **Metas da Empresa** lado a lado;
  - **Despesas do Negócio**:
    - o total no título;
    - o texto de ajuda;
    - o aviso "Se essa despesa também é usada na sua vida pessoal…" **uma vez
      só** no topo da seção (no celular ele se repete em cada despesa);
    - as despesas em grade (`minmax(280px, 1fr)`), cada uma com a faixinha
      colorida, nome, Valor, % do negócio e Excluir;
    - "+ Adicionar despesa" e "Salvar despesas".
- **Direita (flex 2):**
  - **Resumo & Distribuição**, que continua recalculando a cada tecla, como
    hoje;
  - **Gastos avulsos**: a explicação, os cartões C / I / M, a frase do
    período, o botão "Novo Custo / Investimento", os filtros, a busca e a
    lista.

## Responsivo

A partir de quando entra o layout desktop (sugestão: janela com 1024px ou
mais e sem toque), as grades usam `auto-fill/auto-fit` com `minmax`, então
reduzem de colunas sozinhas. Abaixo disso, vale o comportamento atual.
