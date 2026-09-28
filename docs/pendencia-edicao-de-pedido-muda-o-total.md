# Pendência: editar um pedido pode mudar o total sem avisar

> Registrado em 2026-09-28. Trilha **pausada por decisão do Rafael** — a
> Etapa 1 foi entregue, as Etapas 2 e 3 ficam para quando ele retomar.

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
