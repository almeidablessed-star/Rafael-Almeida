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

## Um caso que ainda NÃO foi testado

**Itens de produtos diferentes.** Todos os testes até aqui usaram várias
unidades do *mesmo* produto, porque a conta de teste só tinha uma ficha. Nesse
caso os três itens viram uma linha com quantidade 3 e o valor por acaso
sobrevive.

Com produtos **diferentes** a expectativa é que o segundo e o terceiro item
sejam trocados pelo primeiro e o total mude — mas isso é dedução, não medição.
A Etapa 2 precisa começar por criar duas fichas de preços distintos e medir esse
caso antes de qualquer correção.

## Cuidado ao limpar depois do teste

A exclusão de pedidos e fichas tem **10 segundos de desfazer**. Recarregar a
página antes disso cancela a exclusão, e o dado volta. Esperar a janela fechar
antes de recarregar, e conferir depois de um reload que a conta ficou mesmo
limpa.
