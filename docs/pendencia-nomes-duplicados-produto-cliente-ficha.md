# PENDENTE: checagem de nomes duplicados ao criar Produto/Cliente/Ficha

> Registrado em 2026-09-22, achado durante o mapeamento da pendência de
> capitalização automática de nomes (item "grupo capitalização/busca" da
> lista de polimento desta sessão) — fora do escopo daquela tarefa (que era
> só capitalizar a primeira letra ao digitar), então só documentado aqui,
> sem correção.

## Contexto

O pedido original era evitar que "farinha" e "Farinha" virassem duas
entradas diferentes só por causa de digitação inconsistente. A investigação
separou o problema em duas partes:

1. **Busca/reconhecimento por nome** (autocomplete de insumo, casamento de
   produto com ficha técnica, autocomplete de cliente no Pedido) — já é
   case-insensitive (e insensível a acento/pontuação) em todo lugar que
   importa, via `normalizeName()` em `src/utils/fichaMatcher.ts`. Não
   precisou de correção.
2. **Capitalização ao digitar** — corrigida na mesma sessão com
   `capitalizeFirstLetter()` (`src/utils/textCase.ts`) em 9 campos de nome.

O que ficou de fora, e é o assunto deste registro: **nenhuma tela do app
verifica duplicidade de nome antes de criar um Produto, Cliente ou Ficha
Técnica**. Não é um bug de comparação quebrada — é uma funcionalidade que
simplesmente não existe. Hoje é possível cadastrar "Farinha" duas vezes,
mesmo com capitalização idêntica, sem nenhum aviso.

## Onde ficaria

- `src/components/ProdutosModule.tsx` — `handleSave` do formulário de Produto
  (não confere contra `produtosDoContexto` antes de salvar).
- `src/components/CustomersModule.tsx` — `handleSave` do formulário de
  Cliente (não confere contra a lista de clientes existente).
- `src/components/FichasTecnicasModule.tsx` — `handleSaveFicha` (não confere
  contra `fichas` existentes).

Em nenhum dos três há hoje qualquer `find()`/checagem de nome repetido antes
do insert — confirmado por varredura no código nessa investigação.

## Por que não foi resolvido junto

Adicionar essa checagem é uma decisão de produto maior, não um ajuste
pontual de `.toLowerCase()`:

- **O que deveria acontecer ao detectar um nome repetido?** Bloquear o
  salvamento? Só avisar e deixar a usuária decidir? Sugerir editar o item
  existente em vez de criar um novo?
- **Duplicidade exata ou "parecida"?** Usar `normalizeName()` (que já
  ignora maiúscula/minúscula, acento e pontuação) pegaria "Farinha" ==
  "farinha", mas também casaria "Bolo de Chocolate" com "Bolo   de
  Chocolate!!!" — correto na maioria dos casos, mas pode ter falso positivo
  em nomes legitimamente parecidos (ex: "Brigadeiro" vs "Brigadeiro Gourmet"
  não deveriam colidir, e `normalizeName` sozinho não distingue esse caso do
  de digitação duplicada).
- **Vale o mesmo tratamento pros três (Produto/Cliente/Ficha)?** Cliente
  duplicado é bem mais comum de ser legítimo (duas clientes podem se chamar
  "Maria") do que um insumo duplicado — a resposta certa pode ser diferente
  por tela.

Essas perguntas precisam de uma decisão do Rafael antes de implementar,
então ficou registrada como pendência separada em vez de decidida
unilateralmente no meio de uma tarefa de capitalização.
