# Plano 002: Padronizar Durações de Animação

**Severity:** HIGH  
**Category:** Cohesion & Tokens  
**Commit:** current  
**Esforço:** 30 minutos  

---

## O Problema

Durações de animação estão espalhadas e inconsistentes:
- `250ms` em alguns lugares
- `300ms` em outros
- `0.3s` (CSS) vs `250` (Tailwind) — unidades diferentes
- Nenhum padrão documentado

**Impacto:** O app sente "aleatório" — um botão leva 250ms, outro 300ms. Designers chamam isso de "falta de ritmo".

---

## A Solução

Criar uma **escala de durações** documentada e reutilizável:

| Nome | Valor | Uso |
|------|-------|-----|
| `fast` | 150ms | Micro-interações (hover, focus) |
| `normal` | 250ms | Transições padrão (botões, cards) |
| `slow` | 350ms | Entrada de modais, reveals |
| `slower` | 500ms | Transições de página, storytelling |

---

## Implementação

### 1. Criar `lib/animation-tokens.ts`

```ts
// lib/animation-tokens.ts
export const ANIMATION_DURATIONS = {
  fast: 150,    // ms
  normal: 250,  // ms
  slow: 350,    // ms
  slower: 500,  // ms
} as const;

export const ANIMATION_EASING = {
  spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
  out: 'cubic-bezier(0.23, 1, 0.320, 1)',
  in: 'cubic-bezier(0.550, 0.055, 0.675, 0.190)',
} as const;

// Para Tailwind: exportar como string também
export const durations = {
  fast: '150ms',
  normal: '250ms',
  slow: '350ms',
  slower: '500ms',
};
```

### 2. Atualizar `tailwind.config.ts`

```ts
// tailwind.config.ts
import { durations, ANIMATION_EASING } from './lib/animation-tokens';

export default {
  theme: {
    extend: {
      transitionDuration: durations,
      transitionTimingFunction: {
        spring: ANIMATION_EASING.spring,
        'ease-out': ANIMATION_EASING.out,
        'ease-in': ANIMATION_EASING.in,
      },
    },
  },
};
```

### 3. Substituir valores nos componentes

**Antes (espalhado):**
```tsx
// Dashboard.tsx
className="transition-all duration-250"

// OrdersModule.tsx
className="transition-all duration-300"

// CustomersModule.tsx
style={{ transition: 'all 0.3s ease-in-out' }}
```

**Depois (unificado):**
```tsx
import { ANIMATION_DURATIONS, ANIMATION_EASING } from '@/lib/animation-tokens';

// Dashboard.tsx
className="transition-all duration-normal"

// OrdersModule.tsx
className="transition-all duration-normal"

// CustomersModule.tsx
style={{ 
  transition: `all ${ANIMATION_DURATIONS.normal}ms ${ANIMATION_EASING.spring}`
}}
```

---

## Arquivos a Alterar

| Arquivo | Mudanças | Prioridade |
|---------|----------|-----------|
| `lib/animation-tokens.ts` | CRIAR (novo) | 1 |
| `tailwind.config.ts` | Adicionar theme extends | 2 |
| `Dashboard.tsx` | 3-5 transições | 3 |
| `OrdersModule.tsx` | 2-3 transições | 3 |
| `CustomersModule.tsx` | 2-3 transições | 3 |
| `EstoqueModule.tsx` | 2-3 transições | 3 |
| `FichasTecnicasModule.tsx` | 2-3 transições | 3 |
| `BalancesAndExpensesModule.tsx` | 1-2 transições | 3 |

---

## Valores Específicos (Copiar/Colar)

**Para Motion components:**
```tsx
import { ANIMATION_DURATIONS } from '@/lib/animation-tokens';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{
    duration: ANIMATION_DURATIONS.normal / 1000, // Motion usa segundos
  }}
/>
```

**Para inline styles:**
```tsx
style={{
  transition: `all ${ANIMATION_DURATIONS.normal}ms ${ANIMATION_EASING.spring}`,
}}
```

**Para Tailwind classes:**
```tsx
className="transition-all duration-normal ease-spring"
```

---

## Feel-Check

1. Navegar entre todas as 6 abas
2. Verificar se todas as transições se sentem no mesmo "ritmo"
3. Se alguma parecer rápida/lenta demais → ajustar o valor em `animation-tokens.ts` (ONE place, afeta tudo)

---

## Scope

- ✅ Criar arquivo de tokens
- ✅ Substituir valores hardcoded por tokens
- ❌ NÃO mudar Tailwind v4 config fora de transitionDuration/transitionTimingFunction
- ❌ NÃO renomear classNames (apenas adicionar novos)

---

## Benefícios

- 🎯 Uma fonte de verdade para durações
- 🔄 Fácil mudar "todas as animações" em um único lugar
- 📚 Documentado para futuros designers/devs
- 🎨 Sensação mais coesiva no app

---

## Próximos Passos

Após aplicado:
- Rodar `review-animations` para validar tokens
- Prosseguir para **Plano 003** (easing consolidation)
