# RESOLVIDO: seletor de moeda do Perfil não persiste em `usuarias.moeda`

> Registrado em 2026-09-13, mesmo padrão dos outros `docs/bug-*.md` /
> `docs/pendencia-*.md` desta pasta (achado colateral durante outra tarefa —
> adicionar Euro como terceira opção de moeda —, fora do escopo pedido
> naquele momento, então só documentado, sem correção).
>
> **Resolvido no mesmo dia**, em `src/context/CurrencyContext.tsx`: o
> contexto passou a usar `useAuth()` para ler/gravar `usuarias.moeda`. Banco
> é a fonte de verdade — `localStorage` virou só um cache de leitura
> instantânea (evita a tela nascer em BRL por uma fração de segundo antes do
> perfil carregar), nunca decide sozinho. Testado ao vivo: trocar moeda,
> reload completo, e até limpar o `localStorage` manualmente — nos três
> casos a moeda certa veio do banco. Texto abaixo preservado como registro
> do problema original.

## Sintoma

O seletor de moeda no `ProfileModal.tsx` (topo do modal "Meu Perfil", ao lado
do seletor de período de mão de obra) muda a moeda de **exibição** do app
inteiro (símbolo usado em todo `formatCurrency`/`useCurrency()`), mas essa
escolha **nunca é gravada** de volta na coluna `usuarias.moeda` no Supabase
depois do cadastro inicial.

## Onde fica

- `src/context/CurrencyContext.tsx`: `setCurrency` só atualiza o estado em
  memória e `localStorage.setItem('carula_currency', ...)` — nunca toca o
  banco.
- `src/components/ProfileModal.tsx`: mantém um campo local
  `profileData.currency` (preenchido a partir de `userProfile?.moeda` na
  abertura do modal), mas o `handleSave` (que monta o payload do
  `.update(...)` para a tabela `usuarias`) **não inclui** `moeda` nesse
  payload — só telefone, endereço, Instagram, nome, nome da confeitaria e
  foto.
- `src/pages/SetupProfilePage.tsx` é o **único** lugar que grava `moeda` no
  banco hoje, e só uma vez, no cadastro inicial (`setupProfile(...)`).

## Impacto prático

Duas contas de moeda coexistem sem se atualizarem mutuamente:

1. **Moeda salva no perfil** (`usuarias.moeda`, gravada só no cadastro).
2. **Moeda de exibição corrente** (`CurrencyContext`, vive em
   `localStorage`, por navegador/dispositivo).

Se a pessoa troca de moeda no Perfil, funciona (o app todo passa a exibir a
nova moeda) — mas isso é local àquele navegador. Se ela limpar o
`localStorage`, trocar de aparelho, ou se algum fluxo futuro voltar a ler
`userProfile.moeda` como fonte de verdade, a escolha feita no seletor do
Perfil "se perde" e volta pro valor gravado no cadastro original.

## O que precisa decidir antes de corrigir

Não é só "adicionar `moeda` no payload do `handleSave`" — precisa decidir
antes:

- O seletor do Perfil deveria persistir em `usuarias.moeda` a partir de
  agora (fonte de verdade única, banco), com `localStorage` virando só cache
  local? Ou continuar intencionalmente separado (moeda de exibição é
  "por aparelho", moeda do perfil é só o padrão inicial)?
- Se decidir persistir: qual comportamento cross-device esperado — abrir o
  app num aparelho novo deveria carregar a moeda salva no perfil, ignorando
  qualquer `localStorage` local desse aparelho?

Sem essa decisão, uma correção apressada (só adicionar `moeda` no update)
pode criar um comportamento inesperado pra quem já depende do
`localStorage` ser "por aparelho".
