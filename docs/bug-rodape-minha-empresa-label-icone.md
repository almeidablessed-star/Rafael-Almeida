# Pendência cosmética: aba "Minha Empresa" no rodapé — nome grande demais e ícone de cifrão

> Registrado em 2026-09-12, mesmo padrão dos outros `docs/bug-*.md` desta
> pasta (pendências cosméticas/baixa prioridade, sem correção imediata).

## Sintoma

No menu de navegação inferior (`BottomNav.tsx`), a última aba mostra o rótulo
"Minha Empresa" — nome grande demais para o espaço da aba, encostando no
ícone da aba vizinha ("Produtos"). O ícone atual dessa aba é um cifrão ($),
que não comunica bem o conceito de "empresa/negócio" (lembra mais
"dinheiro"/"custos" do que "minha empresa").

## Onde fica

`src/components/BottomNav.tsx`:

- Rótulo: linha 60, `{ id: 'custos' as TabType, label: 'Minha Empresa', icon: IconCustos }`.
- Ícone: `IconCustos` (linhas 41-44), um SVG desenhado à mão em forma de
  cifrão (`$`) — uma linha vertical (`x1="12" y1="2" x2="12" y2="22"`) mais um
  traço em "S" (`M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6`).

## O que precisa mudar

1. **Rótulo**: encurtar "Minha Empresa" para só "Empresa" — mais curto,
   ainda comunica o conceito, resolve o encostamento visual no ícone
   vizinho.
2. **Ícone**: trocar o cifrão por algo mais associado a
   empresa/negócio — prédio, maleta ou fábrica são as sugestões do Rafael.
   Como os outros ícones do rodapé (`IconInicio`, `IconPedidos`, etc., ver o
   início do mesmo arquivo) são todos SVGs desenhados à mão no mesmo estilo
   (`viewBox="0 0 24 24"`, `strokeLinecap`/`strokeLinejoin` "round"), o novo
   ícone deveria seguir esse mesmo padrão visual em vez de importar de uma
   lib de ícones externa, pra não destoar dos demais.

## Impacto prático

Nenhum funcional — é só uma questão visual/de clareza. A aba funciona
normalmente, só o nome e o ícone não comunicam bem o que ela é e o texto
aperta contra a aba de "Produtos" no rodapé.
