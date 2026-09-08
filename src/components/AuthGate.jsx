import { useState, useEffect } from 'react'
import { supabase, pullFromSupabase } from '../lib/supabase'

function Splash({ message }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="text-5xl mb-4">💪</div>
        <p className="text-slate-400 text-sm">{message}</p>
      </div>
    </div>
  )
}

export default function AuthGate({ children }) {
  // phase: 'checking' | 'email' | 'otp' | 'syncing' | 'ready'
  const [phase, setPhase] = useState('checking')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    let settled = false

    // Gyms have terrible signal. If Supabase can't be reached, don't hang on a
    // "Loading..." splash forever — fall through to the app using local data.
    const timeout = setTimeout(() => {
      if (settled) return
      settled = true
      // supabase-js caches the session in localStorage; if one is there we're
      // a returning signed-in user and can work offline off localStorage.
      const hasCachedSession = Object.keys(localStorage)
        .some(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
      setOffline(true)
      setPhase(hasCachedSession ? 'ready' : 'email')
    }, 6000)

    // Restore existing session on page load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      if (session?.user) {
        setPhase('syncing')
        await pullFromSupabase(session.user.id)
        setPhase('ready')
      } else {
        setPhase('email')
      }
    }).catch(() => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      setOffline(true)
      setPhase('email')
    })

    // Handle magic-link auto-login, token refresh, and sign-out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Covers magic link redirect landing: Supabase processes the hash
          // token before React mounts, fires SIGNED_IN — we catch it here
          setPhase('syncing')
          await pullFromSupabase(session.user.id)
          // Clean the access_token fragment from the URL so it doesn't linger
          if (window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', window.location.pathname)
          }
          setPhase('ready')
        } else if (event === 'SIGNED_OUT') {
          ['fitness_body_stats','fitness_workout_logs','fitness_daily_logs']
            .forEach(k => localStorage.removeItem(k))
          setPhase('email')
        }
      }
    )
    return () => { clearTimeout(timeout); subscription.unsubscribe() }
  }, [])

  async function sendOTP(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // Fallback redirect if Supabase sends a magic link instead of OTP
        emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
      },
    })
    if (error) setError(error.message)
    else setPhase('otp')
    setLoading(false)
  }

  async function verifyOTP(e) {
    e.preventDefault()
    if (token.length !== 6) return
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setPhase('syncing')
    await pullFromSupabase(data.user.id)
    setPhase('ready')
    setLoading(false)
  }

  if (phase === 'checking') return <Splash message="Loading..." />
  if (phase === 'syncing')  return <Splash message="Syncing your data across devices..." />
  if (phase === 'ready') {
    return (
      <>
        {offline && (
          <div className="bg-orange-500/15 border-b border-orange-500/30 text-orange-300 text-xs text-center py-1.5">
            Offline — logging locally, will sync when you reconnect
          </div>
        )}
        {children}
      </>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💪</div>
          <h1 className="text-2xl font-bold text-white">Fitness Tracker</h1>
          <p className="text-slate-400 text-sm mt-1">Saurabh's personal training dashboard</p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700/50">
          {phase === 'email' ? (
            <form onSubmit={sendOTP} className="space-y-4">
              <p className="text-white font-semibold text-center text-lg">Sign In</p>
              <p className="text-slate-400 text-sm text-center">
                Enter your email — we'll send a 6-digit code
              </p>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                className="input-field"
                autoFocus
              />
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending...' : 'Send Code →'}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOTP} className="space-y-4">
              <p className="text-white font-semibold text-center text-lg">Check Your Email</p>
              <p className="text-slate-400 text-sm text-center">
                Code sent to <span className="text-white">{email}</span>
              </p>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={token}
                onChange={e => { setToken(e.target.value.replace(/\D/g, '')); setError('') }}
                className="input-field text-center text-3xl tracking-[0.5em] font-mono"
                autoFocus
              />
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button type="submit" disabled={loading || token.length !== 6} className="btn-primary w-full">
                {loading ? 'Verifying...' : 'Verify & Enter'}
              </button>
              <button
                type="button"
                onClick={() => { setPhase('email'); setToken(''); setError('') }}
                className="w-full text-slate-500 text-sm py-1 hover:text-slate-300"
              >
                ← Use different email
              </button>
            </form>
          )}
        </div>

        <p className="text-slate-600 text-xs text-center mt-4">
          Syncs across all devices · Powered by Supabase
        </p>
      </div>
    </div>
  )
}
