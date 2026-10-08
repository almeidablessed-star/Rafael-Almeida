# Acesso com prazo (`acesso_ate`) — desfazer e regra de leitura

Commits: `3687465` (migração), `03f1e4e` (webhook), `3278cda` (app).
Ordem: rodar a migração → publicar o webhook → publicar o app → **só então**
marcar os eventos na Hotmart.

## A regra de acesso vigente, para qualquer leitura futura

**Nunca use `acesso_status` sozinho.** A partir desta mudança, "tem acesso"
significa:

```sql
acesso_status = 'ativo' AND (acesso_ate IS NULL OR acesso_ate > now())
```

Isso vale para **qualquer relatório ou tela que venha depois** — em particular o
painel do parceiro, que vai contar assinantes ativos. Contar só por
`acesso_status` incluiria quem cancelou e está no fim do período: o número
ficaria maior que a realidade, e a comissão seria discutida em cima dele. A
função `public.tem_acesso_ativo()` já aplica essa regra; prefira reutilizá-la a
repetir a condição.

## Desfazer

**Banco** (devolve a função ao estado anterior e remove a coluna):

```sql
CREATE OR REPLACE FUNCTION public.tem_acesso_ativo()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarias u
     WHERE u.id = auth.uid() AND u.acesso_status = 'ativo'
  )
$$;
REVOKE ALL ON FUNCTION public.tem_acesso_ativo() FROM public;
GRANT EXECUTE ON FUNCTION public.tem_acesso_ativo() TO authenticated, anon;

ALTER TABLE public.usuarias DROP COLUMN IF EXISTS acesso_ate;
```

Derrubar a coluna **devolve o acesso** a quem estava com prazo vencido — elas
voltam a ter `acesso_status = 'ativo'` e nada mais limitando. É o lado seguro,
mas significa que um cancelamento recente deixa de ser respeitado até alguém
revogar à mão.

**Funções e app:**

```bash
git checkout e22d449 -- supabase/functions/smart-processor/index.ts
npx supabase functions deploy smart-processor --project-ref inqyobsjuztztvafpzxn --no-verify-jwt
git checkout HEAD -- supabase/functions/smart-processor/index.ts
git revert --no-edit 3278cda 03f1e4e
git push origin chore/carula-site-preview
git push origin HEAD:production
git push origin HEAD:master
```

Atenção: a versão anterior do webhook **revoga na hora por e-mail, sem trava**.
Reverter devolve o risco de uma assinante em dia perder o acesso por causa de um
boleto que ela gerou e não pagou.

**Hotmart** — voltar ao estado de hoje: em Ferramentas → Webhook (API e
notificações) → "Carula Confeitaria Acesso" → Editar, deixar **apenas "Compra
aprovada"** marcada e salvar. Tire um print antes de mexer, para a volta não
depender de memória.
