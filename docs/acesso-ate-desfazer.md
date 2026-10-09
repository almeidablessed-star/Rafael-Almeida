# Acesso com prazo (`acesso_ate`) — desfazer e regra de leitura

Commits: `3687465` (migração), `03f1e4e` (webhook), `3278cda` (app),
`f514b96` (webhook: cancelamento nunca amplia prazo).
Ordem usada: rodar a migração → publicar o webhook → publicar o app → **só
então** marcar os eventos na Hotmart.

Estado em 09/10/2026: migração rodada, webhook publicado (versão 23,
`verify_jwt = false`, POST sem hottok responde 401) e app publicado.
Na Hotmart **nada foi mexido**: segue só "Compra aprovada" marcada.

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

## Quem pode escrever em `acesso_ate` (consulta de conferência)

A consulta genérica de `column_privileges` não serve para esta pergunta: ela
devolve `acesso_ate` com `SELECT` e `REFERENCES`, que são normais e esperados, e
isso dá a impressão falsa de que o navegador alcança a coluna. O que importa é
só `INSERT` e `UPDATE`:

```sql
SELECT grantee, privilege_type
  FROM information_schema.column_privileges
 WHERE table_schema = 'public'
   AND table_name = 'usuarias'
   AND column_name = 'acesso_ate'
   AND grantee IN ('anon', 'authenticated')
   AND privilege_type IN ('INSERT', 'UPDATE');
```

**Resultado esperado: nenhuma linha.** Qualquer linha aqui significa que o
navegador pode mexer no próprio prazo, e a trava de acesso deixa de valer.

## Como o prazo se comporta

- Cancelamento de assinatura grava `acesso_ate = date_next_charge`.
- Sem data utilizável (ausente, não numérica ou no passado): grava a data de
  segurança de 32 dias e registra `CANCELAMENTO_SEM_DATA` em
  `assinatura_eventos`.
- **Um cancelamento nunca amplia um prazo existente.** Se a conta já tem
  `acesso_ate`, vale o **mais cedo**; o prazo descartado fica registrado como
  `PRAZO_IGNORADO`. Nesse caso `CANCELAMENTO_SEM_DATA` não é gravado, porque a
  data de segurança não foi aplicada.
- Só uma compra aprovada devolve prazo, zerando a coluna (`acesso_ate = null`).
- Reembolso, chargeback e protesto revogam na hora. `PURCHASE_CANCELED` só
  revoga se a transação for a mesma que concedeu o acesso atual; recusa pela
  trava fica como `REVOGACAO_RECUSADA`.

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

**Funções e app** (um bloco por vez no cmd):

```bash
git checkout e22d449 -- supabase/functions/smart-processor/index.ts
```

```bash
npx supabase functions deploy smart-processor --project-ref inqyobsjuztztvafpzxn
```

```bash
git checkout HEAD -- supabase/functions/smart-processor/index.ts
```

```bash
git revert --no-edit f514b96 3278cda 03f1e4e
```

```bash
git push origin chore/carula-site-preview && git push origin HEAD:production && git push origin HEAD:master
```

Atenção: a versão anterior do webhook (`e22d449`) **revoga na hora por e-mail,
sem trava**. Reverter devolve o risco de uma assinante em dia perder o acesso
por causa de um boleto que ela gerou e não pagou.

**Hotmart** — nada a desfazer: a configuração não foi tocada nesta mudança.
Quando os eventos novos forem marcados, tire um print antes, para a volta não
depender de memória.
