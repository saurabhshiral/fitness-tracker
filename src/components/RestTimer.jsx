import { useState, useEffect, useRef } from 'react'

export default function RestTimer({ seconds, exerciseName, onDone }) {
  const [remaining, setRemaining] = useState(seconds)
  const [done, setDone] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(intervalRef.current)
          if (navigator.vibrate) navigator.vibrate([200, 100, 200])
          setDone(true)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const progress = (seconds - remaining) / seconds
  const circumference = 2 * Math.PI * 54

  function handleSkip() {
    clearInterval(intervalRef.current)
    onDone?.()
  }

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4"
      onClick={handleSkip}
    >
      <div
        className="bg-slate-800 rounded-2xl p-8 text-center w-full max-w-xs border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Rest after</p>
        <p className="text-white font-semibold text-sm mb-6 truncate">{exerciseName}</p>

        <div className="relative w-36 h-36 mx-auto mb-6">
          <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#1e293b" strokeWidth="6" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={done ? '#22c55e' : '#f97316'}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {done ? (
              <span className="text-3xl font-bold text-green-400">GO!</span>
            ) : (
              <span className="text-5xl font-bold text-white">{remaining}</span>
            )}
          </div>
        </div>

        {done ? (
          <button onClick={onDone} className="btn-primary w-full">
            Next Set ✓
          </button>
        ) : (
          <>
            <p className="text-slate-500 text-xs mb-3">Tap outside to skip</p>
            <button onClick={handleSkip} className="btn-secondary w-full text-sm">
              Skip Rest
            </button>
          </>
        )}
      </div>
    </div>
  )
}
