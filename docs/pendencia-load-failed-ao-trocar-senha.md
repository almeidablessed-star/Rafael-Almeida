# RESOLVIDO: "Load failed" ao definir a senha nova (conexão ociosa, escrita sem retry)

> Observado em 2026-10-13, no iPhone, pelo app instalado na tela inicial
> (Safari/PWA), durante o teste da restrição de CORS do `swift-responder`.
>
> **Corrigido no mesmo dia, commit `92439f3`**, publicado em `production` e
> `master`. A chamada de troca de senha passou a ter **uma** retentativa, no
> próprio ponto de chamada (`ResetPasswordPage.tsx`), sem afrouxar o retry
> compartilhado de `lib/supabase.ts`, que continua cobrindo só GET.
>
> Repete **só** falha de rede, nas duas formas que o `supabase-js` usa
> conforme a versão: `TypeError` lançado, ou erro devolvido com `status: 0` /
> `AuthRetryableFetchError`. Erro respondido pelo servidor (senha fraca,
> sessão expirada, 422) passa direto, sem segunda tentativa.
>
> **Teste do Rafael, 2026-10-13:** entrou com o código, **esperou 5 minutos
> parado na tela da senha nova** — justamente o intervalo ocioso que é o
> gatilho descrito abaixo — e depois salvou a senha. **Salvou normalmente, sem
> erro nenhum**, e entrou no app em seguida.
>
> **O que esse teste NÃO prova — e vale dizer com clareza:** não dá para
> afirmar se a conexão chegou a cair dessa vez e a retentativa cobriu em
> silêncio, ou se simplesmente não caiu. Do lado de fora os dois cenários são
> idênticos: a senha salva e pronto. Confirmar qual deles aconteceu exigiria
> instrumentar a tela para registrar a retentativa, o que não vale o custo.
>
> **E isso não muda a conclusão prática:** com o retry em produção, o
> resultado para a usuária é sempre "a senha salva", com ou sem queda de
> conexão no meio. Era esse o objetivo.
>
> Fica também, de propósito, sem veredito definitivo a **causa raiz** do
> episódio original: o encaixe com o padrão da conexão ociosa é forte, mas a
> prova decisiva (falhar, repetir na hora e funcionar) nunca foi registrada.
> Se o sintoma voltar em outro caminho de escrita, começar por aqui.
>
> O texto abaixo fica como registro do problema original.

## O sintoma

O login por código funcionou normalmente. Na tela seguinte — definir a senha
nova, do primeiro acesso / troca obrigatória — a tela ficou carregando e
apareceu **"Load failed"** no topo.

"Load failed" é a mensagem do Safari para um `fetch` que **não recebeu
resposta nenhuma** (o equivalente ao "Failed to fetch" do Chrome): sem status,
sem corpo, sem `Response`.

## O que já está estabelecido

- A tela é `src/pages/ResetPasswordPage.tsx`, e a chamada é uma só:
  `supabase.auth.updateUser({ password, data: {...} })`, um **PUT** direto
  para `/auth/v1/user` do Supabase.
- **Não passa por Edge Function nossa.** Buscado `swift-responder` e
  `functions/v1` nessa tela e no `AuthContext`: nenhuma ocorrência. O CORS
  desse endpoint é do Supabase, não nosso.
- **Não tem relação com a restrição de CORS feita no mesmo dia.** Endpoint
  diferente, arquivo diferente — e o login por código, que *passa* pelo
  `swift-responder`, funcionou no mesmo teste.

## A causa provável — o mesmo padrão já documentado

É o sintoma descrito em `docs/investigacao-cors-transacoes-movimentos.md`: uma
conexão ociosa por alguns minutos é derrubada em algum ponto entre o navegador
e o Supabase, e a **primeira chamada depois do intervalo** falha com
`TypeError` sem resposta — que o navegador reporta como se fosse CORS, sem
ser. A mesma chamada funciona na tentativa seguinte, com conexão nova.

**O detalhe que faz esse caminho doer mais que os outros:** por causa daquela
investigação, o cliente foi embrulhado num retry em `src/lib/supabase.ts` —
mas ele **só repete requisições GET**, por decisão consciente de não arriscar
duplicar um lançamento financeiro numa escrita. `updateUser` é um **PUT**.
Logo, é exatamente o tipo de chamada que, caindo nessa falha, **falha
visivelmente para a usuária**, sem segunda tentativa.

O encaixe bate com o relato: entra com o código (tráfego de rede), chega na
tela de senha, digita, confirma — e nesse meio passa um intervalo sem tráfego,
que é o gatilho descrito na investigação.

## O que NÃO foi verificado

- **A prova decisiva não foi registrada:** tentar de novo logo depois da
  falha. Se funcionar na segunda tentativa, é a conexão ociosa, confirmada.
  Se falhar sempre, é outra coisa.
- Não houve leitura de console nem da aba de rede; não se sabe se houve troca
  de Wi-Fi/4G, nem quanto tempo a tela ficou parada antes do toque.
- Outras causas possíveis, em ordem de probabilidade decrescente: rede
  instável do celular, timeout do endpoint de Auth, e — bem improvável — CORS
  de verdade no endpoint do Supabase.

## Direção, quando alguém retomar

Trocar a senha é uma operação **segura de repetir**: definir a mesma senha
duas vezes tem o mesmo efeito que definir uma vez. Isso a separa do motivo que
criou a regra "nunca repetir escrita" — ali o risco era duplicar um pedido ou
um lançamento financeiro, que não é idempotente.

Então a correção natural é **estender o retry para esta chamada específica**,
não para escritas em geral. Duas formas:

1. Repetir no ponto de chamada, dentro da `ResetPasswordPage` — mais cirúrgico
   e não mexe no cliente compartilhado.
2. Ensinar o wrapper de `supabase.ts` a aceitar uma lista curta de rotas
   idempotentes (hoje seria só `/auth/v1/user`) — mais geral, e por isso mais
   fácil de alguém ampliar sem perceber o risco.

A opção 1 é a mais conservadora. Em qualquer uma, manter a regra geral
intacta: escrita de pedido, compra ou despesa **não** se repete.
