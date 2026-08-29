# 📋 AUDITORIA — FLUXOS DO PRODUTO
## Carula Confeitaria — Jornadas Completas de Usuária

**Data:** 28 de Agosto de 2026  
**Objetivo:** Mapear todos os fluxos principais, executar mentalmente, identificar pontos de dúvida/erro  
**Método:** Rastreamento de jornadas completas do início ao fim

---

## 🗺️ MAPA DE FLUXOS PRINCIPAIS

Identificadas **18 jornadas principais** no aplicativo:

### Autenticação & Onboarding
1. **F1: Login**
2. **F2: Signup**
3. **F3: Setup de Perfil (Primeira Vez)**

### Clientes
4. **F4: Cadastrar Cliente**
5. **F5: Editar Cliente**
6. **F6: Deletar Cliente**

### Fichas Técnicas (Receitas/Produtos)
7. **F7: Criar Ficha Técnica**
8. **F8: Editar Ficha Técnica**
9. **F9: Deletar Ficha Técnica**

### Estoque/Ingredientes
10. **F10: Adicionar Ingrediente ao Estoque**
11. **F11: Editar Ingrediente do Estoque**
12. **F12: Deletar Ingrediente**

### Pedidos (Vendasações Principais)
13. **F13: Lançar Novo Pedido**
14. **F14: Editar Pedido**
15. **F15: Deletar Pedido**
16. **F16: Registrar Pagamento / Marcar Como Pago**

### Relatórios & Consultas
17. **F17: Gerar PDF de Orçamento**
18. **F18: Consultar Saldos/Balanços**

---

## 🟢 FLUXOS EXCELENTES

### F16: Registrar Pagamento
**Início:** Aba Pedidos, seleciona pedido

**Jornada:**
1. Confiteira vê lista de pedidos
2. Clica em pedido específico
3. Vê status "Pendente" com botão destacado
4. Clica "Marcar como Pago"
5. Status muda para "Pago" ✓
6. Volta à lista

**Decisões:** Nenhuma — é binário (pago/pendente)

**Pontos de Dúvida:** Nenhum

**Pontos de Erro:** Nenhum

**Resultado:** ✓ Imediato, claro, sem ambiguidade

**Classificação:** 🟢 **EXCELENTE**
- Ação única, não é reversível sem friction
- Visual feedback imediato
- Sem confirmações excessivas

---

### F17: Gerar PDF de Orçamento
**Início:** Aba Pedidos, seleciona pedido

**Jornada:**
1. Confiteira abre pedido
2. Vê botão "PDF" destacado
3. Clica "PDF"
4. Modal abre mostrando prévia do PDF
5. Pode revisar dados do cliente
6. Clica "Confirmar"
7. PDF é gerado
8. Popup "PDF gerado com sucesso"

**Decisões:** Confirmar antes de gerar

**Pontos de Dúvida:** Onde o PDF fica? (Resposta: browser download, não explícito)

**Pontos de Erro:** Dados do cliente incompletos podem resultar em PDF incompleto

**Resultado:** ✓ PDF baixado (no browser)

**Classificação:** 🟢 **EXCELENTE**
- Prévia antes de gerar
- Confirmação reduz erros
- Visual claro

---

### F4: Cadastrar Cliente
**Início:** Aba Clientes, botão "Novo Cliente"

**Jornada:**
1. Confiteira clica "Novo Cliente"
2. Formulário abre com campos:
   - Nome *
   - Telefone
   - Endereço
   - Cidade
   - Data de Aniversário
   - Notas
3. Preenche nome (obrigatório)
4. Preenche outros (opcionais)
5. Clica "Salvar"
6. Cliente é criado em Supabase
7. Volta à lista, novo cliente aparece

**Decisões:** Qual campo é obrigatório?

**Pontos de Dúvida:** Formato de telefone (nacional? internacional?)

**Pontos de Erro:** Pode cadastrar cliente sem telefone (depois não pode vender sem contato?)

**Resultado:** ✓ Cliente criado

**Classificação:** 🟢 **EXCELENTE**
- Campos bem definidos
- Opcionais deixam flexibilidade
- Apenas nome obrigatório é simples

---

## 🟡 FLUXOS ACEITÁVEIS

### F13: Lançar Novo Pedido
**Início:** Dashboard, botão "Lançar Pedido" ou Aba Pedidos, botão "+"

**Jornada:**
1. Modal abre com 4 abas principais:
   - Dados do Cliente & Orçamento
   - Endereço, telefone, observações
   - Foto de inspiração
   - Produtos do Pedido

2. **Aba 1 - Cliente:**
   - Busca cliente por nome/telefone
   - Autocomplete aparece
   - Seleciona cliente
   - Dados são preenchidos automaticamente ✓

3. **Aba 2 - Produto:**
   - Seleciona produto (dropdown de Fichas)
   - Escolhe tamanho
   - Define quantidade
   - Sistema calcula:
     - Subtotal: OK ✓
     - Custos de breakdown: ??? (vê zeros?)
     - Total: mostra valor

4. **Aba 3 - Delivery:**
   - Checkbox "Vai ter entrega?"
   - Se sim, quantas milhas?
   - Taxa calcula automaticamente ✓

5. **Aba 4 - Adicionais:**
   - Checkbox "Vai ter adicional?"
   - Se sim, pode listar:
     - Descrição
     - Valor
     - Se tem custo associado

6. **Final:**
   - Campo "Valor do Sinal" (opcional)
   - Botão "Confirmar e Gravar"
   - ✓ Pedido é salvo

**Decisões:**
- Qual cliente?
- Qual produto / qual tamanho?
- Tem delivery? Quantas milhas?
- Tem adicional?
- Qual valor de sinal?

**Pontos de Dúvida:**
- ❓ Por que custos mostram ZERO?
- ❓ Como sei se preço está correto?
- ❓ Onde vejo o breakdown final (Reposição/Mão de Obra/Custos)?
- ❓ Se editar depois, é fácil?
- ❓ O que acontece se cliente não existe?

**Pontos de Erro:**
- 🔴 Se cliente não existe, tem que criar — fora do fluxo
- 🟠 Se produto não existe (digitado errado), sistema deixa R$ 0
- 🟠 Não há confirmação se preço parece errado
- 🟠 Múltiplos produtos não é óbvio

**Resultado:** ✓ Pedido criado, salvo em localStorage

**Classificação:** 🟡 **ACEITÁVEL**
- Funciona, mas tem confusão
- Muitas decisões em sequência
- Breakdown de custos confuso

---

### F7: Criar Ficha Técnica
**Início:** Aba Fichas, botão "Adicionar Primeira Ficha" ou "+"

**Jornada:**
1. Modal/formulário abre
2. Campos a preencher:
   - Nome do Produto *
   - Categoria (Bolos/Doces/Salgados/etc)
   - Foto
   - Lista de Tamanhos:
     - Descrição (ex: "20 fatias")
     - Preço
     - Quantidade (numero de fatias)
     - [Opcionais] Custo Mão de Obra, Custo Operacional, Investimento
   - Lista de Ingredientes:
     - Nome
     - Quantidade
     - Unidade
     - Custo Unitário
   - Custos globais:
     - Reposição
     - Mão de Obra
     - Custo Operacional
     - Investimento

3. Confiteira preenche

4. Clica "Salvar"

5. ✓ Ficha criada, aparece em Fichas

**Decisões:**
- Qual categoria?
- Quantos tamanhos?
- Quais ingredientes?
- Quanto custa cada coisa?

**Pontos de Dúvida:**
- ❓ Qual é a diferença entre "Custo global" e "Custo por tamanho"?
- ❓ Se definir ambos, qual é usado?
- ❓ Que valor por ingrediente?
- ❓ Que valor para "Investimento"?
- ❓ Devo preencher [Opcionais]?

**Pontos de Erro:**
- 🔴 **CRÍTICO**: Dois níveis de custos sem clareza qual é usado
- 🟠 Deixar campos vazios = 0, sem aviso
- 🟠 Sem valor padrão para ajudar
- 🟠 Sem preview de como fica a ficha

**Resultado:** ✓ Ficha criada (pode estar incompleta)

**Classificação:** 🟡 **ACEITÁVEL (com avisos)**
- Funciona, mas muita flexibilidade/ambiguidade
- Usuária pode criar ficha incompleta sem perceber

---

### F14: Editar Pedido
**Início:** Aba Pedidos, clica pedido existente, clica "Editar"

**Jornada:**
1. Modal abre com dados do pedido preenchidos
2. Confiteira muda algo:
   - Muda cliente? → Tudo recalcula
   - Muda produto? → Tamanhos disponíveis mudam
   - Muda tamanho? → Preço muda
   - Muda quantidade? → Total recalcula
3. Clica "Confirmar"
4. ✓ Pedido atualizado

**Decisões:** O que muda?

**Pontos de Dúvida:**
- ❓ Se muda quantidade de 1 → 3, o estoque rearruma?
- ❓ Se mudar para produto diferente, resconsome ingredientes?
- ❓ Que dados do PDF mudam?

**Pontos de Erro:**
- 🔴 **CRÍTICO**: Editar quantidade pode deixar estoque inconsistente
- 🟠 Sem confirmação de mudança grande (quantidade, cliente)
- 🟠 Sem preview de "antes vs depois"

**Resultado:** ✓ Pedido atualizado (mas pode quebrar estoque)

**Classificação:** 🟡 **ACEITÁVEL (com riscos)**
- Funciona, mas sem validações robustas
- Pode causar inconsistência de estoque

---

## 🟠 FLUXOS QUE PRECISAM MELHORAR

### F8: Editar Ficha Técnica
**Início:** Aba Fichas, seleciona ficha, clica "Editar"

**Jornada:**
1. Modal abre com dados da ficha
2. Confiteira muda algo:
   - Muda preço de tamanho? → Próximos pedidos usarão novo preço
   - Muda ingrediente? → Qual impacto em pedidos antigos?
   - Remove tamanho? → E os pedidos que usaram esse tamanho?
3. Clica "Salvar"
4. ✓ Ficha atualizada

**Decisões:** O que muda? Historicamente?

**Pontos de Dúvida:**
- ❓ Mudo preço de 90 → 100, que muda?
   - Próximos pedidos: usam R$ 100? ✓
   - PDFs antigos: mostram 100 ou 90? ❓
   - Relatórios: recalculam lucro com 100 ou 90? ❓
- ❓ Removo um ingrediente, que acontece?
- ❓ Mudo custo de ingrediente, que recalcula?

**Pontos de Erro:**
- 🔴 **CRÍTICO**: Sem aviso "5 pedidos usam essa ficha"
- 🔴 **CRÍTICO**: Sem versionamento de custos
- 🟠 Possível quebrar pedidos ao remover tamanho
- 🟠 Sem "Tem certeza?" para mudanças grandes

**Resultado:** ✓ Ficha atualizada, mas impacto propagado de forma incerta

**Classificação:** 🟠 **PRECISA MELHORAR**
- Muito risco de impacto não percebido
- Sem confirmações para mudanças grandes

---

### F10: Adicionar Ingrediente ao Estoque
**Início:** Aba Estoque, botão "Novo Insumo"

**Jornada:**
1. Modal abre
2. Campos:
   - Nome do Insumo *
   - Quantidade *
   - Unidade (g, kg, ml, L, un, pacote)
   - Custo por Unidade
   - Limiar mínimo (quantidade)
3. Preenche "Chocolate"
4. Quantidade: 500g
5. Custo: R$ 0,10 (por grama?)
6. Clica "Salvar"
7. ✓ Estoque criado

**Decisões:**
- Qual unidade?
- Qual custo?

**Pontos de Dúvida:**
- ❓ Custo é por unidade (por grama) ou total?
- ❓ Quando devo preencher "Limiar mínimo"?
- ❓ Se deixar custo vazio (0), afeta cálculos?

**Pontos de Erro:**
- 🟠 Ambigüidade: custo por unidade ou total?
- 🟠 Sem default para unidade
- 🟠 Sem aviso se custo = 0

**Resultado:** ✓ Ingrediente criado (mas pode estar com custo errado)

**Classificação:** 🟠 **PRECISA MELHORAR**
- Ambigüidades de unidade
- Sem defaults ou ajuda contextual

---

### F18: Consultar Saldos/Balanços
**Início:** Aba Saldos

**Jornada:**
1. Confiteira abre Saldos
2. Vê:
   - SALDO TOTAL DISPONÍVEL: R$ 2.371,50
   - 3 Cards:
     - REPOSIÇÃO: R$ 222,00 (100%)
     - MÃO DE OBRA: R$ 180,00 (100%)
     - CUSTO+INV: R$ 1.969,50 (100%)
   - Formulário "Lançar Compra Real / Despesa"
   - Histórico de compras realizadas

**Decisões:**
- Qual categoria de despesa?
- Quanto gastei?

**Pontos de Dúvida:**
- ❓ Como esses saldos são calculados?
- ❓ Se mudo preço de produto, os saldos recalculam?
- ❓ O que significa "100%"?
- ❓ Por que Reposição é R$ 222 e não a soma de ingredientes consumidos?
- ❓ Esses números batem com realidade?

**Pontos de Erro:**
- 🔴 **CRÍTICO**: Números podem estar errados (vide auditoria financeira)
- 🟠 Sem clareza da fórmula de cálculo
- 🟠 Sem filtro por período
- 🟠 Sem relatório "onde vem esse número?"
- 🟠 Sem validação se números batem com banco

**Resultado:** ? Saldos mostrados (confiabilidade questionável)

**Classificação:** 🔴 **CRÍTICO**
- Números podem estar sistematicamente errados
- Confiteira toma decisão baseada em informação não confiável

---

## 🔴 FLUXOS CRÍTICOS

### F15: Deletar Pedido
**Início:** Aba Pedidos, seleciona pedido, clica "Deletar"

**Jornada:**
1. Confiteira clica no ícone de lixeira
2. Modal pede confirmação: "Tem certeza?"
3. Clica "Sim"
4. ✓ Pedido deletado
5. Estoque é regenerado? ✓ (código mostra: sim)

**Decisões:** Confirmar ou não

**Pontos de Dúvida:**
- ❓ Estoque realmente volta?
- ❓ Se tinha sinal, o sinal volta também?
- ❓ E se já registrou no banco? Desaparece?

**Pontos de Erro:**
- 🔴 **CRÍTICO**: Sem aviso "5 paginas dependem desse pedido"
- 🔴 **CRÍTICO**: Sem undo. Deletado é deletado.
- 🟠 Confiteira pode deletar acidentalmente

**Resultado:** ✓ Pedido deletado (possivelmente causando dano financeiro)

**Classificação:** 🔴 **CRÍTICO**
- Irreversível
- Pode deletar pedido importante acidentalmente
- Sem dupla confirmação para ações irreversíveis

---

### F6: Deletar Cliente
**Início:** Aba Clientes, seleciona cliente, clica "Deletar"

**Jornada:**
1. Clica "Deletar"
2. Modal: "Tem certeza?"
3. Clica "Sim"
4. ✓ Cliente deletado
5. Pedidos antigos desse cliente: ?

**Decisões:** Confirmar ou não

**Pontos de Dúvida:**
- ❓ Pedidos antigos ficam órfãos?
- ❓ Histórico é perdido?
- ❓ Sem dúvida é sim

**Pontos de Erro:**
- 🔴 **CRÍTICO**: Sem aviso "Cliente tem 3 pedidos"
- 🔴 **CRÍTICO**: Sem undo
- 🟠 Clique errado = perda de dados históricos

**Resultado:** ? Cliente deletado (pedidos possivelmente órfãos)

**Classificação:** 🔴 **CRÍTICO**
- Sem proteção contra deleção em cascata
- Sem undo
- Sem aviso

---

### F9: Deletar Ficha Técnica
**Início:** Aba Fichas, seleciona ficha, clica "Deletar"

**Jornada:**
1. Clica "Deletar"
2. Modal: "Tem certeza?"
3. Clica "Sim"
4. ✓ Ficha deletada
5. Pedidos que usavam: ficam com 0 custo? ficam orfãos?

**Decisões:** Confirmar ou não

**Pontos de Dúvida:**
- ❓ Que acontece com os 5 pedidos que usavam essa ficha?
- ❓ Estoque fica inconsistente?

**Pontos de Erro:**
- 🔴 **CRÍTICO**: Sem aviso "5 pedidos usam essa ficha"
- 🔴 **CRÍTICO**: Sem undo
- 🟠 Sem dupla confirmação

**Resultado:** ✓ Ficha deletada (pedidos quebrados)

**Classificação:** 🔴 **CRÍTICO**
- Orphans pedidos
- Sem undo
- Sem aviso de impacto

---

### F1: Login
**Início:** Tela inicial (ainda não logado)

**Jornada:**
1. Confiteira vê formulário de login
2. Email: almeida.blessed@gmail.com
3. Senha: ****
4. Clica "Entrar"
5. Sistema valida em Supabase
6. Se OK: redirecion para Dashboard
7. Se erro: mostra "Email ou senha incorretos"

**Decisões:** Email/senha corretos?

**Pontos de Dúvida:**
- ❓ Sem "Esqueci a senha"? (vide: ResetPasswordPage existe)
- ❓ Sem "Criar conta"? (vide: signup existe)

**Pontos de Erro:**
- 🟡 Se senha errada, erro genérico (não diz "senha" ou "email")
- 🟠 Sem rate limiting? Pode brute force?

**Resultado:** ✓ Logada, redirecionada ao Dashboard

**Classificação:** 🟡 **ACEITÁVEL**
- Funciona, mas sem "Esqueci a senha" visível
- Erro genérico é seguro mas menos útil

---

## 📊 TABELA RESUMIDA

| Fluxo | Classificação | Problema Principal | Bloqueante? |
|---|---|---|---|
| **F1: Login** | 🟡 Aceitável | Sem "Esqueci Senha" na UI | Não |
| **F2: Signup** | 🟡 Aceitável | Não testado, presumido OK | Não |
| **F3: Setup Perfil** | 🟡 Aceitável | Presumido OK | Não |
| **F4: Cadastrar Cliente** | 🟢 Excelente | Nenhum | Não |
| **F5: Editar Cliente** | 🟡 Aceitável | Sem aviso de propagação | Não |
| **F6: Deletar Cliente** | 🔴 CRÍTICO | Sem aviso de pedidos orphaned | SIM |
| **F7: Criar Ficha Técnica** | 🟡 Aceitável | Ambigüidade de custos | Não |
| **F8: Editar Ficha Técnica** | 🟠 Precisa Melhorar | Sem aviso de propagação, sem versionamento | SIM |
| **F9: Deletar Ficha Técnica** | 🔴 CRÍTICO | Sem aviso de pedidos orphaned | SIM |
| **F10: Adicionar Ingrediente** | 🟠 Precisa Melhorar | Ambigüidade de custo (por unidade?) | Não |
| **F11: Editar Ingrediente** | 🟠 Precisa Melhorar | Sem aviso de recálculo de custos | Não |
| **F12: Deletar Ingrediente** | 🟠 Precisa Melhorar | Sem aviso de impacto em receitas | Não |
| **F13: Lançar Novo Pedido** | 🟡 Aceitável | Breakdown confuso, múltiplos zeros | Não |
| **F14: Editar Pedido** | 🟡 Aceitável | Sem aviso de recálculo de estoque | Não |
| **F15: Deletar Pedido** | 🔴 CRÍTICO | Sem undo, sem dupla confirmação | SIM |
| **F16: Registrar Pagamento** | 🟢 Excelente | Nenhum | Não |
| **F17: Gerar PDF** | 🟢 Excelente | Nenhum | Não |
| **F18: Consultar Saldos** | 🔴 CRÍTICO | Números podem estar errados | SIM |

---

## 🎯 PADRÕES ENCONTRADOS

### Padrão 1: Deletions Sem Proteção
- F6, F9, F15: Todas têm "Tem certeza?" básico
- Nenhuma tem: "Há 5 dependências"
- Nenhuma tem undo (é localStorage, não há histórico)
- **Risco:** Clique errado = perda permanente de dados

### Padrão 2: Ambigüidade de Custos
- F7: "Custo por tamanho" vs "Custo global"?
- F10: "Custo" é por unidade ou total?
- F13: Breakdown mostra zeros sem explicação
- **Risco:** Usuária preenche errado, números ficam inconsistentes

### Padrão 3: Mudanças Sem Aviso de Propagação
- F8: Editar ficha pode quebrar 5 pedidos
- F5: Editar cliente reflete em histórico?
- F11: Editar ingrediente recalcula custos?
- **Risco:** Confiteira faz mudança, não sabe dos impactos

### Padrão 4: Dados Não Confiáveis
- F18: Saldos podem estar errados (vide auditoria financeira)
- F13: Breakdown mostra R$ 0 para custos
- **Risco:** Decisões baseadas em números errados

---

## 🚨 BLOQUEANTES PARA LANÇAMENTO

### Antes de lançar, CORRIGIR:

1. 🔴 **F6, F9, F15**: Adicionar "Tem X dependências" antes de deletar
2. 🔴 **F18**: Validar se números de saldos estão corretos (ver auditoria financeira)
3. 🔴 **F13**: Explicar por que breakdown mostra zeros
4. 🟠 **F8**: Adicionar versionamento de custos ou aviso de propagação
5. 🟠 **F7**: Clarificar "Custo global" vs "Custo por tamanho"

---

## ✅ FLUXOS PRONTOS

- F4: Cadastrar cliente ✓
- F16: Registrar pagamento ✓
- F17: Gerar PDF ✓

---

**Conclusão:** 🚨 **5 fluxos críticos precisa corrigir antes de lançar. 5 fluxos têm melhorias recomendadas. 3 fluxos estão prontos.**
