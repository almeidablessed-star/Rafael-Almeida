# NÃO REPRODUZÍVEL DE FORMA CONFIÁVEL: filtro de Produtos (Todos/Estoque/Compras) às vezes não muda a tela no primeiro clique

> Registrado em 2026-09-15, mesmo padrão dos outros `docs/bug-*.md` desta
> pasta. Investigado ao vivo na conta de teste, com duas hipóteses de causa
> raiz testadas e descartadas por evidência — documentado como pendência de
> baixa prioridade, não como bug confirmado.

## Sintoma relatado

Na aba Produtos (`ProdutosModule.tsx`), com o filtro em "Todos os Produtos",
clicar em "Estoque" às vezes não muda a tela (a lista e o destaque do botão
continuam em "Todos os Produtos"). Sair da aba Produtos e voltar, e só então
clicar em "Estoque", funcionava — o que sugeria um estado que atualizava
internamente mas não re-renderizava até o componente ser desmontado e
remontado.

## O que foi testado ao vivo

1. **Reprodução inicial**: primeira tentativa de clicar em "Estoque" (vindo
   de uma sessão de dev server já em execução, reaproveitada pelo
   `preview_start`) realmente não mudou a tela — bateu com o relato.
2. Todas as tentativas seguintes (clicar de novo sem sair da aba, clicar em
   "Compras", recarregar a página do zero e clicar em "Estoque", repetir o
   fluxo exato do relato: Produtos → Início → Produtos → Estoque) **funcionaram
   de primeira**, sem exceção. Ou seja: 1 falha em ~5 tentativas, sem conseguir
   reproduzir de novo depois da primeira vez.

## Hipóteses testadas e descartadas

**Hipótese 1 — memoização/estado obsoleto em `ProdutosModule.tsx`.**
`aba` é um `useState<'todos'|'estoque'|'compras'>` simples
([ProdutosModule.tsx:108](../src/components/ProdutosModule.tsx#L108)), trocado
via `onClick={() => setAba(tab.id as any)}`
([ProdutosModule.tsx:266](../src/components/ProdutosModule.tsx#L266)), com
renderização condicional direta (`aba === 'compras' ? ... : aba === 'estoque'
? ... : ...`). Não há `React.memo`, `useMemo`, `useCallback` nem
`useEffect` com dependências que possam interferir nesse estado. Descartada:
não existe mecanismo no arquivo capaz de "engolir" o `setState` e não
re-renderizar.

**Hipótese 2 — `key` ausente/instável nos três botões de filtro**, mesmo
padrão que já havia causado bugs semelhantes em Pedido e Ficha Técnica hoje
(botões sem `key` distinta fazendo o React reaproveitar o nó DOM errado e
perder/confundir o primeiro clique após o mount). Verificado
[ProdutosModule.tsx:263-276](../src/components/ProdutosModule.tsx#L263): os
três botões já são renderizados com `key={tab.id}` — string estável
(`'todos'`/`'estoque'`/`'compras'`), não o índice do array — e têm estrutura
idêntica entre si (mesmo elemento, mesmo único filho de texto, sem ícones
condicionais nem número de filhos variável). Descartada: o padrão de risco
que resolveu os outros dois bugs não se aplica aqui.

## Conclusão

Sem causa raiz identificável no código nem reprodução confiável — só 1
ocorrência isolada. Não há correção a aplicar até haver mais sinal.

## Se acontecer de novo

Reabrir esta investigação se o sintoma voltar a aparecer com mais frequência.
Nesse caso, a próxima linha de investigação é usar o React DevTools Profiler
ao vivo no momento exato da falha (capturar o commit/render enquanto o
clique "perdido" acontece), já que a análise estática do código não achou
nada.
