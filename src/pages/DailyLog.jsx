import { useState } from 'react'
import { useStorage, today } from '../hooks/useStorage'
import { CALORIE_TARGETS, MACRO_TARGETS, STEPS_TARGET, WATER_TARGET_L, COMMON_FOODS, WORKOUT_PLAN } from '../data/fitnessPlan'

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
  const dow = new Date().getDay()
  const workout = WORKOUT_PLAN[dow]
  const isCardio = dow === 3
  const calTarget = workout ? (isCardio ? CALORIE_TARGETS.cardio : CALORIE_TARGETS.workout) : CALORIE_TARGETS.rest
  const macros = workout ? MACRO_TARGETS.workout : MACRO_TARGETS.rest

  const [dailyLogs, setDailyLogs] = useStorage('fitness_daily_logs', [])
  const currentDate = today()
  const todayLog = dailyLogs.find(l => l.date === currentDate) || {
    date: currentDate, steps: 0, water: 0, sleep: 0, calories: 0, protein: 0, carbs: 0, fat: 0, foods: [],
  }

  const [form, setForm] = useState({
    steps: todayLog.steps || '',
    water: todayLog.water || '',
    sleep: todayLog.sleep || '',
    calories: todayLog.calories || '',
    protein: todayLog.protein || '',
    carbs: todayLog.carbs || '',
    fat: todayLog.fat || '',
  })
  const [saved, setSaved] = useState(false)
  const [showFoodPicker, setShowFoodPicker] = useState(false)
  const [foodSearch, setFoodSearch] = useState('')
  const [foods, setFoods] = useState(todayLog.foods || [])

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
    setDailyLogs([...filtered, log])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function addFood(food) {
    setFoods(f => {
      const newFoods = [...f, food]
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
    setShowFoodPicker(false)
    setFoodSearch('')
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

  const filtered = COMMON_FOODS.filter(f =>
    f.name.toLowerCase().includes(foodSearch.toLowerCase())
  )

  return (
    <div className="page">
      <h1 className="text-xl font-bold text-white mb-1">Daily Log</h1>
      <p className="text-slate-400 text-sm mb-4">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        {' · '}{workout ? `${calTarget} kcal day` : 'Rest day'}
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
            { key: 'steps', label: '👟 Steps', unit: 'steps', target: STEPS_TARGET, inputMode: 'numeric' },
            { key: 'water', label: '💧 Water', unit: 'litres', target: WATER_TARGET_L, inputMode: 'decimal', step: '0.5' },
            { key: 'sleep', label: '😴 Sleep', unit: 'hours', target: 7.5, inputMode: 'decimal', step: '0.5' },
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

      {/* Food picker modal */}
      {showFoodPicker && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end p-0">
          <div className="bg-slate-800 rounded-t-2xl w-full max-h-[80vh] flex flex-col border-t border-slate-700">
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-semibold">Add Food</p>
                <button onClick={() => setShowFoodPicker(false)} className="text-slate-400 text-2xl leading-none">×</button>
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
              {filtered.map((food, i) => (
                <button
                  key={i}
                  onClick={() => addFood(food)}
                  className="w-full text-left flex items-center justify-between py-3 px-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
                >
                  <div>
                    <p className="text-white text-sm font-medium">{food.name}</p>
                    <p className="text-slate-400 text-xs">{food.cal} kcal · P: {food.protein}g · C: {food.carbs}g · F: {food.fat}g</p>
                  </div>
                  <span className="text-green-400 text-xl ml-2">+</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
