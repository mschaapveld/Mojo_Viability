/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        heading: ['Syne', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
        'display-alt': ['Syne', 'Helvetica Neue', 'Helvetica', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'JetBrains Mono', 'SF Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        'page-title': ['1.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'section-title': ['1.125rem', { lineHeight: '1.3', fontWeight: '600' }],
        'body': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'label': ['0.8125rem', { lineHeight: '1.4', fontWeight: '500' }],
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
        'overline': ['0.6875rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '0.08em' }],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        pill: '9999px',
        tight: '6px',
        chip: '8px',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          foreground: 'hsl(var(--brand-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          border: 'hsl(var(--sidebar-border))',
        },
        surface: {
          0: 'hsl(var(--surface-0))',
          1: 'hsl(var(--surface-1))',
          2: 'hsl(var(--surface-2))',
          3: 'hsl(var(--surface-3))',
        },
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        viability: {
          ink: 'var(--vbr-ink)',
          'ink-2': 'var(--vbr-ink-2)',
          'ink-3': 'var(--vbr-ink-3)',
          cream: 'var(--vbr-cream)',
          'fg-muted': 'var(--vbr-fg-muted)',
          'fg-subtle': 'var(--vbr-fg-subtle)',
          'fg-faint': 'var(--vbr-fg-faint)',
          green: 'var(--vbr-green)',
          'green-hover': 'var(--vbr-green-hover)',
          'green-soft': 'var(--vbr-green-soft)',
          'green-softer': 'var(--vbr-green-softer)',
          'green-line': 'var(--vbr-green-line)',
          'green-on': 'var(--vbr-green-on)',
          amber: 'var(--vbr-amber)',
          'amber-soft': 'var(--vbr-amber-soft)',
          'amber-line': 'var(--vbr-amber-line)',
          red: 'var(--vbr-red)',
          'red-soft': 'var(--vbr-red-soft)',
          'red-line': 'var(--vbr-red-line)',
          border: 'var(--vbr-border)',
          'border-strong': 'var(--vbr-border-strong)',
        },
        m360: {
          orange: 'var(--m360-orange)',
          'orange-hover': 'var(--m360-orange-hover)',
          'orange-soft': 'var(--m360-orange-soft)',
          'orange-line': 'var(--m360-orange-line)',
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'spin': {
          to: { transform: 'rotate(360deg)' },
        },
        'viability-ticker': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-33.333%)' },
        },
        'viability-fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.3s ease-out',
        'spin': 'spin 0.8s linear infinite',
        'viability-ticker': 'viability-ticker 38s linear infinite',
        'viability-ticker-mobile': 'viability-ticker 28s linear infinite',
        'viability-fade-up': 'viability-fade-up 640ms ease-out both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
