/** @type {import('tailwindcss').Config} */

/**
 * Palette notes
 * -------------
 * The default Tailwind scales are overridden rather than adding new token
 * names, so every existing `bg-slate-800` / `text-green-400` picks up the
 * themed colour with no markup churn.
 *
 * Values are CSS variables (see index.css) in `R G B` form, wrapped so
 * Tailwind can inject alpha — `bg-slate-800/50` still works. Toggling
 * `.light` on <html> repoints the whole ramp.
 *
 * Three things were making the original palette read as machine-generated:
 *   1. Stock `slate` is a cold blue-black (#0f172a); paired with neon
 *      `green-400` (#4ade80) it's the default look of a generated dashboard.
 *   2. Accents sat at full saturation. Catppuccin and Rosé Pine — the two
 *      best-known "soothing" themes — desaturate every accent heavily.
 *   3. Pure #fff text on near-black. It vibrates; no one does this by hand.
 *
 * All text/background pairs clear WCAG AA (4.5:1) in both themes.
 */
const v = name => `rgb(var(--c-${name}) / <alpha-value>)`

const ramp = (prefix, shades) =>
  Object.fromEntries(shades.map(s => [s, v(`${prefix}-${s}`)]))

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate:  ramp('slate',  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        green:  ramp('green',  [300, 400, 500, 600, 700]),
        orange: ramp('orange', [300, 400, 500, 600]),
        yellow: ramp('yellow', [400, 500, 600]),
        red:    ramp('red',    [400, 500, 600]),
        blue:   ramp('blue',   [300, 400, 500]),
        purple: ramp('purple', [400, 500]),

        /* Text that sits on a saturated fill. Stays light in BOTH themes —
           unlike `white`, which inverts with the neutral ramp. */
        oncolor: '#FBF8F2',
      },

      fontFamily: {
        sans: [
          'ui-sans-serif', '-apple-system', 'BlinkMacSystemFont',
          '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif',
        ],
      },

      // Tighter tracking on large text is one of the clearest signals that
      // type was actually set rather than left at defaults.
      letterSpacing: { tightest: '-0.03em' },

      borderRadius: { card: '1rem' },

      keyframes: {
        rise: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: { rise: 'rise 0.35s cubic-bezier(0.22, 1, 0.36, 1)' },
    },
  },
  plugins: [],
}
