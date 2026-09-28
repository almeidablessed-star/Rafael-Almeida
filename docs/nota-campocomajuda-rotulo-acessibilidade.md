# Nota rápida: rótulo de acessibilidade fixo do CampoComAjuda

> 2026-09-27. Item pequeno, nota curta de propósito.

O botão "?" do `CampoComAjuda` (`src/components/onboarding/CampoComAjuda.tsx`)
tem o `aria-label` fixo em **"Ver exemplo com os números da sua conta"**, nas
duas variantes.

Isso descreve bem o uso original — em Minha Empresa e no onboarding, o painel
que abre é mesmo um exemplo com os valores reais da conta. Mas o componente
passou a ser usado também para **explicação**, sem número nenhum: no card
"Saldos & Divisão dos Pedidos" do Início, o "?" abre o texto que explica o que
a porcentagem de cada círculo mede. Para quem usa leitor de tela, o botão ali
se anuncia prometendo um exemplo numérico que não vem.

Não é um defeito visual e não afeta quem enxerga a tela: o texto que abre está
correto nos dois casos.

**Por que não foi corrigido junto:** o `CampoComAjuda` é compartilhado por
Minha Empresa, Fichas Técnicas e o onboarding financeiro, e mexer nele estava
fora do escopo fechado daquela etapa, que era só de texto e cor no card do
Início.

**A correção provável** é aceitar um rótulo opcional por prop, mantendo o texto
de hoje como padrão para não alterar nada nas telas que já usam o componente.
Algo como `ariaLabelAjuda?: string`, usado só onde o painel não for um exemplo.
