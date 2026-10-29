-- Deposito de fotos (Supabase Storage) — passo 1 da mudanca "fotos para o Storage".
--
-- Hoje as fotos inteiras vivem como texto (data URI em base64) dentro das linhas:
-- transacoes.cliente_foto_url / imagem_inspiracao, clientes."photoUrl",
-- fichas_tecnicas.foto_url e usuarias.foto_url. Isso pesa no banco e no trafego:
-- cada leitura dessas linhas leva a foto junto. No deposito, a linha guarda so o
-- caminho do arquivo, e a foto so e baixada quando aparece na tela.
--
-- Este passo SO cria o deposito e as regras. Nada muda no app nem nas fotos que
-- ja existem: os passos seguintes (app gravando no deposito, mudanca das fotos
-- antigas) vem depois, cada um com o seu OK.
--
-- Funciona igual no plano Free e no pago; o pago so aumenta os limites e libera
-- a reducao automatica de imagens, que o app pode passar a usar depois.

-- 1) O deposito. Privado: ninguem abre uma foto pelo endereco sem estar logado
--    como a dona. 5 MB por arquivo e so imagem (o app ja comprime antes de
--    enviar; o limite e uma trava contra arquivo errado, nao o tamanho comum).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('fotos', 'fotos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 2) Regras. Cada arquivo fica numa pasta com o id da dona:
--      fotos/<usuaria_id>/<pedidos|clientes|fichas|perfil>/<nome>.jpg
--    A primeira pasta do caminho tem que ser o id de quem esta logada, e a
--    assinatura tem que estar ativa — a mesma regra das tabelas
--    (auth.uid() = usuaria_id AND tem_acesso_ativo()), ver
--    20261007120100_rls_exige_acesso_ativo.sql.
CREATE POLICY "fotos: dona le" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'fotos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (SELECT public.tem_acesso_ativo())
  );

CREATE POLICY "fotos: dona envia" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'fotos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (SELECT public.tem_acesso_ativo())
  );

CREATE POLICY "fotos: dona troca" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'fotos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (SELECT public.tem_acesso_ativo())
  )
  WITH CHECK (
    bucket_id = 'fotos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (SELECT public.tem_acesso_ativo())
  );

CREATE POLICY "fotos: dona apaga" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'fotos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (SELECT public.tem_acesso_ativo())
  );

-- Para desfazer (nao rodar junto):
--   DROP POLICY "fotos: dona le" ON storage.objects;
--   DROP POLICY "fotos: dona envia" ON storage.objects;
--   DROP POLICY "fotos: dona troca" ON storage.objects;
--   DROP POLICY "fotos: dona apaga" ON storage.objects;
--   DELETE FROM storage.buckets WHERE id = 'fotos';  -- so com o deposito vazio
