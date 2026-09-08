import { useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useStorage, today, formatDate, exportData, importData } from '../hooks/useStorage'
import { STARTING_STATS } from '../data/fitnessPlan'

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

export default function Progress() {
  const [bodyStats, setBodyStats] = useStorage('fitness_body_stats', [STARTING_STATS])
  const [workoutLogs] = useStorage('fitness_workout_logs', [])
  const [showAddStats, setShowAddStats] = useState(false)
  const [form, setForm] = useState({ weight: '', bodyFat: '', waist: '', hip: '', neck: '', chest: '', upperArm: '', quadriceps: '' })
  const [importError, setImportError] = useState('')

  const labels = bodyStats.map(s => formatDate(s.date))
  const weights = bodyStats.map(s => s.weight)
  const fats = bodyStats.map(s => s.bodyFat)
  const waists = bodyStats.map(s => s.waist)

  const latest = bodyStats[bodyStats.length - 1] || STARTING_STATS
  const start = bodyStats[0] || STARTING_STATS

  function handleAddStats(e) {
    e.preventDefault()
    const entry = {
      date: today(),
      weight: parseFloat(form.weight) || latest.weight,
      bodyFat: parseFloat(form.bodyFat) || latest.bodyFat,
      waist: parseFloat(form.waist) || latest.waist,
      hip: parseFloat(form.hip) || latest.hip,
      neck: parseFloat(form.neck) || latest.neck,
      chest: parseFloat(form.chest) || latest.chest,
      upperArm: parseFloat(form.upperArm) || latest.upperArm,
      quadriceps: parseFloat(form.quadriceps) || latest.quadriceps,
    }
    const filtered = bodyStats.filter(s => s.date !== today())
    setBodyStats([...filtered, entry].sort((a, b) => a.date.localeCompare(b.date)))
    setShowAddStats(false)
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

      {/* Charts */}
      <Chart title="Body Weight" labels={labels} data={weights} color="#22c55e" unit="kg" />
      <Chart title="Body Fat %" labels={labels} data={fats} color="#f97316" unit="%" />
      <Chart title="Waist" labels={labels} data={waists} color="#818cf8" unit="inches" />

      {/* Recent workouts */}
      <div className="card mb-4">
        <p className="text-white font-semibold mb-3">Recent Workouts</p>
        {recentWorkouts.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No workouts logged yet</p>
        ) : (
          <div className="space-y-2">
            {recentWorkouts.map((log, i) => {
              const totalSets = log.exercises?.reduce((a, e) => a + (e.sets?.filter(s => s.done).length || 0), 0) || 0
              return (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-700 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{log.workoutName} — {log.day}</p>
                    <p className="text-slate-400 text-xs">{formatDate(log.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 text-sm">{totalSets} sets</p>
                    <p className="text-slate-500 text-xs">{log.durationMin} min</p>
                  </div>
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
          All data is local. Export weekly to avoid loss.
        </p>
      </div>

      {/* Add Stats Modal */}
      {showAddStats && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto p-4 flex items-start justify-center pt-8">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700">
            <p className="text-white font-bold text-lg mb-4">Log Today's Stats</p>
            <form onSubmit={handleAddStats} className="space-y-3">
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
