import { useState } from 'react'
import { useStorage, today } from '../hooks/useStorage'
import { COMMON_FOODS, WORKOUT_PLAN, STARTING_STATS } from '../data/fitnessPlan'
import { useSettings } from '../hooks/useSettings'
import { targetsFor, dayTypeFor } from '../lib/coach'

function Ring({ value, max, color, label, size = 80 }) {
  const r = (size / 2) - 8
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth="7" />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <p className={`text-sm font-bold -mt-12 ${value >= max ? 'text-green-400' : 'text-white'}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-8">{label}</p>
      <p className="text-xs text-slate-500">/{max}</p>
    </div>
  )
}

export default function DailyLog() {
  const [dailyLogs, setDailyLogs] = useStorage('fitness_daily_logs', [])
  // Editable date so a forgotten day can be backfilled, not just today
  const [currentDate, setCurrentDate] = useState(today())
  const dayLog = dailyLogs.find(l => l.date === currentDate)

  const [settings] = useSettings()
  const [bodyStats] = useStorage('fitness_body_stats', [STARTING_STATS])
  const latestStat = bodyStats[bodyStats.length - 1] || STARTING_STATS

  // Targets follow the selected date's weekday, not today's
  const dow = new Date(currentDate + 'T00:00:00').getDay()
  const workout = WORKOUT_PLAN[dow]
  const targets = targetsFor(settings, latestStat, dayTypeFor(dow)) || { calories: 0, protein: 0, carbs: 0, fat: 0 }
  const calTarget = targets.calories
  const macros = targets

  const blankForm = { steps: '', water: '', sleep: '', calories: '', protein: '', carbs: '', fat: '' }
  const formFor = log => log
    ? {
        steps: log.steps || '', water: log.water || '', sleep: log.sleep || '',
        calories: log.calories || '', protein: log.protein || '',
        carbs: log.carbs || '', fat: log.fat || '',
      }
    : blankForm

  const [form, setForm] = useState(() => formFor(dayLog))
  const [saved, setSaved] = useState(false)
  const [showFoodPicker, setShowFoodPicker] = useState(false)
  const [foodSearch, setFoodSearch] = useState('')
  const [foods, setFoods] = useState(dayLog?.foods || [])
  const [customFood, setCustomFood] = useState(null)
  const [customFoods, setCustomFoods] = useStorage('fitness_custom_foods', [])

  function changeDate(d) {
    const log = dailyLogs.find(l => l.date === d)
    setCurrentDate(d)
    setForm(formFor(log))
    setFoods(log?.foods || [])
    setSaved(false)
  }

  function saveLog() {
    const log = {
      date: currentDate,
      steps: parseInt(form.steps) || 0,
      water: parseFloat(form.water) || 0,
      sleep: parseFloat(form.sleep) || 0,
      calories: parseInt(form.calories) || totalFromFoods.cal,
      protein: parseInt(form.protein) || totalFromFoods.protein,
      carbs: parseInt(form.carbs) || totalFromFoods.carbs,
      fat: parseInt(form.fat) || totalFromFoods.fat,
      foods,
    }
    const filtered = dailyLogs.filter(l => l.date !== currentDate)
    setDailyLogs([...filtered, log].sort((a, b) => a.date.localeCompare(b.date)))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function addFood(food, servings = 1) {
    const scaled = servings === 1 ? food : {
      name: `${food.name} ×${servings}`,
      cal: Math.round(food.cal * servings),
      protein: Math.round(food.protein * servings),
      carbs: Math.round(food.carbs * servings),
      fat: Math.round(food.fat * servings),
    }
    setFoods(f => {
      const newFoods = [...f, scaled]
      const totals = newFoods.reduce((a, fd) => ({
        cal: a.cal + fd.cal, protein: a.protein + fd.protein,
        carbs: a.carbs + fd.carbs, fat: a.fat + fd.fat,
      }), { cal: 0, protein: 0, carbs: 0, fat: 0 })
      setForm(prev => ({
        ...prev,
        calories: totals.cal,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
      }))
      return newFoods
    })
    // Stay open — a meal is usually several items
    setFoodSearch('')
    setSaved(false)
  }

  function removeFood(idx) {
    setFoods(f => {
      const nf = f.filter((_, i) => i !== idx)
      const totals = nf.reduce((a, fd) => ({
        cal: a.cal + fd.cal, protein: a.protein + fd.protein,
        carbs: a.carbs + fd.carbs, fat: a.fat + fd.fat,
      }), { cal: 0, protein: 0, carbs: 0, fat: 0 })
      setForm(prev => ({ ...prev, calories: totals.cal, protein: totals.protein, carbs: totals.carbs, fat: totals.fat }))
      return nf
    })
  }

  const totalFromFoods = foods.reduce((a, f) => ({
    cal: a.cal + f.cal, protein: a.protein + f.protein,
    carbs: a.carbs + f.carbs, fat: a.fat + f.fat,
  }), { cal: 0, protein: 0, carbs: 0, fat: 0 })

  const displayCal = parseInt(form.calories) || totalFromFoods.cal || 0
  const displayProtein = parseInt(form.protein) || totalFromFoods.protein || 0
  const displayCarbs = parseInt(form.carbs) || totalFromFoods.carbs || 0
  const displayFat = parseInt(form.fat) || totalFromFoods.fat || 0

  const filtered = [...customFoods, ...COMMON_FOODS].filter(f =>
    f.name.toLowerCase().includes(foodSearch.toLowerCase())
  )

  function saveCustomFood(e) {
    e.preventDefault()
    const f = {
      name: customFood.name.trim(),
      cal: parseInt(customFood.cal) || 0,
      protein: parseInt(customFood.protein) || 0,
      carbs: parseInt(customFood.carbs) || 0,
      fat: parseInt(customFood.fat) || 0,
      custom: true,
    }
    if (!f.name) return
    // Remember it so it shows up in search next time
    setCustomFoods([...customFoods.filter(c => c.name !== f.name), f])
    addFood(f, parseFloat(customFood.servings) || 1)
    setCustomFood(null)
  }

  return (
    <div className="page">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h1 className="text-xl font-bold text-white">Daily Log</h1>
        <input
          type="date"
          value={currentDate}
          max={today()}
          onChange={e => changeDate(e.target.value)}
          className="bg-slate-700 text-white text-sm rounded-xl px-3 py-2 outline-none border border-slate-600"
        />
      </div>
      <p className="text-slate-400 text-sm mb-4">
        {new Date(currentDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        {' · '}{workout ? `${calTarget} kcal day` : 'Rest day'}
        {currentDate !== today() && <span className="text-orange-400"> · backfilling</span>}
        {dayLog && <span className="text-green-400"> · saved</span>}
      </p>

      {/* Macro rings */}
      <div className="card mb-4">
        <p className="text-slate-400 text-xs mb-3">TODAY'S MACROS</p>
        <div className="flex justify-around">
          <Ring value={displayCal} max={calTarget} color="#f97316" label="Cal" size={76} />
          <Ring value={displayProtein} max={macros.protein} color="#22c55e" label="Protein" size={76} />
          <Ring value={displayCarbs} max={macros.carbs} color="#60a5fa" label="Carbs" size={76} />
          <Ring value={displayFat} max={macros.fat} color="#a78bfa" label="Fat" size={76} />
        </div>
      </div>

      {/* Food log */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-semibold">Food Log</p>
          <button onClick={() => setShowFoodPicker(true)} className="text-green-400 text-sm font-semibold">+ Add food</button>
        </div>
        {foods.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-3">Tap "Add food" to log meals</p>
        ) : (
          <div className="space-y-2">
            {foods.map((f, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-white truncate">{f.name}</p>
                  <p className="text-slate-400 text-xs">{f.cal} kcal · {f.protein}g protein</p>
                </div>
                <button onClick={() => removeFood(i)} className="text-slate-500 hover:text-red-400 ml-2 text-lg leading-none">×</button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-slate-400 text-xs mb-2">Or enter totals manually:</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'calories', label: 'Calories', unit: 'kcal' },
              { key: 'protein', label: 'Protein', unit: 'g' },
              { key: 'carbs', label: 'Carbs', unit: 'g' },
              { key: 'fat', label: 'Fat', unit: 'g' },
            ].map(({ key, label, unit }) => (
              <div key={key}>
                <label className="text-slate-400 text-xs block mb-1">{label} ({unit})</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={form[key]}
                  onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setSaved(false) }}
                  className="input-field text-sm py-2"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Steps + Water + Sleep */}
      <div className="card mb-4">
        <p className="text-white font-semibold mb-3">Habits</p>
        <div className="space-y-3">
          {[
            { key: 'steps', label: '👟 Steps', unit: 'steps', target: settings.stepsTarget, inputMode: 'numeric' },
            { key: 'water', label: '💧 Water', unit: 'litres', target: settings.waterTargetL, inputMode: 'decimal', step: '0.5' },
            { key: 'sleep', label: '😴 Sleep', unit: 'hours', target: settings.sleepTarget, inputMode: 'decimal', step: '0.5' },
          ].map(({ key, label, unit, target, inputMode, step }) => {
            const val = key === 'steps' ? parseInt(form[key]) || 0 : parseFloat(form[key]) || 0
            const pct = Math.min(100, Math.round((val / target) * 100))
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 text-sm">{label}</label>
                  <span className={`text-xs ${val >= target ? 'text-green-400' : 'text-slate-400'}`}>
                    {val}/{target} {unit} ({pct}%)
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    inputMode={inputMode}
                    step={step || '1'}
                    value={form[key]}
                    onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setSaved(false) }}
                    placeholder={`0 ${unit}`}
                    className="input-field text-sm py-2 flex-1"
                  />
                </div>
                <div className="h-1 bg-slate-700 rounded-full mt-1">
                  <div className={`h-full rounded-full ${val >= target ? 'bg-green-400' : 'bg-orange-400'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={saveLog}
        className={`w-full py-4 rounded-2xl font-bold text-lg transition-colors ${
          saved ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'btn-primary'
        }`}
      >
        {saved ? '✓ Saved!' : 'Save Today\'s Log'}
      </button>

      {/* Custom food modal */}
      {customFood && (
        <div className="fixed inset-0 bg-black/85 z-[60] flex items-center justify-center p-4">
          <form onSubmit={saveCustomFood} className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700 space-y-3">
            <p className="text-white font-bold text-lg">Add Custom Food</p>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Name</label>
              <input
                type="text"
                value={customFood.name}
                onChange={e => setCustomFood(c => ({ ...c, name: e.target.value }))}
                placeholder="e.g. Palak paneer (1 katori)"
                className="input-field"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'cal', label: 'Calories' },
                { key: 'protein', label: 'Protein (g)' },
                { key: 'carbs', label: 'Carbs (g)' },
                { key: 'fat', label: 'Fat (g)' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-slate-400 text-xs block mb-1">{label}</label>
                  <input
                    type="number" inputMode="numeric" placeholder="0"
                    value={customFood[key]}
                    onChange={e => setCustomFood(c => ({ ...c, [key]: e.target.value }))}
                    className="input-field py-2 text-sm"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Servings</label>
              <input
                type="number" inputMode="decimal" step="0.5" min="0.5"
                value={customFood.servings}
                onChange={e => setCustomFood(c => ({ ...c, servings: e.target.value }))}
                className="input-field py-2 text-sm"
              />
            </div>
            <p className="text-slate-500 text-xs">Saved for reuse — it'll appear in search next time.</p>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setCustomFood(null)} className="btn-secondary flex-1 py-2.5">Cancel</button>
              <button type="submit" disabled={!customFood.name.trim()} className="btn-primary flex-1 py-2.5 disabled:opacity-40">Add</button>
            </div>
          </form>
        </div>
      )}

      {/* Food picker modal */}
      {showFoodPicker && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end p-0">
          <div className="bg-slate-800 rounded-t-2xl w-full max-h-[80vh] flex flex-col border-t border-slate-700">
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-semibold">
                  Add Food
                  {foods.length > 0 && <span className="text-green-400 text-sm ml-2">{foods.length} logged</span>}
                </p>
                <button
                  onClick={() => { setShowFoodPicker(false); setFoodSearch('') }}
                  className="bg-green-500 text-white text-sm font-semibold px-4 py-1.5 rounded-xl"
                >
                  Done
                </button>
              </div>
              <input
                type="text"
                placeholder="Search foods..."
                value={foodSearch}
                onChange={e => setFoodSearch(e.target.value)}
                className="input-field"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              <button
                onClick={() => setCustomFood({
                  name: foodSearch, cal: '', protein: '', carbs: '', fat: '', servings: '1',
                })}
                className="w-full py-3 border border-dashed border-slate-600 text-slate-400 rounded-xl text-sm hover:border-green-500 hover:text-green-400 transition-colors"
              >
                ＋ Add custom food{foodSearch && `: "${foodSearch}"`}
              </button>

              {filtered.map((food, i) => (
                <div key={i} className="flex items-stretch gap-1.5">
                  <button
                    onClick={() => addFood(food)}
                    className="flex-1 text-left flex items-center justify-between py-3 px-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors min-w-0"
                  >
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {food.name}{food.custom && <span className="text-green-400 text-xs ml-1">·custom</span>}
                      </p>
                      <p className="text-slate-400 text-xs">{food.cal} kcal · P: {food.protein}g · C: {food.carbs}g · F: {food.fat}g</p>
                    </div>
                    <span className="text-green-400 text-xl ml-2 flex-shrink-0">+</span>
                  </button>
                  {/* Half / double servings without doing the maths yourself */}
                  <button
                    onClick={() => addFood(food, 0.5)}
                    className="w-11 bg-slate-700/60 hover:bg-slate-600 rounded-xl text-slate-300 text-xs font-medium flex-shrink-0"
                  >
                    ½×
                  </button>
                  <button
                    onClick={() => addFood(food, 2)}
                    className="w-11 bg-slate-700/60 hover:bg-slate-600 rounded-xl text-slate-300 text-xs font-medium flex-shrink-0"
                  >
                    2×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
