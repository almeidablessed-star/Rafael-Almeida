# Nota rápida: CustomSelect — dois lugares sem confirmação visual

> 2026-09-26. Nota curta de propósito, não é doc formal.

A migração de todo `<select>` nativo para `CustomSelect` está completa e
testada, **menos dois campos** que exigem um estado que a conta de teste não
tinha na hora e cujo custo de reproduzir não se justificava:

1. **Onboarding financeiro, passos 3 e 4** (dias por semana e período de reset)
   — a conta de teste já concluiu o onboarding; ver esses passos de novo exige
   resetar a conta inteira.
2. **Moeda na tela de criar perfil** (`SetupProfilePage`) — só aparece em conta
   recém-criada.

Risco baixo: os dois usam exatamente o mesmo `CustomSelect` já validado na tela
em vários outros campos (período das metas, dias por semana em Minha Empresa,
categoria de ficha, unidade de insumo, unidade de embalagem, produto do pedido,
ano e mês do histórico). Não há nada específico deles no componente.

**O que fazer:** na próxima vez que passar por um onboarding ou por uma conta
nova — seja em teste ou com uma usuária real —, dar uma olhada nesses dois
campos e confirmar que aparecem no padrão do app, e não com o select do
sistema.

Um detalhe do `SetupProfilePage` que vale conferir junto: o ícone de cifrão que
ficava sobreposto à esquerda do campo foi removido na migração (o CustomSelect
controla o próprio padding e não havia onde encaixar um overlay absoluto sem
desalinhar o texto). As opções já mostram o símbolo da moeda, então não deveria
fazer falta — mas é uma mudança visual que ninguém viu renderizada ainda.
