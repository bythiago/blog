import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: '#6366f1',
        'accent-strong': '#4338ca',
        'accent-soft': '#eef2ff',
        paper: '#fafafa',
        ink: '#18181b',
        surface: '#ffffff',
        muted: '#52525b',
        line: '#e4e4e7',
        night: '#0b0b0f',
        'night-surface': '#18181b',
        'night-ink': '#f4f4f5',
        'night-muted': '#a1a1aa',
        'night-line': '#3f3f46',
      },
      borderRadius: {
        DEFAULT: '12px',
        lg: '12px',
        xl: '16px',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      maxWidth: {
        reading: '68ch',
      },
    },
  },
  plugins: [],
} satisfies Config;
