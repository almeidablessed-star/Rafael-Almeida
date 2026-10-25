-- Novo tipo de lancamento: `lucro` (compra paga com o dinheiro do lucro).
--
-- O Inicio passou a mostrar o lucro como um cofrinho, igual a Reposicao e ao
-- Investimento: entra a parte de lucro das vendas recebidas e sai o que for
-- comprado com ele pela aba Compras ("De onde sai o dinheiro: Lucro"). Ate
-- aqui nenhum lancamento podia sair do lucro, entao o cofrinho so enchia.
--
-- So amplia o CHECK de `tipo` criado em 20260830_transacoes.sql. Nenhuma linha
-- existente muda. A funcao `restaurar_backup_transacoes` copia `tipo` como
-- texto, entao backups com `lucro` passam a restaurar sem mexer nela.

ALTER TABLE public.transacoes DROP CONSTRAINT IF EXISTS transacoes_tipo_check;

ALTER TABLE public.transacoes
  ADD CONSTRAINT transacoes_tipo_check
  CHECK (tipo IN ('venda', 'reposicao', 'maodeobra', 'custo', 'investimento', 'lucro'));
