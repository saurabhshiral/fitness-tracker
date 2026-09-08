// ─── CROSS-DEVICE PASSWORD ────────────────────────────────────────────────
// Set PASSWORD_HASH so the same password works on desktop, mobile, any device.
//
// How to generate your hash (one-time setup):
//   1. Open any webpage in your browser
//   2. Open DevTools console (F12)
//   3. Paste this, replace 'yourpassword' with whatever you want, press Enter:
//
//      const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourpassword'))
//      console.log(Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join(''))
//
//   4. Copy the 64-char hex string it prints
//   5. Paste it below between the quotes
//   6. Run: git add src/config.js && git commit -m "set password" && git push
//
// Leave empty ('') to use the per-device localStorage mode instead.
// ──────────────────────────────────────────────────────────────────────────
export const PASSWORD_HASH = ''
