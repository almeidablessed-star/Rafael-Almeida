-- Adiciona a coluna que faltava em `clientes` para persistir as "Datas
-- Comemorativas" adicionais (aniversario do conjuge, do filho, etc.).
--
-- Motivo: o formulario de cliente (CustomersModule.tsx) sempre funcionou
-- dentro da sessao (adicionar/editar/remover linhas de additionalEvents),
-- mas o mapeamento em CustomersContext.tsx (mapSupabaseToCustomer /
-- mapCustomerToSupabase) nunca leu nem escreveu esse campo -- a coluna nem
-- existia na tabela. Toda data adicionada parecia salvar (o estado local do
-- form mudava), mas sumia ao recarregar a pagina: nunca tinha chegado no
-- banco.
--
-- Nome da coluna em camelCase (com aspas), igual as duas colunas de evento
-- ja existentes (eventDate, recurringEventTitle), pro mapeamento no codigo
-- nao precisar traduzir nomes.
--
-- Idempotente: pode rodar mais de uma vez sem erro.

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS "additionalEvents" jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.clientes."additionalEvents" IS
  'Datas comemorativas adicionais do cliente (aniversario do conjuge, filho, etc), alem da data principal em eventDate. Formato: [{id, title, date (YYYY-MM-DD), type?}].';
