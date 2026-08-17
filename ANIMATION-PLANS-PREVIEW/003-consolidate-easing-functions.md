# Plano 003: Consolidar Funções de Easing

**Severity:** HIGH  
**Category:** Cohesion & Tokens  
**Commit:** current  
**Esforço:** 20 minutos  

---

## O Problema

Cubic-bezier values estão duplicados em múltiplos arquivos:

```tsx
// Dashboard.tsx
style={{ ease: 'cubic-bezier(0.16, 1, 0.3, 1)' }}

// OrdersModule.tsx
transition={{ ease: [0.16, 1, 0.3, 1] }}

// CustomersModule.tsx
style={{ transition: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
```

**Mesmo valor, três formas diferentes.** Impossível padronizar sem agregar tudo em um lugar.

---

## A Solução

Consolidar **3 easing functions** em `lib/animation-tokens.ts` (já criado no Plano 002):

### Easing Palette

| Nome | Valor | Uso |
|------|-------|-----|
| `spring` | `cubic-bezier(0.16, 1, 0.3, 1)` | Botões, CTAs — feel springy |
| `out` | `cubic-bezier(0.23, 1, 0.320, 1)` | Modais, cards — ease-out padrão |
| `in` | `cubic-bezier(0.550, 0.055, 0.675, 0.190)` | Saídas, collapses — ease-in |

**Por quê esses valores?**
- `spring`: mimics slight overshoot (feels responsive)
- `out`: standard deceleration (feels polished)
- `in`: acceleration (feels intentional on exit)

---

## Atualizar `lib/animation-tokens.ts`

Se você executou Plano 002, já tem este arquivo. Confirmar que contém:

```ts
// lib/animation-tokens.ts
export const ANIMATION_EASING = {
  spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
  out: 'cubic-bezier(0.23, 1, 0.320, 1)',
  in: 'cubic-bezier(0.550, 0.055, 0.675, 0.190)',
} as const;

// Para Motion library (array format)
export const EASING_ARRAYS = {
  spring: [0.16, 1, 0.3, 1],
  out: [0.23, 1, 0.320, 1],
  in: [0.550, 0.055, 0.675, 0.190],
} as const;
```

---

## Substituir nos Componentes

### Dashboard.tsx

**Antes:**
```tsx
transition={{
  ease: [0.16, 1, 0.3, 1],
  duration: 0.3,
}}
```

**Depois:**
```tsx
import { EASING_ARRAYS, ANIMATION_DURATIONS } from '@/lib/animation-tokens';

transition={{
  ease: EASING_ARRAYS.spring,
  duration: ANIMATION_DURATIONS.normal / 1000,
}}
```

### OrdersModule.tsx

**Antes:**
```tsx
style={{
  boxShadow: '0 14px 30px rgba(58,35,80,0.36)',
  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
}}
```

**Depois:**
```tsx
import { ANIMATION_EASING, ANIMATION_DURATIONS } from '@/lib/animation-tokens';

style={{
  boxShadow: '0 14px 30px rgba(58,35,80,0.36)',
  transition: `all ${ANIMATION_DURATIONS.normal}ms ${ANIMATION_EASING.spring}`,
}}
```

### Tailwind Config

Se ainda não feito (Plano 002):

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-out': 'cubic-bezier(0.23, 1, 0.320, 1)',
        'ease-in': 'cubic-bezier(0.550, 0.055, 0.675, 0.190)',
      },
    },
  },
};
```

---

## Arquivos a Alterar

| Arquivo | O Quê | Linhas Aprox |
|---------|-------|------------|
| `lib/animation-tokens.ts` | Confirmar EASING_ARRAYS | N/A (já criado) |
| `tailwind.config.ts` | Confirmar transitionTimingFunction | N/A (já adicionado) |
| `Dashboard.tsx` | Substituir 2-3 cubic-beziers | 250, 290, 320 |
| `OrdersModule.tsx` | Substituir 1-2 cubic-beziers | 241, 350 |
| `CustomersModule.tsx` | Substituir 1 cubic-bezier | 185 |
| Outros componentes | Audit para mais cubic-beziers | Conforme encontrado |

---

## Valores Prontos (Copy-Paste)

**Para Motion:**
```tsx
import { EASING_ARRAYS } from '@/lib/animation-tokens';

transition={{ ease: EASING_ARRAYS.spring }}
transition={{ ease: EASING_ARRAYS.out }}
transition={{ ease: EASING_ARRAYS.in }}
```

**Para CSS/inline:**
```tsx
import { ANIMATION_EASING } from '@/lib/animation-tokens';

style={{ transition: `all 250ms ${ANIMATION_EASING.spring}` }}
style={{ transition: `all 300ms ${ANIMATION_EASING.out}` }}
```

**Para Tailwind:**
```tsx
className="transition-all duration-normal ease-spring"
className="transition-all duration-slow ease-out"
className="transition-all duration-fast ease-in"
```

---

## Feel-Check

1. Navegar entre componentes com transições
2. Verificar se todas as animações se sentem "suaves" (não abruptas)
3. Comparar "clique em botão" vs "clique em modal" — se uma parecer muito diferente, ajustar easing em `animation-tokens.ts`

---

## Scope

- ✅ Consolidar cubic-beziers em um arquivo
- ✅ Substituir valores hardcoded
- ❌ NÃO mudar durations (isso é Plano 002)
- ❌ NÃO adicionar novos easings (use os 3 padrões)

---

## Benefícios

- 🎨 Ritmo visual consistente
- 🔄 Mudar easing globalmente em um lugar
- 📖 Documentado com nomes semânticos
- ✨ Reduce copy-paste bugs

---

## Checklist de Conclusão

- [ ] `ANIMATION_EASING` importado em Dashboard.tsx
- [ ] `ANIMATION_EASING` importado em OrdersModule.tsx
- [ ] Todos os cubic-beziers substituídos por tokens
- [ ] Tailwind config tem `transitionTimingFunction`
- [ ] Feel-check passa (transições se sentem suaves)
- [ ] Nenhum cubic-bezier hardcoded restante (grep `cubic-bezier` deve retornar vazio)

---

## Próximos Passos

Após aplicados Planos 001, 002, 003:
- 🎯 App terá animations coesivas e padronizadas
- 📊 Executar `review-animations` para validar
- ➕ Opcionalmente, executar Planos MEDIUM (tab-switch animation, card stagger)
