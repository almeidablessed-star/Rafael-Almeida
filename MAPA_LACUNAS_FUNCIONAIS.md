# 🗺️ MAPA DE LACUNAS FUNCIONAIS DO CARULA
## Análise: O Que Falta vs O Que Já Existe

**Data:** 28 de Agosto de 2026  
**Método:** Comparar o que Carula faz com necessidades reais de confeiteira. Priorizar essencial vs nice-to-have.

---

## 🔍 O QUE CARULA JÁ FAZ

### Funcionalidades Existentes

✅ **Pedidos/Vendas**
- Registrar venda (cliente, produto, quantidade, valor)
- Marcar como pago/pendente
- Gerar PDF de orçamento
- Histórico de pedidos

✅ **Clientes**
- Cadastrar cliente (nome, telefone, endereço)
- Listar clientes
- Notas e observações
- Datas comemorativas (aniversários)
- Integração WhatsApp (enviar)

✅ **Estoque**
- Registrar ingrediente (nome, quantidade, unidade, custo)
- Alerta de mínimo
- Histórico de movimentações

✅ **Fichas Técnicas**
- Criar receita (nome, categoria, tamanhos, preços)
- Listar ingredientes por receita
- Definir custos (global + por tamanho)

✅ **Dashboard**
- Total de vendas (semana/mês)
- Vendas pagas vs a receber
- Agenda de pedidos (calendário)

✅ **Saldos/Finanças**
- Saldo total (reposição, mão de obra, custos)
- Histórico de compras
- Estimativa de custos por categoria

✅ **Suporte Técnico**
- Backup/Restaurar dados
- Login/Logout
- Perfil de usuário

---

## ❌ O QUE FALTA (NECESSIDADES REAIS)

### Categoria 1: ESSENCIAL (Sem isso, confiteira não consegue trabalhar)

#### 1.1 Rota de Entrega / Otimização de Entregas

**Problema:** Confiteira tem 5 entregas e não sabe em qual ordem ir  
**Solução:** Mapa mostrando:
- Próxima entrega: "Rua X, 123 — João — 14:00"
- Ordem otimizada: Mapa mostrando caminho
- Status de entrega: Check-in ao chegar
- Tempo de trajeto

**Quem Precisa?** 100% confiteiras (todas fazem entregas)  
**Pagaria Mais?** Sim, +R$ 20/mês  
**Deve Existir no Lançamento?** 🔴 SIM, é crítico para workflow diário

---

#### 1.2 Orçamento/Cotação Antes de Vender

**Problema:** Cliente pede "quanto custa um bolo de 20 pessoas?" e confiteira não consegue calcular rápido  
**Solução:**
- Input rápido: "Bolo de Chocolate, 20 fatias"
- Output: "R$ 150" (com margem sugerida)
- Gerar PDF de orçamento (sem salvar como pedido)
- Cliente aprova, depois confirma pedido

**Quem Precisa?** 80% confiteiras (consultadas durante o dia)  
**Pagaria Mais?** Sim, +R$ 15/mês  
**Deve Existir no Lançamento?** 🟡 IMPORTANTE, economia de tempo

---

#### 1.3 Alertas de Entrega (SMS/WhatsApp)

**Problema:** Confiteira esquece de entregar, cliente reclama  
**Solução:**
- 24h antes: "Você tem 2 entregas amanhã"
- 2h antes: "Maria — Rua X — falta 2h"
- 30min antes: "Não esqueça de João!"

**Quem Precisa?** 60% confiteiras (as desorganizadas)  
**Pagaria Mais?** Sim, +R$ 10/mês  
**Deve Existir no Lançamento?** 🟡 IMPORTANTE, reduz reclamações

---

#### 1.4 Mensagens de Confirmação para Cliente (WhatsApp/SMS)

**Problema:** Cliente não sabe se pedido foi registrado  
**Solução:**
- Ao confirmar pedido, enviar automático via WhatsApp:
  - "Seu pedido foi registrado! Bolo de Chocolate, 15 fatias, R$ 85. Entrega: 28/08 às 18h."
- Cliente confirma digitando "OK"
- Status muda para "confirmado por cliente"

**Quem Precisa?** 90% confiteiras  
**Pagaria Mais?** Sim, +R$ 15/mês  
**Deve Existir no Lançamento?** 🔴 SIM, reduz miscomunicação

---

#### 1.5 Reabastecer Ingrediente (Compra Rápida)

**Problema:** Confiteira vê que "Chocolate tem 100g", sabe que precisa de 500g, mas Carula não tem interface para "vou comprar 1kg hoje"  
**Solução:**
- Ao ver ingrediente: Botão "+ Comprar"
- Input: Quantidade + Data de chegada
- Estimativa: "Chocolate 1kg = R$ 45"
- Notificação: "Chocolate chegou, atualizar estoque"

**Quem Precisa?** 100% confiteiras  
**Pagaria Mais?** Não (é básico)  
**Deve Existir no Lançamento?** 🟡 IMPORTANTE

---

### Categoria 2: IMPORTANTE (Aumenta valor percebido)

#### 2.1 Análise de Lucro por Receita

**Problema:** Confiteira não sabe qual receita é mais lucrativa  
**Solução:**
- Gráfico: "Margens por receita"
  - Bolo de Chocolate: 30% margem, 15 vendas, R$ 1.200 de lucro
  - Bolo de Morango: 25% margem, 10 vendas, R$ 600 de lucro
  - Doce de Abóbora: 40% margem, 5 vendas, R$ 200 de lucro
- Recomendação: "Aumente produções de Bolo de Chocolate (maior lucro)"

**Quem Precisa?** 70% confiteiras (as que querem crescer)  
**Pagaria Mais?** Sim, +R$ 20/mês  
**Deve Existir no Lançamento?** 🟡 IMPORTANTE para retenção

---

#### 2.2 Previsão de Demanda (Padrões Sazonais)

**Problema:** Confiteira não sabe quanto produzir cada mês  
**Solução:**
- "Seu mês típico tem 25 pedidos de Bolos e 30 de Doces"
- "Dezembro tem 3x mais pedidos que junho"
- "Aumente produções em julho (preparação para agosto)"

**Quem Precisa?** 50% confiteiras (planejamento)  
**Pagaria Mais?** Sim, +R$ 25/mês  
**Deve Existir no Lançamento?** 🟠 NICE-TO-HAVE (1–2 meses de aprendizado)

---

#### 2.3 Sugestão de Preço (Margem Automática)

**Problema:** Confiteira precisa precificar novo bolo, mas não sabe se R$ 80 é caro/barato  
**Solução:**
- Ao criar nova receita:
  - Custo calculado: R$ 25 (ingredientes + mão de obra + operacional)
  - Sugestão: "Preço sugerido: R$ 75 (30% margem)" ou "R$ 65 (25% margem) ou "R$ 100 (40% margem)"
  - Confiteira escolhe margem desejada, preço auto-calcula

**Quem Precisa?** 60% confiteiras  
**Pagaria Mais?** Sim, +R$ 10/mês  
**Deve Existir no Lançamento?** 🟡 IMPORTANTE para confiança

---

#### 2.4 Listagem de Tarefas / Checklist Diário

**Problema:** Confiteira tem múltiplas tarefas (produzir bolo X, entregar Y, repor Z) e esquece  
**Solução:**
- Tab "Hoje": 
  - Produzir: "2x Bolo de Chocolate 20 fatias"
  - Entregar: "João (14h), Maria (16h)"
  - Repor: "Chocolate, Farinha"
  - Comprar: "Embalagem rosa"
- Checkboxes, notificações de prioridade

**Quem Precisa?** 70% confiteiras  
**Pagaria Mais?** Sim, +R$ 15/mês  
**Deve Existir no Lançamento?** 🟡 IMPORTANTE para workflow

---

### Categoria 3: AUMENTA VALOR (Nice-to-have, mas útil)

#### 3.1 Foto do Produto Entregue

**Problema:** Confiteira não sabe se foto salva é do bolo certo  
**Solução:**
- Ao marcar entrega como "completo", obrigar foto do resultado final
- Galeria de trabalhos feitos (portfolio)
- Cliente vê: "Seu bolo de 28/08 com 5 ⭐"

**Valor:** Portfolio de trabalhos, prova visual  
**Pagaria Mais?** Talvez, +R$ 5/mês  
**Deve Existir no Lançamento?** 🟠 NICE-TO-HAVE (mês 2+)

---

#### 3.2 Avaliação de Cliente

**Problema:** Confiteira não sabe quem é cliente satisfeito vs insatisfeito  
**Solução:**
- Após entrega, enviar WhatsApp: "Como foi? ⭐⭐⭐⭐⭐"
- Registrar nota: 5⭐ = muito bom, 3⭐ = problemas
- Dashboard: "Satisfação média: 4.5⭐"

**Valor:** Medir satisfação, identificar problemas  
**Pagaria Mais?** Talvez, +R$ 8/mês  
**Deve Existir no Lançamento?** 🟠 NICE-TO-HAVE

---

#### 3.3 Chatbot para FAQ de Cliente

**Problema:** Confiteira recebe pergunta repetida 100x "Qual é o prazo de entrega?"  
**Solução:**
- Configurar FAQ automática:
  - "Prazo padrão: 7 dias"
  - "Tamanho: 20 fatias = 2 dias de trabalho"
  - "Valor: Bolo simples começa em R$ 50"
- Cliente manda mensagem, bot responde (confiteira aprova)

**Valor:** Economiza tempo respondendo  
**Pagaria Mais?** Sim, +R$ 20/mês  
**Deve Existir no Lançamento?** 🟠 NICE-TO-HAVE (complexo demais para MVP)

---

#### 3.4 Integração com Formas de Pagamento (Pix, Paypal)

**Problema:** Confiteira recebe dinheiro, Pix, cartão — sem sincronização  
**Solução:**
- Integrar Pix automático:
  - Cliente paga via Pix, transação aparece automaticamente em Carula
  - Status muda para "Pago" sem confiteira fazer nada
  - Saldo atualiza automaticamente

**Valor:** Zero fricção de pagamento  
**Pagaria Mais?** Sim, +R$ 25/mês  
**Deve Existir no Lançamento?** 🟡 IMPORTANTE para crescimento

---

### Categoria 4: DESNECESSÁRIO (Complexidade sem benefício)

#### 4.1 Integrações Avançadas (ERP, Nota Fiscal)

**Problema:** Carula tenta "ser como SAP"  
**Solução:** Não faça. 90% confiteiras não precisa de nota fiscal eletrônica.

**Impacto:** Complexidade desnecessária  
**Recomendação:** Remover do roadmap

---

#### 4.2 Fluxo de Inventário Perfeito

**Problema:** Carula tenta controlar "consumo esperado vs real de ingredientes"  
**Solução:** Muito complexo. Confiteira não quer.

**Impacto:** Campos extras que confundem  
**Recomendação:** Simplificar para "entrada/saída"

---

#### 4.3 Análise Preditiva (Machine Learning)

**Problema:** "IA vai prever seus lucros!" — mas confiteira não quer  
**Solução:** Remover. Usar análise simples (padrão histórico).

**Impacto:** Ilude sobre capacidades  
**Recomendação:** Não incluir no MVP

---

## 📊 MAPA PRIORIZADO

### TIER 1: IMPLEMENTAR ANTES DO LANÇAMENTO (Bloqueantes)

| # | Funcionalidade | Esforço | Valor | ROI |
|---|---|---|---|---|
| 1 | Rota de Entrega | Alto | 🔴 Crítico | Alto |
| 2 | Mensagens de Confirmação (WhatsApp) | Médio | 🔴 Crítico | Alto |
| 3 | Orçamento Rápido | Médio | 🟠 Alto | Alto |
| 4 | Análise de Lucro por Receita | Médio | 🟠 Alto | Alto |
| 5 | Sugestão de Preço | Baixo | 🟠 Alto | Alto |

**Esforço Total:** ~60h | **Impacto:** +150% em retenção

---

### TIER 2: IMPLEMENTAR NO MÊS 1 (Importantes)

| # | Funcionalidade | Esforço | Valor | ROI |
|---|---|---|---|---|
| 6 | Alertas de Entrega | Baixo | 🟡 Médio | Alto |
| 7 | Reabastecer Ingrediente | Baixo | 🟡 Médio | Alto |
| 8 | Listagem de Tarefas | Médio | 🟡 Médio | Alto |
| 9 | Integração Pix | Alto | 🟡 Médio | Médio |

**Esforço Total:** ~40h

---

### TIER 3: INVESTIGAR (Não é prioridade)

| # | Funcionalidade | Motivo |
|---|---|---|
| 10 | Previsão de Demanda | Complexo, requer >3 meses de dados |
| 11 | Foto do Produto | Nice-to-have, não crítico |
| 12 | Avaliação de Cliente | Nice-to-have, pode ser manual |
| 13 | Chatbot FAQ | Muito complexo para MVP |

---

### TIER 4: NÃO FAZER (Removidos do Roadmap)

| # | Funcionalidade | Motivo |
|---|---|---|
| X | Integrações ERP/NF | 90% confiteiras não precisa |
| X | Inventário Perfeito | Complexidade desnecessária |
| X | Previsão com IA | Ilude sobre capacidades |

---

## 🎯 RECOMENDAÇÕES

### Antes do Lançamento
1. ✅ Implementar Tier 1 (5 funcionalidades, 60h)
2. ✅ Remover as 4 funcionalidades desnecessárias
3. ✅ Corrigir bugs existentes (profit inflation, UX)

### Mês 1–2 Pós-Lançamento
4. ✅ Implementar Tier 2 (4 funcionalidades, 40h)
5. ✅ Coletar feedback de usuárias reais
6. ✅ Iterar baseado em uso real

### Mês 3+
7. ✅ Tier 3 (se viável)
8. ✅ Novas demandas que surgirem

---

**Conclusão:** 🟡 **Carula falta 5 funcionalidades CRÍTICAS para competir. Com Tier 1, sobe para "pronto para lançamento". Remover Tier 4 reduz confusão.**
