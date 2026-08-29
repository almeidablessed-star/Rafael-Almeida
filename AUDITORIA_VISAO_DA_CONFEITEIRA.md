# 👩‍🍳 AUDITORIA — VISÃO DA CONFEITEIRA
## Carula na Rotina Real: "Estou com 5 encomendas para entregar e muita pressa"

**Persona:** Confeiteira brasileira que administra seu próprio negócio (não é especialista em software). Entende bolos, doces, encomendas, ingredientes, custos, estoque, preço, lucro — MAS tem rotina ocupada.

**Cenário:** Terça-feira, 10h. Tenho 5 encomendas para entregar hoje (14h, 16h, 18h, 19h, 20h). Cliente chegou com novo pedido. Forno está funcionando. Assistente está preparando cobertura. Preciso registrar tudo RÁPIDO.

**Método:** Avaliar Carula sob pressão. Qual é lento? Burocrático? Desnecessariamente complexo?

**Data:** 28 de Agosto de 2026

---

## ⏰ CONTEXTO: ROTINA DE CONFEITEIRA

**Meu dia típico:**
- 06:00 — Chegar na cozinha, ligar forno, preparar ingredientes
- 07:00 — Receber encomendas (WhatsApp, telefonema, cliente chegando)
- 09:00 — Começar a produção (bolos, doces, salgados)
- 12:00 — Pausa, almoço rápido
- 13:00 — Voltaç produção, embalagem
- 14:00 — Primeira entrega
- 15:00–20:00 — Mais entregas, consultoria com clientes, novos pedidos

**Minha mentalidade:**
- Velocidade > perfeição
- Prático > bonito
- Objetivo > navegação

**Desafio de usar um app:**
- Não quero sair da cozinha
- Tela suja/molhada
- Mãos ocupadas (misturando bolo, decorando)
- Interruptions (forno apita, cliente chegou, ajudante grita)
- Preciso de 1 segundo, não 30 segundos

---

## 🧑‍💼 ROTINA: CADASTRAR INGREDIENTES

### Cenário: Comprei farinha nova

**O que preciso fazer:**
1. Cadastrar novo ingrediente: "Farinha de Trigo (Integral)"
2. Quantidade: 5kg
3. Preço: R$ 45,00
4. Usar no próximo pedido

**Fluxo no Carula:**
1. Clico em "ESTOQUE"
2. Clico em "Novo Insumo"
3. Modal abre com campos:
   - Nome: "Farinha de Trigo (Integral)"
   - Quantidade: "5"
   - Unidade: "kg" (dropdown)
   - Custo por Unidade: "9" (R$ 45 / 5 = R$ 9 por kg)
   - Limiar Mínimo: "1" (kg)
4. Salvo

**Avaliação: ⏱️ ~1 minuto**

**Minha perspectiva (Confeiteira):**
- ✅ Rápido
- ✅ Campos claros
- ✅ Consegui em 1 minuto
- ❓ "Custo por Unidade" — foi R$ 9 por kg, certo?

**Classificação:** 🟢 **ESSENCIAL** — Funciona bem, rápido, direto.

---

## 🍰 ROTINA: CRIAR RECEITA (FICHA TÉCNICA)

### Cenário: Novo pedido chegou para "Bolo de Chocolate com Calda Quente"

**O que preciso fazer:**
1. Criar receita com tamanhos: 10 fatias (R$ 60) e 15 fatias (R$ 85)
2. Ingredientes: Farinha, Chocolate, Leite, Ovos, Calda
3. Depois fazer pedido com essa receita

**Fluxo no Carula:**
1. Clico em "FICHAS"
2. Clico em "Nova Ficha"
3. Modal abre com MUITOS campos:
   - Nome: "Bolo de Chocolate com Calda Quente"
   - Categoria: "Bolos & Massas"
   - Rendimento: "10 fatias" (Fatias)
   - Foto: (não tenho tempo para tirar foto agora)
   - Ingredientes: Preciso listar 5 ingredientes com custos
     - Farinha de Trigo: 200g, R$ 1,80
     - Chocolate: 100g, R$ 3,00
     - Leite: 200ml, R$ 0,50
     - Ovos: 3 un, R$ 1,50
     - Calda: 50ml, R$ 0,70
   - CUSTOS GLOBAIS:
     - Reposição: (pre-calculado R$ 7,50 dos ingredientes?)
     - Mão de Obra: ?
     - Custo: ?
     - Investimento: ?
   - TAMANHOS & PREÇOS:
     - 10 fatias: R$ 60 (com mão de obra, custo, investimento)
     - 15 fatias: R$ 85 (com mão de obra, custo, investimento)

**Avaliação: ⏱️ ~10 minutos (ou mais)**

**Minha perspectiva (Confeiteira com pressa):**

❌ **Muito longo:**
- Preciso scroll 5 vezes
- Preciso preencher 5 ingredientes (5 clicks de "+ Adicionar")
- Preciso entender "Custos Globais" vs "Custos por Tamanho"
- Preciso remover 3 tamanhos pré-preenchidos
- Preciso adicionar campos por tamanho (Mão de Obra, Custo, Investimento)

❌ **Confuso demais:**
- Qual campo é "Mão de Obra"? Quanto que custa minha hora?
- "Custo" — é diferente de "Reposição"? Ou é a mesma coisa?
- "Investimento" — por quê isso é relevante para uma receita?
- Se eu preencho "Custos Globais" com R$ 0 em "Reposição", mas depois preencho cada tamanho com "Reposição" de novo, qual é usado?

❌ **Tempo perdido:**
- Enquanto estou aqui, cliente está esperando para pagar
- Forno está tocando (bolo pronto)
- Assistente está gritando ("Confeiteira, encher o bico?)

❌ **Sem feedback:**
- Não vejo uma preview da ficha antes de salvar
- "Está tudo certo?" — como saber?
- Salvei e esqueci um ingrediente? (Terá que editar depois)

**Pensamento (Confeiteira com Pressa):**
- "Que chato. Vou fazer direto no WhatsApp para não gastar tempo?"
- "Ou deixo de usar a receita e lanço tudo como 'Outro/Personalizado' no pedido?"

**Classificação:** 🔴 **DESNECESSARIAMENTE COMPLEXO** — Toma tempo demais para um processo simples.

**Sugestão de Melhoria:**
- Form simplificado: Nome, Categoria, 1–3 tamanhos com preço
- Ingredientes podem ser adicionados depois (não agora)
- Custos podem ser calculados automaticamente (ou deixar vazio)

---

## 📝 ROTINA: REGISTRAR NOVO PEDIDO

### Cenário: Cliente chegou, quer "Bolo de Chocolate com Calda Quente" — 15 fatias, entregar hoje às 18h, R$ 85 à vista

**O que preciso fazer:**
1. Registrar cliente: Maria (telefone já conheço)
2. Registrar pedido: Bolo 15 fatias, R$ 85, entrega 18h
3. Confirmar, receber dinheiro, avisar assistente

**Fluxo no Carula:**
1. Abro Dashboard ("INÍCIO")
2. Clico em "NOVA COMANDA - Lançar Pedido"
3. Modal abre, PRECISO SCROLL muito:

**Seção 1: Tipo de Lançamento** (Venda/Pedido — OK, já vem selecionado)

**Seção 2: Dados da Cliente & Orçamento**
- Nome: "Maria" ← Cliente já existe, preciso buscar ou digitar?
- Telefone: 98765432100 (já sei)
- Data do Evento: 28/08/2026 (hoje)
- Endereço: Rua X, 123 (já sei)
- Horário Entrega: 18:00 (preciso digitar)
- Observações: (deixo vazio)
- Foto: (não tenho agora)

**Seção 3: Produtos do Pedido**
- Produto: "Bolo de Chocolate com Calda Quente"
- Tamanho: "15 fatias"
- Qtd: 1
- Subtotal: R$ 85,00 ← esperando aparecer
- Mão de Obra: ?
- Custos: ?
- (Aparecem zeros ou valores corretos?)

**Seção 4: Entrega?**
- Não (cliente vem buscar)

**Seção 5: Adicionais?**
- Não

**Seção 6: Status Pagamento**
- Pago (já recebi)

**Seção 7: Forma de Pagamento**
- Dinheiro

**Seção 8: Data do Pedido**
- Hoje (automático)

**Seção 9: Observações**
- "Entregar 18h"

**Total**
- R$ 85,00

**Valor Sinal**
- R$ 85,00 (já recebi tudo)

**Clico "Confirmar e Gravar"**

**Avaliação: ⏱️ ~3–5 minutos**

**Minha perspectiva (Confeiteira com Pressa):**

⚠️ **Longo demais:**
- 9 seções, preciso scroll
- Muitos campos vazios que não preciso preencher
- Cliente já está esperando resultado

✅ **Bom:**
- Consegui fazer
- Dinheiro foi registrado como "Pago"
- Horário de entrega está lá

❌ **Problemas:**
- ❓ Cliente digitada? Ou apareceu de busca?
- ❓ Se digitei "Maria", criou automaticamente ou preciso confirmar?
- ❓ Tamanho estava lá ou precisei selecionar?
- ❓ Valores (R$ 85) aparecem certos?

❌ **Ausentes:**
- Sem notificação visual "✓ Pedido salvo"
- Sem botão "Rápido" (forma reduzida para pedidos simples)

**Pensamento (Confeiteira com Pressa):**
- "Consegui fazer, mas demorou"
- "Tinha tanta informação que não precisava"
- "Se tiver 5 pedidos em 2 horas, vou levar 15 minutos só preenchendo formulário"

**Classificação:** 🟡 **IMPORTANTE, MAS LONGO** — Funciona, mas toma tempo demais.

**Sugestão de Melhoria:**
- "Quick Add" — Uma forma simplificada com: Cliente, Produto, Qtd, Total, Data de Entrega
- Deixar dados opcionais para depois (endereço, foto, etc)

---

## 📊 ROTINA: EDITAR QUANTIDADE/PREÇO DE PEDIDO

### Cenário: Cliente disse "Aumento para 20 fatias, quer pagar R$ 110"

**O que preciso fazer:**
1. Abrir pedido
2. Mudar tamanho de "15 fatias" para "20 fatias"
3. Confirmar novo preço (R$ 110)

**Fluxo no Carula:**
1. Vou para "PEDIDOS"
2. Busco pedido de "Maria"
3. Clico no pedido para expandir/editar
4. Modal abre (similar ao novo pedido)
5. Mudo tamanho: "15 fatias" → "20 fatias"
6. Valor atualiza: R$ 85 → R$ ? (qual o valor de 20 fatias?)

**Avaliação: ⏱️ ~2 minutos**

**Minha perspectiva (Confeiteira):**

❓ **Confuso:**
- Se criei receita com "10 fatias (R$ 60)" e "15 fatias (R$ 85)", qual é o preço de "20 fatias"?
- Sistema interpola (R$ 110 = 20 fatias * R$ 5,5/fatia)?
- Ou preciso ter criado "20 fatias" previamente?
- Se sistema não tem "20 fatias", mostra erro? Ou deixa vazio?

❌ **Risco:**
- Se mudo tamanho, estoque recalcula?
- Se tinha 1 unidade de "15 fatias" consumida, agora vai para 0 (1 de "20 fatias")?
- Ou fica inconsistente?

**Pensamento (Confeiteira):**
- "Espero que não quebrou meu estoque"

**Classificação:** 🟠 **PRECISA MELHORAR** — Incerteza sobre impactos.

---

## 📦 ROTINA: CONSULTAR ESTOQUE RÁPIDO

### Cenário: Tenho ovos em casa? Quantos?

**O que preciso fazer:**
1. Verificar quantidade de ovos
2. Decidir: tem o suficiente para o próximo pedido?

**Fluxo no Carula:**
1. Clico em "ESTOQUE"
2. Vejo card: "Ovos — 18 un — Alerta mínimo: 12"
3. Pronto!

**Avaliação: ⏱️ ~5 segundos**

**Minha perspectiva (Confeiteira):**
- ✅ Rápido
- ✅ Claro
- ✅ Funciona

**Classificação:** 🟢 **ESSENCIAL** — Perfeito.

---

## 💰 ROTINA: CONSULTAR QUANTO RECEBI HOJE

### Cenário: Fim do dia. Recebi quanto? Ainda falta quem pagar?

**O que preciso fazer:**
1. Somar vendas do dia (28/08)
2. Separar: Pago vs A Receber
3. Decidir: feche bem o dia?

**Fluxo no Carula:**
1. Vou para "PEDIDOS"
2. Vejo no topo: "TOTAL EM VENDAS: R$ 441,00 — VENDAS PAGAS: R$ 341 — A RECEBER: R$ 100"
3. Vejo filtro: "Pagos (3), Pendentes (0)"

**Avaliação: ⏱️ ~10 segundos**

**Minha perspectiva (Confeiteira):**
- ✅ Rápido
- ✅ Claro
- ✅ Consigo ver em 1 segundo: "Recebi R$ 341 hoje, faltam R$ 100 de clientes"

**Pensamento (Confeiteira):**
- "Não foi um dia ruim"

**Classificação:** 🟢 **ESSENCIAL** — Funciona bem.

---

## 📈 ROTINA: ENTENDER MEU LUCRO

### Cenário: Pedi emprestado R$ 500 para começar mês. Devo devolver? Tenho lucro?

**O que preciso fazer:**
1. Somar vendas do mês
2. Subtrair custos
3. Ver se sobrou lucro

**Fluxo no Carula:**
1. Vou para "SALDOS"
2. Vejo: "SALDO TOTAL DISPONÍVEL: R$ 2.371,50"
   - Reposição: R$ 222
   - Mão de Obra: R$ 180
   - Custo+Inv: R$ 1.969,50
3. ???

**Avaliação: ⏱️ ~30 segundos, MAS CONFUSO**

**Minha perspectiva (Confeiteira):**

❌ **Não entendo:**
- "Saldo Total Disponível" — é meu dinheiro em caixa? É lucro? É custo total?
- "Reposição R$ 222" — gastei isso em ingredientes?
- "Mão de Obra R$ 180" — isso é quanto que devo pagar a mim mesma?
- "Custo+Inv R$ 1.969,50" — isso é o quê?
- A conta não fecha: Total (R$ 2.371) é muito maior que minhas vendas (R$ 341)

❌ **Não há:**
- Período (semana? mês? tudo?)
- Comparação com vendas
- Cálculo de LUCRO (vendas - custos)
- Tendência (mês passado vs este mês)

❌ **Risco:**
- Eu confio nesse número? Está certo?
- Se estiver errado, tomo decisão errada (e pego de novo o empréstimo)

**Pensamento (Confeiteira):**
- "Não sei se tenho lucro ou não"
- "Preciso de ajuda de contador?"
- "Vou usar minha planilha do Excel mesmo"

**Classificação:** 🔴 **CRÍTICO** — Confeiteira não consegue responder a pergunta principal (Tenho lucro?).

---

## 🎬 ROTINA: VER MEUS 5 PEDIDOS DO DIA

### Cenário: São 13h, já fiz 5 pedidos. Preciso ver a lista de entrega

**O que preciso fazer:**
1. Ver todos os 5 pedidos
2. Horários de entrega
3. Cliente, produto, endereço
4. Gerar PDFs para levar

**Fluxo no Carula:**
1. Vou para "PEDIDOS"
2. Vejo lista com 3 cards (tenho que scroll para ver os 5?)

**Avaliação: ⏱️ ~20 segundos**

**Minha perspectiva (Confeiteira):**

✅ **Bom:**
- Lista é clara
- Vejo cliente, data, status

⚠️ **Potencial:**
- Se tem muitos pedidos, preciso scroll
- Em mobile é ruim (tela pequena)

❓ **Ausente:**
- Rota de entrega (próxima entrega → próxima → próxima)
- Não vejo os 5 de uma vez
- Mapa não aparece

**Pensamento (Confeiteira):**
- "Funciona, mas não é otimizado para entregar"

**Classificação:** 🟡 **IMPORTANTE, MAS NÃO OTIMIZADO** — Funciona, mas poderia ser melhor.

---

## 📊 RESUMO: O QUE CONFEITEIRA PENSA

| Tarefa | Tempo | Complexidade | Classificação | Pensamento |
|---|---|---|---|---|
| **Cadastrar Ingrediente** | 1 min | Simples | 🟢 Essencial | ✅ Rápido, funciona |
| **Criar Receita** | 10 min | Muito Complexo | 🔴 Desnecessário | ❌ Muito chato, deixo para depois |
| **Fazer Pedido** | 5 min | Complexo | 🟡 Importante | ⚠️ Funciona, mas longo |
| **Editar Pedido** | 2 min | Médio | 🟠 Precisa Melhorar | ❓ Risco de quebrar estoque |
| **Consultar Estoque** | 5 seg | Simples | 🟢 Essencial | ✅ Perfeito |
| **Consultar Receitas** | 10 seg | Simples | 🟢 Essencial | ✅ Rápido |
| **Ver Total Recebido** | 10 seg | Simples | 🟢 Essencial | ✅ Claro |
| **Entender Lucro** | 30 seg | Confuso | 🔴 Crítico | ❌ Não entendo |
| **Ver Pedidos do Dia** | 20 seg | Simples | 🟡 Importante | ⚠️ Funciona, mas sem rota |

---

## 🎯 CLASSIFICAÇÃO POR TIPO

### 🟢 Tarefas ESSENCIAIS (Funciona bem)
- Cadastrar Ingrediente
- Consultar Estoque
- Ver Total Recebido
- Listar Pedidos do Dia

**Pensamento:** "Estes, eu uso."

### 🟡 Tarefas IMPORTANTES (Funciona, mas poderia melhorar)
- Fazer Pedido (muito longo, precisa de "Quick Add")
- Ver Pedidos do Dia (sem rota de entrega)

**Pensamento:** "Estes, eu uso com cuidado."

### 🟠 Tarefas PRECISAM MELHORAR
- Editar Pedido (risco de quebrar estoque)

**Pensamento:** "Estes, tenho medo de mexer."

### 🔴 Tarefas CRÍTICAS (Não funciona para confeiteira)
- Criar Receita (muito complexo, tempo demais)
- Entender Lucro (não consigo responder a pergunta)

**Pensamento:** "Estes, eu abandono e faço na mão."

---

## 💭 COMO CONFEITEIRA USA CARULA NA PRÁTICA

**Cenário: Primeiro mês de uso**

- **Dia 1:** Entusiasmo. Cadastra 10 clientes, tenta criar 3 receitas, abandona (muito chato).
- **Dia 5:** Entende estoque e pedidos. Usa Carula para fazer pedidos, MAS sem receitas (deixa tudo como "Outro").
- **Dia 15:** Checa quanto recebeu no mês (R$ 2.000). Vê "Saldos" dizendo que tem custos de R$ 3.500. Fica confusa ("Estou com prejuízo?"). Não usa mais Saldos.
- **Dia 30:** Mês passado. Usa Carula diariamente para pedidos + estoque. Não usa Fichas Técnicas (criou 2, depois deixou). Não entende Saldos.

**Resultado:**
- ✅ Usa: Pedidos, Estoque, Total Recebido
- ❌ Não usa: Fichas Técnicas, Saldos, Análises

**Pensamento final:**
- "Carula é útil, mas não é completo para mim. Deixei de usar metade das features."

---

## ✅ O QUE FARIA CONFEITEIRA USAR TUDO

### 1. Simplificar Fichas Técnicas (ESSENCIAL)
- Form reduzido: Nome, Categoria, 3 tamanhos, preço
- Ingredientes opcionais (pode adicionar depois)
- Custos calculados automaticamente

### 2. Adicionar "Quick Add" para Pedidos (IMPORTANTE)
- 4 campos: Cliente, Produto, Qtd, Total
- Expandir para form completo depois
- Atalho em mobile (Voice input??)

### 3. Explicar Saldos (CRÍTICO)
- "Seu lucro esta semana: R$ X"
- "Seus custos esta semana: R$ Y"
- "Sua margem: Z%"
- Período selecionável (semana, mês, tudo)

### 4. Adicionar Rota de Entrega (IMPORTANTE)
- "Próxima entrega em 2 horas: Rua X"
- Mapa com endereços
- Atalho para WhatsApp

### 5. Proteger contra Erros (IMPORTANTE)
- Aviso: "Editar pedido vai atualizar estoque"
- Confirmação dupla para deletar
- Botão "Undo" (últimas 3 ações)

---

## 🎬 CONCLUSÃO: PARA CONFEITEIRA, CARULA É...

**🟢 BOM PARA:**
- Controlar venda do dia (fácil)
- Controlar estoque de ingredientes (fácil)
- Listar pedidos (ok)

**🔴 RUIM PARA:**
- Entender lucro real (impossível)
- Gerenciar receitas (muito chato)
- Otimizar processo de entrega (não tem feature)
- Fazer tudo em 1 segundo (form muito longo)

**🎯 DIAGNÓSTICO:**
Carula foi desenhado para "Gestão Financeira de Confeitarias" (nome no app). MAS confeiteira real não quer "Gestão Financeira" — quer:
1. "Quem devo entregar hoje?"
2. "Tem ingrediente?"
3. "Recebi quanto?"

**4. "Estou ganhando dinheiro?"** ← Esta é a mais importante, e Carula não responde.

**NPS Estimado:** 🟡 **+5 a +10** — Usa 40% do app, abandona o resto. Recomendaria com ressalvas ("Bom para controle de venda, mas não recomendo para análise financeira").

---

## 📋 SUGESTÕES DE PRIORIZAÇÃO

### Se fosse Confeiteira decidindo prioridades:

1. 🔴 **Entender Lucro** — Sem isto, sou cega. Use planilha Excel enquanto não consertar.
2. 🔴 **Simplificar Fichas Técnicas** — Atualmente gasto 10 min por receita. Reduza para 2 min.
3. 🟡 **"Quick Add" Pedido** — Adicione modo rápido para pedidos simples (5 campos).
4. 🟡 **Rota de Entrega** — Mapa com próximas entregas, ordem otimizada.
5. 🟡 **Proteger Contra Erros** — Undo, confirmação dupla, avisos.

---

**Parecer Final:** "Carula é meio caminho — tem as bases, mas não é prático para a rotina de uma confeiteira real. Se melhorar esses 5 pontos, vira essencial."
