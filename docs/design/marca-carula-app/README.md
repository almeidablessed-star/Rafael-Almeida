# Marca e telas do Carula App

Cópia local do projeto **"Pedido Carula Cake"** feito no Claude Design
(<https://claude.ai/artifact/XTXXWhWMbiFYbQJYDZFUC3>), guardada em 19/10/2026
para ser usada no app. O link é a fonte viva; esta pasta é o registro do que
foi aprovado.

## Marca final (aprovada)

| | Escolha |
|---|---|
| **Ícone** | O "C" em anel com a etiqueta pendurada na abertura (caminho A do `IconeC`) |
| **Logo** | "carula" em Manrope 800 + etiqueta rosé "APP" inclinada (opção 3, Etiqueta) |
| **Fundos** | branco, preto e roxo (degradê) |

### Cores

| Uso | Cor |
|---|---|
| Roxo principal | `#3A2350` |
| Degradê roxo (155°) | `#3A2350 → #6E3F72 → #A85E86` |
| Rosé (etiqueta em fundo escuro/roxo) | `#F5B9C6` |
| Etiqueta em fundo branco | `#E58FA3` |
| Preto | `#141014` |

Fonte do logo: **Manrope 800** (a mesma do app). Títulos do app seguem em
Instrument Serif.

### Arquivos prontos para usar — `svg/`

| Arquivo | Para quê |
|---|---|
| `icone-app-roxo.svg` | Ícone do app (tela inicial do celular, PWA, favicon): quadrado arredondado com o degradê. 512×512 |
| `icone-fundo-claro.svg` | Só o símbolo, para fundo branco/claro |
| `icone-fundo-escuro.svg` | Só o símbolo, para fundo preto/escuro (e sobre o roxo) |
| `logo-fundo-claro.svg` | Logo "carula APP" em roxo, para fundo branco |
| `logo-fundo-escuro.svg` | Logo em branco, para fundo preto |
| `logo-fundo-roxo.svg` | Logo em branco, para o degradê roxo |

Os SVGs foram montados a partir do código do design e conferidos lado a lado
com ele. **O logo usa texto em Manrope**: dentro do app (que já carrega a
fonte) aparece certo; para gráfica, redes sociais ou qualquer lugar sem a
fonte, converter o texto em curvas antes (ou exportar PNG a partir do app).

Para o ícone da tela inicial do iPhone/Android ainda é preciso gerar os PNGs
nos tamanhos de cada plataforma (180, 192, 512…) a partir de
`icone-app-roxo.svg` — ainda não foi feito.

## Arquivos do design — abrir no navegador

Os `.dc.html` abrem direto no navegador (o `support.js` de cada pasta é o
mesmo da raiz do repo).

### `marca/`
- `MarcaFinal.dc.html` — **a marca aprovada**: ícone e logo nos três fundos, com as cores.
- `IconeC.dc.html` — os 4 caminhos do ícone (A anel + etiqueta ✓, B bico de confeitar, C a fatia, D o c da etiqueta).
- `LogoAnel.dc.html`, `LogoCobertura.dc.html`, `LogoEtiqueta.dc.html` — as 3 opções de logo exploradas (a Etiqueta foi a escolhida).

### `telas/` — telas aprovadas, já aplicadas no app
- `EditarProduto.dc.html` — formulário de produto (estilo "comanda"). Aplicado no commit `edd554a`.
- `FichaInsumosV2.dc.html` — ficha técnica, passo 2. Aplicado em `edd554a` (+ seletor de tamanho em `5e085dc`).
- `FichaPreco.dc.html` — ficha técnica, passo 3. Aplicado em `edd554a`.
- `PdfFolhaCliente.dc.html` — primeira versão do PDF da Folha do Cliente (base dos commits `eeea304` em diante; o PDF evoluiu depois para a página em pé, `f2237bc`/`746898d`).

`canvas.json` é o índice do projeto no Claude Design (páginas e posições).

## O que ainda falta aplicar no app

- Trocar o ícone do app (manifest/PWA, favicon, ícone da tela inicial) pelo `icone-app-roxo.svg`.
- Usar o logo novo onde hoje aparece o nome em texto (tela de login, cabeçalho, e-mails).
