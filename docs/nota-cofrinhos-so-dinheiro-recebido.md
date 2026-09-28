# Nota: os cofrinhos passaram a contar só o dinheiro recebido

> 2026-09-27. Duas limitações conhecidas e aceitas, registradas junto da
> mudança que trocou os círculos do card "Saldos & Divisão dos Pedidos" por
> cartões em dinheiro.

## O que mudou

O card contava a composição **inteira** de um pedido assim que ele era
registrado, mesmo quando só o sinal havia sido recebido. Num pedido de $100
com sinal de $40, os cofrinhos guardavam os $100 enquanto o caixa tinha $40 —
e a confeiteira podia comprar insumo com dinheiro que ainda não existia.

Agora entra só o que já chegou, na proporção do recebido: pendente não entra,
sinal de $40 em $100 entra a 40%, pago por completo entra inteiro. Isso alinha
o card com o "Já entrou" da Meta, que **sempre** contou só o sinal — antes os
dois discordavam sobre o mesmo dinheiro.

## Limitação 1: em qual período o dinheiro conta

Quando o restante de um pedido é pago numa semana diferente daquela em que ele
foi lançado, **o dinheiro conta na semana do lançamento**, não naquela em que
chegou. Marcar um pedido como pago não altera a data de registro, e é por essa
data que a janela do período filtra.

Efeito prático: receber o restante faz o número de uma semana **passada**
subir depois. Isso já acontecia no "Já entrou" da Meta, então a mudança não
introduziu a limitação — só passou a compartilhá-la, o que ao menos deixa as
duas telas coerentes entre si.

Corrigir de verdade exigiria **guardar a data de cada pagamento**, e não só o
valor do sinal: hoje a transação registra *quanto* foi recebido, nunca
*quando*. Isso é mudança de estrutura de dados, e ficou fora deste trabalho.

## Limitação 2: "Mão de obra" inclui entrega e adicionais

O cofrinho chamado **Mão de obra** soma três coisas da composição da venda: a
mão de obra propriamente dita, os **adicionais** (flores, velas, topos) e a
**entrega**. O nome só menciona a primeira.

Isso é anterior a esta mudança e foi mantido de propósito — trocar o nome ou a
conta estava fora do escopo. Fica registrado porque o número do cartão pode
parecer maior do que o esperado para quem cobra entrega ou adicionais com
frequência, e a explicação não está em lugar nenhum da tela.

Se um dia for endereçado, as opções são renomear o cartão (por exemplo "Seu
trabalho e extras") ou separar entrega e adicionais num cofrinho próprio — a
segunda mexe em cálculo e mudaria números de contas existentes.
