import { useState } from 'react'
import { Link } from 'react-router-dom'
import { today } from '../hooks/useStorage'
import { calorieAdvice, overloadAdvice } from '../lib/coach'
import Icon from './Icon'

const STATUS_STYLE = {
  'need-data':    { border: 'border-slate-700',     accent: 'text-slate-300',  icon: 'trending' },
  'need-logging': { border: 'border-blue-400/30',   accent: 'text-blue-400',   icon: 'notebook' },
  'adherence':    { border: 'border-orange-400/30', accent: 'text-orange-400', icon: 'flame' },
  'hold':         { border: 'border-green-500/30',  accent: 'text-green-400',  icon: 'check' },
  'decrease':     { border: 'border-orange-400/30', accent: 'text-orange-400', icon: 'flame' },
  'increase':     { border: 'border-blue-400/30',   accent: 'text-blue-400',   icon: 'leaf' },
  'floor':        { border: 'border-red-400/30',    accent: 'text-red-400',    icon: 'scale' },
}

export default function WeeklyCheckIn({ bodyStats, dailyLogs, workoutLogs, settings, setSettings, latestStat }) {
  const [dismissed, setDismissed] = useState(false)

  const advice = calorieAdvice({ bodyStats, dailyLogs, settings, latestStat })
  const lifts = overloadAdvice(workoutLogs)
  const style = STATUS_STYLE[advice.status] || STATUS_STYLE['need-data']

  if (dismissed) return null

  function applyAdjustment() {
    setSettings(s => ({
      ...s,
      calorieAdjustment: (s.calorieAdjustment || 0) + advice.delta,
      lastCheckIn: today(),
      checkInHistory: [
        ...(s.checkInHistory || []),
        { date: today(), delta: advice.delta, reason: advice.headline },
      ],
    }))
    setDismissed(true)
  }

  const canApply = advice.delta !== 0

  return (
    <div className={`card mb-4 ${style.border}`}>
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <p className="eyebrow">Weekly check-in</p>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-600 hover:text-slate-300 -mt-0.5 -mr-0.5 p-1 transition-colors"
          aria-label="Dismiss"
        >
          <Icon name="close" size={14} strokeWidth={2} />
        </button>
      </div>

      <p className={`font-semibold flex items-center gap-2 ${style.accent} mb-1.5`}>
        <Icon name={style.icon} size={17} strokeWidth={2} className="flex-shrink-0" />
        {advice.headline}
      </p>
      <p className="text-slate-400 text-sm leading-relaxed mb-3">{advice.detail}</p>

      {/* Trend readout */}
      {advice.trend?.rate !== null && (
        <div className="grid grid-cols-3 gap-2 text-center bg-slate-700/30 rounded-xl py-2.5 mb-3">
          <div>
            <p className="text-slate-500 text-xs">Actual</p>
            <p className="text-white font-bold text-sm">
              {advice.trend.rate > 0 ? '+' : ''}{advice.trend.rate.toFixed(2)}
              <span className="text-xs font-normal text-slate-400"> kg/wk</span>
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Goal</p>
            <p className="text-white font-bold text-sm">
              {advice.goalRate > 0 ? '+' : ''}{advice.goalRate}
              <span className="text-xs font-normal text-slate-400"> kg/wk</span>
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Avg intake</p>
            <p className="text-white font-bold text-sm">
              {advice.adherence.avgCalories || '—'}
            </p>
          </div>
        </div>
      )}

      {advice.status === 'need-data' && (
        <Link to="/progress" className="flex items-center justify-center gap-1.5 w-full bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-medium py-2.5 rounded-xl transition-colors mb-3">
          Log today&rsquo;s weight
          <Icon name="arrow" size={14} strokeWidth={2} />
        </Link>
      )}

      {canApply && (
        <div className="flex gap-2 mb-3">
          <button onClick={() => setDismissed(true)} className="btn-secondary flex-1 py-2.5 text-sm">
            Not now
          </button>
          <button onClick={applyAdjustment} className="btn-primary flex-1 py-2.5 text-sm">
            Apply {advice.delta > 0 ? '+' : ''}{advice.delta} kcal
          </button>
        </div>
      )}

      {/* Progressive overload suggestions */}
      {lifts.length > 0 && (
        <div className="border-t border-slate-700/70 pt-3">
          <p className="eyebrow mb-2.5">Training</p>
          <div className="space-y-2.5">
            {lifts.map((l, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className={`flex-shrink-0 mt-0.5 ${
                  l.type === 'increase' ? 'text-green-400'
                    : l.type === 'regression' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  <Icon
                    name={l.type === 'increase' ? 'trending' : l.type === 'regression' ? 'scale' : 'timer'}
                    size={15}
                    strokeWidth={2}
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-slate-100 text-sm font-medium truncate">{l.exercise}</p>
                  <p className="text-slate-400 text-xs leading-relaxed">{l.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
