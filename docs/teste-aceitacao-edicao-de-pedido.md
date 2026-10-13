# Teste de aceitação da edição de pedido

> Criado em 2026-09-28, junto da Etapa 1 da correção. **Repetir a cada etapa**
> seguinte, antes de considerá-la pronta.

## Por que este teste existe

Editar um pedido apagava dados silenciosamente. O defeito não estava em salvar,
e sim em **abrir**: o formulário de edição preenche os campos um a um, e o que
ele esquece de preencher é gravado como vazio ao salvar. Ou seja, qualquer campo
esquecido vira perda de dado — e isso não aparece em nenhum teste de "criar
pedido", só ao editar um que já existe.

Por isso o teste é sempre o mesmo e é sempre de ida e volta.

## O teste

1. Criar um pedido **com tudo preenchido**: nome, telefone, endereço,
   observações da cliente, data e horário de entrega, forma de pagamento,
   **sinal**, **entrega com valor**, **adicionais** e **mais de um item**.
2. Anotar o total e o que a lista de Pedidos mostra.
3. Abrir **"Editar"** e conferir campo por campo o que voltou preenchido.
4. **Salvar sem mexer em nada.**
5. Recarregar a página (para ler do servidor, não da tela) e conferir que
   **nada mudou**: mesmo total, mesmo sinal, mesmos itens, mesmos adicionais.

Passa se o pedido depois for idêntico ao de antes.

## Estado por etapa

| Campo | Situação |
|---|---|
| Nome, telefone, endereço, observações, datas, horário, pagamento, status, fotos | OK desde sempre |
| Taxa de entrega | OK (reconstruída a partir do texto do pedido) |
| **Sinal** | **corrigido na Etapa 1** (commit `fbf23c5`) |
| Adicionais | **ainda se perdem** — Etapa 2 |
| Itens além do primeiro | **ainda se perdem** — Etapa 2 |
| Anotações internas | **ainda se embrulham** a cada edição — Etapa 3 |

Enquanto as Etapas 2 e 3 não chegarem, rode o teste com pedidos **sem
adicionais e com um item só**, senão o resultado mistura defeitos já conhecidos
com regressões novas.

## O caso dos produtos diferentes — TESTADO em 2026-10-13

Este era o caso que faltava: até então todos os testes usavam várias unidades
do *mesmo* produto, porque a conta só tinha uma ficha.

Montado na conta real, com dados de teste criados e apagados no mesmo dia: um
produto de estoque (5.000 g), uma ficha nova ligada a ele (100 g por unidade,
R$ 50,00) e um pedido de **R$ 1.073,00** com **duas fichas diferentes**
(1× R$ 883,00 + 2× R$ 50,00), um item **"Outro / Personalizado"** (R$ 45,00),
**entrega** (R$ 25,00) e **adicional** (R$ 20,00).

Resultado de salvar sem mexer em nada, **duas vezes seguidas**:

| | antes | depois da 1ª | depois da 2ª |
|---|---|---|---|
| Total | R$ 1.073,00 | R$ 1.073,00 | R$ 1.073,00 |
| Itens em `breakdown.itens` | 3 | 3 | 3 |
| `breakdown` + `ficha_itens` | — | byte a byte idênticos | idênticos |
| `notas` | `null` | `null` | `null` |
| Estoque do insumo | 4.800 g | 4.800 g | 4.800 g |

A expectativa antiga registrada aqui — "o segundo e o terceiro item são
trocados pelo primeiro e o total muda" — **não se confirma mais**: as Etapas 2
e 3 corrigiram isso antes deste teste.

## Estoque na edição — TESTADO em 2026-10-13

A edição **não calcula delta**: devolve tudo o que a versão antiga consumiu e
consome de novo pela composição nova (App.tsx). Medido em
`estoque_movimentos`: cada salvamento grava um par `devolucao: 200` +
`consumo: 200`, e o saldo fica em 4.800 g. Apagar o pedido devolveu os 200 g e
o saldo voltou a 5.000 g, exatamente o valor inicial.

O ledger cresce a cada edição — é o projeto do reequilíbrio, não um defeito —,
mas as linhas de um produto já apagado continuam na tabela.

## Cuidado ao limpar depois do teste

A exclusão de pedidos e fichas tem **10 segundos de desfazer**. Recarregar a
página antes disso cancela a exclusão, e o dado volta. Esperar a janela fechar
antes de recarregar, e conferir depois de um reload que a conta ficou mesmo
limpa.
