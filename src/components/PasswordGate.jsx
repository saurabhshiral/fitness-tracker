import { useState, useEffect } from 'react'
import { PASSWORD_HASH } from '../config'

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// If PASSWORD_HASH is set in config.js, use it (works on all devices).
// Otherwise fall back to per-device localStorage mode.
const GLOBAL_HASH = PASSWORD_HASH?.trim() || null

export default function PasswordGate({ children }) {
  const [authed, setAuthed] = useState(false)
  const [hasPassword, setHasPassword] = useState(null)
  const [input, setInput] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // In global-hash mode: always show login (no "create" step)
    if (GLOBAL_HASH) {
      setHasPassword(true)
    } else {
      setHasPassword(!!localStorage.getItem('fitness_auth_hash'))
    }
    if (sessionStorage.getItem('fitness_authed') === 'true') setAuthed(true)
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    if (!input) return
    setLoading(true)
    const hash = await sha256(input)
    const stored = GLOBAL_HASH || localStorage.getItem('fitness_auth_hash')
    if (hash === stored) {
      sessionStorage.setItem('fitness_authed', 'true')
      setAuthed(true)
    } else {
      setError('Wrong password. Try again.')
      setInput('')
    }
    setLoading(false)
  }

  async function handleSetPassword(e) {
    e.preventDefault()
    if (newPass.length < 6) { setError('Minimum 6 characters'); return }
    if (newPass !== confirmPass) { setError("Passwords don't match"); return }
    setLoading(true)
    const hash = await sha256(newPass)
    localStorage.setItem('fitness_auth_hash', hash)
    sessionStorage.setItem('fitness_authed', 'true')
    setAuthed(true)
    setLoading(false)
  }

  if (hasPassword === null) return null
  if (authed) return children

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💪</div>
          <h1 className="text-2xl font-bold text-white">Fitness Tracker</h1>
          <p className="text-slate-400 text-sm mt-1">Saurabh's personal training dashboard</p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700/50">
          {!hasPassword ? (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <p className="text-white font-semibold text-center text-lg">Create Your Password</p>
              <p className="text-slate-400 text-sm text-center">This device only — or set a global hash in config.js</p>
              <input
                type="password"
                placeholder="New password (min 6 characters)"
                value={newPass}
                onChange={e => { setNewPass(e.target.value); setError('') }}
                className="input-field"
                autoFocus
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPass}
                onChange={e => { setConfirmPass(e.target.value); setError('') }}
                className="input-field"
              />
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Setting up...' : 'Create Password & Enter'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <p className="text-white font-semibold text-center text-lg">Welcome Back</p>
              <input
                type="password"
                placeholder="Enter your password"
                value={input}
                onChange={e => { setInput(e.target.value); setError('') }}
                className="input-field"
                autoFocus
              />
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Checking...' : 'Enter'}
              </button>
            </form>
          )}
        </div>

        <p className="text-slate-600 text-xs text-center mt-4">
          {GLOBAL_HASH ? 'Global password · Works on all devices' : 'Password stored locally on this device'}
        </p>
      </div>
    </div>
  )
}
