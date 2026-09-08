import { useState } from 'react'
import { WORKOUT_PLAN, PHASES, COMMON_FOODS, PROGRAM_START } from '../data/fitnessPlan'
import { getWeekNumber } from '../hooks/useStorage'

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const COLOR_MAP = {
  orange: { bg: 'bg-orange-400/10', border: 'border-orange-400/30', text: 'text-orange-400' },
  blue:   { bg: 'bg-blue-400/10',   border: 'border-blue-400/30',   text: 'text-blue-400' },
  green:  { bg: 'bg-green-400/10',  border: 'border-green-400/30',  text: 'text-green-400' },
  purple: { bg: 'bg-purple-400/10', border: 'border-purple-400/30', text: 'text-purple-400' },
  yellow: { bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', text: 'text-yellow-400' },
}

const TABS = ['Workouts', 'Phases', 'Meals', 'Rules']

export default function PlanRef() {
  const [tab, setTab] = useState('Workouts')
  const currentWeek = getWeekNumber(PROGRAM_START)

  return (
    <div className="page">
      <h1 className="text-xl font-bold text-white mb-4">12-Week Plan</h1>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-800 rounded-xl p-1 mb-4">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
              tab === t ? 'bg-green-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Workouts' && (
        <div className="space-y-3">
          {Object.entries(WORKOUT_PLAN)
            .filter(([, v]) => v !== null)
            .map(([dow, w]) => {
              const c = COLOR_MAP[w.color] || COLOR_MAP.green
              return (
                <div key={dow} className={`card border ${c.border}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                        {DAY_NAMES[dow]}
                      </span>
                      <span className="text-white font-semibold">{w.name}</span>
                    </div>
                    <span className="text-slate-400 text-xs">{w.duration}</span>
                  </div>
                  <p className="text-slate-400 text-xs mb-2">{w.focus}</p>
                  <div className="space-y-1.5">
                    {w.exercises.map(ex => (
                      <div key={ex.id} className="flex items-center gap-2 text-sm">
                        <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${c.bg} ${c.text}`}>
                          {ex.priority}
                        </span>
                        <span className="text-slate-300 flex-1">{ex.name}</span>
                        <span className="text-slate-500 text-xs flex-shrink-0">
                          {ex.sets}×{ex.reps}
                          {ex.rest > 0 && ` · ${ex.rest}s`}
                        </span>
                      </div>
                    ))}
                  </div>
                  {w.tip && (
                    <p className={`text-xs mt-2 pt-2 border-t border-slate-700 ${c.text}`}>💡 {w.tip}</p>
                  )}
                </div>
              )
            })}
          <div className="card border border-slate-700 text-center">
            <p className="text-slate-400 text-sm">Saturday & Sunday</p>
            <p className="text-white font-semibold">🌴 Active Recovery</p>
            <p className="text-slate-400 text-xs mt-1">Walk 20-30 min · 8,000+ steps · Stretch</p>
          </div>
        </div>
      )}

      {tab === 'Phases' && (
        <div className="space-y-3">
          {/* Current week indicator */}
          <div className="card bg-green-500/10 border-green-500/20">
            <p className="text-green-400 text-sm font-semibold">You are on Week {currentWeek} of 12</p>
            <div className="h-2 bg-slate-700 rounded-full mt-2">
              <div className="h-full bg-green-400 rounded-full" style={{ width: `${(currentWeek / 12) * 100}%` }} />
            </div>
          </div>

          {PHASES.map((p, i) => {
            const isCurrent = currentWeek >= p.start && currentWeek <= p.end
            return (
              <div key={i} className={`card border ${isCurrent ? 'border-green-500/50 bg-green-500/5' : 'border-slate-700'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {isCurrent && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold">CURRENT</span>}
                  <span className="text-slate-400 text-xs">Weeks {p.start}-{p.end}</span>
                </div>
                <p className="text-white font-bold text-lg mb-1">Phase {i + 1}: {p.name}</p>
                <p className="text-slate-300 text-sm">{p.description}</p>

                {i === 0 && (
                  <div className="mt-3 space-y-1 text-xs text-slate-400">
                    <p>• 3 sets only — learn the movement</p>
                    <p>• Weight: can do 12 reps with 2 reps left in tank</p>
                    <p>• Cardio: 20 min Wed walk only</p>
                    <p>• Goal: establish routine, initial fat loss begins</p>
                  </div>
                )}
                {i === 1 && (
                  <div className="mt-3 space-y-1 text-xs text-slate-400">
                    <p>• Bump to 4 sets on main lifts</p>
                    <p>• Add 1-2 kg when you hit 12 reps easily for 2 sessions</p>
                    <p>• Extend to 30 min Wed cardio + 10 min Fri cooldown walk</p>
                    <p>• Goal: numbers climbing, visible shoulder & arm definition</p>
                  </div>
                )}
                {i === 2 && (
                  <div className="mt-3 space-y-1 text-xs text-slate-400">
                    <p>• Drop sets on last set of isolation moves</p>
                    <p>• Pair opposing muscles as supersets</p>
                    <p>• Add second 20-min incline walk on Saturday</p>
                    <p>• Goal: body fat ↓ ~1-2%, waist tightening, V-taper starting</p>
                  </div>
                )}
              </div>
            )
          })}

          {/* Plateau prevention */}
          <div className="card">
            <p className="text-white font-semibold mb-3">⚠️ Plateau Prevention</p>
            <div className="space-y-2 text-sm">
              {[
                { week: 'Wk 1-4', rule: 'Stick to 1,950 cal. Do NOT drop calories.' },
                { week: 'Wk 4 check', rule: 'Weight stuck 2 weeks? Add 20 min walking — not cut food.' },
                { week: 'Wk 8 check', rule: 'Still stuck? Reduce carbs 20g only — not total calories.' },
                { week: 'Never', rule: 'Go below 1,800 cal while training 5 days.', warn: true },
              ].map(({ week, rule, warn }) => (
                <div key={week} className="flex gap-3">
                  <span className="text-green-400 text-xs font-mono w-20 flex-shrink-0 pt-0.5">{week}</span>
                  <p className={warn ? 'text-red-400' : 'text-slate-300'}>{rule}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Meals' && (
        <div className="space-y-3">
          {/* Targets */}
          <div className="card">
            <p className="text-white font-semibold mb-2">Daily Targets</p>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              {[
                { label: 'Workout day', val: '1,950 kcal' },
                { label: 'Cardio day (Wed)', val: '1,850 kcal' },
                { label: 'Rest day', val: '1,750 kcal' },
                { label: 'Protein (all days)', val: '150g' },
                { label: 'Water (workout)', val: '3.5 litres' },
                { label: 'Water (rest)', val: '3 litres' },
              ].map(({ label, val }) => (
                <div key={label}>
                  <p className="text-slate-400 text-xs">{label}</p>
                  <p className="text-white font-semibold">{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Meal timing */}
          {[
            { time: '7:00 AM', name: 'Breakfast', cal: '~400 kcal · 32g protein', items: 'Oats (60g) + 2 eggs + banana + 10 almonds' },
            { time: '10:30 AM', name: 'Mid-morning snack', cal: '~180 kcal · 18g protein', items: 'Greek yogurt 150g OR 2 boiled eggs + apple OR roasted chana 40g' },
            { time: '1:00 PM', name: 'Lunch', cal: '~520 kcal · 42g protein', items: 'Dal + paneer bhurji/egg curry + 2 chapati + salad + curd' },
            { time: '4:30 PM', name: 'Pre-workout', cal: '~220 kcal · 22g protein', items: 'Whey shake (1 scoop) + banana or 3 dates' },
            { time: 'Post-gym', name: 'Post-workout', cal: '~280 kcal · 28g protein', items: 'Whey in 250ml milk + rice (80g) or banana' },
            { time: '8:00 PM', name: 'Dinner', cal: '~420 kcal · 35g protein', items: '3-egg bhurji or paneer sabji + 1-2 chapati + large veggies' },
            { time: 'Bedtime', name: 'Optional snack', cal: '~150 kcal · 12g protein', items: '250ml warm milk or 150g Greek yogurt (casein)' },
          ].map(meal => (
            <div key={meal.time} className="card">
              <div className="flex justify-between mb-1">
                <p className="text-green-400 text-xs font-mono">{meal.time}</p>
                <p className="text-slate-400 text-xs">{meal.cal}</p>
              </div>
              <p className="text-white font-semibold">{meal.name}</p>
              <p className="text-slate-300 text-sm mt-1">{meal.items}</p>
            </div>
          ))}

          {/* Sweet cravings */}
          <div className="card border border-orange-400/20">
            <p className="text-orange-400 font-semibold mb-2">🍫 Sweet Craving Fix</p>
            <div className="space-y-1.5 text-sm">
              {[
                { fix: 'Saunf (fennel seeds) 1 tsp', cal: '0 kcal — best option' },
                { fix: 'Lindt 70%+ dark chocolate, 1 square', cal: '~50 kcal' },
                { fix: 'Banana or 4-5 dates', cal: '~80-100 kcal' },
                { fix: 'Warm milk + haldi + tiny honey', cal: '~150 kcal (bedtime)' },
              ].map(({ fix, cal }) => (
                <div key={fix} className="flex justify-between">
                  <p className="text-slate-300">{fix}</p>
                  <p className="text-slate-500 text-xs ml-2 flex-shrink-0">{cal}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Protein table */}
          <div className="card">
            <p className="text-white font-semibold mb-3">Top Protein Sources</p>
            <div className="space-y-1.5">
              {COMMON_FOODS.filter(f => f.protein >= 6).map(f => (
                <div key={f.name} className="flex items-center justify-between text-sm">
                  <p className="text-slate-300 flex-1 truncate">{f.name}</p>
                  <p className="text-green-400 font-semibold ml-2">{f.protein}g</p>
                  <p className="text-slate-500 ml-2">{f.cal} kcal</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Rules' && (
        <div className="space-y-3">
          {/* 5 non-negotiables */}
          <div className="card">
            <p className="text-white font-bold mb-3">The 5 Non-Negotiables</p>
            {[
              { emoji: '🥩', rule: '150g protein daily', why: 'Without this, training doesn\'t build anything' },
              { emoji: '👟', rule: '8,000 steps minimum', why: 'Doubles daily calorie burn vs sitting' },
              { emoji: '😴', rule: 'Sleep 7-8 hours', why: 'GH and testosterone peak during deep sleep' },
              { emoji: '💧', rule: '3L water daily', why: 'Reduces hunger, improves gym performance ~10%' },
              { emoji: '📝', rule: 'Log every workout', why: 'Without logs, progressive overload is impossible' },
            ].map(({ emoji, rule, why }) => (
              <div key={rule} className="flex gap-3 mb-3">
                <span className="text-2xl">{emoji}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{rule}</p>
                  <p className="text-slate-400 text-xs">{why}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Training rules */}
          <div className="card">
            <p className="text-white font-semibold mb-3">Training Rules</p>
            {[
              { rule: 'Rest between sets', val: '60-90s isolation · 2-3 min compound' },
              { rule: 'Progressive overload', val: 'Add 1-2 kg when 12 reps easy × 2 sessions' },
              { rule: 'Leave reps in tank', val: '1-2 reps reserve — not failure every set' },
              { rule: 'Warmup every session', val: '5 min treadmill + arm circles + 50% set' },
              { rule: 'Weigh yourself', val: 'Morning, fasted, post-toilet. 7-day average.' },
              { rule: 'Never skip legs', val: 'Thu is legs day — respect it' },
            ].map(({ rule, val }) => (
              <div key={rule} className="flex gap-3 mb-2.5">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">{rule}</p>
                  <p className="text-slate-400 text-xs">{val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* IT desk strategies */}
          <div className="card">
            <p className="text-white font-semibold mb-3">💻 IT Desk Worker Rules</p>
            {[
              'Every time you finish a 500ml bottle: stand up, refill, do 10 squats',
              'No food after 8 PM — late-night eating is #1 reason for belly fat in IT workers',
              'Coffee: max 2 cups before 2 PM. After 2 PM → green tea or water',
              'Posture reset every 45 min: stand, roll shoulders, squeeze glutes 10 sec',
              'Pre-pack snacks Sunday: 10 boiled eggs, chana, yogurt. Remove 4 PM decision.',
              'Canteen pick: dal + roti + sabji. Avoid: fried rice, samosa, sweet lassi',
            ].map((tip, i) => (
              <div key={i} className="flex gap-2 mb-2 text-sm">
                <span className="text-slate-500 text-xs mt-0.5">•</span>
                <p className="text-slate-300">{tip}</p>
              </div>
            ))}
          </div>

          {/* 12-week expected results */}
          <div className="card border border-green-500/20">
            <p className="text-white font-bold mb-3">Week 12 Expected Results</p>
            <p className="text-slate-400 text-xs mb-2 font-semibold">WHAT WILL VISIBLY CHANGE</p>
            {[
              'Waist: 33.2" → ~31-31.5"',
              'Love handle softness noticeably reduced',
              'Shoulder & arm definition — deltoids show a clear edge',
              'Back begins showing a V-taper',
              'Forward shoulder rounding largely corrected',
              'Face looks noticeably leaner (often the first place people notice)',
            ].map((r, i) => (
              <p key={i} className="text-green-400 text-sm mb-1">✓ {r}</p>
            ))}
            <p className="text-slate-400 text-xs font-semibold mt-3 mb-2">WHAT WON'T CHANGE YET</p>
            <p className="text-slate-400 text-sm">• No visible abs — needs 12-13% body fat (starting at 17.8%)</p>
            <p className="text-slate-400 text-sm">• No dramatic muscle size — beginners build ~1-2 lbs/month max</p>
          </div>

          {/* Supplement */}
          <div className="card border border-yellow-400/20">
            <p className="text-yellow-400 font-semibold mb-1">💊 One Supplement Worth Adding</p>
            <p className="text-white font-semibold">Vitamin D3 + K2</p>
            <p className="text-slate-300 text-sm mt-1">IT workers sitting indoors are almost universally deficient. Affects testosterone, muscle recovery, and mood. 2,000-4,000 IU daily with a fat-containing meal.</p>
          </div>
        </div>
      )}
    </div>
  )
}
