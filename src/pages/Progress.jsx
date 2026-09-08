import { useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useStorage, today, formatDate, exportData, importData } from '../hooks/useStorage'
import { STARTING_STATS } from '../data/fitnessPlan'
import { supabase, signOut } from '../lib/supabase'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { mode: 'index' } },
  scales: {
    x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: '#1e293b' } },
    y: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: '#1e293b' } },
  },
}

function makeLineData(labels, data, color) {
  return {
    labels,
    datasets: [{
      data,
      borderColor: color,
      backgroundColor: color + '22',
      fill: true,
      tension: 0.3,
      pointBackgroundColor: color,
      pointRadius: 4,
      borderWidth: 2,
    }],
  }
}

function Chart({ title, labels, data, color, unit }) {
  if (!data.length) return (
    <div className="card mb-4">
      <p className="text-white font-semibold mb-3">{title}</p>
      <p className="text-slate-500 text-sm text-center py-8">No data yet — log your first measurement!</p>
    </div>
  )

  return (
    <div className="card mb-4">
      <div className="flex justify-between items-baseline mb-3">
        <p className="text-white font-semibold">{title}</p>
        <p className="text-slate-400 text-xs">{unit}</p>
      </div>
      <div className="h-40">
        <Line data={makeLineData(labels, data, color)} options={CHART_OPTS} />
      </div>
    </div>
  )
}

/** Every exercise that has at least one logged set, newest-first by last use */
function collectExercises(logs) {
  const map = new Map()
  logs.forEach(l => l.exercises?.forEach(e => {
    const done = e.sets?.filter(s => s.done && s.weight > 0) || []
    if (!done.length) return
    const top = Math.max(...done.map(s => s.weight))
    const volume = done.reduce((a, s) => a + s.weight * (s.reps || 0), 0)
    const prev = map.get(e.exerciseId) || { id: e.exerciseId, name: e.name, points: [] }
    prev.points.push({ date: l.date, top, volume })
    map.set(e.exerciseId, prev)
  }))
  return [...map.values()]
    .map(e => ({ ...e, points: e.points.sort((a, b) => a.date.localeCompare(b.date)) }))
    .sort((a, b) => b.points.at(-1).date.localeCompare(a.points.at(-1).date))
}

function StrengthProgress({ workoutLogs }) {
  const exercises = collectExercises(workoutLogs)
  const [sel, setSel] = useState(null)
  const active = exercises.find(e => e.id === sel) || exercises[0]

  if (!exercises.length) {
    return (
      <div className="card mb-4">
        <p className="text-white font-semibold mb-3">Strength Progression</p>
        <p className="text-slate-500 text-sm text-center py-8">
          Log a few workouts with weights and your lifts will chart here.
        </p>
      </div>
    )
  }

  const first = active.points[0].top
  const last = active.points.at(-1).top
  const gain = (last - first).toFixed(1)
  const best = Math.max(...active.points.map(p => p.top))

  return (
    <div className="card mb-4">
      <div className="flex justify-between items-baseline mb-3">
        <p className="text-white font-semibold">Strength Progression</p>
        <p className="text-slate-400 text-xs">top set, kg</p>
      </div>

      <select
        value={active.id}
        onChange={e => setSel(e.target.value)}
        className="w-full bg-slate-700 text-white text-sm rounded-xl px-3 py-2.5 mb-3 outline-none border border-slate-600"
      >
        {exercises.map(e => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>

      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div>
          <p className="text-slate-400 text-xs">Best</p>
          <p className="text-white font-bold">{best}<span className="text-xs font-normal text-slate-400">kg</span></p>
        </div>
        <div>
          <p className="text-slate-400 text-xs">Change</p>
          <p className={`font-bold ${gain > 0 ? 'text-green-400' : gain < 0 ? 'text-red-400' : 'text-white'}`}>
            {gain > 0 ? '+' : ''}{gain}<span className="text-xs font-normal text-slate-400">kg</span>
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-xs">Sessions</p>
          <p className="text-white font-bold">{active.points.length}</p>
        </div>
      </div>

      {active.points.length < 2 ? (
        <p className="text-slate-500 text-sm text-center py-6">
          One session logged — chart appears after the next one.
        </p>
      ) : (
        <div className="h-40">
          <Line
            data={makeLineData(
              active.points.map(p => formatDate(p.date)),
              active.points.map(p => p.top),
              '#eab308'
            )}
            options={CHART_OPTS}
          />
        </div>
      )}
    </div>
  )
}

function WeeklySummary({ workoutLogs, dailyLogs }) {
  // Monday-start week containing today
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const p = n => String(n).padStart(2, '0')
  const key = d => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i); return key(d)
  })

  const sessions = weekDates.filter(d => workoutLogs.some(l => l.date === d)).length
  const weekDaily = dailyLogs.filter(l => weekDates.includes(l.date))
  const avg = (arr, k) => arr.length
    ? Math.round(arr.reduce((a, l) => a + (l[k] || 0), 0) / arr.length)
    : 0

  const volume = workoutLogs
    .filter(l => weekDates.includes(l.date))
    .reduce((a, l) => a + (l.exercises?.reduce((b, e) =>
      b + (e.sets?.filter(s => s.done).reduce((c, s) => c + (s.weight || 0) * (s.reps || 0), 0) || 0), 0) || 0), 0)

  return (
    <div className="card mb-4">
      <p className="text-white font-semibold mb-3">This Week</p>
      <div className="flex gap-1.5 mb-4">
        {weekDates.map((d, i) => {
          const hit = workoutLogs.some(l => l.date === d)
          const planned = i < 5 // Mon-Fri are training days
          const future = d > key(now)
          return (
            <div key={d} className="flex-1 text-center">
              <p className="text-slate-500 text-[10px] mb-1">{['M','T','W','T','F','S','S'][i]}</p>
              <div className={`h-8 rounded-lg flex items-center justify-center text-xs ${
                hit ? 'bg-green-500/25 text-green-400'
                  : future ? 'bg-slate-700/40 text-slate-600'
                  : planned ? 'bg-red-500/15 text-red-400/70'
                  : 'bg-slate-700/40 text-slate-600'
              }`}>
                {hit ? '✓' : future ? '·' : planned ? '✕' : '–'}
              </div>
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="text-slate-400 text-xs">Sessions</p>
          <p className={`font-bold ${sessions >= 5 ? 'text-green-400' : 'text-white'}`}>{sessions}<span className="text-xs font-normal text-slate-400">/5</span></p>
        </div>
        <div>
          <p className="text-slate-400 text-xs">Volume</p>
          <p className="text-white font-bold text-sm">{(volume / 1000).toFixed(1)}<span className="text-xs font-normal text-slate-400">t</span></p>
        </div>
        <div>
          <p className="text-slate-400 text-xs">Avg cal</p>
          <p className="text-white font-bold text-sm">{avg(weekDaily, 'calories') || '—'}</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs">Avg protein</p>
          <p className={`font-bold text-sm ${avg(weekDaily, 'protein') >= 150 ? 'text-green-400' : 'text-white'}`}>
            {avg(weekDaily, 'protein') || '—'}<span className="text-xs font-normal text-slate-400">g</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Progress() {
  const [bodyStats, setBodyStats] = useStorage('fitness_body_stats', [STARTING_STATS])
  const [workoutLogs, setWorkoutLogs] = useStorage('fitness_workout_logs', [])
  const [dailyLogs] = useStorage('fitness_daily_logs', [])
  const [showAddStats, setShowAddStats] = useState(false)
  const [form, setForm] = useState({ weight: '', bodyFat: '', waist: '', hip: '', neck: '', chest: '', upperArm: '', quadriceps: '' })
  const [importError, setImportError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [statDate, setStatDate] = useState(today())

  const labels = bodyStats.map(s => formatDate(s.date))
  const weights = bodyStats.map(s => s.weight)
  const fats = bodyStats.map(s => s.bodyFat)
  const waists = bodyStats.map(s => s.waist)

  const latest = bodyStats[bodyStats.length - 1] || STARTING_STATS
  const start = bodyStats[0] || STARTING_STATS

  function handleAddStats(e) {
    e.preventDefault()
    const entry = {
      date: statDate,
      weight: parseFloat(form.weight) || latest.weight,
      bodyFat: parseFloat(form.bodyFat) || latest.bodyFat,
      waist: parseFloat(form.waist) || latest.waist,
      hip: parseFloat(form.hip) || latest.hip,
      neck: parseFloat(form.neck) || latest.neck,
      chest: parseFloat(form.chest) || latest.chest,
      upperArm: parseFloat(form.upperArm) || latest.upperArm,
      quadriceps: parseFloat(form.quadriceps) || latest.quadriceps,
    }
    const filtered = bodyStats.filter(s => s.date !== statDate)
    setBodyStats([...filtered, entry].sort((a, b) => a.date.localeCompare(b.date)))
    setShowAddStats(false)
    setStatDate(today())
    setForm({ weight: '', bodyFat: '', waist: '', hip: '', neck: '', chest: '', upperArm: '', quadriceps: '' })
  }

  function delta(key) {
    const d = (latest[key] - start[key]).toFixed(1)
    return { val: d, sign: d > 0 ? '+' : '' }
  }

  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      await importData(file)
      window.location.reload()
    } catch {
      setImportError('Invalid backup file')
    }
  }

  const recentWorkouts = workoutLogs.slice(-10).reverse()

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">Progress</h1>
        <button
          onClick={() => setShowAddStats(true)}
          className="bg-green-500 text-white text-sm font-semibold px-3 py-1.5 rounded-xl"
        >
          + Log Stats
        </button>
      </div>

      {/* Current snapshot */}
      <div className="card mb-4">
        <p className="text-slate-400 text-xs mb-3">CURRENT SNAPSHOT</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Weight', key: 'weight', unit: 'kg', good: d => d <= 0 },
            { label: 'Body fat', key: 'bodyFat', unit: '%', good: d => d <= 0 },
            { label: 'Waist', key: 'waist', unit: 'in', good: d => d <= 0 },
            { label: 'Hip', key: 'hip', unit: 'in', good: d => d <= 0 },
            { label: 'Chest', key: 'chest', unit: 'in', good: d => d >= 0 },
            { label: 'Arm', key: 'upperArm', unit: 'in', good: d => d >= 0 },
          ].map(({ label, key, unit, good }) => {
            const d = delta(key)
            const isGood = good(parseFloat(d.val))
            return (
              <div key={key} className="text-center">
                <p className="text-slate-400 text-xs">{label}</p>
                <p className="text-white font-bold">{latest[key]}<span className="text-xs font-normal text-slate-400">{unit}</span></p>
                {bodyStats.length > 1 && (
                  <p className={`text-xs ${isGood ? 'text-green-400' : 'text-red-400'}`}>
                    {d.sign}{d.val}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <WeeklySummary workoutLogs={workoutLogs} dailyLogs={dailyLogs} />

      {/* Charts */}
      <Chart title="Body Weight" labels={labels} data={weights} color="#22c55e" unit="kg" />
      <Chart title="Body Fat %" labels={labels} data={fats} color="#f97316" unit="%" />
      <Chart title="Waist" labels={labels} data={waists} color="#818cf8" unit="inches" />

      <StrengthProgress workoutLogs={workoutLogs} />

      {/* Recent workouts */}
      <div className="card mb-4">
        <p className="text-white font-semibold mb-3">Recent Workouts</p>
        {recentWorkouts.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No workouts logged yet</p>
        ) : (
          <div className="space-y-2">
            {recentWorkouts.map((log, i) => {
              const totalSets = log.exercises?.reduce((a, e) => a + (e.sets?.filter(s => s.done).length || 0), 0) || 0
              const volume = log.exercises?.reduce((a, e) =>
                a + (e.sets?.filter(s => s.done).reduce((b, s) => b + (s.weight || 0) * (s.reps || 0), 0) || 0), 0) || 0
              return (
                <div key={log.date} className="flex justify-between items-center gap-2 py-2 border-b border-slate-700 last:border-0">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{log.workoutName} — {log.day}</p>
                    <p className="text-slate-400 text-xs">
                      {formatDate(log.date)}
                      {volume > 0 && ` · ${volume.toLocaleString()} kg volume`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-green-400 text-sm">{totalSets} sets</p>
                    <p className="text-slate-500 text-xs">{log.durationMin} min</p>
                  </div>
                  <button
                    onClick={() => setConfirmDelete(log.date)}
                    className="text-slate-600 hover:text-red-400 text-lg leading-none px-1 flex-shrink-0"
                    aria-label="Delete workout"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Backup / Restore */}
      <div className="card">
        <p className="text-white font-semibold mb-3">Backup & Restore</p>
        <div className="flex gap-2">
          <button onClick={exportData} className="btn-secondary flex-1 text-sm py-2.5">
            ⬇ Export JSON
          </button>
          <label className="btn-secondary flex-1 text-sm py-2.5 text-center cursor-pointer">
            ⬆ Import JSON
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
        {importError && <p className="text-red-400 text-xs mt-2">{importError}</p>}
        <p className="text-slate-500 text-xs mt-2 text-center">
          {supabase ? 'Auto-synced across devices via Supabase.' : 'All data is local. Export weekly to avoid loss.'}
        </p>
      </div>

      {supabase && (
        <button
          onClick={signOut}
          className="w-full mt-3 py-3 rounded-2xl text-slate-500 hover:text-red-400 text-sm transition-colors"
        >
          Sign out
        </button>
      )}

      {/* Delete workout confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-xs border border-slate-700 text-center">
            <p className="text-white font-bold mb-2">Delete workout?</p>
            <p className="text-slate-400 text-sm mb-5">
              The session logged on {formatDate(confirmDelete)} will be removed.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
              <button
                onClick={() => {
                  setWorkoutLogs(workoutLogs.filter(l => l.date !== confirmDelete))
                  setConfirmDelete(null)
                }}
                className="flex-1 bg-red-500 hover:bg-red-400 text-white font-semibold py-2.5 rounded-xl text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stats Modal */}
      {showAddStats && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto p-4 flex items-start justify-center pt-8">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700">
            <p className="text-white font-bold text-lg mb-4">Log Body Stats</p>
            <form onSubmit={handleAddStats} className="space-y-3">
              <div>
                <label className="text-slate-400 text-xs block mb-1">Date</label>
                <input
                  type="date"
                  value={statDate}
                  max={today()}
                  onChange={e => setStatDate(e.target.value)}
                  className="input-field"
                />
              </div>
              {[
                { key: 'weight', label: 'Weight (kg)', placeholder: latest.weight },
                { key: 'bodyFat', label: 'Body Fat (%)', placeholder: latest.bodyFat },
                { key: 'waist', label: 'Waist (in)', placeholder: latest.waist },
                { key: 'hip', label: 'Hip (in)', placeholder: latest.hip },
                { key: 'chest', label: 'Chest (in)', placeholder: latest.chest },
                { key: 'upperArm', label: 'Upper Arm (in)', placeholder: latest.upperArm },
                { key: 'quadriceps', label: 'Quadriceps (in)', placeholder: latest.quadriceps },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-slate-400 text-xs block mb-1">{label}</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="input-field"
                  />
                </div>
              ))}
              <p className="text-slate-500 text-xs">Leave blank to keep last value</p>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddStats(false)} className="btn-secondary flex-1 py-2.5">Cancel</button>
                <button type="submit" className="btn-primary flex-1 py-2.5">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
