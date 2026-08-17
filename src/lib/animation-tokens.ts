/**
 * Animation Tokens
 * Centralized animation values for consistency across the Carula app
 * Used in: Tailwind config, Motion components, inline styles
 */

export const ANIMATION_DURATIONS = {
  fast: 150,    // ms — Micro-interações (hover, focus)
  normal: 250,  // ms — Transições padrão (botões, cards)
  slow: 350,    // ms — Entrada de modais, reveals
  slower: 500,  // ms — Transições de página, storytelling
} as const;

export const ANIMATION_EASING = {
  spring: 'cubic-bezier(0.16, 1, 0.3, 1)',      // Springy feel (botões, CTAs)
  out: 'cubic-bezier(0.23, 1, 0.320, 1)',       // Ease-out padrão (modais, cards)
  in: 'cubic-bezier(0.550, 0.055, 0.675, 0.190)', // Ease-in (saídas, collapses)
} as const;

// Para Motion library (array format)
export const EASING_ARRAYS = {
  spring: [0.16, 1, 0.3, 1],
  out: [0.23, 1, 0.320, 1],
  in: [0.550, 0.055, 0.675, 0.190],
} as const;

// Para Tailwind config
export const durations = {
  fast: '150ms',
  normal: '250ms',
  slow: '350ms',
  slower: '500ms',
} as const;

export const easingFunctions = {
  spring: ANIMATION_EASING.spring,
  'ease-out': ANIMATION_EASING.out,
  'ease-in': ANIMATION_EASING.in,
} as const;
