# Plano 001: Corrigir Transform-Origin em Botões

**Severity:** HIGH  
**Category:** Physicality & Origin  
**Commit:** current  
**Esforço:** 15 minutos  

---

## O Problema

Botões com `scale-95` no estado `:active` estão escalando do canto superior-esquerdo em vez do centro. Isso causa um efeito visual desagradável onde o botão "pula" em vez de encolher simetricamente.

**Evidência:**
```tsx
// Dashboard.tsx, linha ~250
<button
  onClick={() => onOpenAddModal('venda')}
  className="w-full relative overflow-hidden transition-all duration-250"
  style={{
    background: 'linear-gradient(...)',
    borderRadius: '20px',
    padding: '18px 20px',
    // ... SEM transformOrigin declarado
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-3px) rotate(-0.6deg)';
  }}
/>
```

Resultado: quando clicado, escala de um ponto indefinido.

---

## A Solução

Adicionar `transformOrigin: 'center'` a **todos os elementos** com `scale-95`, `scale-90`, ou qualquer `scale()` transform.

### Elementos afetados:

1. **Buttons** com `active:scale-95`
2. **Cards/div** com hover scale
3. **Modais** com scale de entrada/saída

### Valores padrão:

| Tipo | Transform-Origin |
|------|-----------------|
| Botões | `center` |
| Cards | `center` |
| Modais (entrada) | `center` |
| Overlays | `center` |

---

## Arquivos & Changes

### 1. Dashboard.tsx (linha ~250)
**Antes:**
```tsx
<button
  style={{
    background: 'linear-gradient(...)',
    borderRadius: '20px',
  }}
>
```

**Depois:**
```tsx
<button
  style={{
    background: 'linear-gradient(...)',
    borderRadius: '20px',
    transformOrigin: 'center',  // ← ADD THIS
  }}
>
```

### 2. OrdersModule.tsx (linha ~240)
**Antes:**
```tsx
className="w-full relative overflow-hidden transition-all duration-250"
```

**Depois:**
```tsx
className="w-full relative overflow-hidden transition-all duration-250"
style={{
  transformOrigin: 'center',  // ← ADD THIS
}}
```

### 3. Todos os `<button>` e `<div>` com `active:scale-*` ou `hover:scale-*`

Grep para encontrar:
```bash
grep -r "scale-95\|scale-90\|scale-" src/components/ | grep -v "transformOrigin"
```

Adicionar `transformOrigin: 'center'` inline style a cada um.

---

## Feel-Check (Verificação)

1. Abra o app no navegador
2. Vá para qualquer aba (Dashboard, Pedidos, etc.)
3. **Clique em um botão** (ex: "Lançar Pedido")
4. **Sensação esperada:** botão encolhe simetricamente do centro, não "puxa" de um canto

Se ainda pular de forma estranha → verifique se há `transform-origin: initial` ou similar sobrescrevendo em CSS.

---

## Scope

- ✅ Tocar em: todos os `<button>`, `<div>` com scale transforms
- ❌ NÃO tocar em: cores, tamanhos, durations (esses são planos separados)
- ❌ NÃO alterar: DOM structure, classNames

---

## Próximos Passos

Após este plano ser aplicado:
- Rodar `review-animations` para validar o resultado
- Prosseguir para **Plano 002** (durações padronizadas)
