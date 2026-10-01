# Pendência — três falhas no primeiro acesso (cadastro + onboarding)

> **Situação em 2026-10-01, fim do dia:** os itens 1 e 2 foram corrigidos e
> estão em produção (ver "Como ficou", no fim de cada um). O item 3 continua
> em aberto, por decisão de escopo.

Encontradas em 2026-10-01 numa auditoria **só de leitura** do código de cadastro
e do onboarding financeiro, pedida junto com o reset de uma conta de teste.
Nenhuma foi corrigida: o Rafael pediu explicitamente que ficassem registradas
para decidir o escopo depois. Nada aqui quebra o cálculo financeiro — o
`financialEngine.ts` já guarda todas as divisões e lida com banco vazio. O que
está em jogo é a qualidade do dado que a pessoa informa no primeiro uso.

## 1. Vírgula no teclado pt-BR zera o campo em silêncio

`src/components/onboarding/EmpresaOnboardingFlow.tsx`, linhas 286, 311, 407,
414, 527, 551 e 575: todos os campos numéricos do fluxo são
`<input type="number">` lidos com `Number(e.target.value)`.

Quando a pessoa digita `12,50` — a forma natural no teclado pt-BR, e a que o
resto do app exibe — o browser considera o valor inválido e devolve **string
vazia** em `e.target.value`. `Number('')` é `0`, então o estado recebe zero.
Não há NaN, não há erro, não há aviso: o campo simplesmente fica em branco e o
valor gravado é 0. Isso atinge o recebimento desejado, o valor da hora, o valor
e o rateio de cada despesa, e as três metas percentuais.

**Como ficou (corrigido em 2026-10-01).** Os nove campos passaram a usar
`type="text"` com `inputMode="decimal"`, dentro do componente local
`CampoNumerico`, e a string crua é interpretada por `parseNumeroDigitado`
(`src/utils/formatters.ts`). A vírgula é sempre decimal; o ponto é milhar
quando vem seguido de exatamente 3 dígitos, e decimal nos outros casos.
Confirmado na tela: "3.000" grava 3000 e "3000,50" grava 3000.5.

## 2. O onboarding pode ser concluído com tudo em zero

Nenhum dos 9 passos exige valor maior que zero — os botões "Avançar" só ficam
desabilitados enquanto `salvando` é true. É possível atravessar o fluxo inteiro
deixando tudo em 0, e o botão "Concluir" do passo 9 continua habilitado, porque
`estrutura.valido` depende apenas das três porcentagens (que nascem com os
defaults 34/5/13 e somam 52%), não dos valores em dinheiro.

O resultado é uma conta com o onboarding marcado como completo, faturamento
necessário 0 e meta de horas 0 — ou seja, o Início nasce com metas zeradas em
vez de ter pedido o dado que faltava. Combinado com o item 1, esse estado pode
acontecer sem a pessoa perceber que informou zero. A conta de teste
`rdealmeida590@gmail.com` estava exatamente assim quando isto foi escrito.

**Como ficou (corrigido em 2026-10-01).** "Confirmar e concluir" passou a
exigir `monthlyIncomeTarget > 0`: abaixo disso mostra um aviso explicando que
é desse valor que saem todas as metas, com um botão "Preencher agora" que leva
de volta ao passo 1. Só esse campo é obrigatório — CMV, investimento, lucro e
despesas continuam podendo ficar no default, porque todos têm valor válido de
partida. O aviso só aparece depois de uma tentativa de concluir.

## 3. Cadastro duplicado quebra com erro cru

`src/context/AuthContext.tsx:321`: `setupProfile` grava o perfil com `.insert()`
em `usuarias`. Como o `id` é a chave primária, uma segunda chamada para o mesmo
usuário viola a PK e o erro do Postgres sobe cru até a tela. Isso acontece em
situações comuns — duplo clique no botão, aba duplicada, retry depois de uma
falha de rede. Um `.upsert()` com `onConflict: 'id'` tornaria a operação
idempotente, que é o comportamento esperado para "criar meu perfil".
