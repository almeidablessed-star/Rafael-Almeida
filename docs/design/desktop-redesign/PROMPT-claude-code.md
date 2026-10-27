# Prompt para o Claude Code aplicar o desktop

Cole o texto abaixo no Claude Code, na pasta do projeto, depois de trazer esta
pasta para o seu branch (veja o fim do arquivo).

---

Quero aplicar no app a versão desktop que eu aprovei no Claude Design.

Leia primeiro `docs/design/desktop-redesign/README.md`: ele tem as regras, a
estrutura comum (menu lateral, título, cartões) e o que muda em cada tela. Os
arquivos `.dc.html` da mesma pasta são o desenho aprovado, com as medidas e
cores exatas nos `style` de cada elemento. Use-os como referência visual e de
medidas, não como código para copiar. Os dados neles são exemplos.

Regras:
- Só o desktop muda. O celular e o tablet com toque ficam exatamente como estão.
- Mesmo conteúdo, mesmos cálculos, mesmos textos e mesmos modais de hoje: só
  a disposição e os ajustes visuais descritos no README.
- Use os componentes e contexts que já existem (CardDeSaldo,
  ResumoDistribuicaoCard, OrdersCalendar, LogoCarulaApp, os contexts de
  pedidos, fichas, clientes, produtos e custos). Não duplique cálculo.

Faça uma tela por vez, nesta ordem: estrutura comum (menu lateral + área de
conteúdo), Início, Pedidos, Fichas, Clientes, Produtos e Minha Empresa. No fim
de cada tela, rode o app no tamanho desktop e no celular, confira contra o
`.dc.html` correspondente e me mostre antes de passar para a próxima.

---

## Como trazer esta pasta para o seu projeto

A pasta foi enviada no branch `claude/loving-cannon-zhqsv1` do GitHub
(criado a partir do `master`, só com esta pasta a mais). No seu computador:

```bash
git fetch origin claude/loving-cannon-zhqsv1
git checkout origin/claude/loving-cannon-zhqsv1 -- docs/design/desktop-redesign
```

Isso copia só a pasta para o branch em que você já está trabalhando, sem
mexer em mais nada.
