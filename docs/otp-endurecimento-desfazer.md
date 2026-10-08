# Endurecimento do OTP — como desfazer

Publicado em 2026-10-08. As duas Edge Functions e o app mudaram juntos. Isto é o
botão de pânico, caso o primeiro acesso pare de funcionar.

**As duas funções têm de ser revertidas juntas.** Elas compartilham o mesmo
cálculo de HMAC com `OTP_PEPPER`: se só uma voltar à versão antiga, nenhum
código confere, porque uma grava hash e a outra espera texto puro.

## Versões de referência

| | antes das mudanças | depois |
|---|---|---|
| `swift-responder` | commit `2329014` (cópia fiel do que estava no ar) | `2460b37` |
| `smart-processor` | commit `2d8528a` | `2460b37` |
| app (`VerifyOtpPage`) | `2d8528a` | `9a2a2ed` |

## Republicar as funções anteriores

```bash
git checkout 2329014 -- supabase/functions/swift-responder/index.ts
git checkout 2d8528a -- supabase/functions/smart-processor/index.ts
npx supabase functions deploy swift-responder --project-ref inqyobsjuztztvafpzxn --no-verify-jwt
npx supabase functions deploy smart-processor --project-ref inqyobsjuztztvafpzxn --no-verify-jwt
git checkout HEAD -- supabase/functions/
```

O `--no-verify-jwt` **não é opcional**: sem ele o padrão do CLI é exigir JWT, e
as duas funções param na hora — a Hotmart manda hottok, não JWT, e quem verifica
o código ainda não tem sessão.

A última linha devolve o working tree ao estado atual, para o repositório não
ficar descrevendo uma coisa e o deploy outra.

## Reverter o app

```bash
git revert --no-edit 9a2a2ed
git push origin chore/carula-site-preview
git push origin HEAD:production
git push origin HEAD:master
```

## O que NÃO desfazer por aqui

**As colunas `code_hash` e `tentativas` podem ficar.** São aditivas e as funções
antigas as ignoram.

**O `code` em texto não volta.** As linhas antigas foram apagadas com
`UPDATE otp_codes SET code = NULL`, e nenhuma versão recupera isso — nem precisa:
eram códigos de teste, já invalidados. Depois de reverter, quem precisar de
acesso pede uma compra simulada nova.

**As políticas de `otp_codes` continuam fechadas.** Reverter as funções não
reabre a tabela, e **não deve** reabrir: foi justamente a abertura que permitia
ler os códigos de todas as compradoras e forjar sessão de outra pessoa. Se, ao
reverter, a `VerifyOtpPage` antiga voltar, ela **não vai funcionar** — ela lia a
tabela pelo navegador. Nesse cenário o caminho de primeiro acesso é a
`VerifyOtpStandalonePage`, que já passava pela função.

## Remetente configurável (publicado em 2026-10-08)

O `smart-processor` passou a exigir `RESEND_FROM` e `OTP_PEPPER` no início do
pedido, e monta o remetente como `Carula Confeitaria <endereço do secret>`. A
versão anterior é o commit `d821bcf`. Só o `smart-processor` mudou — o
`swift-responder` não precisa voltar.

```bash
git checkout d821bcf -- supabase/functions/smart-processor/index.ts
npx supabase functions deploy smart-processor --project-ref inqyobsjuztztvafpzxn --no-verify-jwt
git checkout HEAD -- supabase/functions/smart-processor/index.ts
git revert --no-edit bc4e95a 37ff718
git push origin chore/carula-site-preview
git push origin HEAD:production
git push origin HEAD:master
```

Atenção ao reverter: a versão antiga **cai no remetente de teste do resend.dev**
quando `RESEND_FROM` não existe, e aquele endereço só entrega ao dono da conta
Resend. Reverter devolve o comportamento de "a compradora não recebe nada, e
nada no log diz isso" — por isso reverta só se o problema for pior que esse.

## Etapa 2 — falha de e-mail e reenvio (publicado em 2026-10-08)

Mudou o `smart-processor` (classificação do erro do Resend em três classes e
registro de `EMAIL_FALHOU`) e entrou a função nova `resend-otp`, com o botão
"Não recebi o código" nas duas telas de verificação. O `swift-responder` **não**
foi tocado nesta etapa.

Versão anterior do `smart-processor`: commit `5e37be9`.

```bash
git checkout 5e37be9 -- supabase/functions/smart-processor/index.ts
npx supabase functions deploy smart-processor --project-ref inqyobsjuztztvafpzxn --no-verify-jwt
git checkout HEAD -- supabase/functions/smart-processor/index.ts
npx supabase functions delete resend-otp --project-ref inqyobsjuztztvafpzxn
git revert --no-edit 04923f3 ee540a5 dd3b481 2889892 0a1d30c
git push origin chore/carula-site-preview
git push origin HEAD:production
git push origin HEAD:master
```

Apagar a `resend-otp` é opcional: sem o botão no app ninguém a chama, e deixá-la
publicada não abre nada — ela responde sempre a mesma mensagem genérica. Só
apague se quiser a superfície menor.

Atenção ao reverter o `smart-processor`: a versão `5e37be9` volta à regra antiga
de "qualquer 4xx é definitivo", que **apaga a conta de quem pagou** e responde
200 para a Hotmart não reenviar. Uma configuração quebrada volta a derrubar
todas as compradoras em silêncio. Reverta só se o problema for pior que esse.
