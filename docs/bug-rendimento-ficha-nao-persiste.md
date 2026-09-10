# Bug pendente: "Rendimento" da Ficha Técnica nunca é salvo

> Encontrado em 2026-09-10, durante o teste ao vivo do novo formulário em 3
> passos de "Ficha Técnica - Opções" (mesmo formato de registro usado para o
> CORS em docs/investigacao-cors-transacoes-movimentos.md e para as datas
> comemorativas em docs/bug-datas-comemorativas-nao-persistem.md).

## Sintoma

No formulário de criar/editar ficha técnica, o campo "Rendimento" (Passo 1)
permite digitar um valor (ex: "10") e escolher uma unidade (Fatias/Gramas/
Unidades/ML). Ao reabrir a ficha para editar, esse campo **não mostra o que
foi digitado** — mostra a descrição do primeiro tamanho cadastrado (ex:
"20 cm"), que é um dado completamente diferente.

Confirmado criando uma ficha nova ("Bolo de Chocolate Teste E2E") com
Rendimento "10 Fatias" e dois tamanhos ("20 cm" e "30 cm"): ao reabrir para
editar, o campo Rendimento aparece preenchido com "20 cm" em vez de "10".

## Causa raiz

`src/components/FichasTecnicasModule.tsx`:

- **Escrita**: `handleSaveFicha` (linha ~733) monta `fichaData` sem incluir
  `yieldInfo` em nenhum momento — o valor digitado pelo usuário no estado
  local `yieldInfo` nunca chega ao objeto salvo no Supabase. Confirmado que
  isso já acontecia antes de qualquer mudança desta sessão (mesmo trecho já
  presente no commit `db75ed7`, anterior ao redesign visual).
- **Leitura**: `handleOpenEdit` (linha ~382) chama
  `setYieldInfo(getYieldInfoCompat(ficha))`, e `getYieldInfoCompat` (linha
  ~49) retorna `ficha.tamanhos[0].descricao` — a descrição do primeiro
  tamanho, não o rendimento real. Isso também já existia antes desta sessão.

Ou seja: o campo nunca foi de fato ligado à persistência. `getYieldInfoCompat`
parece ser um substituto legado de uma época em que a descrição do tamanho
("10 fatias") também servia como um proxy aproximado do rendimento — o que
deixava de ser óbvio quando a descrição do tamanho é algo como "20 cm" (um
diâmetro, não uma contagem), caso que o novo formulário passou a expor com
mais clareza através do gerenciamento explícito de Tamanhos no Passo 1.

`ficha.yieldInfo` existe como campo no tipo `FichaTecnica` e é lido em
`QuotePdfModal.tsx:1028` ("Rendimento: {ficha.yieldInfo}"), mas como nunca é
escrito, sempre aparece vazio/undefined no PDF de orçamento também.

## Impacto prático

- Quem preenche "Rendimento" pensando estar guardando essa informação está
  perdendo o dado sem aviso — ao reabrir a ficha para editar, vê outro valor
  no lugar (a descrição de um tamanho).
- O PDF de orçamento (`QuotePdfModal.tsx`) nunca mostra o rendimento real,
  porque o campo nunca foi persistido.

## O que precisa de decisão antes de corrigir

1. Adicionar `yieldInfo` ao objeto `fichaData` em `handleSaveFicha`, e trocar
   `setYieldInfo(getYieldInfoCompat(ficha))` em `handleOpenEdit` por
   `setYieldInfo(ficha.yieldInfo || getYieldInfoCompat(ficha))` (fallback
   para fichas antigas que nunca tiveram o campo real preenchido).
2. Confirmar se a coluna correspondente já existe em `fichas_tecnicas` no
   Supabase (mapeamento em `useFichasTecnicas`/contexto) ou se precisa de
   migration — mesmo processo de sempre (backup antes de alterar schema).
3. Não há como recuperar retroativamente o que já foi "perdido" — fichas
   existentes vão continuar mostrando o fallback (descrição do tamanho) até
   que alguém edite e resalve com o valor correto.
