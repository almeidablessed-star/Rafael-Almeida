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
