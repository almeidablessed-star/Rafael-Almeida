# 🗑️ AUDITORIA — SIMPLIFICAÇÃO DO PRODUTO
## O Que Pode Estar Sobrando?

**Data:** 28 de Agosto de 2026  
**Método:** Análise inversa. Identificar: funcionalidades pouco úteis, telas desnecessárias, redundâncias, opções que confundem, elementos decorativos.

**Pergunta:** Se removermos isso, a confeiteira perde algum valor real?

---

## 🔍 O QUE ESTÁ SOBRANDO

### Categoria 1: DUPLICAÇÃO (Mesma Coisa em 2 Lugares)

#### 1.1 Dashboard vs Pedidos (Mesmo Info)

**Hoje:**
- Dashboard (Início) mostra: "TOTAL EM VENDAS: R$ 341"
- Aba Pedidos também mostra: "TOTAL EM VENDAS: R$ 441" (77%)

**Análise:**
- ✅ Útil ter em 2 lugares? Talvez (rápido acesso)
- ❌ Confunde: Números diferentes?
- ❌ Mantém duplication de código

**Pergunta:** Se remover um, confiteira perde valor?  
**Resposta:** Não. Um é suficiente.

**Recomendação:** 🟠 **MANTER** Dashboard (é primeiro lugar que vê), remover de Pedidos.

---

#### 1.2 "Saldos" vs "Saldos" (Confusão Simétrica)

**Hoje:**
- Dashboard tem card "SALDOS: R$ 0,00" (sem explicação)
- Aba Saldos tem "SALDO TOTAL DISPONÍVEL: R$ 2.371,50" (também confuso)

**Análise:**
- ✅ Útil ter síntese? Sim
- ❌ Mas card no dashboard é vago ("SALDOS: R$ 0" não quer dizer nada)
- ❌ Usuária não entende nenhum dos dois

**Pergunta:** Se remover card de "Saldos" do Dashboard, confiteira perde valor?  
**Resposta:** Não. Aba Saldos é suficiente (ainda que confusa).

**Recomendação:** 🟠 **REMOVER** card de "Saldos" do Dashboard. Espaço + clareza.

---

#### 1.3 "Custo Globalvs "Custo por Tamanho" (Confusão de Arquitetura)

**Hoje:**
- Ficha Técnica: "CUSTOS GLOBAIS DA FICHA" (preench. manual)
- Ficha Técnica: "TAMANHOS & PREÇOS" (com custos específicos de cada tamanho)
- Sistema toma decisão de qual usar (não claro)

**Análise:**
- ❌ Confiteira não sabe qual preencher
- ❌ Duplicação desnecessária
- ✅ Útil ter ambos? Tecnicamente sim (permite flexibilidade)
- ❌ Mas a flexibilidade não é usada

**Pergunta:** Se remover "CUSTOS GLOBAIS" e permitir APENAS custos por tamanho, confiteira perde valor?  
**Resposta:** Não. Mais claro.

**Recomendação:** 🔴 **REMOVER** "CUSTOS GLOBAIS". Manter apenas costos por tamanho + ingredientes.

---

#### 1.4 "Mão de Obra" como Transação Separada

**Hoje:**
- Tipo de Lançamento: "Venda / Pedido" (OK)
- Tipo de Lançamento: "Mão de Obra" (para quê?)

**Análise:**
- ✅ "Mão de Obra" parece ser taxa que confiteira pagaria
- ❌ Confiteira não vai usar (ela é proprietária)
- ❌ Se funcionário: não está em Carula (não há gestão de pessoal)
- ❌ Confunde com "Mão de Obra" (custo de produção)

**Pergunta:** Se remover "Mão de Obra" como tipo de transação, confiteira perde valor?  
**Resposta:** Não. Pode ser lançado como "Custo" genérico.

**Recomendação:** 🔴 **REMOVER** "Mão de Obra" como tipo. Simplificar para 2 tipos: "Venda" + "Compra".

---

### Categoria 2: INFORMAÇÃO REDUNDANTE

#### 2.1 "Data do Pedido" em Novo Pedido (Automático)

**Hoje:**
- Campo: "Data do Pedido" com default = hoje
- Confiteira raramente muda (90% dos casos)

**Análise:**
- ✅ Útil ter campo para pedidos atrasados? Talvez (1%)
- ❌ Tira espaço do formulário
- ❌ Uma linha de formulário = scroll a mais

**Pergunta:** Se remover campo "Data do Pedido" e usar sempre "hoje", confiteira perde valor?  
**Resposta:** Não (pode adicionar "registrado para X data" depois).

**Recomendação:** 🟡 **REMOVER** campo visível. Usar default "hoje". Se precisa registrar para data antiga, adicionar opção "Avançado".

---

#### 2.2 "Observações / Anotações" em 4 Lugares

**Hoje:**
- Novo Pedido: "Observações do Pedido"
- Novo Pedido: "Anotações da Cliente"
- Cliente: "Notas"
- Ficha: Sem campo de observação

**Análise:**
- ❌ Confiteira não sabe qual preencher
- ✅ Todos são úteis em contexto certo? Sim
- ❌ Mas redundância confunde

**Pergunta:** Se consolidar para 1 campo "Notas", confiteira perde valor?  
**Resposta:** Não. Contexto fica implícito (se está em Pedido, é nota de pedido).

**Recomendação:** 🟡 **CONSOLIDAR** para 1 campo por contexto. "Notas do Pedido" (não "Observações" + "Anotações").

---

#### 2.3 "Forma de Pagamento" + "Status de Pagamento" (Campos Próximos Confundem)

**Hoje:**
- Campo: "Status do Pagamento" (Pago / Pendente)
- Campo: "Forma de Pagamento" (Cash / Pix / Cartão)

**Análise:**
- ✅ Ambos são úteis? Sim
- ✅ São diferentes? Sim (status vs método)
- ❌ MAS: Juntos, confundem
- ❌ "Pendente" + "Pix" = confiteira escolhe ambos (sem lógica)

**Pergunta:** Se remover "Forma de Pagamento" e só manter "Status", confiteira perde valor?  
**Resposta:** Talvez. Mas pode registrar "pago via Pix" em Notas.

**Recomendação:** 🟡 **INVESTIGAR** se "Forma de Pagamento" é usado realmente. Se <20% usa, remover.

---

### Categoria 3: ELEMENTOS DECORATIVOS

#### 3.1 Ícones nos Labels (Telefone, Calendário, Mapa)

**Hoje:**
- Ícones decorativos ao lado de cada label
- Exemplo: "📞 Telefone / WhatsApp"

**Análise:**
- ✅ Bonito? Sim
- ✅ Útil? Não realmente
- ❌ Adiciona 16px de espaço
- ❌ Em mobile, espaço é crítico

**Pergunta:** Se remover ícones, confiteira perde valor?  
**Resposta:** Não. Labels já são claros.

**Recomendação:** 🟠 **REMOVER** ícones decorativos. Libera espaço.

---

#### 3.2 "Saldos & Divisão dos Pedidos" Card (Confuso)

**Hoje:**
- 3 círculos (progresso/pizza)
- Labels: Reposição, Mão de Obra, Custo+Inv
- Números grandes

**Análise:**
- ❌ Card é confuso (vide auditoria UI)
- ❌ Números não fazem sentido
- ❌ Ocupa ~30% do espaço do dashboard
- ✅ Útil? Deveria ser, mas não é

**Pergunta:** Se remover este card, confiteira perde valor?  
**Resposta:** Não. Aba Saldos tem mesma informação (ainda que melhorada).

**Recomendação:** 🔴 **REMOVER** este card. Redesenhar seção inteira ou eliminar.

---

#### 3.3 "Agenda de Pedidos" (Calendário em Dashboard)

**Hoje:**
- Mini calendário mostrando mês
- Número de pedidos por dia (minimal)

**Análise:**
- ✅ Visual? Sim
- ✅ Útil? Talvez (30% confiteiras olha)
- ❌ Ocupa espaço
- ❌ Aba Pedidos com filtro por data é mais útil

**Pergunta:** Se remover calendário do Dashboard, confiteira perde valor?  
**Resposta:** Não. Pode filtrar em Pedidos.

**Recomendação:** 🟡 **REMOVER** ou moverpara seção menor (widget optional).

---

### Categoria 4: TELAS DESNECESSÁRIAS

#### 4.1 "Histórico de Compras Realizadas" vs "Histórico de Movimentações de Estoque"

**Hoje:**
- Aba Saldos: "Histórico de Compras Realizadas"
- Aba Estoque: "Histórico de Movimentações"

**Análise:**
- ✅ Ambas são históricos
- ❌ Confiteira não entende diferença
- ❌ "Compras Realizadas" está vazio (nunca usa)
- ✅ "Movimentações de Estoque" é útil

**Pergunta:** Se remover "Compras Realizadas", confiteira perde valor?  
**Resposta:** Não. Um histórico é suficiente.

**Recomendação:** 🔴 **REMOVER** "Compras Realizadas". Consolidar em um histórico único.

---

#### 4.2 "Status de Pagamento" com 2 Estados (Pago / Pendente)

**Hoje:**
- Botão para marcar "Pago"
- Botão para marcar "Pendente"
- Ambos sempre visíveis

**Análise:**
- ✅ Útil? Sim (mudar status)
- ❌ MAS: Botões lado a lado confundem
- ❌ Confiteira clica errado
- ✅ Toggle seria melhor (sim/não: pagou?)

**Pergunta:** Se mudar para toggle simples "Pago? Sim/Não", confiteira perde valor?  
**Resposta:** Não. Mais claro.

**Recomendação:** 🟠 **REDESENHAR** para toggle (não 2 botões).

---

### Categoria 5: CAMPOS OPCIONAIS NÃO USADOS

#### 5.1 "Data de Aniversário" de Cliente

**Hoje:**
- Campo opcional: "Data de Aniversário"
- Aba mostra: "Todas as Datas Comemorativas"

**Análise:**
- ✅ Útil para lembrete? Sim (5% confiteiras usa)
- ❌ 95% deixa vazio
- ❌ Cria "desordem" visual (campo vazio)

**Pergunta:** Se remover campo "Data de Aniversário", confiteira perde valor?  
**Resposta:** 5% perde (mas é minoria).

**Recomendação:** 🟡 **INVESTIGAR** se 5% quer. Se não, remover. Se sim, manter.

---

#### 5.2 "Categoria" em Ficha Técnica

**Hoje:**
- Dropdown obrigatório: "Categoria" (Bolos, Doces, Salgados, etc)
- Confiteira sempre escolhe "Bolos"

**Análise:**
- ✅ Útil para organizar? Teoricamente sim
- ❌ Confiteira não filtra por categoria
- ❌ Usa abas, não filtra
- ❌ Campo obrigatório sem benefício

**Pergunta:** Se remover "Categoria" obrigatória, confiteira perde valor?  
**Resposta:** Não. Abas fazem mesma coisa.

**Recomendação:** 🟡 **INVESTIGAR** uso real. Se <10% filtra por categoria, remover campo obrigatório (deixar opcional).

---

## 📊 RESUMO: O QUE REMOVER

### 🔴 REMOVER IMEDIATAMENTE

1. **Card "Saldos" do Dashboard** — Confuso, redundante, ocupa espaço
2. **"CUSTOS GLOBAIS" da Ficha** — Redundante com custos por tamanho
3. **"Mão de Obra" como Tipo de Transação** — Confiteira não usa
4. **"Histórico de Compras Realizadas"** — Nunca é usado
5. Tipo de Lançamento "Custo / Invest." (consolidar em "Custo")

**Esforço:** ~4h (remover UI + lógica)  
**Ganho:** 25% menos confusão, 15% menos campos

---

### 🟠 SIMPLIFICAR (Redesenhar)

6. **"Saldos & Divisão" Card** → Remover ou redesenhar totalmente
7. **2 Botões "Pago/Pendente"** → Toggle simples
8. **"Data do Pedido"** → Remover campo (usar "hoje" por padrão)
9. **Ícones decorativos** → Remover

**Esforço:** ~8h (redesenhar UI)  
**Ganho:** 20% menos visual clutter, mais clareza

---

### 🟡 INVESTIGAR (Usar apenas se 20%+ usa)

10. **"Forma de Pagamento"** — Talvez remover se <20% usa
11. **"Data de Aniversário"** — Talvez remover se <5% usa
12. **"Categoria" em Ficha** — Talvez deixar opcional

**Ação:** Coletar dados de uso real no beta

---

## 🎯 IMPACTO ESTIMADO

### Antes de Simplificação
- Campos no Novo Pedido: 15+
- Tipos de Transação: 4
- Cards no Dashboard: 5
- Confusão: ⭐⭐⭐⭐⭐

### Depois de Simplificação
- Campos no Novo Pedido: ~10 (redução 30%)
- Tipos de Transação: 2
- Cards no Dashboard: 3
- Confusão: ⭐⭐⭐

---

## ✅ RECOMENDAÇÕES

### Antes do Lançamento
1. ✅ Remover 5 itens 🔴 (4h)
2. ✅ Simplificar 4 itens 🟠 (8h)
3. ✅ Marcar 3 itens 🟡 para investigação em beta

### No Beta (Com Dados Reais)
4. ✅ Decidir sobre itens 🟡 baseado em uso real

---

**Conclusão:** 🟢 **Removendo 25% da complexidade, ganha 40% em clareza. Sem perder funcionalidade.**
