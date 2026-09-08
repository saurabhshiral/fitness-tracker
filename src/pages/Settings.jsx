import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStorage } from '../hooks/useStorage'
import { useSettings, DEFAULT_SETTINGS } from '../hooks/useSettings'
import { STARTING_STATS } from '../data/fitnessPlan'
import {
  ACTIVITY_LEVELS, GOALS, bmr, tdee, baseCalories, targetsFor, dayOffsets, leanMass,
} from '../lib/coach'
import { supabase, signOut } from '../lib/supabase'

function Section({ title, sub, children }) {
  return (
    <div className="card mb-4">
      <p className="text-white font-semibold">{title}</p>
      {sub && <p className="text-slate-400 text-xs mt-0.5 mb-3">{sub}</p>}
      <div className={sub ? '' : 'mt-3'}>{children}</div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div className="mb-3 last:mb-0">
      <label className="text-slate-400 text-xs block mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-slate-600 text-xs mt-1">{hint}</p>}
    </div>
  )
}

export default function Settings() {
  const [settings, setSettings] = useSettings()
  const [bodyStats] = useStorage('fitness_body_stats', [STARTING_STATS])
  const [confirmReset, setConfirmReset] = useState(false)

  const latestStat = bodyStats[bodyStats.length - 1] || STARTING_STATS
  const set = (k, v) => setSettings(s => ({ ...DEFAULT_SETTINGS, ...s, [k]: v }))

  const restingRate = bmr(latestStat)
  const total = tdee(latestStat, settings.activity)
  const base = baseCalories(settings, latestStat)
  const offsets = dayOffsets()
  const lbm = latestStat.bodyFat > 0 ? leanMass(latestStat.weight, latestStat.bodyFat) : null

  const dayTargets = ['workout', 'cardio', 'rest'].map(t => ({
    type: t, ...targetsFor(settings, latestStat, t),
  }))

  function resetAll() {
    ;['fitness_body_stats', 'fitness_workout_logs', 'fitness_daily_logs',
      'fitness_custom_foods', 'fitness_settings', 'fitness_workout_draft',
      'fitness_program_start'].forEach(k => {
      try { localStorage.removeItem(k) } catch {}
    })
    window.location.reload()
  }

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <Link to="/" className="text-slate-400 text-sm">← Back</Link>
      </div>

      {/* Live calculation summary */}
      <div className="card mb-4 border-green-500/30 bg-green-500/5">
        <p className="text-green-400 text-xs font-semibold tracking-wider mb-3">YOUR NUMBERS</p>
        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <div>
            <p className="text-slate-400 text-xs">Lean mass</p>
            <p className="text-white font-bold">
              {lbm ? lbm.toFixed(1) : '—'}<span className="text-xs font-normal text-slate-400">kg</span>
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">BMR</p>
            <p className="text-white font-bold">{restingRate || '—'}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">TDEE</p>
            <p className="text-white font-bold">{total || '—'}</p>
          </div>
        </div>
        {!latestStat.bodyFat && (
          <p className="text-orange-400 text-xs mb-2">
            Log a body fat % in Progress for a more accurate BMR.
          </p>
        )}
        <p className="text-slate-400 text-xs">
          Weekly average target: <span className="text-white font-semibold">{base || '—'} kcal/day</span>
          {settings.calorieAdjustment !== 0 && (
            <span className={settings.calorieAdjustment > 0 ? 'text-green-400' : 'text-orange-400'}>
              {' '}(includes {settings.calorieAdjustment > 0 ? '+' : ''}{settings.calorieAdjustment} from check-ins)
            </span>
          )}
        </p>
      </div>

      {/* Per-day breakdown */}
      <Section title="Daily targets" sub="Calories cycle by day type but average out to your weekly target. Macros are derived from calories, so they always add up.">
        <div className="space-y-2">
          {dayTargets.map(d => (
            <div key={d.type} className="flex items-center justify-between bg-slate-700/40 rounded-xl px-3 py-2.5">
              <div>
                <p className="text-white text-sm font-medium capitalize">{d.type} day</p>
                <p className="text-slate-400 text-xs">
                  P {d.protein}g · C {d.carbs}g · F {d.fat}g
                </p>
              </div>
              <div className="text-right">
                <p className="text-orange-400 font-bold">{d.calories}</p>
                <p className="text-slate-500 text-xs">
                  {offsets[d.type] > 0 ? '+' : ''}{offsets[d.type]} kcal
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Goal */}
      <Section title="Goal">
        <div className="space-y-2">
          {Object.entries(GOALS).map(([k, g]) => (
            <button
              key={k}
              onClick={() => set('goal', k)}
              className={`w-full text-left rounded-xl px-3 py-3 transition-colors border ${
                settings.goal === k
                  ? 'bg-green-500/15 border-green-500/40'
                  : 'bg-slate-700/40 border-transparent hover:bg-slate-700'
              }`}
            >
              <p className={`text-sm font-medium ${settings.goal === k ? 'text-green-400' : 'text-white'}`}>
                {g.label}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                Target rate: {g.rateKgWk > 0 ? '+' : ''}{g.rateKgWk} kg/week
                {g.deficitPct !== 0 && ` · ${Math.abs(Math.round(g.deficitPct * 100))}% ${g.deficitPct > 0 ? 'deficit' : 'surplus'}`}
              </p>
            </button>
          ))}
        </div>
      </Section>

      {/* Calories */}
      <Section title="Calories" sub="Auto derives your target from lean mass and activity. Manual lets you set the number yourself — the weekly check-in still adjusts from there.">
        <div className="flex gap-2 mb-3">
          {[['auto', 'Auto (from TDEE)'], ['manual', 'Manual']].map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => set('calorieMode', mode)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                settings.calorieMode === mode ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {settings.calorieMode === 'manual' ? (
          <Field label="Weekly average calories" hint="This is the average across the week — individual days still cycle up and down around it.">
            <input
              type="number" inputMode="numeric"
              value={settings.manualCalories}
              onChange={e => set('manualCalories', parseInt(e.target.value) || 0)}
              className="input-field"
            />
          </Field>
        ) : (
          <Field label="Activity level" hint="Counts everything outside the gym too — steps, commute, standing.">
            <select
              value={settings.activity}
              onChange={e => set('activity', e.target.value)}
              className="input-field"
            >
              {Object.entries(ACTIVITY_LEVELS).map(([k, a]) => (
                <option key={k} value={k}>{a.label}</option>
              ))}
            </select>
          </Field>
        )}

        {settings.calorieAdjustment !== 0 && (
          <button
            onClick={() => set('calorieAdjustment', 0)}
            className="w-full mt-2 bg-slate-700 text-slate-300 text-xs py-2 rounded-xl"
          >
            Clear check-in adjustment ({settings.calorieAdjustment > 0 ? '+' : ''}{settings.calorieAdjustment} kcal)
          </button>
        )}
      </Section>

      {/* Macros */}
      <Section title="Macro split" sub="Protein is set per kg of bodyweight; fat as a share of calories. Carbs fill whatever is left.">
        <Field label={`Protein: ${settings.proteinPerKg} g/kg (${Math.round(settings.proteinPerKg * latestStat.weight)}g at ${latestStat.weight}kg)`}
               hint="1.6–2.2 g/kg is the evidence-backed range for preserving muscle in a deficit.">
          <input
            type="range" min="1.4" max="3" step="0.1"
            value={settings.proteinPerKg}
            onChange={e => set('proteinPerKg', parseFloat(e.target.value))}
            className="w-full accent-green-500"
          />
        </Field>
        <Field label={`Fat: ${Math.round(settings.fatPct * 100)}% of calories`}
               hint="Below ~20% can affect hormone production. The app floors fat at 0.6 g/kg regardless.">
          <input
            type="range" min="0.15" max="0.4" step="0.01"
            value={settings.fatPct}
            onChange={e => set('fatPct', parseFloat(e.target.value))}
            className="w-full accent-green-500"
          />
        </Field>
      </Section>

      {/* Habits */}
      <Section title="Daily habit targets">
        <div className="grid grid-cols-3 gap-2">
          <Field label="Steps">
            <input
              type="number" inputMode="numeric"
              value={settings.stepsTarget}
              onChange={e => set('stepsTarget', parseInt(e.target.value) || 0)}
              className="input-field py-2 text-sm"
            />
          </Field>
          <Field label="Water (L)">
            <input
              type="number" inputMode="decimal" step="0.5"
              value={settings.waterTargetL}
              onChange={e => set('waterTargetL', parseFloat(e.target.value) || 0)}
              className="input-field py-2 text-sm"
            />
          </Field>
          <Field label="Sleep (hrs)">
            <input
              type="number" inputMode="decimal" step="0.5"
              value={settings.sleepTarget}
              onChange={e => set('sleepTarget', parseFloat(e.target.value) || 0)}
              className="input-field py-2 text-sm"
            />
          </Field>
        </div>
      </Section>

      {/* Profile */}
      <Section title="Profile" sub="Optional — body fat % drives the BMR calculation, so these are only used for context.">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Height (cm)">
            <input
              type="number" inputMode="numeric"
              value={settings.heightCm}
              onChange={e => set('heightCm', parseInt(e.target.value) || 0)}
              className="input-field py-2 text-sm"
            />
          </Field>
          <Field label="Age">
            <input
              type="number" inputMode="numeric"
              value={settings.age}
              onChange={e => set('age', parseInt(e.target.value) || 0)}
              className="input-field py-2 text-sm"
            />
          </Field>
        </div>
        {settings.heightCm > 0 && (
          <p className="text-slate-500 text-xs">
            BMI: {(latestStat.weight / ((settings.heightCm / 100) ** 2)).toFixed(1)}
            <span className="text-slate-600"> — a poor measure at your body fat level; track waist and body fat % instead.</span>
          </p>
        )}
      </Section>

      {/* Check-in history */}
      {settings.checkInHistory?.length > 0 && (
        <Section title="Check-in history">
          <div className="space-y-2">
            {[...settings.checkInHistory].reverse().slice(0, 8).map((h, i) => (
              <div key={i} className="flex justify-between items-start gap-2 text-xs border-b border-slate-700 last:border-0 pb-2 last:pb-0">
                <div className="min-w-0">
                  <p className="text-slate-300">{h.date}</p>
                  <p className="text-slate-500 truncate">{h.reason}</p>
                </div>
                <span className={`font-semibold flex-shrink-0 ${
                  h.delta > 0 ? 'text-green-400' : h.delta < 0 ? 'text-orange-400' : 'text-slate-500'
                }`}>
                  {h.delta > 0 ? '+' : ''}{h.delta || 0}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Danger zone */}
      <div className="card border-red-500/20">
        <p className="text-white font-semibold mb-3">Data</p>
        {confirmReset ? (
          <div className="text-center">
            <p className="text-slate-300 text-sm mb-1">Delete everything?</p>
            <p className="text-slate-500 text-xs mb-4">
              All workouts, daily logs, body stats and settings. Export a backup from Progress first.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmReset(false)} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
              <button onClick={resetAll} className="flex-1 bg-red-500 hover:bg-red-400 text-white font-semibold py-2.5 rounded-xl text-sm">
                Delete all
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="w-full bg-slate-700 hover:bg-red-500/20 text-slate-300 hover:text-red-400 text-sm py-2.5 rounded-xl transition-colors"
          >
            Reset all data
          </button>
        )}
        {supabase && (
          <button onClick={signOut} className="w-full mt-2 py-2.5 text-slate-500 hover:text-red-400 text-sm transition-colors">
            Sign out
          </button>
        )}
      </div>
    </div>
  )
}
