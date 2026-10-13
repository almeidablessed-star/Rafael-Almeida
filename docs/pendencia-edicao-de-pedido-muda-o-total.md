# RESOLVIDO: editar um pedido pode mudar o total sem avisar

> Registrado em 2026-09-28, com a trilha pausada por decisão do Rafael depois
> da Etapa 1.
>
> **Resolvido — verificado ao vivo em 2026-10-13.** As Etapas 2 e 3 foram
> entregues logo depois deste texto e o documento ficou para trás: `a037776`
> (30/09, itens), `414fa32` (01/10, adicionais) e `cd5df00` (anotações). Todos
> em produção.
>
> O caminho escolhido foi o **Caminho B** recomendado abaixo: itens e
> adicionais passaram a ser gravados estruturados em `breakdown.itens` e
> `breakdown.adicionaisDetalhados`, e a edição lê de lá. `ficha_itens` não foi
> tocado.
>
> **Teste feito em 2026-10-13** (roteiro em
> `docs/teste-aceitacao-edicao-de-pedido.md`), com pedido de R$ 1.073,00 —
> duas fichas diferentes, um item "Outro / Personalizado", entrega e adicional:
> salvar sem mexer em nada **duas vezes seguidas** deixou o total, a linha crua
> do banco (`breakdown` + `ficha_itens`) e o estoque **idênticos**. As
> anotações continuaram `null` nas duas vezes — o texto "Breakdown:" não volta
> mais ao campo.
>
> **Três ressalvas que continuam valendo:**
>
> 1. **Pedidos criados antes de 30/09 não têm `breakdown.itens`** e, por isso,
>    **não podem ser editados**: o app bloqueia o salvamento com um aviso
>    pedindo para refazer os itens (TransactionFormModal.tsx, "Pedido antigo,
>    sem a lista de itens gravada"). É proposital — melhor bloquear que gravar
>    valor errado —, mas é um beco sem saída para esses pedidos: a única saída
>    é apagar e lançar de novo.
> 2. **Os valores dos itens de ficha são recalculados pelo preço ATUAL da
>    ficha** ao reabrir, não pelo `valorUnitario` congelado (só item
>    personalizado e ficha apagada usam o valor gravado). Quem segura o
>    estrago é a "trava do centavo", que recusa salvar se o total remontado
>    divergir do gravado. Resultado prático: se a ficha mudou de preço, aquele
>    pedido fica travado para edição. O histórico não é reescrito, mas também
>    não é restaurado.
> 3. O ledger `estoque_movimentos` **cresce a cada edição** (devolução +
>    consumo), o que é o projeto do reequilíbrio e mantém o saldo correto —
>    mas as linhas de um produto apagado permanecem na tabela.
>
> O texto abaixo fica como registro do problema original.

## O problema

Abrir "Editar" num pedido e salvar **sem mexer em nada** pode mudar o valor do
pedido. Medido na tela, não deduzido:

Um pedido de **$250,00** — três itens de fichas diferentes ($100 + $60), um
item "Outro / Personalizado" ($45), entrega $25 e um adicional $20 — virou
**$205,00** ao ser salvo sem nenhuma alteração.

Três perdas somadas:

- **O adicional some** ($20). Ele não é restaurado ao abrir a edição.
- **Itens de fichas diferentes viram uma ficha só.** Os três itens viraram
  "TORTA SESSENTA × 3". E não é "vira o primeiro item": vira a primeira ficha
  cujo nome aparece na descrição, seguindo a ordem da lista de fichas. O valor
  final depende de qual ficha casa primeiro, não do que a cliente comprou — um
  pedido pode até ficar mais caro.
- **O item "Outro / Personalizado" é descartado**, esteja ele em que posição
  estiver. Testado também com ele em primeiro lugar: mesmo resultado.

Além disso, **as anotações internas crescem a cada salvamento**: o texto montado
pelo sistema é devolvido ao campo de observações e embrulhado dentro de si
mesmo. Medido: "Breakdown:" aparece 2× após a primeira edição e 3× após a
segunda.

## Regra provisória, enquanto não for corrigido

**Não usar "Editar" em pedidos que tenham adicionais ou mais de um item.**
Apagar o pedido e lançar de novo é mais seguro. Editar pedidos simples (um item
de ficha, sem adicionais) está seguro.

## O que já foi corrigido

**O sinal**, no commit `fbf23c5` (Etapa 1). O campo abria vazio e salvar apagava
do banco o valor que a cliente ainda devia. Agora ele abre preenchido, e há uma
confirmação caso alguém esvazie o campo de um pedido que tinha sinal.

## O que falta

- **Etapa 2** — restaurar adicionais e todos os itens.
- **Etapa 3** — parar de devolver o texto do sistema ao campo de anotações.

## Direção recomendada (NÃO aprovada)

**Caminho B: gravar adicionais e itens de forma estruturada dentro de
`breakdown`**, e ler de lá ao editar, em vez de depender do texto livre das
anotações.

Não precisa de mudança no banco: `breakdown` é `jsonb` e aceita campos novos.
**Não mexer em `ficha_itens`** — esse campo alimenta a baixa e a devolução de
estoque, e mudar o formato dele arriscaria o estoque sem necessidade.

O motivo de descartar o caminho alternativo (ler tudo do texto): o preço de cada
item e o item personalizado não existem no texto de forma confiável, então esse
caminho não fecha a conta.

## Perguntas em aberto para quem retomar

1. **Mostrar a linha crua gravada no banco.** A afirmação "os itens estão
   gravados de forma estruturada" veio só de leitura de código e **já foi
   corrigida duas vezes**. O que o código diz hoje: `ficha_itens` guarda ficha,
   nome, quantidade e tamanho, **sem o valor de cada item**, descarta o item
   personalizado e junta itens da mesma ficha numa linha só. Isso precisa ser
   confirmado olhando uma linha real antes de virar base de qualquer plano.
2. **O que acontece com o estoque ao editar um pedido?** A baixa usa
   `ficha_itens`. Se a edição reescreve esse campo com menos itens, o estoque
   pode ficar errado — não foi medido.
3. **De onde vêm os valores dos itens ao abrir a edição?** Se forem recalculados
   pelo preço atual da ficha, editar um pedido antigo reescreve o passado —
   exatamente o defeito que a composição gravada foi criada para evitar.

## Lição de método

**Afirmações sobre o que está gravado no banco devem ser confirmadas com a
linha crua, não só com a leitura do código.** Nesta investigação eu afirmei
duas vezes coisas sobre o dado gravado a partir do código e me corrigi duas
vezes. Ler o código diz o que ele *pretende* gravar; só a linha diz o que está
lá.
