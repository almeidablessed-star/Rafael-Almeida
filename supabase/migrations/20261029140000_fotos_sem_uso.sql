-- Limpeza de fotos sem uso no deposito (bucket `fotos`).
--
-- Excluir um registro com foto nao apaga o arquivo (o app tem "Desfazer", e o
-- backup guarda o endereco). O app de cada dona anota aqui quando viu cada
-- arquivo sem uso pela primeira vez e so apaga depois de 30 dias seguidos sem
-- uso; se o arquivo voltar a ser usado (ex.: backup restaurado), a anotacao sai.
-- Ver src/utils/limparFotosSemUso.ts. Rodado pelo Rafael em 29/10/2026.
--
-- Arquivo NAO se apaga por SQL (DELETE em storage.objects deixa o arquivo
-- perdido no deposito): a exclusao e sempre pelo app, via API do Storage.

CREATE TABLE IF NOT EXISTS public.fotos_sem_uso (
  caminho text PRIMARY KEY,
  usuaria_id uuid NOT NULL DEFAULT auth.uid(),
  visto_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fotos_sem_uso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fotos_sem_uso: dona" ON public.fotos_sem_uso
  FOR ALL TO authenticated
  USING (auth.uid() = usuaria_id AND (SELECT public.tem_acesso_ativo()))
  WITH CHECK (
    auth.uid() = usuaria_id
    AND (SELECT public.tem_acesso_ativo())
    AND caminho LIKE auth.uid()::text || '/%'
  );

-- Para desfazer: DROP TABLE public.fotos_sem_uso;
