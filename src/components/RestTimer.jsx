import { useState, useEffect, useRef } from 'react'

/** Short beep via WebAudio. iOS ignores navigator.vibrate, so sound is the only
 *  cue that works when the phone is in your pocket. The AudioContext is created
 *  inside a user-gesture-driven render, which is what unlocks audio on iOS. */
function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const play = (freq, start, dur) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur)
    }
    play(880, 0, 0.15)
    play(1180, 0.18, 0.25)
    setTimeout(() => ctx.close(), 1000)
  } catch { /* audio blocked — vibration/visual still fire */ }
}

export default function RestTimer({ seconds, exerciseName, onDone }) {
  // Absolute end time, not a countdown counter. Mobile browsers throttle or
  // suspend setInterval when the tab is backgrounded or the screen locks, so a
  // decrementing counter drifts badly. Deriving from Date.now() stays correct.
  const endAtRef = useRef(Date.now() + seconds * 1000)
  const [remaining, setRemaining] = useState(seconds)
  const [done, setDone] = useState(false)
  const firedRef = useRef(false)

  useEffect(() => {
    function tick() {
      const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0 && !firedRef.current) {
        firedRef.current = true
        setDone(true)
        beep()
        if (navigator.vibrate) navigator.vibrate([200, 100, 200])
      }
    }
    const id = setInterval(tick, 250)
    // Recompute immediately when returning from a locked screen / app switch
    document.addEventListener('visibilitychange', tick)
    tick()
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  function addTime(extra) {
    endAtRef.current += extra * 1000
    firedRef.current = false
    setDone(false)
  }

  const progress = (seconds - remaining) / seconds
  const circumference = 2 * Math.PI * 54
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const label = mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : String(secs)

  return (
    <div
      className="fixed inset-0 scrim flex items-center justify-center z-50 p-4"
      onClick={onDone}
    >
      <div
        className="bg-slate-800 rounded-2xl p-8 text-center w-full max-w-xs border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Rest after</p>
        <p className="text-slate-50 font-semibold text-sm mb-6 truncate">{exerciseName}</p>

        <div className="relative w-36 h-36 mx-auto mb-6">
          <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" strokeWidth="6" className="stroke-slate-700" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              strokeWidth="6"
              className={done ? 'stroke-green-400' : 'stroke-orange-400'}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.3s linear, stroke 0.3s' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {done ? (
              <span className="text-3xl font-bold text-green-400">GO!</span>
            ) : (
              <span className="text-5xl font-bold text-slate-50 tabular-nums">{label}</span>
            )}
          </div>
        </div>

        {done ? (
          <button onClick={onDone} className="btn-primary w-full">
            Next set
          </button>
        ) : (
          <>
            <div className="flex gap-2 mb-3">
              <button onClick={() => addTime(-15)} className="btn-secondary flex-1 text-sm py-2">−15s</button>
              <button onClick={() => addTime(30)} className="btn-secondary flex-1 text-sm py-2">+30s</button>
            </div>
            <button onClick={onDone} className="w-full text-slate-400 text-sm py-2 hover:text-slate-50">
              Skip rest
            </button>
          </>
        )}
      </div>
    </div>
  )
}
