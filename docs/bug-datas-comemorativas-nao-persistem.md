# RESOLVIDO: "Datas comemorativas" no cadastro de cliente nunca salva nem carrega

> Encontrado em 2026-09-10, durante o preview do novo layout de "Cliente -
> Cadastro" (mesmo formato de registro usado para o CORS em
> docs/investigacao-cors-transacoes-movimentos.md).
>
> **Resolvido em 2026-09-12, no commit `9a12462`** ("fix(clientes): persiste
> additionalEvents"), com a coluna criada pela migration
> `supabase/migrations/20260913_clientes_additional_events.sql`. Está em
> produção. O documento ficou para trás e só foi fechado em 2026-10-13.
>
> **Verificado ao vivo em 2026-10-13**, ida e volta completa: cliente de teste
> com uma data extra ("aniversário de casamento", 04/07/2026) gravou
> `additionalEvents` na linha do banco; depois de recarregar a página inteira,
> o formulário de edição reabriu **com a data preenchida**, e o cartão "Todas
> as Datas Comemorativas" passou de 14 (só feriados) para 16. A cliente de
> teste foi apagada em seguida e a conta voltou ao estado anterior.
>
> **Diferença em relação ao que este texto propunha:** a coluna não se chama
> `eventos_adicionais`. Ficou `"additionalEvents" jsonb NOT NULL DEFAULT '[]'`,
> em camelCase com aspas, para casar com `eventDate` e `recurringEventTitle`
> que já existiam — assim o mapeamento no código não precisa traduzir nomes.
>
> **A decisão 2 abaixo foi tomada no sentido de incluir:** a lista "Todas as
> Datas Comemorativas" monta os eventos em três blocos — data principal,
> `additionalEvents` um a um, e os feriados de `UNIVERSAL_HOLIDAYS`
> (CustomersModule.tsx, por volta da linha 485). Os dois conceitos aparecem
> juntos na lista, mas continuam separados na origem.
>
> **A decisão 3 continua valendo como aviso:** datas que alguém tenha tentado
> salvar antes de 2026-09-12 nunca chegaram ao banco e **não são
> recuperáveis** — precisam ser recadastradas. Não é tarefa de código.
>
> O texto abaixo fica como registro do problema original.

## Sintoma

No formulário de editar/cadastrar cliente (`CustomersModule.tsx`), a seção
"Datas comemorativas" permite adicionar linhas com nome + data (ex:
"Aniversário de casamento", "12/03"). Independente de quantas datas uma
cliente real tenha, a seção **sempre abre vazia** ao editar, e qualquer data
adicionada ali **não sobrevive a um recarregamento** — é perdida
silenciosamente.

Confirmado com uma cliente real da conta ("Maria", que a lista principal
mostra com "15 datas" em "Todas as Datas Comemorativas"): abrindo o
formulário de edição, a seção "Datas comemorativas" aparece vazia
("Nenhuma data ainda — toque para adicionar").

## Causa raiz

`src/context/CustomersContext.tsx`, funções `mapSupabaseToCustomer` (linha
~57) e `mapCustomerToSupabase` (linha ~70): nenhuma das duas menciona
`additionalEvents` em nenhuma direção.

- **Leitura**: `mapSupabaseToCustomer` monta o objeto `Customer` sem o campo
  `additionalEvents` — fica `undefined`, e o formulário inicializa o estado
  local com `c.additionalEvents || []` (`CustomersModule.tsx:257`), sempre
  caindo no array vazio.
- **Escrita**: `mapCustomerToSupabase` tambem nao inclui `additionalEvents`
  ao montar o payload gravado no Supabase — mesmo que o formulario local
  tivesse dados (por exemplo, adicionados na mesma sessao antes de salvar),
  eles nunca chegam ao banco.

O restante do formulario (`handleAddExtraEventField`, `handleUpdateExtraEvent`,
`handleRemoveExtraEvent`) funciona perfeitamente **dentro da sessao** — o
problema e exclusivamente a ausencia da coluna/mapeamento na camada de
persistencia.

## O que NAO e este bug

As "15 datas" mostradas na lista principal de clientes (bloco "Todas as
Datas Comemorativas") vem de uma fonte diferente — provavelmente a
combinacao de `eventDate`/`recurringEventTitle` da propria cliente com a
lista estatica `UNIVERSAL_HOLIDAYS` (feriados/datas comerciais fixas, usada
para sugestao de mensagens de WhatsApp). Nao foi confirmado em detalhe qual
e exatamente essa fonte — so que **nao e** `additionalEvents`, dado que o
numero aparece mesmo com o campo sempre vazio.

## Impacto pratico

Quem usa a secao "Datas comemorativas" pensando que esta guardando uma data
extra (ex: aniversario de casamento, aniversario de filho) esta perdendo
esse dado sem nenhum aviso — a UI nao indica falha, so parece "vazia da
proxima vez".

## O que precisa de decisao antes de corrigir

1. Adicionar uma coluna real em `clientes` (ex: `eventos_adicionais jsonb`)
   e mapear nos dois sentidos, migration com backup — mesmo processo de
   sempre.
2. Decidir se "Todas as Datas Comemorativas" (a fonte com as "15 datas")
   deveria **incluir** as datas de `additionalEvents` depois de corrigido, ou
   se sao propositalmente conceitos separados (uma e "datas desta cliente",
   outra e "datas comerciais/feriados para todas as clientes"). Vale
   entender a intencao original antes de mexer, para nao unificar dois
   conceitos que deveriam ficar distintos.
3. Confirmar se ha dados hoje "perdidos" que a usuaria tentou salvar antes
   (nao da para recuperar retroativamente — nunca foram persistidos), so
   para ela saber que precisa recadastrar essas datas quando o campo for
   corrigido.
