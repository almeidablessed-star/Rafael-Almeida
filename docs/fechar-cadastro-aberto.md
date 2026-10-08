# Fechar o cadastro aberto — desfazeres e decisões

Três passos, nesta ordem: **tela**, **padrão `inativo`**, **interruptor do
Supabase**. Cada um é revertido por conta própria; nenhum depende do outro para
voltar atrás.

A ordem não é arbitrária. O padrão vem **antes** do interruptor porque é ele que
torna a compra simulada uma prova de verdade: enquanto o default for `'ativo'`,
uma conta nasceria ativa mesmo que o webhook esquecesse de mandar o campo, e o
teste não distinguiria as duas coisas. Com o default `'inativo'`, a compra que
nascer ativa prova que o webhook manda `acesso_status` explicitamente.

## 1. Tela de login

Commit `027ab2e`. Tirou o botão "Criar Conta", pôs "Já comprou? Verificar
Código", moveu `HOTMART_URL` para `src/config/hotmart.ts` e removeu o modo
`signup` do `ProtectedRoute`.

```bash
git revert --no-edit 027ab2e
git push origin chore/carula-site-preview
git push origin HEAD:production
git push origin HEAD:master
```

`SignupPage.tsx` continua no repositório, sem rota — reverter devolve a rota sem
precisar recriar a tela.

## 2. Padrão da coluna

> **O arquivo de migração está no repositório desde o commit `027ab2e`, mas
> isso NÃO significa que ele já foi aplicado.** Ele é rodado à mão pelo Rafael
> no SQL Editor, logo depois de o app ir ao ar — nesta ordem, porque a compra
> simulada seguinte é o que prova que o webhook manda `acesso_status`
> explicitamente. Enquanto não for rodado, o default no banco continua
> `ativo`.

Arquivo `supabase/migrations/20261009120000_acesso_status_default_inativo.sql`.

```sql
ALTER TABLE public.usuarias ALTER COLUMN acesso_status SET DEFAULT 'ativo';
```

Reverter o padrão **não reativa ninguém**: contas que já nasceram pausadas
continuam pausadas, porque têm valor gravado. Para destravar uma delas é preciso
um `UPDATE` explícito.

## 3. Interruptor "Allow new users to sign up"

Religar no painel do Supabase, em Authentication → Sign In / Providers. É o
desfazer mais rápido dos três e não exige deploy — por isso ele é o último a ser
aplicado e o primeiro a ser revertido se a compra simulada B falhar.

## Decisão registrada: "Confirm email" fica DESLIGADO nesta rodada

Com o cadastro fechado, ninguém de fora cria conta, então a confirmação de
e-mail perde quase toda a função. E o primeiro acesso pelo código **já marca o
e-mail como confirmado** — foi observado em produção: `email_confirmed_at` fica
preenchido depois de usar o código. Ou seja, as compradoras saem confirmadas de
qualquer jeito.

**Quando reabrir o cadastro, ligar passa a ser obrigatório**, por dois motivos:
impede alguém de criar conta com o e-mail de outra pessoa, e é o pré-requisito
da futura função de ativação pela compra, que precisa exigir `email_confirmed_at`
preenchido — senão alguém cadastra o e-mail de quem comprou e herda o acesso.

**Risco de ligar agora**, e a razão de não ligar: o webhook cria o usuário com
`email_confirm: false`, então a compradora passaria a receber **dois** e-mails —
o de confirmação do Supabase e o nosso com o código — e poderia travar no
primeiro, sem entender qual usar.

## Porta que continua aberta, e não foi fechada aqui

`LoginModal` (`src/components/LoginModal.tsx:71`) ainda chama `signup()`, e ela
**é montada** em `App.tsx:651`, aberta em `App.tsx:538` quando alguém sem sessão
toca no perfil. Na prática esse caminho é difícil de alcançar, porque o `App` só
renderiza depois do `ProtectedRoute`, que exige sessão. Mas o código existe e não
foi tocado — ficou fora do escopo deste passo. Com o interruptor desligado, a
chamada falha no servidor de qualquer forma; vale limpar depois.
