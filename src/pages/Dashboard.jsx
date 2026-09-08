import { Link } from 'react-router-dom'
import { useStorage, today, getWeekNumber, getCurrentPhase } from '../hooks/useStorage'
import { WORKOUT_PLAN, PROGRAM_START, STEPS_TARGET, CALORIE_TARGETS, STARTING_STATS } from '../data/fitnessPlan'

function StatCard({ label, value, unit, valueColor = 'text-white', sub, icon }) {
  return (
    <div className="card">
      <p className="text-slate-400 text-xs flex items-center gap-1">{icon && <span>{icon}</span>}{label}</p>
      <p className={`text-2xl font-bold mt-1 ${valueColor}`}>
        {value}
        {unit && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}
      </p>
      {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const dow = new Date().getDay()
  const workout = WORKOUT_PLAN[dow]
  const currentDate = today()
  const week = getWeekNumber(PROGRAM_START)
  const phase = getCurrentPhase(PROGRAM_START)

  const [dailyLogs] = useStorage('fitness_daily_logs', [])
  const [bodyStats] = useStorage('fitness_body_stats', [STARTING_STATS])
  const [workoutLogs] = useStorage('fitness_workout_logs', [])

  const todayLog = dailyLogs.find(l => l.date === currentDate) || {}
  const latestStat = bodyStats[bodyStats.length - 1] || STARTING_STATS
  const startStat = bodyStats[0] || STARTING_STATS
  const weightDelta = (latestStat.weight - startStat.weight).toFixed(1)

  const calTarget = workout
    ? (dow === 3 ? CALORIE_TARGETS.cardio : CALORIE_TARGETS.workout)
    : CALORIE_TARGETS.rest

  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const hr = new Date().getHours()
  const greeting = hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening'

  // Sessions completed in the current Mon-Sun week. A consecutive-*day* streak
  // is useless on a 5-day plan — it would reset to zero every weekend.
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const pad = n => String(n).padStart(2, '0')
  const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i); return key(d)
  })
  const weekSessions = weekDates.filter(d => workoutLogs.some(l => l.date === d)).length
  const loggedToday = workoutLogs.some(l => l.date === currentDate)

  return (
    <div className="page">
      {/* Header */}
      <div className="mb-5">
        <p className="text-slate-400 text-sm">
          {dayNames[dow]}, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
        </p>
        <h1 className="text-2xl font-bold text-white">Good {greeting}, Saurabh 👋</h1>
      </div>

      {/* Phase progress bar */}
      <div className="card mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-green-400 text-xs font-semibold tracking-wider">WEEK {week} / 12 · PHASE {phase.phase}</p>
          <p className="text-white font-semibold">{phase.name}</p>
          <p className="text-slate-400 text-xs mt-0.5">{phase.weeks} weeks</p>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="w-20 h-2 bg-slate-700 rounded-full mb-1">
            <div
              className="h-full bg-green-400 rounded-full transition-all"
              style={{ width: `${(week / 12) * 100}%` }}
            />
          </div>
          <p className="text-slate-500 text-xs">{Math.round((week/12)*100)}%</p>
        </div>
      </div>

      {/* Today's workout */}
      {workout ? (
        <Link to="/workout" className="block card mb-4 hover:border-green-500/50 active:scale-[0.98] transition-all">
          <div className="flex items-center justify-between mb-2">
            {loggedToday ? (
              <span className="text-xs font-semibold text-green-400 bg-green-400/10 px-2.5 py-0.5 rounded-full">
                ✓ COMPLETED TODAY
              </span>
            ) : (
              <span className="text-xs font-semibold text-orange-400 bg-orange-400/10 px-2.5 py-0.5 rounded-full">
                TODAY'S WORKOUT
              </span>
            )}
            <span className="text-slate-400 text-xs">{workout.duration}</span>
          </div>
          <p className="text-xl font-bold text-white">{workout.name} Day</p>
          <p className="text-slate-400 text-sm mb-3">{workout.focus}</p>
          <div className="flex flex-wrap gap-1 mb-3">
            {workout.exercises.slice(0,4).map(ex => (
              <span key={ex.id} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                {ex.name.split(' ').slice(-2).join(' ')}
              </span>
            ))}
          </div>
          <p className="text-green-400 text-sm font-semibold">
            {loggedToday ? 'Tap to review or edit →' : 'Tap to start →'}
          </p>
        </Link>
      ) : (
        <div className="card mb-4">
          <span className="text-xs font-semibold text-blue-400 bg-blue-400/10 px-2.5 py-0.5 rounded-full">
            REST DAY
          </span>
          <p className="text-white font-semibold mt-2">Active Recovery</p>
          <p className="text-slate-400 text-sm mt-1">
            Walk 20-30 min · Target {STEPS_TARGET.toLocaleString()} steps · Sleep 7-8 hrs
          </p>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard
          icon="🔥"
          label="Cal target today"
          value={calTarget}
          unit="kcal"
          valueColor="text-orange-400"
          sub={todayLog.calories ? `Logged ${todayLog.calories} kcal` : 'Not logged yet'}
        />
        <StatCard
          icon="🥩"
          label="Protein target"
          value={150}
          unit="g"
          valueColor="text-green-400"
          sub={todayLog.protein ? `Logged ${todayLog.protein}g` : 'Not logged yet'}
        />
        <StatCard
          icon="👟"
          label="Steps today"
          value={todayLog.steps ? todayLog.steps.toLocaleString() : '—'}
          valueColor={todayLog.steps >= STEPS_TARGET ? 'text-green-400' : 'text-white'}
          sub={`Target: ${STEPS_TARGET.toLocaleString()}`}
        />
        <StatCard
          icon="⚖️"
          label="Weight"
          value={latestStat.weight}
          unit="kg"
          sub={bodyStats.length > 1
            ? `${weightDelta > 0 ? '+' : ''}${weightDelta} from start`
            : 'Starting weight'}
        />
      </div>

      {/* Streak + daily reminder */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="text-slate-400 text-xs mb-1">🔥 This week</p>
          <p className={`text-3xl font-bold ${weekSessions >= 5 ? 'text-green-400' : 'text-orange-400'}`}>
            {weekSessions}<span className="text-lg text-slate-500">/5</span>
          </p>
          <div className="flex gap-1 justify-center mt-2">
            {weekDates.slice(0, 5).map(d => (
              <span
                key={d}
                className={`w-2 h-2 rounded-full ${
                  workoutLogs.some(l => l.date === d) ? 'bg-green-400'
                    : d > currentDate ? 'bg-slate-600' : 'bg-red-500/40'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="card">
          <p className="text-slate-400 text-xs mb-2">Today's non-negotiables</p>
          <div className="space-y-1">
            <p className="text-sm text-slate-300">💧 3.5L water</p>
            <p className="text-sm text-slate-300">😴 7-8 hrs sleep</p>
            <p className="text-sm text-slate-300">🥩 150g protein</p>
          </div>
        </div>
      </div>

      {workout?.tip && (
        <div className="mt-3 bg-orange-400/10 border border-orange-400/20 rounded-xl px-4 py-2.5">
          <p className="text-orange-400 text-sm">💡 {workout.tip}</p>
        </div>
      )}
    </div>
  )
}
