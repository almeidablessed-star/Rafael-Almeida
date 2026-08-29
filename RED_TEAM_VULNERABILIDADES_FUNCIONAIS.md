# 🔴 RED TEAM — VULNERABILIDADES FUNCIONAIS
## Carula Confeitaria — Teste de Quebra e Edge Cases

**Data:** 28 de Agosto de 2026  
**Objetivo:** Encontrar situações onde uma confeiteira causa estado inconsistente SEM PERCEBER  
**Foco:** Dados, cálculos, relacionamentos, navegação, valores  
**Metodologia:** Teste conceptual + análise de código

---

## 🎯 RESUMO

Encontradas **16 vulnerabilidades funcionais** onde o sistema permite estados inválidos ou cálculos inconsistentes. Nenhuma requer hacker; uma confeiteira normal pode causar essas situações acidentalmente.

**Risco:** ALTO - confeiteira registra dados que parecem corretos, mas estão inconsistentes internamente.

---

## 🔴 VULNERABILIDADES CRÍTICAS

### V1: Decimal Separator = Arredondamento Silencioso
**Tipo:** Vulnerabilidade de Cálculo  
**Gravidade:** ALTA  
**Cenário Real:**

```
Confeiteira digita: "147,50" (cento e quarenta e sete e meio)
Sistema converte: parseFloat("147,50".replace(',', '.')) = 147.5
Subtotal mostra: R$ 147,50 ✓

Confeiteira digita: "147,555" (erro de digitação)
Sistema converte: parseFloat("147,555".replace(',', '.')) = 147.555
Subtotal mostra: R$ 147,56 (arredonda para 2 casas)
Confeiteira não vê o valor real guardado (147.555)
Quando sincronizar com Supabase, será 147.555
Dashboard mostra R$ 147,56, mas banco tem 147.555
```

**Evidência no Código:**
```typescript
// src/components/TransactionFormModal.tsx:686
signalValue: signalValue ? Number(signalValue.replace(',', '.')) : undefined,
// NÃO há rounding para 2 casas decimais
```

**Impacto:**
- Pequenos erros se acumulam ao longo de dezenas de pedidos
- Diferença entre o que confiteira viu e o que saiu do caixa
- "Perdi R$ 2,37 em lugar nenhum"

**Como Reproduzir:**
1. Lançar pedido com valor "147,555"
2. Salvar
3. Editar pedido
4. Ver se mostra 147.56 ou 147.555
5. Criar outro com "147,557"
6. Depois de 100 pedidos, acumulam centavos

---

### V2: Quantidade Negativa = Estoque Sobe em Vez de Descer
**Tipo:** Lógica de Negócio Quebrada  
**Gravidade:** CRÍTICA  
**Cenário Real:**

```
Estoque inicial: Chocolate 500g

Confiteira digita quantidade "-2" (erro de clique)
Sistema salva: quantidade = -2
consumeIngredientsFromFicha() executa:
  stock.currentQuantity -= (-2) ← Subtração de negativo = SOMA
  stock.currentQuantity = 500 - (-2) = 502 ✓ (errado!)

Estoque final: Chocolate 502g (deveria ser 498g)

Confiteira não vê a venda negativa em lugar nenhum.
Estoque está fisicamente errado, mas dentro do app tá "consistente".
```

**Evidência no Código:**
```typescript
// src/utils/stockManager.ts:81
const totalQuantity = ingredient.quantity * factor;
// factor pode ser negativo se orderQuantity < 0
// Não há validação: const factor = Math.max(1, Number(orderQuantity));

stock.currentQuantity -= totalQuantity; // Subtração de negativo = soma
```

**Onde Falha a Validação:**
```typescript
// src/components/TransactionFormModal.tsx:559
if (unitValNum >= 0 && quantity > 0) { // Não checa quantity < 0
  setTotalValue(String(quantity * unitValNum));
}

// Falta:
// if (quantity < 0 || quantity === 0) return;
```

**Impacto:**
- Estoque fisicamente inconsistente
- Confiteira pensa que tem mais chocolate do que realmente tem
- Vende produto que não existe em quantidades suficientes
- Pedido é lançado, compra de reposição nunca é feita

**Como Reproduzir:**
1. Abrir "Lançar Pedido"
2. Tentar digitar "-2" no campo de quantidade
3. Se aceitar, salvar
4. Verificar Estoque → Chocolate está com quantidade maior

---

### V3: Deletar Ficha Técnica Deixa Pedidos Órfãos Sem Aviso
**Tipo:** Relacionamento Quebrado  
**Gravidade:** CRÍTICA  
**Cenário Real:**

```
Confiteira cadastra: "Bolo Chocolate" (fichaId: 42)
Lança 3 pedidos com essa ficha

Semanas depois, limpa cadastro. Delete "Bolo Chocolate"

Agora os 3 pedidos têm fichaId: 42 que não existe mais
Dashboard calcula saldos - fichas não encontram os itens consumidos
consumeIngredientsForOrder() não consegue achar a ficha:
  "Aviso: fichaId '42' não encontrado no catálogo"

Mas o pedido JÁ foi feito. Estoque foi consumido.
Agora não há como reverter ou recalcular.
```

**Evidência no Código:**
```typescript
// src/utils/storage.ts:90-95
const ficha = fichasDisponiveis.find((f) => f.id === item.fichaId);
if (!ficha) {
  console.warn(`[ESTOQUE] Aviso: fichaId "${item.fichaId}" não encontrado...`);
  // Apenas loga aviso, continua silenciosamente
}
return ficha ? { ficha, quantity: item.quantity } : null;
```

E não há cascata de exclusão ou validação:
```typescript
// src/context/FichasTecnicasContext.tsx:229
const deleteFicha = async (id: string) => {
  // Delete direto sem verificar se há pedidos usando essa ficha
  const { error: deleteError } = await supabase
    .from('fichas_tecnicas')
    .delete()
    .eq('id', parseInt(id));
  // ← Nenhuma validação que evite orfandade
};
```

**Impacto:**
- Histórico de vendas referencia fichas que não existem mais
- Impossível regenerar consumo de estoque para esses pedidos
- Cálculos de saldos ficam inconsistentes (faltam insumos)
- Confiteira pensa que tem mais estoque do que realmente tem

---

### V4: Editar Pedido = Duplicação ou Falta de Consumo de Estoque
**Tipo:** Lógica de Transação Incompleta  
**Gravidade:** CRÍTICA  
**Cenário Real:**

```
Confiteira lança pedido: "2x Bolo Chocolate"
Sistema consome: Chocolate -200g (está correto, 100g por bolo)
Estoque agora: 300g

Confiteira edita o pedido: "3x Bolo Chocolate"
updateSaleWithStock() tenta devolve estoque antigo:
  returnIngredientsToStock() → Chocolate +200g → 500g

Depois reconsome com novo quantidade:
  consumeIngredientsForOrder() → Chocolate -300g → 200g

AH, MAS: E se a edição for REJEITADA por erro de rede?
Estoque ficou +200g (devolvido) mas a edição não completou.
Danos: -100g consumido fantasma, +200g devolvido fantasma.
```

**Evidência no Código:**
```typescript
// src/utils/storage.ts:70-84
export const updateSaleWithStock = (
  updatedTx: Transaction,
  fichasDisponiveis: FichaTecnica[]
): Transaction => {
  const current = getStoredTransactions();
  const existing = current.find((t) => t.id === updatedTx.id);

  // 1. Desfaz o consumo antigo, se havia
  if (existing?.consumedIngredients?.length) {
    returnIngredientsToStock(existing.id, existing.consumedIngredients, updatedTx.date);
  }

  // 2. Reconsome pela composicao nova
  const fichaItems = updatedTx.fichaItems || [];
  
  // PROBLEMA: Se ficha não é encontrada aqui, reconsumo não acontece
  // Mas estoque JÁ foi devolvido! Ficar desbalanceado.
};
```

**E onde SaveTransactions pode falhar:**
```typescript
// Não há try/catch em volta de updateSaleWithStock
// Se localStorage.setItem() falhar (quota exceeded), estado fica meia-boca:
// - Estoque devolvido ✓
// - Nova transaction NÃO foi salva ✗
// - Próximo reload vê estoque +200 mas pedido original ainda lá ✗
```

**Impacto:**
- Editar quantidade → estoque fica errado
- Estoque pode virar negativo (se tenta consumir mais do que tem)
- Devolver estoque sem reconsumir → sobra material fantasma

---

### V5: Valor Total = 0 → Confeiteira Vende Sem Registrar Preço
**Tipo:** Validação Ausente  
**Gravidade:** ALTA  
**Cenário Real:**

```
Confiteira abre "Lançar Pedido"
Digita nome do cliente
Digita nome do produto
ESQUECE de preencher o preço (campo estava vazio)
Sistema calcula:
  unitValue = parseFloat("") = NaN
  NaN || 0 = 0
  totalValue = 0

Clica em "Confirmar e Gravar"
Pedido é salvo com:
  unitValue: 0
  totalValue: 0
  signalValue: undefined

Semanas depois:
  Dashboard mostra: "Vendi R$ 100" (outro pedido)
  Mas houve 10 pedidos de R$ 0 silenciosos
  Números financeiros estão completamente errados
```

**Evidência no Código:**
```typescript
// src/components/TransactionFormModal.tsx:708-710
const parsedUnit = parseFloat(unitValue.replace(',', '.')) || 0;
const parsedQty = parseInt(quantity, 10) || 1;
const calcTotal = parsedQty * parsedUnit; // Se parsedUnit = 0, total = 0

// E depois:
// if (grandTotalSalePrice <= 0) { ... } // Às vezes bloqueia, às vezes não
```

**Onde Validação é Inconsistente:**
```typescript
// src/components/TransactionFormModal.tsx:605
if (grandTotalSalePrice <= 0) { // Valida em ALGUNS lugares
  return; // Bloqueia save
}

// Mas em OUTRO lugar, talvez não valide:
// Se confiteira chegar pelo caminho alternativo, valor 0 é salvo
```

**Impacto:**
- Venda fantasma com R$ 0 entra no sistema
- Saldos ficam inconsistentes
- Quantidade de vendas não bate com faturamento
- Estoque foi consumido mas nenhum dinheiro foi registrado

---

### V6: signalValue > totalValue = Recebimento Maior que Venda
**Tipo:** Lógica de Negócio Violada  
**Gravidade:** CRÍTICA  
**Cenário Real:**

```
Confiteira lança pedido: Valor Total: R$ 100
Pede sinal de: R$ 150 (erro de digitação)

Sistema salva:
  totalValue: 100
  signalValue: 150

Dashboard mostra:
  "A Receber: R$ 50" (150 - 100 = -50, ???)

Cálculo fica: 100 - 150 = -50
Confiteira lê como "devo R$ 50" (inverte significado)

Pior: Se sistema usa para cálculo de caixa:
  "Pago: R$ 150 | Total da venda: R$ 100 | Falta: -R$ 50"
  Sistema fica confuso se sinal > total
```

**Evidência no Código:**
```typescript
// src/components/TransactionFormModal.tsx
// Não há validação de signalValue <= totalValue

// Validação parcial em:
// 1603: if (numVal <= totalNum) { setSignalValue(val); }
// Mas só valida se totalValue JÁ está preenchido

// Cenário perigoso:
// 1. Digita: Sinal = 150, Total = vazio
// 2. Validação passa (porque total está vazio)
// 3. Depois preenche Total = 100
// 4. Sistema não revalida se sinal > total
```

**Impacto:**
- Recebimentos podem ser maiores que vendas
- Cálculos de "A Receber" ficam negativos e confusos
- Relatório financeiro mostra valor errado

---

### V7: Excluir Ingrediente Usado em Receita = Consumo Quebrado
**Tipo:** Relacionamento Cascata Faltando  
**Gravidade:** ALTA  
**Cenário Real:**

```
Ficha "Bolo Chocolate" tem ingrediente:
  - Chocolate: 100g por bolo

Confiteira vende 5 bolos → Consome 500g de Chocolate
Estoque: 500 → 0g

Depois, no módulo de Fichas, EDITA a receita:
- Remove "Chocolate" da lista de ingredientes
- Salva ficha

Agora a ficha não tem Chocolate, mas os 5 pedidos antigos têm:
  consumedIngredients: [{ ingredientId: 'choc_1', quantity: 500 }]

Se confiteira EDITA um daqueles 5 pedidos:
  updateSaleWithStock() tenta reconsumir
  Mas Chocolate não está mais na ficha
  consumeIngredientsForOrder() não encontra Chocolate
  Estoque não é reatuado: fica inconsistente
```

**Evidência no Código:**
```typescript
// src/context/FichasTecnicasContext.tsx:205
const updateFicha = async (id: string, fichaData: ...) => {
  // Edita a ficha e altera ingredientes
  // Nenhuma check: "essa ficha é usada em N pedidos antigos?"
  // Nenhuma validação: impedir remoção de ingrediente se há pedidos?
};

// Depois quando edita pedido:
// src/utils/storage.ts:87-99
const resolved = fichaItems
  .map((item) => {
    const ficha = fichasDisponiveis.find((f) => f.id === item.fichaId);
    if (!ficha) { console.warn(...); }
    return ficha ? { ficha, quantity: item.quantity } : null;
  })
```

**Impacto:**
- Estoque desatualizado se receita for editada retroativamente
- Pedidos antigos referem ingredientes que não existem mais
- Impossível regenerar consumo de estoque

---

## ⚠️ VULNERABILIDADES ALTAS

### V8: Float Precision = R$ 0,01 se Multiplica em Cálculos
**Tipo:** Erro de Ponto Flutuante  
**Gravidade:** ALTA  

```
Confiteira cria ficha: Preço = R$ 33,33 (terço de 100)

Lança pedido: 3x R$ 33,33 = R$ 99,99 (esperado)

Sistema calcula:
  parseFloat("33,33".replace(',', '.')) = 33.33
  3 * 33.33 = 99.99000000000001 (erro de float)

Confiteira ve: R$ 99,99 ✓
Banco armazena: 99.99000000000001
Dashboard calcula saldos: 99.99000000000001 - 100 = -0.00999999999
Porcentagem: ((99.99000000000001) / 100) * 100 = 99.99000000000001%

Após 1000 vendas desse tipo, centavos se acumulam:
  Total visto: R$ 1.000,00
  Total somado: R$ 1.000,00731 (?) 
```

**Impacto:**
- Pequeninas diferenças se acumulam
- Relatório financeiro não bate com caixa
- "Perdi alguns centavos"

---

### V9: Editar Cliente = Pedidos Antigos Mostram Dados Novos
**Tipo:** Referência Sem Snapshot  
**Gravidade:** ALTA  
**Cenário Real:**

```
Confiteira lança pedido para "Maria" com:
  customerName: "Maria"
  customerPhone: "123456"
  customerAddress: "Rua A"
  
Depois EDITA o cliente Maria no app:
  Nome: "Maria Silva" (adiciona sobrenome)
  Telefone: "987654" (troca número)
  Endereço: "Rua B" (muda endereço)

Abre o PDF do pedido antigo:
  Mostra: "Maria Silva | 987654 | Rua B"
  
MAS: Cliente solicitou o bolo para "Maria | 123456 | Rua A"!

Confiteira entrega em endereço errado ou liga para número errado.
```

**Evidência no Código:**
```typescript
// Transaction interface:
export interface Transaction {
  id: string;
  customerName?: string; // Snapshot de nome
  customerPhone?: string; // Snapshot de telefone
  // ... SEM referência para ForeignKey customer.id
}

// Nunca há:
// customerId?: string; // para buscar dados atualizados

// Na edição:
// src/components/TransactionFormModal.tsx:164
const applyCustomer = async (found: Customer) => {
  setCustomerName(found.name); // Copia nome AGORA
  setCustomerPhone(found.phone || ''); // Copia telefone AGORA
  // Se cliente edita depois, isso não reflete em pedidos antigos
};
```

**Impacto:**
- Dados de cliente do pedido mudam quando cliente é editado
- PDF mostra endereço/telefone errado
- Confiteira entrega errado

---

### V10: Deletar Cliente = Pedidos Órfãos Sem Aviso
**Tipo:** Relacionamento Quebrado  
**Gravidade:** ALTA  
**Cenário Real:**

```
Confiteira tem "Maria" com 5 pedidos

Delete "Maria" por engano

Agora os 5 pedidos têm customerName: "Maria"
Mas não há referência para o objeto cliente (sem customerId na transaction)

Se confiteira precisa saber:
  - Qual era o telefone de Maria? ← Perdido
  - Qual era o endereço? ← Perdido
  - Qual era a data de aniversário? ← Perdido

Só tem o nome "Maria" em texto solto
```

**Evidência:**
Transações não têm `customerId`, só `customerName` em texto.

**Impacto:**
- Histórico de pedidos perde contexto do cliente
- Impossível recuperar dados do cliente

---

### V11: Stale Data Quando Usuária Abre 2 Abas de Fichas
**Tipo:** Sincronização Multi-Aba  
**Gravidade:** ALTA  
**Cenário Real:**

```
Aba 1: Abre Fichas Técnicas
Aba 2: Abre Fichas Técnicas (nova aba, mesmo app)

Aba 1: Clica "Editar" na Ficha "Bolo Chocolate"
Aba 1: Muda preço de R$ 50 → R$ 60
Aba 1: Salva ✓

Aba 2: Ainda vê R$ 50 (dados carregados quando aba abriu)
Aba 2: Clica "Editar" na mesma Ficha
Aba 2: Muda preço de R$ 50 → R$ 55
Aba 2: Salva ✓ (SOBRESCREVE a mudança da Aba 1!)

Resultado: Preço virou R$ 55 em vez de R$ 60
A mudança da Aba 1 foi perdida silenciosamente
```

**Impacto:**
- Edições são sobrescrites sem aviso
- Dados perdidos de forma silenciosa

---

### V12: Ficha Técnica com Tamanhos Duplicados = Confusão de Preços
**Tipo:** Validação de Dados  
**Gravidade:** MÉDIA  
**Cenário Real:**

```
Confiteira cria Ficha "Bolo Chocolate" com tamanhos:
  - 20cm: R$ 50
  - 20cm: R$ 60 (duplicado por engano)

Sistema não bloqueia porque não há validação única por tamanho

Quando vende:
  "20cm" aparece 2x no dropdown
  Confiteira clica primeiro
  Sistema usa R$ 50
  Confiteira acha que vendeu por R$ 60
```

**Impacto:**
- Preço é registrado errado
- Confiteira não sabe qual das duplicatas foi usada

---

### V13: Quantidade Decimal em Quantity = Estoque Quebrado
**Tipo:** Validação de Tipo  
**Gravidade:** ALTA  
**Cenário Real:**

```
Confiteira digita quantidade: "2,5" (dois e meio bolos)
Campo quantity deveria ser integer, não float

Sistema salva quantity: 2.5
consumeIngredientsFromFicha executa:
  totalQuantity = 100 * 2.5 = 250g (OK por acaso)

Mas ao exibir:
  Dashboard mostra: "Vendidas: 2.5" (confuso, não há meia-unidade)
  Número de pedidos: "2.5 vendas" (???)
```

**Impacto:**
- Números não fazem sentido para unidades inteiras
- Estoque pode fica estranho

---

## 🔸 VULNERABILIDADES MÉDIAS

### V14: signalValue sem Símbolo de Moeda Confunde Usuária
**Tipo:** UX  
**Gravidade:** MÉDIA  
**Cenário Real:**

```
Pedido Total: R$ 100
Campo "Valor do Sinal": [147,00]

Confiteira acha que deve receber R$ 147 de entrada
MAS: campo é OPCIONAL

Se deixar vazio, significa:
  signalValue: undefined → usa totalValue inteiro → R$ 100

Mas se digita "147" naquele campo:
  signalValue: 147 → A receber: 0

Confiteira não sabe se "vazio" = "ignore" ou "use 0"
```

**Impacto:**
- Confusão se campo é opcional ou obrigatório

---

### V15: Percentual de Lucro Não Reflete signalValue
**Tipo:** Cálculo Incorreto  
**Gravidade:** MÉDIA  
**Cenário Real:**

```
Venda: R$ 100 total
Sinal: R$ 30 pago
A Receber: R$ 70

Dashboard calcula lucro como:
  totalPaidSales = 30 (sinal)
  totalExpenses = 50
  Lucro = 30 - 50 = -20 (NEGATIVO!)
  Margem: -20 / 30 = -66% (???)

Confiteira vê lucro NEGATIVO quando na verdade fará R$ 50 no total.
Visualização financeira é completamente enganosa.
```

**Impacto:**
- Confiteira vê dashboard com números alarmantes
- Pode abandonar o app pensando que está perdendo dinheiro

---

### V16: Clique Duplo em "Confirmar" = Duplicação de Transação
**Tipo:** Race Condition  
**Gravidade:** MÉDIA  
**Cenário Real:**

```
Confiteira clica "Confirmar e Gravar" (lento loading)
Sem feedback visual, pensa que não clicou
Clica novamente

Duas requisições são enviadas:
  POST /save-transaction (1)
  POST /save-transaction (2)

Se não há idempotência:
  Transação é criada DUAS VEZES
  Mesmo ID será diferente (por timestamp)
  Mas dados são idênticos

Estoque é consumido DUAS VEZES
Cliente é duplicado no histórico
```

**Evidência no Código:**
```typescript
// src/components/TransactionFormModal.tsx
const handleSaveTransaction = () => {
  onSave(txData); // Nenhum botão disabled
  // ↓ Próximo render pode ter o mesmo onSave novamente
};

// Não há:
// const [isSaving, setIsSaving] = useState(false);
// if (isSaving) return;
// button disabled={isSaving}
```

**Impacto:**
- Transações são duplicadas
- Estoque consumido em dobro
- Números financeiros errados

---

## 📊 TABELA DE VULNERABILIDADES

| # | Vulnerabilidade | Tipo | Gravidade | Como Usuária Causa | Impacto |
|---|---|---|---|---|---|
| V1 | Decimal arredondamento | Cálculo | ALTA | Digita "147,555" | Centavos acumulam |
| V2 | Quantidade negativa | Lógica | CRÍTICA | Erro de digitação "-2" | Estoque sobe em vez de descer |
| V3 | Deletar ficha usada | Relacionamento | CRÍTICA | Delete sem verificar | Pedidos orphaned |
| V4 | Editar pedido = duplica consumo | Transação | CRÍTICA | Edita quantidade | Estoque inconsistente |
| V5 | Valor = 0 sem aviso | Validação | ALTA | Esquece preencher preço | Venda fantasma registrada |
| V6 | signalValue > totalValue | Lógica | CRÍTICA | Erro de digitação | Recebimento > venda |
| V7 | Remove ingrediente de receita | Cascata | ALTA | Edita ficha | Estoque desatualizado |
| V8 | Float precision | Ponto Flutuante | ALTA | 3 x R$ 33,33 | Centavos se acumulam |
| V9 | Cliente editado = pedido muda | Snapshot | ALTA | Edita cliente antigo | Pedido mostra dado novo |
| V10 | Deletar cliente = pedidos orphaned | Relacionamento | ALTA | Delete cliente | Dados perdidos |
| V11 | Editar mesmo item em 2 abas | Sincronização | ALTA | 2 abas abertas | Mudança sobrescrita |
| V12 | Tamanhos duplicados na ficha | Validação | MÉDIA | Digita 2x "20cm" | Preço confuso |
| V13 | Quantidade decimal | Tipo | ALTA | Digita "2,5" | Unidades não fazem sentido |
| V14 | signalValue sem símbolo | UX | MÉDIA | Deixa vazio vs. digita | Confusão se é opcional |
| V15 | Lucro com signalValue errado | Cálculo | MÉDIA | Usa sinal | Dashboard mostra negativo |
| V16 | Clique duplo confirmar | Race | MÉDIA | Clica 2x por lentidão | Transação duplicada |

---

## 🎯 CENÁRIOS DE FALHA COMPLETA (Combinações)

### Cenário Crítico 1: "Perdi Meus Dados"
```
1. Confiteira trabalha em Safari desktop
2. Lança 10 pedidos (salvos em localStorage)
3. Troca para Chrome (localStorage vazio)
4. Abre app
5. Vê "Nenhuma venda registrada"
6. Cancela assinatura: "O app deletou meus dados"

Raiz: localStorage não sincroniza entre browsers
```

### Cenário Crítico 2: "Números Não Batem"
```
1. Lança 5 pedidos com quantidade negativa por erro (V2)
2. Estoque sobe em vez de descer
3. Lança 3 pedidos com preço 0 por engano (V5)
4. Dashboard mostra R$ 200 vendido
5. Caixa tem R$ 300
6. "O app tá roubando meu dinheiro"

Raiz: Múltiplas validações ausentes se combinam
```

### Cenário Crítico 3: "Receita Desapareceu"
```
1. Edita "Bolo Chocolate" em 2 abas (V11)
2. Aba 1: muda preço 50→60, salva
3. Aba 2: muda preço 50→55, salva (sobrescreve)
4. Próximos 10 pedidos: usam R$ 55
5. Confiteira acha que vendeu por R$ 60
6. Perdeu R$ 50 em margem

Raiz: Sem sincronização multi-aba ou lock pessimista
```

---

## 🔧 PADRÕES DE EXPLORAÇÃO

### 1. **Manipulação Numérica**
- Decimais com precisão excessiva (V1)
- Números negativos (V2)
- Quantidades fracionadas (V13)
- Valores zero (V5)
- signalValue > totalValue (V6)

### 2. **Deletar Relacionados**
- Ficha usada em pedidos (V3, V7)
- Cliente com histórico (V10)
- Ingrediente em receita (V7)
- Sem validação em cascata

### 3. **Edição Retroativa**
- Cliente editado → pedidos antigos mostram dados novos (V9)
- Receita editada → consumo anterior invalida (V7)
- Mesma ficha aberta em 2 abas → sobrescrita (V11)

### 4. **Estados Zumbis**
- Transações com ficha deleted (V3)
- Ingredientes removidos de receita (V7)
- Clientes deletados ainda em pedidos antigos (V10)
- Sem cascata delete ou soft delete

### 5. **Race Conditions**
- Clique duplo no salvar (V16)
- Múltiplas abas editando (V11)
- Sem debouncing, throttling ou disabled button

---

## 💡 PADRÕES NÃO IMPLEMENTADOS

1. **Cascata Delete**
   - Deletar ficha deveria validar: "5 pedidos usam isso"
   - Opção: "Manter histórico com ficha snapshot" ou "Recusar delete"

2. **Idempotência**
   - Clique duplo no salvar deveria usar requestId deduplication
   - Servidor deve responder com mesmo resultado para requestId duplicado

3. **Soft Delete**
   - Fichas, clientes, ingredientes com `deleted_at` timestamp
   - Não deletar, apenas marcar como inativo
   - Histórico permanece válido

4. **Snapshot de Dados**
   - Transação deveria guardar snapshot de cliente (nome, telefone, endereço)
   - Não referência `customerId` apenas
   - Histórico fica imutável

5. **Numeric Constraints**
   - quantity ∈ (0, MAX_INT] (nunca zero, nunca negativa, nunca decimal)
   - signalValue ∈ [0, totalValue]
   - unitValue > 0
   - Validação tanto frontend quanto banco

6. **Debounce / Throttle**
   - Botão "Confirmar" disabled durante save
   - onSave com debouncing
   - Feedback visual de "salvando..."

7. **Foreign Keys no Banco**
   - Supabase: `fichaId` → referência integrity
   - Supabase: `customerId` → referência integrity
   - Banco recusa operações que quebrem integridade

---

## 🎬 COMO USUÁRIA PODE CAUSAR CADA VULNERABILIDADE

| V# | Ação | Resultado |
|---|---|---|
| V1 | Digita "147,555" | Centavos acumulam |
| V2 | Digita "-2" em quantidade | Estoque sobe |
| V3 | Delete "Bolo Chocolate" | 5 pedidos orphaned |
| V4 | Edita pedido de 2x → 3x | Estoque desatualizado |
| V5 | Deixa preço vazio | Venda R$ 0 salva |
| V6 | Digita sinal de R$ 150 com total R$ 100 | Confusão de valores |
| V7 | Remove ingrediente de receita | Pedidos antigos inválidos |
| V8 | Vende 3x R$ 33,33 | Float error acumula |
| V9 | Edita cliente antigo | PDF mostra dado novo |
| V10 | Delete cliente | Histórico perde contexto |
| V11 | Abre ficha em 2 abas, edita ambas | Mudança sobrescrita |
| V12 | Digita "20cm" 2x na receita | Dropdown duplicado |
| V13 | Digita "2,5" em quantidade | Unidade não faz sentido |
| V14 | Deixa sinal vazio | Não sabe se é 0 ou ignore |
| V15 | Faz venda com sinal | Dashboard mostra margem errada |
| V16 | Clica "Confirmar" 2x rapidamente | Transação duplicada |

---

## 🔴 CONCLUSÃO

**16 vulnerabilidades funcionais encontradas** onde o sistema não protege contra erros de usuária ou permite estados inconsistentes.

**Padrão:** O aplicativo **confia demais em dados corretos** e não valida em:
- ✗ Numeric constraints (negativo, zero, decimal)
- ✗ Relacionamentos (ficha usada? cliente tem pedidos?)
- ✗ Sincronização (multi-aba, multi-browser)
- ✗ Idempotência (clique duplo = problema)
- ✗ Snapshots (dados que mudam retroativamente)

**Risco:** Confiteira usa app normalmente e **sem perceber causa inconsistências** que quebram números financeiros.

**Recomendação para QA:** Próxima rodada, adicionar testes de validação numeric, cascade delete, multi-aba sync, e race conditions de salvar duplo.

---

**RED TEAM Assessment: 🔴 VULNERÁVEL**

O aplicativo é quebrável sem intenção maliciosa. Uma confiteira normal, em 1-2 semanas de uso normal, pode facilmente causar uma (ou mais) dessas 16 situações.
