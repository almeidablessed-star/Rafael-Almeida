-- O acesso passa a ser negado por padrao.
--
-- NAO RODAR ainda: este arquivo e o texto aprovado, para o Rafael rodar no SQL
-- Editor no passo combinado. Ate la o default segue 'ativo'.
--
-- Por que: enquanto o default for 'ativo', qualquer linha nova em `usuarias`
-- que omita a coluna nasce com acesso liberado. Com o app sendo vendido por
-- assinatura, a regra correta se inverte — o acesso so existe se a compra
-- confirmar. Com o default 'inativo', um furo no cadastro falha para o lado
-- seguro (pessoa sem acesso, que reclama e e destravada na hora) em vez de
-- falhar para o lado caro (acesso gratis e silencioso).
--
-- O que NAO muda:
--   - As contas existentes. DEFAULT so vale para linhas novas que OMITAM a
--     coluna; todas as linhas de hoje tem valor gravado.
--   - A linha criada pela compra. O webhook manda `acesso_status: 'ativo'`
--     explicitamente em `garantirLinhaDeUsuaria`, e valor explicito ignora o
--     default. E justamente por isso a compra simulada feita DEPOIS desta
--     migration vira a prova de que o webhook manda o campo de verdade: se ele
--     o omitisse, a conta nasceria pausada.
--
-- O que MUDA de proposito: o INSERT da tela de perfil nao envia
-- `acesso_status` (as colunas liberadas pelo Script B nao a incluem), entao
-- quem criar conta sem comprar passa a nascer pausado e cai na tela de
-- assinatura pausada.

ALTER TABLE public.usuarias ALTER COLUMN acesso_status SET DEFAULT 'inativo';

-- Desfazer:
--   ALTER TABLE public.usuarias ALTER COLUMN acesso_status SET DEFAULT 'ativo';
