import type { Config } from 'tailwindcss';
import { durations, easingFunctions } from './src/lib/animation-tokens';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Primary typeface: Manrope (replaces Fredoka + PJS)
        sans: ['Manrope', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        // Typographic Scale (Manrope-based hierarchy)
        xs: ['11px', { lineHeight: '1.3', letterSpacing: '0.5px', fontWeight: '500' }],
        sm: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        base: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        lg: ['16px', { lineHeight: '1.5', fontWeight: '500' }],
        xl: ['18px', { lineHeight: '1.3', fontWeight: '600' }],
        '2xl': ['24px', { lineHeight: '1.25', fontWeight: '600' }],
        '3xl': ['32px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.5px' }],
      },
      fontWeight: {
        // Manrope weight scale
        300: '300',
        400: '400',
        500: '500',
        600: '600',
        700: '700',
      },
      spacing: {
        // 8px-based rhythm system (used intentionally, not mechanically)
        xs: '4px',
        sm: '8px',
        compact: '12px',
        md: '16px',
        lg: '20px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '40px',
      },
      colors: {
        // Pastel Harmonic - Diversified Premium Palette
        primary: {
          DEFAULT: '#3E3430',
          dark: '#2A2520',
          light: '#8B8276',
          lighter: '#B4A99D',
        },
        neutral: {
          hero: '#FAFAF7',
          white: '#FFFFFF',
          light: '#F5F3F0',
          medium: '#E6E1DB',
          'warm-gray': '#8B8276',
          'dark-gray': '#5C5550',
          charcoal: '#0D0B08',
        },
        // Section-specific colors (Pastel Harmonic)
        vendas: {
          DEFAULT: '#E8B4B8',
          light: '#F5E5E7',
          dark: '#C85A54',
        },
        labor: {
          DEFAULT: '#D4C5E2',
          light: '#EDE5F5',
          dark: '#8E7DB3',
        },
        reposicao: {
          DEFAULT: '#C8E6D7',
          light: '#E5F4F0',
          dark: '#5A8A6F',
        },
        destaque: {
          DEFAULT: '#F5D4A8',
          light: '#FBE8D6',
          dark: '#C99B6F',
        },
        dados: {
          DEFAULT: '#B8D4E8',
          light: '#DDE9F5',
          dark: '#5A7A9E',
        },
        accent: {
          gold: '#C9A878',
          'gold-dark': '#B8945C',
          'gold-light': '#F5EFED',
        },
        semantic: {
          success: '#6B8070',
          warning: '#D4AF7E',
          error: '#C85A54',
          info: '#7A8A94',
        },
      },
      boxShadow: {
        // Shadow hierarchy
        '2xs': '0 1px 2px rgba(0, 0, 0, 0.05)',
        xs: '0 1px 3px rgba(0, 0, 0, 0.08)',
        sm: '0 2px 4px rgba(0, 0, 0, 0.08)',
        md: '0 4px 8px rgba(0, 0, 0, 0.1)',
        lg: '0 8px 16px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        xs: '6px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
      },
      transitionDuration: durations,
      transitionTimingFunction: easingFunctions,
    },
  },
  plugins: [],
};

export default config;
