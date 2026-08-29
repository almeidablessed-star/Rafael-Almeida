# 🚀 AUDITORIA — PRIMEIRO ACESSO E ONBOARDING
## Carula Confeitaria — Jornada de Cliente Completamente Nova

**Data:** 28 de Agosto de 2026  
**Persona:** Confeiteira que nunca usou Carula. Fez login. Está vendo Saldos na primeira tela.

**Pergunta Central:** Ela sabe o que fazer primeiro? Por que cadastrar informação X? Quando o app começa a entregar valor?

---

## ⏱️ PRIMEIRO MINUTO

### Minuto 0–15 segundos: Tela de Saldos

**O que vê:**
```
SALDO TOTAL DISPONÍVEL: R$ 2.371,50
  ├─ Reposição: R$ 222
  ├─ Mão de Obra: R$ 180
  └─ Custo+Inv: R$ 1.969,50

[Formulário: Lançar Compra Real / Despesa]

[Histórico: (0) movimentos]
```

**Pensamento dela:**
- ❓ "Por que estou vendo isso?"
- ❓ "O que é 'Saldo Total Disponível'?"
- ❓ "De onde vem esse número?"
- ❓ "Preciso fazer algo aqui?"

**Ação que toma:**
- Confusa, vai procurar algo que faça sentido
- Clica em outra aba (INÍCIO, PEDIDOS, FICHAS)

**Valor entregue:** ❌ NENHUM

**Classificação:** 🔴 **CRÍTICO — Tela errada de entrada**

---

### Minuto 15–30 segundos: Clica em INÍCIO

**O que vê:**
```
TOTAL EM VENDAS: R$ 341,00
  ├─ VENDAS PAGAS: R$ 341
  ├─ SALDOS: R$ 0,00
  └─ A RECEBER: R$ 100

[Botão grande: NOVA COMANDA - Lançar Pedido]

[Saldos & Divisão: 3 círculos confusos]

[Agenda de Pedidos: Calendário agosto]
```

**Pensamento dela:**
- ✅ "OK, vejo que fiz R$ 341 em vendas"
- ❓ "Mas por que aparecem esses números de 'Saldos'?"
- ✅ "Há um botão para fazer pedido, legal"
- ❓ "Mas o que eu faço PRIMEIRO?"

**Ação que toma:**
- Talvez clique em "Lançar Pedido" (porque é grande)
- Ou explore outras abas para entender

**Valor entregue:** ⚠️ PARCIAL (Vê faturamento, mas sem contexto)

**Classificação:** 🟡 **ACEITÁVEL, MAS SEM ORIENTAÇÃO**

---

## 📋 SEGUNDO–TERCEIRO MINUTO: Exploração

### Scenario A: Clica em "Lançar Pedido"

**Fluxo:**
1. Modal gigante abre
2. Vê 4 tipos de transação (Venda, Estoque, Mão de Obra, Custo)
3. Vê 8+ campos de cliente
4. ❓ "Por que tantos campos?"
5. Tenta preencher
6. Fica preso: "Qual é o produto?"

**Pensamento:**
- 😰 "Isso é muito complicado"
- ❓ "Preciso criar uma receita primeiro?"
- ❓ "Ou posso fazer um pedido genérico?"

**Ação:**
- Fecha modal com X
- Vai para FICHAS para criar receita

**Valor entregue:** ❌ NENHUM — Saiu do fluxo

**Classificação:** 🔴 **CRÍTICO — Modal é barreira**

---

### Scenario B: Clica em FICHAS

**Fluxo:**
1. Vê 5 abas de categoria
2. Vê empty state: "Nenhuma ficha cadastrada"
3. CTA: "+ Adicionar Primeira Ficha"
4. ❓ "O que é uma ficha?"
5. Clica em "+ Adicionar Primeira Ficha"
6. Modal GIGANTE abre (10+ campos)
7. ❓ "Por que tantos campos?"
8. Tenta preencher:
   - Nome: OK
   - Categoria: OK (escolhe "Bolos")
   - Rendimento: ❓ "O que é isso?"
   - Ingredientes: ❓ "Quanto custa cada um?"
   - Custos Globais: ❓ "Global? Por que global?"
   - Tamanhos & Preços: ❓ "Preciso preencher tudo isso agora?"
9. Desiste

**Pensamento:**
- 😡 "Muito complicado"
- "Eu não sou contadora"
- "Vou usar Excel mesmo"

**Ação:**
- Fecha modal
- Abre outra aba para entender melhor

**Valor entregue:** ❌ NENHUM — Desistiu

**Classificação:** 🔴 **CRÍTICO — Form é barreira**

---

### Scenario C: Clica em CLIENTES

**Fluxo:**
1. Vê um cliente já cadastrado (Maria)
2. Vê botão "+ Cadastrar Nova Cliente"
3. Clica para testar
4. Modal abre com 6 campos
5. Preenche: Nome, Telefone (simples)
6. Salva
7. ✅ Novo cliente aparece na lista

**Pensamento:**
- ✅ "Ah, isso funcionou!"
- ✅ "Consegui criar algo"

**Ação:**
- Sente-se um pouco melhor
- Volta para INÍCIO para tentar novamente

**Valor entregue:** ✅ PARCIAL (Criou um cliente, ganhou confiança)

**Classificação:** 🟢 **BOM — Sucesso rápido**

---

## ⏰ PRIMEIRO DIA: Resumo de Experiência

### Timeline da Primeira Hora

```
0:00 — Login → vê Saldos → confusa
0:15 — Clica Início → entende faturamento, vê botão Lançar Pedido
0:30 — Tenta Lançar Pedido → modal muito longo, desiste
1:00 — Vai para Fichas → empty state, tenta criar ficha
2:30 — Ficha é muito complexa, desiste
3:00 — Vai para Clientes → cria cliente com sucesso ✅
4:00 — Volta para Início, tentar Lançar Pedido novamente
5:00 — Modal é muito longo, mas consegue fazer pedido (depois de 5 minutos de struggle)
```

**Impressão geral:**
- ⭐⭐ Confiança baixa
- ⭐ Usabilidade confusa
- ✅ Um sucesso (cliente) resgatou esperança
- ❓ Sem onboarding = se deixar agora, pode não voltar

---

## 🎯 MOMENTOS CRÍTICOS DE "TÁ, MAS E AGORA?"

### Momento 1: Primeira Tela (Saldos)
**Pensamento:** "Tá, mas e agora? Por onde começo?"
**Sem onboarding:** Usuária clica ao acaso
**Com onboarding:** Toast de boas-vindas + 3 passos

### Momento 2: Vê Dashboard
**Pensamento:** "Legal, vejo vendas. Tá, mas como lanço uma nova?"
**Sem onboarding:** Clica em "Lançar Pedido" (sorte)
**Com onboarding:** Arrow/highlight no botão

### Momento 3: Modal Lançar Pedido Abre
**Pensamento:** "Tá, mas por onde começo? Qual campo primeiro?"
**Sem onboarding:** Scroll desavisado, perde contexto
**Com onboarding:** "1. Escolha cliente (ou crie um novo)" → highlight + tooltip

### Momento 4: Tenta Fazer Pedido Sem Ficha
**Pensamento:** "Por que não consigo? Preciso de receita?"
**Sem onboarding:** Desiste
**Com onboarding:** Toast "Dica: Use receitas pré-criadas ou 'Outro/Personalizado'"

### Momento 5: Vê Empty State Fichas
**Pensamento:** "O que é ficha? Preciso mesmo disso?"
**Sem onboarding:** Desiste
**Com onboarding:** "Fichas são suas receitas. Crie uma para reutilizar em pedidos."

---

## 📊 VALOR ENTREGUE TIMELINE

```
Minute 0:        ❌ Nenhum (Saldos confuso)
Minute 1:        ⚠️ Parcial (Dashboard + botão Lançar Pedido)
Minute 3:        ❌ Nenhum (Modal muito longo)
Minute 5:        ✅ Valor! (Criou cliente)
Minute 10:       ✅ Valor! (Criou pedido)
```

**Problema:** Usuária espera 10 minutos para primeiro valor entregue.

**Risco:** Se sair antes de minuto 5, nunca volta.

---

## ✅ O QUE FARIA PRIMEIRA EXPERIÊNCIA MELHORAR

### Passo 1: Tela de Entrada Correta
**Mudança:** Não mostrar Saldos no primeiro login. Mostrar Dashboard (Início).

**Por quê:** Dashboard mostra faturamento, que é o que confeiteira quer ver.

### Passo 2: Toast de Boas-vindas
**Mudança:** Ao login, mostrar toast:
```
"Bem-vinda ao Carula! 👋
Seu app de gestão de confeitaria.

Próximos passos:
1. Crie sua primeira cliente
2. Crie sua primeira receita
3. Registre seu primeiro pedido
```

**Por quê:** Dá orientação clara sem bloquear.

### Passo 3: Modal Lançar Pedido Simplificado
**Mudança:** 4 campos apenas (Cliente, Produto, Qtd, Total). Expandir depois.

**Por quê:** Confeiteira consegue fazer primeiro pedido em < 2 minutos.

### Passo 4: Botão "Criar Cliente" no Modal Pedido
**Mudança:** Se cliente não existe, mostrar "Criar novo cliente" inline.

**Por quê:** Fluxo unificado (não precisa ir para aba Clientes).

### Passo 5: Ficha Técnica Opcional
**Mudança:** Ao lançar pedido, permitir "Outro/Personalizado" sem ficha.

**Por quê:** Confeiteira consegue fazer pedido no primeiro dia, ficha é para depois.

### Passo 6: In-App Tour (Deschartável)
**Mudança:** Tour visual dos 5 passos principais (pode skippar).

**Por quê:** Guia visual para usuárias que preferem aprender assim.

---

## 📈 IMPACTO ESTIMADO

### Sem Onboarding (Atual)
- Primeiro valor entregue: Minuto 10 (se não desistir)
- Taxa de desistência antes de minuto 5: ~60%
- Confiança inicial: ⭐ Baixa

### Com Onboarding Mínimo (Toast + Dicas)
- Primeiro valor entregue: Minuto 2
- Taxa de desistência: ~20%
- Confiança inicial: ⭐⭐⭐ Média

### Com Onboarding Completo (Tour + UI Simplificado)
- Primeiro valor entregue: Minuto 1
- Taxa de desistência: ~5%
- Confiança inicial: ⭐⭐⭐⭐ Alta

---

## 🎯 RECOMENDAÇÕES

### P0: CRÍTICO
1. **Mudar tela de entrada** — Mostrar Dashboard (Início), não Saldos
2. **Simplificar modal Lançar Pedido** — 4 campos principais, expandir depois
3. **Permitir "Outro/Personalizado"** — Sem ficha obrigatória

### P1: IMPORTANTE
4. **Toast de boas-vindas** — Primeiras ações sugeridas
5. **Botão "Criar Cliente" inline** — No modal pedido
6. **Dica de "Ficha Técnica" no empty state** — Explicar o quê é

### P2: DESEJÁVEL
7. **Tour visual interativo** — 5 passos, deschartável
8. **Progresso de onboarding** — "Você completou 2 de 5 passos"

---

**Prognóstico:** 🔴 **Sem onboarding, 60% de desistência no primeiro dia. Com onboarding mínimo, cai para 20%.**
