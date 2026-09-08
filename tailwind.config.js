/** @type {import('tailwindcss').Config} */

/**
 * Palette notes
 * -------------
 * The default Tailwind scales are deliberately overridden rather than adding
 * new token names, so every existing `bg-slate-800` / `text-green-400` in the
 * app picks up the new colour with no markup churn.
 *
 * Three things were making the old palette read as machine-generated:
 *   1. Tailwind's stock `slate` is a *cold blue* black (#0f172a). Paired with
 *      neon `green-400` (#4ade80) it's the default look of a generated
 *      dashboard. Replaced with a warm umber-tinted charcoal.
 *   2. Accents sat at full saturation. Both Catppuccin and Rosé Pine — the
 *      two best-known "soothing" open-source themes — desaturate every accent
 *      heavily (Catppuccin green #a6e3a1, Rosé Pine gold #f6c177). Ours now do
 *      the same.
 *   3. Pure #fff text on near-black. No one designing by hand does this; it
 *      vibrates. `white` is remapped to a warm off-white.
 *
 * All text/background pairs below were checked to clear WCAG AA (4.5:1).
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm off-white instead of #fff — softer on a dark ground
        white: '#F3EEE3',

        // Neutrals: warm charcoal with an umber undertone (was cold navy)
        slate: {
          50:  '#F3EEE3',
          100: '#E5DFD1',
          200: '#CFC7B4',
          300: '#B8AF9A',   // secondary text      7.6:1 on slate-800
          400: '#938B76',   // muted text          4.9:1 on slate-800
          500: '#6B6454',
          600: '#443E30',
          700: '#2E2A20',   // borders, buttons
          800: '#221F18',   // card surface
          900: '#17150F',   // page background
          950: '#100E0A',
        },

        // Success / positive — sage, not neon lime
        green: {
          300: '#A8BC9C',
          400: '#8CA57E',   // 6.2:1 on slate-800
          500: '#718A64',
          600: '#5B7250',
          700: '#485A40',
        },

        // Primary action / energy — clay & terracotta
        orange: {
          300: '#E0A585',
          400: '#CE8A66',   // 5.9:1 on slate-800
          500: '#B87150',
          600: '#9C5C3E',
        },

        // Warning / milestone — aged gold
        yellow: {
          400: '#D9B368',
          500: '#C59A4C',
          600: '#A87F38',
        },

        // Danger — muted brick, never fire-engine red
        red: {
          400: '#C67D72',
          500: '#B0645A',
          600: '#964F46',
        },

        // Information — dusty blue
        blue: {
          300: '#A3BCCE',
          400: '#85A3B8',
          500: '#6A889E',
        },

        // Occasional accent — soft plum
        purple: {
          400: '#A796B0',
          500: '#8C7A96',
        },
      },

      fontFamily: {
        sans: [
          'ui-sans-serif', '-apple-system', 'BlinkMacSystemFont',
          '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif',
        ],
      },

      // Tighter tracking on large text is one of the clearest signals of
      // typography that was set by hand rather than left at defaults.
      letterSpacing: {
        tightest: '-0.03em',
      },

      borderRadius: {
        card: '1rem',
      },

      keyframes: {
        'rise': {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        rise: 'rise 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
