# ✍️ AUDITORIA — MICROCOPY
## Carula Confeitaria — Análise de Palavras, Textos, Labels, Mensagens

**Data:** 28 de Agosto de 2026  
**Pergunta:** Uma confeiteira entenderia isso imediatamente?

---

## 📝 ANÁLISE POR SEÇÃO

### 1. NAVEGAÇÃO (Bottom Nav)

| Label | Claro? | Problema | Sugestão |
|---|---|---|---|
| INÍCIO | ✅ Claro | Nenhum | - |
| PEDIDOS | ✅ Claro | Nenhum | - |
| FICHAS | ❓ Ambíguo | "Ficha" não é termo nativo | "RECEITAS" ou "PRODUTOS" |
| CLIENTES | ✅ Claro | Nenhum | - |
| ESTOQUE | ✅ Claro | Nenhum | - |
| SALDOS | ⚠️ Técnico | "Saldos" parece financeiro/contábil | "FINANÇAS" ou "MEU DINHEIRO" |

**Classificação:** 🟡 **ACEITÁVEL, MAS 2 TERMOS TÉCNICOS**

---

### 2. DASHBOARD (Início)

| Texto | Claro? | Problema | Sugestão |
|---|---|---|---|
| "TOTAL EM VENDAS" | ✅ Claro | Nenhum | - |
| "VENDAS PAGAS" | ✅ Claro | Nenhum | - |
| "A RECEBER (PENDENTES)" | ✅ Claro | Parêntese ajuda | - |
| "SALDOS" | ❌ Confuso | "Saldos" aqui quer dizer o quê? | "CUSTOS PREVISTOS" ou "REPARTIÇÃO" |
| "REPOSIÇÃO" | ❌ Técnico | Confeiteira não sabe o que é | "INGREDIENTES" |
| "MÃO DE OBRA" | ✅ Claro | Jargão, mas comum | - |
| "CUSTO+INV" | ❌ Confuso | "INV"? Investimento? Tá abreviado. | "CUSTOS E INVESTIMENTO" |
| "Entradas das vendas pagas — Compras registradas" | 🟠 Confuso | Subtítulo é vago | "Quanto você ganhou e gastou esta semana" |

**Classificação:** 🔴 **CRÍTICO — 3 termos confusos**

---

### 3. FICHAS TÉCNICAS

| Texto | Claro? | Problema | Sugestão |
|---|---|---|---|
| "Nenhuma ficha técnica cadastrada neste setor." | ⚠️ Técnico | "Ficha técnica" não explica o que é | "Nenhuma receita cadastrada aqui. Crie sua primeira!" |
| "+ Adicionar Primeira Ficha" | 🟡 Parcial | "Ficha" ainda é jargão | "+ Criar Primeira Receita" |
| "Nome do Pedido *" | ❌ Errado | "Pedido"? Isso é receita/produto, não pedido | "Nome do Produto" ou "Nome da Receita" |
| "Rendimento *" | ❓ Ambíguo | "Quantas fatias" ajuda, mas não está óbvio | "Quantidade por Lote (ex: 10 fatias)" |
| "INGREDIENTS (1)" | ✅ Claro | Número ajuda | - |
| "Total Reposição (Ingredients)" | ⚠️ Técnico | "Reposição" + parêntese jargonístico | "Custo dos Ingredientes" |
| "CUSTOS GLOBAIS DA FICHA" | ❌ Confuso | "Globais"? O que isso significa? | "CUSTOS FIXOS DA RECEITA" |
| "Reposição ($)" | ❌ Confuso | Confeiteira não sabe: "por unidade? total? global?" | "Custo de Ingredientes por Lote" |
| "Mão de Obra ($)" | ⚠️ Técnico | Claro o conceito, mas jargão | "Quanto você ganha por receita" |
| "Custo ($)" | ❌ Ambíguo | "Custo" de quê? Operacional? | "Custos Operacionais (luz, gás, etc)" |
| "Investimento ($)" | ❌ Confuso | O que conta como "investimento"? | "Investimento (decoração, embalagem, etc)" |
| "TAMANHOS & PREÇOS ($)" | ✅ Claro | Straightforward | - |

**Classificação:** 🔴 **CRÍTICO — Muitos termos confusos**

---

### 4. NOVO PEDIDO (Modal)

| Texto | Claro? | Problema | Sugestão |
|---|---|---|---|
| "TIPO DO LANÇAMENTO" | ❌ Confuso | "Lançamento"? Que palavra estranha. | "TIPO DE TRANSAÇÃO" ou "O QUE VOCÊ ESTÁ FAZENDO" |
| "Venda / Pedido" | ⚠️ Redundante | Venda E Pedido é a mesma coisa | "Venda" ou "Registro de Venda" |
| "Estoque / Compra" | 🟡 Parcial | "Compra de ingredientes para repor estoque" é clara | "Reposição de Estoque" |
| "Mão de Obra" | ✅ Claro | Separar de Venda faz sentido (talvez) | - |
| "Custo / Invest." | ❌ Abreviado | "Invest." não está claro | "Custos e Investimentos" |
| "Nome da Cliente *" | ✅ Claro | Nenhum | - |
| "Telefone / WhatsApp" | ✅ Claro | Nenhum | - |
| "Data do Evento" | ⚠️ Técnico | Para confeiteira, é "Data da Entrega" ou "Data de Validade", não "evento" | "Data de Entrega" |
| "Endereço de Entrega" | ✅ Claro | Nenhum | - |
| "Horário de Entrega / Retirada" | ✅ Claro | Nenhum | - |
| "Observações do Pedido" | ✅ Claro | Nenhum | - |
| "Foto de Inspiração do Cliente" | 🟡 Longo | OK, mas pode ser "Referência Visual" | - |
| "PRODUTOS DO PEDIDO (1)" | ⚠️ Parcial | Número entre parêntesis é confuso | "ITENS DO PEDIDO (1 item)" ou "PRODUTOS (1)" |
| "Valores preenchidos automaticamente" | 🟡 Enganoso | Valores estão ZERO, não "preenchidos" | "Os valores vão aparecer ao selecionar o tamanho" |
| "Escolha o Produto *" | ✅ Claro | Nenhum | - |
| "Tamanho / Medida" | ⚠️ Vago | Não deixa claro que é obrigatório | "Tamanho / Medida *" (asterisco) |
| "Qtd" | ✅ Claro | Abreviatura OK | - |
| "Subtotal do Item" | ✅ Claro | Nenhum | - |
| "ENTREGA (DELIVERY)?" | 🟡 Inglês/Português | "DELIVERY" é anglicismo desnecessário | "HÁ ENTREGA?" ou "PRECISA ENTREGAR?" |
| "ADICIONAIS (FLORES, VELAS, TOPOS)?" | ⚠️ Exemplos | Parêntesis com exemplos ajuda, mas pode estar incompleto | "ADICIONAIS (flores, velas, topos, etc)?" |
| "Status do Pagamento *" | ✅ Claro | Nenhum | - |
| "Pendente (A Receber)" | ✅ Claro | Parêntesis ajuda | - |
| "Forma de Pagamento *" | ✅ Claro | Nenhum | - |
| "Data do Pedido" | ⚠️ Técnico | Confeiteira pode pensar "por que preciso disso?" (é automático) | "Data do Pedido (hoje)" ou não mostrar |
| "Observações / Anotações do Cliente (Opcional)" | 🟡 Redundante | Dois termos para a mesma coisa | "Observações" apenas |
| "TOTAL CONSOLIDADO DO PEDIDO" | 🟠 Jargão | "Consolidado" é jargão financeiro | "TOTAL DO PEDIDO" ou "VALOR FINAL" |
| "Valor do Sinal / Entrada Pago (Opcional)" | 🟡 Longo | Duplo termo confunde ("Sinal" vs "Entrada") | "Valor de Entrada/Sinal Recebido (Opcional)" |
| "Deixe em branco = valor total pago" | ⚠️ Pressuposto | Confeiteira pode não entender | "Se deixar vazio, significa que recebeu o valor total" |
| "Confirmar e Gravar" | ⚠️ Jargão | "Gravar" é jargão de sistemas antigos | "Confirmar e Salvar" ou "Criar Pedido" |

**Classificação:** 🔴 **CRÍTICO — Muitos termos técnicos e confusos**

---

### 5. ESTOQUE

| Texto | Claro? | Problema | Sugestão |
|---|---|---|---|
| "Novo Insumo" | ⚠️ Técnico | "Insumo" é jargão, confeiteira diz "ingrediente" | "Novo Ingrediente" |
| "Buscar insumo no estoque..." | ⚠️ Técnico | "Insumo" novamente | "Buscar ingrediente..." |
| "Alertar quando menor que" | ✅ Claro | Nenhum | - |

**Classificação:** 🟡 **ACEITÁVEL, COM 1 TERMO TÉCNICO**

---

### 6. CLIENTES

| Texto | Claro? | Problema | Sugestão |
|---|---|---|---|
| "Novo Cliente" | ✅ Claro | Nenhum | - |
| "Cadastrar Nova Cliente" | ✅ Claro | Nenhum | - |
| "Todas as Datas Comemorativas" | 🟡 Evasivo | "Datas comemorativas" não diz "aniversários" | "Aniversários e Datas Especiais" |
| "15 datas" | ✅ Claro | Nenhum | - |

**Classificação:** 🟢 **BOM**

---

### 7. SALDOS (Seção)

| Texto | Claro? | Problema | Sugestão |
|---|---|---|---|
| "SALDO TOTAL DISPONÍVEL" | ❌ Confuso | "Disponível" para quê? É meu dinheiro? Custo? | "CUSTO TOTAL PREVISTO" ou "QUANTO VOCÊ DEVE GASTAR" |
| "Reposição" | ❌ Técnico | Confeiteira não entende | "Ingredientes" |
| "Mão de Obra" | ✅ Claro | Nenhum | - |
| "Custo+Invest" | ❌ Abreviado | Confuso | "Custos e Investimentos" |
| "Lançar Compra Real / Despesa" | 🟡 Longo | Dupla barra confunde ("Real" vs "Despesa") | "Registrar Compra" ou "Registrar Gasto" |
| "Desconta automaticamente do cofrinhos selecionado" | ❌ Confuso | "Cofrinhos"? (jargão, presume que leu algo que não viu) | "Deduz automaticamente da categoria selecionada" |
| "Histórico de Compras Realizadas (0)" | ✅ Claro | Nenhum | - |

**Classificação:** 🔴 **CRÍTICO — Muitos termos confusos**

---

## 🎯 RESUMO: TERMOS TÉCNICOS ENCONTRADOS

### Jargão (Confeiteira não usa)
- ❌ Ficha Técnica → usar "Receita" ou "Produto"
- ❌ Saldos → usar "Finanças" ou "Meu Dinheiro"
- ❌ Reposição → usar "Ingredientes" ou "Custo de Ingredientes"
- ❌ Insumo → usar "Ingrediente"
- ❌ Lançamento → usar "Transação" ou "Registro"
- ❌ Consolidado → usar "Total" ou "Valor Final"
- ❌ Investimento → clarificar ("decoração, embalagem")
- ❌ Custo (operacional) → clarificar ("luz, gás, aluguel")

### Abreviações Confusas
- ❌ "INV" → escrever "Investimento"
- ❌ "Qtd" → OK (comum)
- ❌ "Entrada" vs "Sinal" → escolher um termo

### Anglicismos Desnecessários
- ❌ "DELIVERY" → usar "ENTREGA"

### Pressuposto Errado
- ❌ "Valores preenchidos automaticamente" (mas aparecem 0) → clarificar

---

## 📊 IMPACTO

### Sem Clareza (Atual)
- Confiteira gasta tempo entendendo termos
- Preenche errado (não sabia o que era)
- Abandona app (muito técnico)

### Com Clareza
- Confiteira entende em < 30 seg
- Preenche correto
- Confiança aumenta

---

## ✅ RECOMENDAÇÕES

### P0: CRÍTICO
1. **Trocar "Ficha Técnica" → "Receita" em toda app**
2. **Trocar "Saldos" → "Minhas Finanças" ou "Resumo Financeiro"**
3. **Trocar "Reposição" → "Ingredientes" (sempre que possível)**
4. **Clarificar "Custo" → adicionar tooltip "(luz, gás, aluguel, etc)"**
5. **Clarificar "Investimento" → adicionar tooltip "(decoração, embalagem, etc)"**

### P1: IMPORTANTE
6. **Trocar "Insumo" → "Ingrediente"**
7. **Trocar "DELIVERY" → "ENTREGA"**
8. **Trocar "Confirmar e Gravar" → "Confirmar e Salvar"**
9. **Remover "Consolidado" → usar "Total"**
10. **Adicionar asterisco (*) em campos obrigatórios (consistente)**

### P2: DESEJÁVEL
11. **Adicionar tooltips explicativos** em termos técnicos
12. **Criar glossário** (ícone ? → popup com definições)

---

**Classificação Geral:** 🔴 **CRÍTICO — Jargão técnico afasta confeiteira**
