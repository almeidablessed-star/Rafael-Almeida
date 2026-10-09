# Roteiro de teste do acesso com prazo (`acesso_ate`)

Publicado em 09/10/2026: webhook versão 23 e app no commit `f245949`.
Nada foi mexido na Hotmart.

**Regras de uso:** todos os blocos `cmd` na MESMA janela do Prompt de Comando
(as variáveis `HOTTOK` e `CORTE` só valem ali). Um bloco por vez. Nada para
editar à mão. Cada bloco SQL vai sozinho no SQL Editor (ele mostra só o
resultado do último comando).

E-mail de teste: `almeida.blessed+prazo1@gmail.com`.

---

## 0. Guardar o hottok (colagem separada)

```bat
set /p HOTTOK=
```

Cole o hottok e aperte Enter. A janela não mostra o valor em nenhum momento.

---

## 1. Compra simulada + primeiro acesso

```bat
curl -i -X POST "https://inqyobsjuztztvafpzxn.supabase.co/functions/v1/smart-processor" -H "X-HOTMART-HOTTOK: %HOTTOK%" -H "Content-Type: application/json" -d "{\"id\":\"EVT-PRAZO-1\",\"event\":\"PURCHASE_APPROVED\",\"data\":{\"buyer\":{\"email\":\"almeida.blessed+prazo1@gmail.com\",\"name\":\"Teste Prazo\"},\"purchase\":{\"status\":\"APPROVED\",\"transaction\":\"TX-PRAZO-A\"},\"subscriber\":{\"code\":\"SUB-PRAZO-1\",\"email\":\"almeida.blessed+prazo1@gmail.com\"}}}"
```

Esperado: **HTTP 200** e e-mail com o código chegando na caixa.

Depois, em https://rafael-almeida-nine.vercel.app : "Já comprou? Verificar
código" → código → definir senha → login → tela "Bem-vindo" (preencher nome da
confeitaria) → onboarding financeiro. Tem de dar para entrar e usar o app.

**Guarde o id da conta** (vale para todos os blocos seguintes):

```sql
SELECT usuaria_id
  FROM public.assinatura_eventos
 WHERE hotmart_subscriber_code = 'SUB-PRAZO-1'
   AND usuaria_id IS NOT NULL
 LIMIT 1;
```

Esperado: uma linha com o UUID da conta.

---

## 2. Cancelamento com prazo de 5 minutos

```bat
for /f %i in ('node -e "console.log(Date.now()+300000)"') do @set CORTE=%i
```

```bat
echo %CORTE%
```

Esperado: um número de 13 dígitos (milissegundos UTC).

```bat
curl -i -X POST "https://inqyobsjuztztvafpzxn.supabase.co/functions/v1/smart-processor" -H "X-HOTMART-HOTTOK: %HOTTOK%" -H "Content-Type: application/json" -d "{\"id\":\"EVT-PRAZO-2\",\"event\":\"SUBSCRIPTION_CANCELLATION\",\"data\":{\"date_next_charge\":%CORTE%,\"subscriber\":{\"code\":\"SUB-PRAZO-1\",\"email\":\"almeida.blessed+prazo1@gmail.com\"}}}"
```

Esperado: **HTTP 200** com `"message":"Access scheduled to end"` e um `ate`
cinco minutos à frente.

Conferência no banco:

```sql
SELECT acesso_status, acesso_ate, acesso_ate > now() AS ainda_vale
  FROM public.usuarias
 WHERE id = (SELECT usuaria_id FROM public.assinatura_eventos
              WHERE hotmart_subscriber_code = 'SUB-PRAZO-1'
                AND usuaria_id IS NOT NULL LIMIT 1);
```

Esperado: `ativo`, `acesso_ate` cinco minutos à frente, `ainda_vale = true`.
No app (recarregando): tudo funciona normalmente, sem tela de pausa.

---

## 3. "Expirada" de outra transação não revoga

```bat
curl -i -X POST "https://inqyobsjuztztvafpzxn.supabase.co/functions/v1/smart-processor" -H "X-HOTMART-HOTTOK: %HOTTOK%" -H "Content-Type: application/json" -d "{\"id\":\"EVT-PRAZO-3\",\"event\":\"PURCHASE_EXPIRED\",\"data\":{\"buyer\":{\"email\":\"almeida.blessed+prazo1@gmail.com\",\"name\":\"Teste Prazo\"},\"purchase\":{\"status\":\"EXPIRED\",\"transaction\":\"TX-OUTRA-C\"},\"subscriber\":{\"code\":\"SUB-PRAZO-1\"}}}"
```

Esperado: **HTTP 200** com `"message":"Event ignored","event":"PURCHASE_EXPIRED"`.

Rode de novo o bloco SQL do passo 2. Esperado: **exatamente o mesmo**
`acesso_status` e `acesso_ate` — nada mudou.

---

## 4. Passado o prazo: tela de pausa e banco recusando

Espere os 5 minutos e recarregue o app. Esperado: **tela de pausa**.

Prova de que o banco também recusa (leitura só, termina em `ROLLBACK`; troque
`<ID>` pelo UUID do passo 1):

```sql
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<ID>","role":"authenticated"}';
SELECT public.tem_acesso_ativo() AS tem_acesso;
ROLLBACK;
```

Esperado: `tem_acesso = false`.

```sql
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<ID>","role":"authenticated"}';
SELECT count(*) AS clientes_visiveis FROM public.clientes;
ROLLBACK;
```

Esperado: `clientes_visiveis = 0` (a RLS esconde tudo, logo também recusaria
gravar).

---

## 5. Nova compra aprovada devolve o acesso

```bat
curl -i -X POST "https://inqyobsjuztztvafpzxn.supabase.co/functions/v1/smart-processor" -H "X-HOTMART-HOTTOK: %HOTTOK%" -H "Content-Type: application/json" -d "{\"id\":\"EVT-PRAZO-4\",\"event\":\"PURCHASE_APPROVED\",\"data\":{\"buyer\":{\"email\":\"almeida.blessed+prazo1@gmail.com\",\"name\":\"Teste Prazo\"},\"purchase\":{\"status\":\"APPROVED\",\"transaction\":\"TX-PRAZO-B\"},\"subscriber\":{\"code\":\"SUB-PRAZO-1\",\"email\":\"almeida.blessed+prazo1@gmail.com\"}}}"
```

Esperado: **HTTP 200** com `"message":"User already exists"` e **nenhum
e-mail novo** (a conta já existe, a senha continua a mesma).

Rode de novo o bloco SQL do passo 2. Esperado: `ativo`, `acesso_ate` **nulo**,
`ainda_vale` nulo. No app, recarregando: o acesso volta, sem tela de pausa.

---

## 6. Cancelamento SEM data usa a data de segurança

```bat
curl -i -X POST "https://inqyobsjuztztvafpzxn.supabase.co/functions/v1/smart-processor" -H "X-HOTMART-HOTTOK: %HOTTOK%" -H "Content-Type: application/json" -d "{\"id\":\"EVT-PRAZO-5\",\"event\":\"SUBSCRIPTION_CANCELLATION\",\"data\":{\"subscriber\":{\"code\":\"SUB-PRAZO-1\",\"email\":\"almeida.blessed+prazo1@gmail.com\"}}}"
```

Esperado: **HTTP 200** com um `ate` cerca de 32 dias à frente.

```sql
SELECT evento, payload->>'motivo' AS motivo, payload->>'data_de_seguranca' AS data_de_seguranca
  FROM public.assinatura_eventos
 WHERE evento = 'CANCELAMENTO_SEM_DATA'
 ORDER BY recebido_em DESC LIMIT 1;
```

Esperado: uma linha, com a data de segurança igual ao `ate` da resposta.

---

## 6b. Segundo cancelamento NÃO amplia o prazo (o ajuste de hoje)

```bat
for /f %i in ('node -e "console.log(Date.now()+60*86400000)"') do @set LONGE=%i
```

```bat
curl -i -X POST "https://inqyobsjuztztvafpzxn.supabase.co/functions/v1/smart-processor" -H "X-HOTMART-HOTTOK: %HOTTOK%" -H "Content-Type: application/json" -d "{\"id\":\"EVT-PRAZO-6\",\"event\":\"SUBSCRIPTION_CANCELLATION\",\"data\":{\"date_next_charge\":%LONGE%,\"subscriber\":{\"code\":\"SUB-PRAZO-1\",\"email\":\"almeida.blessed+prazo1@gmail.com\"}}}"
```

Esperado: **HTTP 200** com o `ate` ainda nos ~32 dias (o prazo de 60 dias foi
descartado).

```sql
SELECT evento, payload->>'prazo_mantido' AS mantido, payload->>'prazo_descartado' AS descartado
  FROM public.assinatura_eventos
 WHERE evento = 'PRAZO_IGNORADO'
 ORDER BY recebido_em DESC LIMIT 1;
```

Esperado: uma linha, `mantido` ≈ 32 dias, `descartado` ≈ 60 dias.

---

## 7. Limpeza da conta de teste

Primeiro pegue o id (o mesmo do passo 1) e **confirme que é a conta de teste**:

```sql
SELECT u.id, u.nome, u.nome_confeitaria, e.email
  FROM public.usuarias u
  JOIN public.assinatura_eventos e ON e.usuaria_id = u.id
 WHERE e.email = 'almeida.blessed+prazo1@gmail.com'
 GROUP BY u.id, u.nome, u.nome_confeitaria, e.email;
```

Depois, **trocando `<ID>` pelo UUID** nas duas ocorrências por bloco:

```sql
BEGIN;
DELETE FROM public.administrative_costs            WHERE usuaria_id = '<ID>';
DELETE FROM public.clientes                        WHERE usuaria_id = '<ID>';
DELETE FROM public.fichas_tecnicas                 WHERE usuaria_id = '<ID>';
DELETE FROM public.transacoes                      WHERE usuaria_id = '<ID>';
DELETE FROM public.produtos                        WHERE usuaria_id = '<ID>';
DELETE FROM public.estoque_movimentos              WHERE usuaria_id = '<ID>';
DELETE FROM public.despesas_empresa                WHERE usuaria_id = '<ID>';
DELETE FROM public.configuracao_empresa_historico  WHERE usuaria_id = '<ID>';
DELETE FROM public.pedidos                         WHERE usuaria_id = '<ID>';
DELETE FROM public.saldos_semanais                 WHERE usuaria_id = '<ID>';
DELETE FROM public.otp_codes                       WHERE user_id    = '<ID>';
DELETE FROM public.assinatura_eventos              WHERE usuaria_id = '<ID>';
DELETE FROM public.usuarias                        WHERE id         = '<ID>';
SELECT 'apagado' AS resultado;
COMMIT;
```

Esperado: `apagado`. `usuarias` não apaga em cascata, por isso os dados vêm
antes dela.

Sobram as linhas de `assinatura_eventos` sem conta casada (as de e-mail que
nunca casou), se houver:

```sql
DELETE FROM public.assinatura_eventos
 WHERE email = 'almeida.blessed+prazo1@gmail.com';
```

E por último o usuário do Auth:

```sql
DELETE FROM auth.users WHERE id = '<ID>';
```

Esperado: 1 linha apagada. Confira que o id é o da conta de teste antes de
rodar — este bloco não tem volta.
