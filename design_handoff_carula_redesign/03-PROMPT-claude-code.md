# Como aplicar o redesign com o Claude Code

Este pacote traz **código pronto**. A regra que economiza tokens: o Claude Code deve
**copiar e ligar**, nunca inventar estilos nem recalcular valores.

---

## Passo 0 — copiar dois arquivos (você faz, sem gastar tokens)

1. Cole o conteúdo de `01-index.css` **no topo de `src/index.css`**, logo depois dos imports do Tailwind.
2. Copie `02-carula-ui.tsx` para `src/components/carula-ui.tsx`.

Pronto — toda a camada visual (paleta, fontes, cards, sombras, animações, medidores,
nav, comanda) já existe no projeto. Falta só usá-la.

---

## Passo 1 — prompt inicial (cole exatamente isto)

> Li que existem dois arquivos novos no projeto: `src/index.css` (com um bloco de tokens `--car-*` e classes `.car-*`) e `src/components/carula-ui.tsx` (biblioteca de componentes visuais prontos).
>
> Sua tarefa é **aplicar essa camada visual às telas existentes**, uma tela por vez, sem mudar comportamento.
>
> Regras invioláveis:
> 1. **Não altere** navegação, nomes de abas, textos, rótulos, placeholders, contagens, formatação de moeda, tipos, handlers, rotas, cálculos nem chamadas de dados. Só JSX de apresentação e classes/estilos.
> 2. **Não crie** novas cores, sombras, raios, durações ou fontes. Use apenas os tokens `--car-*` e as classes `.car-*` que já existem, ou os componentes de `carula-ui.tsx`.
> 3. **Não escreva CSS novo.** Se algo parecer faltar, use o componente/classe mais próximo do que existe.
> 4. Reaproveite os componentes de `carula-ui.tsx` em vez de reescrever markup: `Card`, `Pill`, `IconButton`, `SearchField`, `Segmented`, `CategoryChips`, `ComandaButton`, `RingGauge`, `ArcGauge`, `CompositionRing`, `LegendRow`, `StackedBar`, `OrderTicket`, `MonthCalendar`, `StockCard`, `DatesDisclosure`, `AppHeader`, `BottomNav`, `Sidebar`, `PageHeader`, `HeroCard`, `SheetBody`, `AppShell`.
> 5. Trabalhe **um arquivo por vez**. Ao terminar cada um, pare, diga o que mudou em 3 linhas e espere meu OK.
>
> Comece pelo arquivo 1 da lista abaixo. Não toque nos outros ainda.
>
> **Ordem:**
> 1. `src/components/Header.tsx` → substituir pelo `AppHeader`.
> 2. `src/components/BottomNav.tsx` → substituir pelo `BottomNav` (usar `TABS`; manter as chaves de rota que o app já usa).
> 3. `src/App.tsx` → envolver com `AppShell` (barra inferior < 1024px, sidebar >= 1024px).
> 4. `src/components/Dashboard.tsx` → `HeroCard` + `RingGauge` no lucro; `MonthCalendar` na agenda (mês inteiro, só os dias); três `RingGauge` nos cofrinhos; `ComandaButton` no "Lançar Pedido"; `SheetBody` no painel claro.
> 5. `src/components/OrdersModule.tsx` → `HeroCard` nos totais, `SearchField`, `Segmented` nos filtros, `OrderTicket` em cada pedido.
> 6. `src/components/FichasTecnicasModule.tsx` → `CategoryChips` nas 5 categorias; `CompositionRing` + `LegendRow` no lugar dos 4 quadrados; botões Editar/Duplicar/Excluir com `car-btn`, `car-btn--asym-l`, `car-btn--asym-r`.
> 7. `src/components/EstoqueModule.tsx` → `StockCard` por insumo (o arco já calcula 100% = 4x o mínimo), `SearchField`, botão `car-btn--primary`.
> 8. `src/components/CustomersModule.tsx` → capa em `var(--car-grad-brand-135)`, dados em pílulas `car-pill`, `DatesDisclosure` nas datas comemorativas.
> 9. `src/components/BalancesAndExpensesModule.tsx` → `HeroCard` + `StackedBar` no saldo total; cofrinhos em `Card`; formulário e histórico com `car-*`.

---

## Passo 2 — prompt de continuação (a cada OK seu)

> OK. Próximo arquivo da lista, mesmas regras. Não revisite arquivos já aprovados.

---

## Passo 3 — se ele começar a inventar

Interrompa e cole:

> Pare. Você está criando estilo novo. Reverta o que fez neste arquivo e refaça usando **apenas** classes `.car-*`, tokens `--car-*` e componentes de `carula-ui.tsx`. Se achar que falta algo, pergunte em vez de criar.

---

## Detalhes que ele costuma errar (deixe já no prompt do arquivo correspondente)

**Pedidos.** O valor do pedido usa `.car-ticket__value` — **17px, igual em pago e pendente**. PDF, "Pendente" / "Marcar PAGO" e o selo de status são todos `car-pill` (9px, padding 5x10, nowrap): **mesmo tamanho**. O `OrderTicket` já resolve isso; só passe as props.

**Agenda.** Calendário do **mês inteiro**, só os dias — sem lista de bolos dentro. `MonthCalendar` recebe `days: {day, inMonth, booked, today}[]` (42 células, semana começando no domingo).

**Fichas.** As 5 categorias em `CategoryChips` (wrap em duas linhas, nunca rolagem cortada). `CompositionRing` recebe os três valores numéricos e a sugestão já formatada.

**Estoque.** `StockCard` cuida da escala do arco, da cor do alerta e do hover 3D. O item abaixo do nível é definido por `quantity <= min` — não mude o critério do app.

**Clientes.** Nunca rosa chapado com texto branco: texto escuro sobre superfície clara. O bloco de datas é contíguo ao cabeçalho e recolhível (`DatesDisclosure`, `defaultOpen={false}`).

**Saldos.** `StackedBar parts={[{pct:45.6,color:'#F5B9C6'},{pct:31.6,color:'#D6B8E0'},{pct:22.8,color:'#A9D8B8'}]}` — as porcentagens devem vir dos valores reais dos três cofrinhos.

---

## Exemplos de uso (copie ao pedir cada tela)

```tsx
// Cabeçalho + shell (App.tsx)
import { AppShell, AppHeader, PageHeader, SearchField } from './components/carula-ui';

<AppShell
  active={tab} onChange={setTab}
  header={<AppHeader onProfile={openProfile} />}
  desktopHeader={<PageHeader title="Pedidos & Encomendas" subtitle="12 pedidos registrados">
    <SearchField placeholder="Buscar por nome da cliente ou descrição do produto..." value={q} onChange={setQ} />
  </PageHeader>}
>
  {renderTab()}
</AppShell>
```

```tsx
// Card de lucro (Dashboard)
<HeroCard glow>
  <div style={{ position:'relative', display:'flex', alignItems:'center', gap:16 }}>
    <RingGauge percent={margem} size={92} stroke={9} color="#F5B9C6" track="rgba(255,255,255,.18)" glow>
      <span style={{ fontSize:19, fontWeight:800, color:'#fff' }}>{margem}%</span>
      <span style={{ fontSize:8, color:'rgba(247,220,225,.75)', marginTop:3 }}>margem</span>
    </RingGauge>
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <span className="car-label-on-dark">LUCRO LÍQUIDO DO MÊS (RENDIMENTO)</span>
      <span style={{ fontSize:32, fontWeight:800, color:'#fff', letterSpacing:'-.03em' }}>{lucroFormatado}</span>
      <Pill tone="paid">Positivo</Pill>
    </div>
  </div>
</HeroCard>
```

```tsx
// Pedido
<OrderTicket
  customer={o.cliente} paid={o.status === 'PAGO'}
  statusLabel={o.status === 'PAGO' ? '✅ Pago' : '⏳ Pendente'}
  date={formatDate(o.data)} payment={o.pagamento} value={formatCurrency(o.valor)}
  onPdf={() => gerarPdf(o)} onToggleStatus={() => toggleStatus(o)}
  onEdit={() => editar(o)} onDelete={() => excluir(o)}
/>
```

```tsx
// Ficha técnica
<Card hover pad={18}>
  <div style={{ display:'flex', gap:14 }}>
    <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:8 }}>
      <span className="car-serif" style={{ fontSize:23 }}>{f.nome}</span>
      <Pill tone="cat">{f.rendimento}</Pill>
    </div>
    {f.foto && <img src={f.foto} alt={f.nome} style={{ width:84, height:84, objectFit:'cover', borderRadius:20, border:'2px solid #fff' }} />}
  </div>
  <div style={{ display:'flex', alignItems:'center', gap:15, background:'var(--car-surface-2)', borderRadius:18, padding:14 }}>
    <CompositionRing reposicao={f.reposicao} maoDeObra={f.maoDeObra} custos={f.custos} sugestao={formatCurrency(f.sugestao)} />
    <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:7 }}>
      <LegendRow color="#6E3F72" label="Reposição"  value={formatCurrency(f.reposicao)} />
      <LegendRow color="#C4626F" label="Mão de Obra" value={formatCurrency(f.maoDeObra)} />
      <LegendRow color="#B08D57" label="Custos Op."  value={formatCurrency(f.custos)} />
    </div>
  </div>
  <div style={{ display:'flex', gap:8 }}>
    <button className="car-btn car-btn--primary car-btn--asym-l" style={{ flex:1 }} onClick={() => editar(f)}><IconEdit size={15} color="#F5B9C6" />Editar</button>
    <button className="car-btn car-btn--soft car-btn--asym-r" style={{ flex:1 }} onClick={() => duplicar(f)}><IconCopy size={15} color="#6E3F72" />Duplicar</button>
    <button className="car-btn car-btn--danger" style={{ flex:1 }} onClick={() => excluir(f)}><IconTrash size={15} color="#C4626F" />Excluir</button>
  </div>
</Card>
```

```tsx
// Estoque e Clientes
<div className="car-deck" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(420px,1fr))', gap:14 }}>
  {insumos.map(i => (
    <StockCard key={i.id} name={i.nome} quantity={i.quantidade} unit={i.unidade} min={i.minimo}
      onDec={() => ajustar(i, -1)} onInc={() => ajustar(i, 1)} onEdit={() => editar(i)} onDelete={() => excluir(i)} />
  ))}
</div>

<DatesDisclosure customerName={c.nome} count={c.datas.length}
  dates={c.datas.map(d => ({ emoji: d.emoji, title: d.titulo, date: d.data }))}
  onNotify={(t) => avisarWhatsApp(c, t)} />
```

---

## Checklist de aceite por tela

- [ ] Nenhuma string, contagem ou cálculo mudou.
- [ ] Nenhuma cor fora dos tokens `--car-*`.
- [ ] Cards levantam no hover; abas sobem 4px; nada pisca.
- [ ] Selos e ações de uma mesma linha têm tamanho idêntico.
- [ ] Valores nunca quebram linha (`white-space: nowrap`).
- [ ] Funciona em 390px e em 1280px.
- [ ] `npm run build` passa sem erro de tipo.

---

## Se o Claude Code continuar caro

Faça você mesmo os passos 1–3 (colar dois arquivos + trocar Header, BottomNav e App —
são substituições diretas) e use o Claude Code só para as quatro telas restantes,
uma por conversa. Cada conversa lê **um** módulo, não o projeto inteiro.
