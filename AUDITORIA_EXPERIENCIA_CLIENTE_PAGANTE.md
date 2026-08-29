# 📱 AUDITORIA — EXPERIÊNCIA DO CLIENTE PAGANTE
## Carula Confeitaria — Primeira Impressão de Uma Confeiteira que Assinou Hoje

**Persona:** Confeiteira brasileira que acabou de assinar Carula. Não conhece software de gestão. Pagou uma mensalidade. Quer saber: "Vale a pena? O app funciona?"

**Método:** Exploração real do app (sem tutoriais). Responder: Entendo o que o app faz? Para quem? Que benefício? Consigo usar sem ajuda?

**Data:** 28 de Agosto de 2026

---

## 🎯 PRIMEIRA IMPRESSÃO

### Acesso ao App
**O que vejo ao fazer login:**
- Tela de Saldos (não Dashboard!)
- Grande número: "R$ 2.371,50" — "SALDO TOTAL DISPONÍVEL"
- 3 cards: Reposição (R$ 222), Mão de Obra (R$ 180), Custo+Inv (R$ 1.969,50)
- Formulário para "Lançar Compra Real / Despesa"

**Minha reação (Cliente Pagante):**
- ❓ Por que estou vendo "Saldos" primeiro?
- ❓ O que é "SALDO TOTAL DISPONÍVEL"?
- ❓ De onde saem esses números (R$ 222, R$ 180, R$ 1.969,50)?
- ❌ Ninguém me disse o que fazer primeiro
- ❌ Não entendo se esses números estão corretos

**Classificação:** 🔴 **Ruim** — Cliente pagante quer entender o valor imediatamente, não quer ficar confusa.

---

## 📊 DASHBOARD (Início)

### O que vejo:
```
TOTAL EM VENDAS: R$ 341,00
  ├─ VENDAS PAGAS: R$ 341,00 (3 pagos)
  ├─ SALDOS: R$ 0,00
  └─ A RECEBER: R$ 100,00 (0 pendentes)

Botão grande: "NOVA COMANDA - Lançar Pedido"

Seção "Saldos & Divisão dos Pedidos":
  ├─ REPOSIÇÃO: 100% (R$ 222,00)
  ├─ MÃO DE OBRA: 100% (R$ 180,00)
  └─ CUSTO+INV: 100% (R$ 1.969,50)

Agenda de Pedidos (agosto)
```

**Minha reação (Cliente Pagante):**

✅ **Bom:**
- Vejo meu faturamento principal (R$ 341)
- Entendo que recebi R$ 341 e faltam R$ 100
- Botão "Lançar Pedido" é claro e proeminente
- Calendário de pedidos mostra visual da agenda

❌ **Confuso:**
- "Saldos & Divisão dos Pedidos" — o que significa?
- "REPOSIÇÃO 100%" — 100% de quê?
- "MÃO DE OBRA R$ 180" — por quê esse número específico?
- "CUSTO+INV R$ 1.969,50" — isso deveria ser meu custo total? Meu investimento?
- Esses números não fazem sentido em relação às minhas vendas (R$ 341)
- A conta não fecha: custos (R$ 222+180+1969,50) >> vendas (R$ 341)
- Ninguém explicou se devo confiar nesses números

❌ **Ausente:**
- Sem onboarding ("Olá! Aqui é como começar")
- Sem "o que fazer agora?" (devo criar receita? cadastrar cliente? fazer pedido?)
- Sem tutorial de 30 segundos

**Pensamento Cliente Pagante:**
- "Isso vale minha mensalidade?" ← INCERTEZA

**Classificação:** 🟡 **Aceitável, mas confuso** — Está tudo aqui, mas não sei como usar.

---

## 🧾 FICHAS TÉCNICAS (Receitas/Produtos)

### Fluxo: Criar Primeira Ficha

**Modal "Criar Nova Ficha Técnica":**

```
Nome do Pedido * (obrigatório)
  Ex: Bolo Vulcão Ninho com Nutella

Categoria * (obrigatório)
  ├─ Bolos & Massas (selecionado)
  ├─ Doces & Sobremesas
  ├─ Salgados
  ├─ Saudáveis & Fit
  └─ Kids Friendly

Rendimento * (obrigatório)
  "10 fatias" + dropdown "Fatias"

Foto
  Botão: "Escolher Foto"

INGREDIENTS (1)
  Ingrediente: "Farinha de Trigo"
  Quantidade: "200"
  Unidade: "g"
  Custo Gasto: "R$ 1,00"
  Botão: "+ Adicionar"
  Total Reposição (Ingredients): R$ 1,00

CUSTOS GLOBAIS DA FICHA
  Reposição ($): 0
  Mão de Obra ($): 20
  Custo ($): 5
  Investimento ($): 5

TAMANHOS & PREÇOS ($)
  [5 tamanhos pré-preenchidos]
  ├─ 10 fatias → R$ 55
  ├─ 15 fatias → R$ 75
  ├─ 20 fatias → R$ 90
  ├─ 25 fatias → R$ 100
  └─ 30 fatias → R$ 120
  
  Cada um com campos separados:
    Mão de Obra ($): 20
    Custo ($): 5
    Investimento ($): 5
    [Botão Remover]
```

**Minha reação (Cliente Pagante — confeiteira iniciante):**

✅ **Bom:**
- Consegui entender: Nome, Categoria, Rendimento

❌ **MUITO CONFUSO:**

1. **"Rendimento"** — O que significa? Quantas fatias que rende? Devo mudar de "Fatias" para outra unidade?

2. **"Custo Gasto" de ingredientes** — R$ 1,00 é o valor total da Farinha que uso na receita, ou é o preço por grama? Não está claro!

3. **"Total Reposição (Ingredients): R$ 1,00"** — Entendo, é a soma dos custos dos ingredientes.

4. **"CUSTOS GLOBAIS DA FICHA"** — Tem um campo "Reposição" que está zerado (0). Mas acabei de dizer que Reposição é R$ 1,00 na seção acima! Qual é a diferença?
   - ❓ Preciso preencher ambos?
   - ❓ Se preencho aqui (global), vai anular o custo dos ingredientes?

5. **"TAMANHOS & PREÇOS"** — Por quê há 5 tamanhos pré-preenchidos? Eu não disse que quero 5 tamanhos!
   - ❓ Devo remover os que não quero?
   - ❓ Posso adicionar mais?

6. **Duplicação de campos** — Vejo campos de "Mão de Obra", "Custo", "Investimento" em DOIS lugares:
   - Uma vez em "CUSTOS GLOBAIS DA FICHA"
   - Novamente em cada "TAMANHO & PREÇO"
   - ❓ Qual um é usado quando faço uma venda?
   - ❓ Se preecho o global e depois mudo o tamanho, o tamanho sobrepõe o global?
   - ❓ Se vendo "10 fatias" com custos global de Mão de Obra R$ 20, mas tamanho "10 fatias" tem Mão de Obra R$ 20 também, qual é usado?

7. **"Investimento"** — O que é investimento em uma receita? Décor da mesa? Aluguel da cozinha? Não entendo!

❌ **Não há:**
- Preview do resultado (como fica a ficha depois)
- Ajuda contextual (um ponto de interrogação explicando cada campo)
- Valores padrão sugeridos
- Validação (posso deixar campo vazio sem aviso?)

**Pensamento Cliente Pagante:**
- "Preciso de ajuda de um contador para preencher isso?"
- "Vou errar? Como sei se errei?"
- "Vale a pena investir tempo aprendendo isso?"
- ❌ "Isso vale minha mensalidade?" ← DIMINUI CONFIANÇA

**Classificação:** 🔴 **Crítico** — Confeiteira abandona aqui. Sente-se burra. "Não é para pessoas como eu."

---

## 📋 NOVO PEDIDO (Venda/Encomenda)

### Fluxo: Lançar Novo Pedido (Comanda)

**Modal gigante "Lançar Novo Pedido":**

```
TIPO DO LANÇAMENTO:
  ├─ Venda / Pedido (selecionado)
  ├─ Estoque / Compra
  ├─ Mão de Obra
  └─ Custo / Invest.

DADOS DA CLIENTE & ORÇAMENTO:
  Nome da Cliente * (obrigatório)
    Ex: Camila Santos...
  
  Telefone / WhatsApp
    Ex: (781) 420-6892
  
  Data do Evento
    28/08/2026
  
  Endereço de Entrega
    Ex: 103 Cabot St, Beverly...
  
  Horário de Entrega / Retirada
    --:--
  
  Observações do Pedido
    Ex: Cliente escolheu folhas amarelas...
  
  Foto de Inspiração do Cliente
    Botão: "Carregar Foto"

PRODUTOS DO PEDIDO (1) — "Valores preenchidos automaticamente"
  Item #1
    Escolha o Produto *
      ├─ Bolo Vulcão Ninho com Nutella (selecionado)
      └─ [Outro produto...]
    
    Tamanho / Medida
      [VAZIO — NÃO PREENCHIDO]
    
    Qtd: - 1 +
    
    Subtotal do Item: R$ 0,00 ← RED FLAG!
    
    Breakdown:
      ├─ Reposição: R$ 0,00
      ├─ Mão de Obra: R$ 0,00
      ├─ Custo: R$ 0,00
      └─ Investimento: R$ 0,00

  Botão: "+ Adicionar outro item ao mesmo pedido"

ENTREGA (DELIVERY)?
  ├─ Não (padrão)
  └─ Sim

ADICIONAIS (FLORES, VELAS, TOPOS)?
  ├─ Não (padrão)
  └─ Sim

Status do Pagamento *
  ├─ Pendente (A Receber) (selecionado)
  └─ [Outro status]

Forma de Pagamento *
  ├─ [Campo vazio]
  └─ Cash (Dinheiro)

Data do Pedido
  28/08/2026

Observações / Anotações do Cliente (Opcional)
  Ex: Entregar às 15h, sem glacê no topo...

TOTAL CONSOLIDADO DO PEDIDO
  R$ 0,00 ← GRANDE PROBLEMA!
  (1 item no pedido)
  
  Breakdown:
    ├─ Reposição: R$ 0,00
    ├─ Mão de Obra: R$ 0,00
    ├─ Custos: R$ 0,00
    └─ Investimento: R$ 0,00

Valor do Sinal / Entrada Pago (Opcional)
  "Deixe em branco = valor total pago"

Botão: "✓ Confirmar e Gravar"
```

**Minha reação (Cliente Pagante — confeiteira ocupada):**

✅ **Bom:**
- Vejo que preciso fornecer dados do cliente
- Botão para múltiplos itens é útil
- Opção de entrega, adicionais faz sentido
- Sinal é opcional (bom)

❌ **MUITO PROBLEMA:**

1. **Total mostrando R$ 0,00** — POR QUÊ?
   - Selecionar um produto não é suficiente?
   - Preciso selecionar tamanho?
   - Mas "Tamanho / Medida" está VAZIO e não há dropdown!
   - Onde clico para selecionar tamanho?
   - Não há instruções!

2. **Breakdown mostrando tudo como R$ 0,00** — Como sei se o preço está certo?
   - Se eu digitar errado, vou descobrir depois ao ver a nota fiscal?
   - Como sei se lucro está bom?

3. **Formulário MUITO longo** — Preciso scroll muito
   - 8+ campos antes do produto
   - Múltiplas seções
   - Em mobile é pior (teclado oclude tudo)
   - Risco de erro por pressa

4. **"Valores preenchidos automaticamente"** — Mas estão zerados!
   - Texto promete automático, realidade é zero
   - Confundidor

5. **4 tipos de transação no topo** — Por quê? Como sei qual usar?
   - "Venda / Pedido" — óbvio
   - "Estoque / Compra" — devo usar aqui ou em outra aba?
   - "Mão de Obra" — separado de "Venda"? Por quê?
   - "Custo / Invest." — isso é gasto, não venda?

❌ **Scenario de erro real:**
- Eu lanço pedido com "Total R$ 0,00"
- Clico "Confirmar e Gravar"
- Sistema salva "Total R$ 0,00"
- Depois eu percebo que errei
- Preciso editar ou deletar

**Pensamento Cliente Pagante:**
- "Eu consegui fazer um pedido? Ou ficou errado?"
- "O sistema é confiável?"
- "Preciso de suporte para cada pedido?"
- ❌ "Isso vale minha mensalidade?" ← MUITA DÚVIDA

**Classificação:** 🔴 **Crítico** — Confeiteira não consegue fazer pedido simples sem erros.

---

## 📦 ESTOQUE (Ingredientes)

### Primeira Impressão:

```
Título: "Estoque"
Botão: "Novo Insumo"
Busca: "Buscar insumo no estoque..."

Item Listado:
  Chocolate (badge: ATUAL)
  Semicírculo: 100%
  Alerta: "-" 500 "+" "g"
  Editar | Deletar

Histórico de Movimentações:
  "Rastreie todas as consumições, 
   devoluções e reposições automáticas"
  Status: "Nenhum movimento registrado ainda"
```

**Minha reação (Cliente Pagante):**

✅ **Bom:**
- Simples, claro
- Entendo que tenho Chocolate com 500g
- Alerta de mínimo é prático
- Histórico promete rastrear automaticamente (bom!)
- Botões de editar/deletar são diretos

❓ **Pequenas dúvidas:**
- "ATUAL" — significa a versão atual? Há versões antigas?
- Semicírculo "100%" — é a quantidade em percentual? De uma embalagem padrão?

**Pensamento Cliente Pagante:**
- ✅ "Isso parece funcionar"
- ✅ "Consigo usar sem ajuda"

**Classificação:** 🟢 **Bom** — Esta tela funciona.

---

## 👥 CLIENTES

### Primeira Impressão:

```
Título: "Clientes"
Botão: "Novo Cliente"
Busca: "Buscar cliente por nome, telefone ou cidade..."

Cliente Listado:
  Avatar: "M"
  Nome: Maria
  Badge: Medford
  Telefone: 7813672829
  Endereço: 15 south st
  Editar | Deletar

Seção: "Todas as Datas Comemorativas"
  "15 datas" (expandível)

Seção: "Envio via WhatsApp"
  "Modo atual: WhatsApp Business"
  Botão: "Configurar WhatsApp"
```

**Minha reação (Cliente Pagante):**

✅ **Bom:**
- Simples, claro
- Vejo lista de clientes
- Busca funciona
- Botões de editar/deletar são diretos
- WhatsApp Business? Ótimo, vendo para clientes que usam WhatsApp
- "15 datas comemorativas" — presumo que são aniversários, ótimo para lembretes

**Pensamento Cliente Pagante:**
- ✅ "Isso parece funcionar"
- ✅ "Consigo usar sem ajuda"

**Classificação:** 🟢 **Bom** — Esta tela funciona.

---

## 📊 SALDOS (Análise Financeira)

### Primeira Impressão:

```
SALDO TOTAL DISPONÍVEL:
  R$ 2.371,50

Cards:
  ├─ Reposição: R$ 222,00 (100%)
  ├─ Mão de Obra: R$ 180,00 (100%)
  └─ Custo+Invest: R$ 1.969,50 (100%)

Formulário: "Lançar Compra Real / Despesa"

Histórico: "Histórico de Compras Realizadas (0)"
```

**Minha reação (Cliente Pagante):**

❓ **Grande confusão:**
- "SALDO TOTAL DISPONÍVEL" — é meu dinheiro em caixa? Ou custo total?
- "Reposição R$ 222" — é o que gastei em ingredientes?
- "Mão de Obra R$ 180" — é quanto pago a mim mesma?
- "Custo+Invest R$ 1.969,50" — é o quê exatamente?
- A conta não fecha: R$ 222 + R$ 180 + R$ 1.969,50 = R$ 2.371,50 ✓ (fecha, ok)
- MAS isso não tem relação com meu faturamento (R$ 341 em vendas)
- Eu gasto mais do que ganho? (R$ 2.371 de custos vs R$ 341 de vendas)

❌ **Não há:**
- Explicação do que significa cada número
- Período (semana? mês? tudo?)
- Comparação com vendas
- Dica: "Seu lucro é R$ X"

**Pensamento Cliente Pagante:**
- "Meu negócio está falindo?"
- "O software está certo?"
- "Devo confiar nesses números?"
- ❌ "Isso vale minha mensalidade?" ← PERDA DE CONFIANÇA

**Classificação:** 🔴 **Crítico** — Confiteira não consegue entender seus próprios números.

---

## 🎯 RESUMO: O QUE CLIENTE PAGANTE PENSA

### Momento 1: Primeira Tela (Saldos)
**Pensamento:** "Por que estou vendo números confusos? Ninguém me explicou nada."
**Sentimento:** 😕 Confuso

### Momento 2: Dashboard
**Pensamento:** "OK, vejo meu faturamento (R$ 341). Legal. Mas esses números de custos parecem estranhos."
**Sentimento:** 🤔 Cautela

### Momento 3: Criar Primeira Ficha
**Pensamento:** "Esse formulário é muito complexo. Tem campos que não entendo. Vou errar?"
**Sentimento:** 😰 Ansiosa

### Momento 4: Fazer Primeiro Pedido
**Pensamento:** "O total está zerado? Como isso funciona? Eu consegui fazer certo?"
**Sentimento:** 😠 Frustrada

### Momento 5: Estoque & Clientes
**Pensamento:** "Ah, esses dois funcionam bem. Consegui entender."
**Sentimento:** ✅ Aliviada (parcial)

### Momento 6: Voltar a Saldos
**Pensamento:** "Meu negócio está falindo segundo esse app? Não confio nesses números."
**Sentimento:** 😡 Desconfiada

---

## ❓ PERGUNTAS NÃO RESPONDIDAS

Cliente pagante deixa o app com perguntas:

1. **Qual é meu lucro real?** (Não consegue calcular)
2. **Está certo esse número de R$ 2.371,50 em custos?** (Parece alto)
3. **Preciso preencher "Custos Globais" E "Custos por Tamanho"?** (Qual é usado?)
4. **Por que o total do pedido fica R$ 0,00?** (Bug ou feature?)
5. **Meus números estão corretos?** (Não há validação)
6. **Como sei que fiz um pedido certo?** (Sem confirmação visual)
7. **O que significa "Investimento"?** (Jargão técnico)
8. **Por quê há 4 tipos de transação?** (Para quê?)

---

## 🎬 CONCLUSÃO: VALE A PENA?

### Perspectiva Cliente Pagante (Primeiro Dia):

**PONTOS POSITIVOS:**
- ✅ Estoque funciona
- ✅ Clientes funciona
- ✅ WhatsApp Business integrado
- ✅ Dashboard mostra faturamento

**PONTOS NEGATIVOS:**
- ❌ Fichas Técnicas é muito complexa (sente-se incapaz)
- ❌ Novo Pedido tem bugs aparentes (total R$ 0,00)
- ❌ Saldos mostrando números que parecem errados
- ❌ Nenhuma explicação, nenhum onboarding
- ❌ Jargão técnico ("Investimento", "Custos Globais", "Reposição")

**CONFIANÇA:**
- No início: 😐 Neutra ("Vou tentar")
- Depois de Fichas Técnicas: 😕 Baixa ("Isso é muito complicado")
- Depois de Novo Pedido: 😠 Muito Baixa ("O app não funciona?")
- Depois de Saldos: 😡 Muito Baixa ("Não confio nos números")

---

## 📊 CLASSIFICAÇÃO FINAL

| Aspecto | Classificação | Motivo |
|---|---|---|
| **Onboarding** | 🔴 Crítico | Sem tutoriais, sem "o que fazer" |
| **Dashboard** | 🟡 Aceitável | Claro no conceito, confuso em detalhes |
| **Fichas Técnicas** | 🔴 Crítico | Muito complexo, confuso |
| **Novo Pedido** | 🔴 Crítico | Total R$ 0,00, muito longo |
| **Estoque** | 🟢 Bom | Simples, intuitivo |
| **Clientes** | 🟢 Bom | Simples, intuitivo |
| **Saldos** | 🔴 Crítico | Números confusos, sem explicação |

---

## 🚨 BLOQUEANTES PARA CLIENTE PAGAR NOVAMENTE

Se cliente pagante usar o app por 1 semana:

1. **Sem tutorial:** Abandona em 3 dias ("Não entendo")
2. **Novo Pedido com total R$ 0,00:** Não consegue confiar ("Bug?")
3. **Saldos mostrando números errados:** Abandona ("Meu negócio está falindo?")

---

## ✅ O QUE FARIA CLIENTE MANTER-SE

1. **Onboarding em 5 minutos:** "Bem-vindo! Aqui é como começar"
2. **Tooltip em campos:** Ícone "?" explicando cada campo
3. **Novo Pedido fix:** Total e breakdown atualizando ao mudar dados
4. **Saldos com explicação:** "Seu lucro desta semana é R$ X"
5. **Validação:** "Tamanho é obrigatório"

---

**Prognóstico:** 🔴 **Cliente abandona em 1 semana se não corrigir Fichas/Pedido/Saldos.**

**NPS Estimado:** ❌ **−20** (detrator — vai desaconselhar para outras confeiteiras)
