# Plano de limpeza do sistema "Estoque" legado

> Mapeado em 2026-09-07, depois que Produtos assumiu como fonte real de
> estoque, compras e histórico de movimentações. Executado em etapas
> separadas, cada uma commitada e testada ao vivo antes da próxima.

## Status (atualizado em 2026-09-08 — limpeza concluída)

| Passo | O quê | Status |
|---|---|---|
| 1 | Mover `movimentos`/`fetchMovimentos`/`MovimentoEstoque` para `ProdutosContext` (B2) | ✅ Feito — commit `97a8458` |
| 2 | Mover `ResultadoBaixa` para `stockConsumption.ts` + resolver a dependência de `useEstoque` no ramo legado de `devolverPedido` (B1) | ✅ Feito — commit `97407ff`. **Escolhida a abordagem (b)** (reescrever o ramo legado para consultar `estoque` direto via `supabase`, por id) em vez da (a) (backfill `estoque_id`→`produto_id`): mais simples, zero risco de dado, sem precisar de migration. O ramo legado continua existindo em `ProdutosContext.tsx`, só não depende mais do contexto. |
| 3+4+5 (fundidos) | Remover `EstoqueProvider` da árvore + deletar `EstoqueContext.tsx` (B3) + deletar `EstoqueModule.tsx`/limpar linha morta em `FichasTecnicasModule.tsx` (A) + remover aba de `BottomNav.tsx`/`types.ts` + redirect de localStorage `'estoque'→'produtos'` (B4) | ✅ Feito — commit `b58fe96`. Fundidos numa etapa só porque `EstoqueModule.tsx` ainda usava `useEstoque()` de verdade (CRUD funcional, não código morto) — remover só o provider teria quebrado essa tela em runtime. |
| 5.1 (achado na varredura final) | `ProdutosContext.tsx`: ramo legado de `devolverPedido` (`else if (m.estoque_id)`) ainda lia/escrevia `public.estoque` diretamente — resíduo da reescrita do passo 2, que só removeu a dependência do `EstoqueContext` mas não antecipou que a tabela seria dropada | ✅ Feito — commit `8f8a12a`. Mantida só a gravação da linha de histórico em `estoque_movimentos`; testado ao vivo (pedido sintético #50 com `estoque_id` legado) confirmando devolução gravada com `estoque_id: null` e `estoque.quantidade_atual` intocado. |
| 6 | Migration final: dropar a FK `estoque_movimentos_estoque_id_fkey` e então `DROP TABLE public.estoque`, mantendo `estoque_movimentos` e a coluna `estoque_id` como histórico | ✅ Feito em 2026-09-08. Backup em `public._backup_20260908_estoque` (RLS habilitado, sem policy). Testado ao vivo pós-drop: app carrega sem erro, venda + cancelamento de "Bolo joaquim" funciona ponta a ponta. |

A limpeza do sistema Estoque legado está concluída. Não existe mais tabela
`public.estoque` nem qualquer código lendo/escrevendo nela — só o backup
datado, guardado por segurança.

## Contexto

O app tinha um sistema de estoque (tabela `estoque`, componente
`EstoqueModule.tsx`, contexto `EstoqueContext.tsx`) que foi substituído pelo
catálogo único `Produtos` (tabela `produtos`, `ProdutosModule.tsx`,
`ProdutosContext.tsx`). A aba antiga "Estoque" ainda existe no rodapé, mas
mostra dados congelados — nada escreve nela para uso real, exceto a própria
tela de CRUD manual e um ramo de código legado (ver Bloco B abaixo).

Antes de remover qualquer coisa, é preciso separar o que é seguro apagar do
que precisa ser reescrito primeiro — a dependência real, descoberta nesta
investigação, é que `ProdutosContext.tsx` ainda importa `useEstoque()` para
conseguir estornar pedidos vendidos **antes** desta migração.

## (A) Seguro remover agora — nada depende disso

| Arquivo | Linhas | O quê | Por quê é seguro |
|---|---|---|---|
| `src/components/EstoqueModule.tsx` | arquivo inteiro (678 linhas) | Tela CRUD da aba Estoque antiga | Só é renderizado em `App.tsx:465`. Nenhum outro import. |
| `src/App.tsx` | 45, 464-466 | import + branch `activeTab === 'estoque'` | Remoção isolada. |
| `src/components/BottomNav.tsx` | ~33, 75 | `IconEstoque` e a entrada `{ id: 'estoque', label: 'Estoque' }` | Só nav. Ver nota de localStorage no Bloco B. |
| `src/types.ts` | 197 | `'estoque'` no union `TabType` | Remover o literal só depois de tratar o localStorage (B4). |
| `src/components/FichasTecnicasModule.tsx` | 6, 133 | `import { useEstoque }` + `const { estoque } = useEstoque();` | **Código morto confirmado**: `estoque` nunca é lido depois da linha 133. O autocomplete já usa `produtos` (linha 139). Seguro remover hoje. |
| `src/context/EstoqueContext.tsx` | 78-82, 304-436 | `consumirParaPedido` / `devolverPedido` (versões legadas) | `App.tsx:66` chama as versões de `useProdutos()`. Nenhum chamador restante. |
| `src/context/EstoqueContext.tsx` | 83-90, 438-464, 479 | `registrarEntrada` | Zero chamadores. `BalancesAndExpensesModule.tsx:58` documenta que deixou de usá-lo. |
| `src/context/EstoqueContext.tsx` | 75-77, 160-245 | `addEstoque` / `updateEstoque` / `deleteEstoque` | Chamados só por `EstoqueModule.tsx:64`. Caem junto com a tela. |
| Tabela Supabase `estoque` | — | — | Depois de A + B, os únicos `.from('estoque')` restantes são em `EstoqueContext.tsx` (linhas 144, 166, 208, 236, 321, 358, 416 — tudo removível) e `ProdutosContext.tsx:352` (ver B1). |

## (B) Precisa ser reescrito antes de remover

### B1. `ProdutosContext.tsx` → `useEstoque` (bloqueador principal)

- `src/context/ProdutosContext.tsx:6` — `import { useEstoque, ResultadoBaixa } from './EstoqueContext';`
- `:82-83` — `const { estoque, fetchEstoque, fetchMovimentos } = useEstoque();`
- `:347-368` — ramo legado de `devolverPedido`: quando o movimento tem
  `estoque_id` (venda anterior à migração), lê `estoque.find(...)`, faz
  `UPDATE public.estoque` e grava a devolução com `estoque_id`.
- `:371-375` — `fetchEstoque()` condicional + `fetchMovimentos()`.

**O que muda:** remover `EstoqueProvider` da árvore quebra este `useEstoque()`
em runtime (`EstoqueContext.tsx` lança erro se chamado fora do provider) — e
quebra **o app inteiro**, não só o cancelamento, porque o hook roda no corpo
do provider. Antes de retirar é preciso:

- (a) fazer um backfill que converta `estoque_movimentos.estoque_id` →
  `produto_id` (os ids batem 1:1 — `20260907_produtos.sql` fez o backfill de
  `produtos` com o MESMO id de `estoque`) e então deletar o ramo
  `else if (m.estoque_id)`; ou
- (b) reescrever o ramo legado para consultar `estoque` via `supabase` direto,
  sem depender do contexto.

Sem um dos dois, cancelar pedidos vendidos antes da migração deixa de
estornar corretamente.

**Dependência de tipo:** `ResultadoBaixa` (`EstoqueContext.tsx:62-65`) é
importado por `ProdutosContext.tsx`. Precisa migrar para
`src/utils/stockConsumption.ts` (onde já vive `ProblemaBaixa`) ou para
`ProdutosContext` antes de `EstoqueContext.tsx` sumir.

### B2. `StockMovementsHistory.tsx` → `useEstoque().movimentos`

- `:3` `import { useEstoque }`, `:5` `import type { MovimentoEstoque }`,
  `:74`, `:106`, `:138` `const { movimentos } = useEstoque();`

Este componente é da UI **nova** (usado dentro de Produtos > Estoque e
Produtos > Compras), mas lê o estado via `EstoqueContext`. Antes de remover
`EstoqueContext`, mover `movimentos` + `fetchMovimentos` + o tipo
`MovimentoEstoque` para `ProdutosContext` (ou um contexto próprio de
movimentos). Sem isso, a aba Produtos > Estoque perde o histórico que acabou
de ser migrado para lá.

### B3. `EstoqueProvider` na árvore de providers

- `src/App.tsx:59, 637, 643`

Ordem atual: `AuthProvider > ProtectedRoute > CurrencyProvider >
CustomersProvider > FichasTecnicasProvider > CostsProvider >
FinancialOnboardingGate > **EstoqueProvider** > ProdutosProvider >
TransacoesProvider > AppContent`.

`EstoqueProvider` só existe hoje como pai de `ProdutosProvider` (comentário em
`ProdutosContext.tsx`). Nada mais depende dessa ordenação por outro motivo —
removê-lo é puramente estrutural, desde que B1 e B2 sejam feitos antes.

### B4. localStorage `carula_activeTab`

- `src/App.tsx:75-82, 108-111`

A chave pode conter `'estoque'` de sessões salvas antes da limpeza. Já existe
um precedente de migração de aba morta nessas mesmas linhas (`'saldos'` →
`'compras'`). É preciso adicionar o mesmo redirecionamento para `'estoque'` →
`'produtos'`, senão quem tinha essa aba salva vê uma tela em branco (nenhum
branch de `activeTab` casa mais).

## (C) Compartilhado — nunca remover, mesmo depois da limpeza

| Item | Local | Por quê fica |
|---|---|---|
| Tabela `estoque_movimentos` | `supabase/migrations/20260830_estoque_movimentos.sql` | Escrita ativamente pelo código NOVO (`ProdutosContext.tsx`). |
| Coluna `estoque_movimentos.produto_id` | `supabase/migrations/20260907_estoque_movimentos_produto_id.sql` | Coluna do sistema novo. |
| Coluna `estoque_movimentos.estoque_id` | `20260830_estoque_movimentos.sql` (FK → `estoque(id) ON DELETE SET NULL`) | É FK para `public.estoque`. Dropar a tabela `estoque` exige dropar essa constraint antes. Movimentos históricos gravados com `estoque_id` continuam aparecendo no histórico; depois de B1 a coluna vira só rastro histórico, sem FK. |
| `estoque_movimentos.transacao_id` | `20260830_transacoes.sql`; `App.tsx:312` | FK para transações, independente do estoque legado. |
| Tipo `StockItem` | `src/types.ts:212-225` | **Não é legado.** Virou o formato de interoperação: `ProdutosContext.tsx` mapeia Produtos → `StockItem[]` para `planejarBaixa`; idem `FichasTecnicasModule.tsx`, `BalancesAndExpensesModule.tsx`. Também usado por `utils/units.ts`, `utils/stockConsumption.ts`, `StockItemAutocomplete.tsx`. Manter (renomear no futuro, se fizer sentido). |
| `planejarBaixa` / `ProblemaBaixa` | `src/utils/stockConsumption.ts` | Usado pelo motor NOVO (`ProdutosContext.tsx`) e por `App.tsx`. |
| Migrations históricas | `20260830_estoque_movimentos.sql`, `20260907_produtos.sql` (backfill `FROM public.estoque`) | Arquivos históricos, nunca editar/apagar. O backfill de `20260907_produtos.sql` depende de `public.estoque` existir — se a tabela for dropada, essa migration não roda mais do zero num banco limpo. Planejar a remoção da tabela como uma migration nova (Migration B, já prevista desde `20260907_produtos.sql`). |

## Passo 6 (concluído): migration final

Executado em 2026-09-08, em três partes, revisadas linha por linha antes de
rodar:

```sql
-- 1. Backup completo da tabela estoque
CREATE TABLE IF NOT EXISTS public._backup_20260908_estoque AS TABLE public.estoque;
ALTER TABLE public._backup_20260908_estoque ENABLE ROW LEVEL SECURITY;

-- 2. Remove a FK (a coluna estoque_id em si não é removida — os dados
--    históricos ficam, só deixam de ser uma referência válida)
ALTER TABLE public.estoque_movimentos
  DROP CONSTRAINT estoque_movimentos_estoque_id_fkey;

-- 3. Drop da tabela, só depois da FK removida
DROP TABLE public.estoque;
```

Antes de rodar, confirmada mais uma vez (mesma cautela dos passos
anteriores) uma varredura de `.from('estoque')` no repositório — zero
resultados fora de migrations históricas — e corrigido o resíduo encontrado
no passo 5.1 acima. Testado ao vivo depois do drop: app carrega sem erro
(console limpo em aba nova), 7 abas no rodapé, e um ciclo completo de
venda + cancelamento de "Bolo joaquim" funciona normalmente.
