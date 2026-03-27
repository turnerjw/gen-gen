import type {Config} from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Instrument Serif'", "'Instrument Serif'", "serif"],
        mono: ["'JetBrains Mono'", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        "border-light": "hsl(var(--border-light))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        syntax: {
          surface: "hsl(var(--syntax-surface))",
          border: "hsl(var(--syntax-border))",
          muted: "hsl(var(--syntax-muted))",
          comment: "hsl(var(--syntax-comment))",
          keyword: "hsl(var(--syntax-keyword))",
          property: "hsl(var(--syntax-property))",
          punctuation: "hsl(var(--syntax-punctuation))",
          value: "hsl(var(--syntax-value))",
          identifier: "hsl(var(--syntax-identifier))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "var(--radius)",
        sm: "var(--radius)",
      },
      borderWidth: {
        brand: '3px',
      },
      letterSpacing: {
        display: '0.2em',
        label: '0.15em',
        nav: '0.1em',
        button: '0.12em',
        ticker: '0.18em',
      },
    },
  },
};

export default config;
