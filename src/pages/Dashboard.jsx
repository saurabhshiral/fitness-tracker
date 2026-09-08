import { Link } from 'react-router-dom'
import { useStorage, today, getWeekNumber, getCurrentPhase, getProgramStartDate, restartProgram } from '../hooks/useStorage'
import { useSettings } from '../hooks/useSettings'
import { WORKOUT_PLAN, PROGRAM_START, STARTING_STATS } from '../data/fitnessPlan'
import { targetsFor, dayTypeFor } from '../lib/coach'
import WeeklyCheckIn from '../components/WeeklyCheckIn'
import Icon from '../components/Icon'
import { useTheme } from '../hooks/useTheme'

function StatCard({ label, value, unit, valueColor = 'text-slate-50', sub, icon }) {
  return (
    <div className="card">
      <p className="text-slate-400 text-xs flex items-center gap-1.5">
        {icon && <Icon name={icon} size={14} strokeWidth={1.9} className="text-slate-500" />}
        {label}
      </p>
      <p className={`text-2xl font-semibold mt-1.5 tracking-tightest tabular-nums ${valueColor}`}>
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

  // Custom start overrides the hardcoded constant when the user has restarted
  const startDate = getProgramStartDate() || PROGRAM_START
  const week = getWeekNumber(startDate)
  const programDone = week > 12
  const phase = getCurrentPhase(startDate)

  const [dailyLogs] = useStorage('fitness_daily_logs', [])
  const [bodyStats] = useStorage('fitness_body_stats', [STARTING_STATS])
  const [workoutLogs] = useStorage('fitness_workout_logs', [])
  const [settings, setSettings] = useSettings()
  const { resolved, setTheme } = useTheme()

  const todayLog = dailyLogs.find(l => l.date === currentDate) || {}
  const latestStat = bodyStats[bodyStats.length - 1] || STARTING_STATS
  const startStat = bodyStats[0] || STARTING_STATS
  const weightDelta = (latestStat.weight - startStat.weight).toFixed(1)

  // Targets are computed from your current lean mass and goal, not hardcoded
  const targets = targetsFor(settings, latestStat, dayTypeFor(dow)) || {}
  const calTarget = targets.calories || 0
  const proteinTarget = targets.protein || 0

  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const hr = new Date().getHours()
  const greeting = hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening'

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

  // Pull summary stats for the program-complete banner
  const totalSessions = workoutLogs.length
  const totalVolume = workoutLogs.reduce((a, l) =>
    a + (l.exercises?.reduce((b, e) =>
      b + (e.sets?.filter(s => s.done).reduce((c, s) => c + (s.weight || 0) * (s.reps || 0), 0) || 0), 0) || 0), 0)
  const weightChange = (latestStat.weight - startStat.weight).toFixed(1)
  const bfChange = ((latestStat.bodyFat || 0) - (startStat.bodyFat || 0)).toFixed(1)

  return (
    <div className="page">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-slate-400 text-sm">
            {dayNames[dow]}, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl font-bold text-slate-50">Good {greeting}, Saurabh</h1>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setTheme(resolved === 'light' ? 'dark' : 'light')}
            className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-orange-400 hover:border-slate-600 transition-colors"
            aria-label={resolved === 'light' ? 'Switch to night mode' : 'Switch to day mode'}
          >
            <Icon name={resolved === 'light' ? 'moon' : 'sun'} size={18} />
          </button>
          <Link
            to="/settings"
            className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:border-slate-600 transition-colors"
            aria-label="Settings"
          >
            <Icon name="settings" size={19} />
          </Link>
        </div>
      </div>

      <WeeklyCheckIn
        bodyStats={bodyStats}
        dailyLogs={dailyLogs}
        workoutLogs={workoutLogs}
        settings={settings}
        setSettings={setSettings}
        latestStat={latestStat}
      />

      {/* Program complete banner — replaces the phase bar */}
      {programDone ? (
        <div className="card mb-4 border-yellow-500/40 bg-yellow-500/5">
          <div className="text-center mb-5">
            <Icon name="trophy" size={40} strokeWidth={1.3} className="text-yellow-400 mx-auto mb-3" />
            <p className="eyebrow text-yellow-400 mb-1.5">12-week program complete</p>
            <p className="text-slate-50 font-semibold text-xl tracking-tightest">You did it, Saurabh</p>
            <p className="text-slate-400 text-sm mt-1">Twelve weeks of consistent training, finished.</p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center mb-4">
            <div>
              <p className="text-slate-400 text-xs">Sessions</p>
              <p className="text-slate-50 font-bold">{totalSessions}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Tonnage</p>
              <p className="text-slate-50 font-bold text-sm">{(totalVolume / 1000).toFixed(0)}<span className="text-xs font-normal text-slate-400">t</span></p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Weight Δ</p>
              <p className={`font-bold ${weightChange <= 0 ? 'text-green-400' : 'text-orange-400'}`}>
                {weightChange > 0 ? '+' : ''}{weightChange}<span className="text-xs font-normal text-slate-400">kg</span>
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">BF Δ</p>
              <p className={`font-bold ${bfChange <= 0 ? 'text-green-400' : 'text-orange-400'}`}>
                {bfChange > 0 ? '+' : ''}{bfChange}<span className="text-xs font-normal text-slate-400">%</span>
              </p>
            </div>
          </div>
          <p className="text-slate-400 text-xs text-center mb-4">
            Log a final body measurement in Progress before restarting, so your transformation is captured.
          </p>
          <div className="flex gap-2">
            <Link to="/progress" className="flex-1 btn-secondary text-center text-sm py-2.5">
              Log final stats
            </Link>
            <button
              onClick={restartProgram}
              className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-semibold text-sm py-2.5 rounded-xl transition-colors"
            >
              Start week 1 again
            </button>
          </div>
        </div>
      ) : (
        /* Phase progress — a 12-segment track rather than a bare percentage.
           Discrete units make remaining effort feel finite and countable,
           which is a far stronger pull than a continuous fill. */
        <div className="card-quiet mb-4">
          <div className="flex items-baseline justify-between mb-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-slate-50 font-semibold">Week {week}</span>
              <span className="text-slate-500 text-sm">of 12</span>
            </div>
            <span className="text-slate-400 text-xs">
              {phase.name} · phase {phase.phase}
            </span>
          </div>
          <div className="flex gap-[3px]">
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  i < week - 1 ? 'bg-green-500/70'
                    : i === week - 1 ? 'bg-orange-400'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Today's workout — the single focal point of this screen. It gets the
          warm accent, the largest type and a real border so the eye lands here
          first; everything below is deliberately quieter. */}
      {workout ? (
        <Link
          to="/workout"
          className={`group block card mb-4 relative overflow-hidden active:scale-[0.985] transition-all duration-200 ${
            loggedToday ? 'border-green-500/35' : 'border-orange-400/35 hover:border-orange-400/60'
          }`}
        >
          {!loggedToday && (
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/[0.07] via-transparent to-transparent pointer-events-none" />
          )}
          <div className="relative">
            <div className="flex items-center justify-between mb-2.5">
              {loggedToday ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-green-400">
                  <Icon name="check" size={13} strokeWidth={2.4} /> Completed
                </span>
              ) : (
                <span className="eyebrow text-orange-400">Today&rsquo;s session</span>
              )}
              <span className="inline-flex items-center gap-1.5 text-slate-500 text-xs">
                <Icon name="timer" size={13} /> {workout.duration}
              </span>
            </div>

            <p className="text-[26px] leading-tight font-semibold text-slate-50 tracking-tightest">
              {workout.name}
            </p>
            <p className="text-slate-400 text-sm mt-0.5 mb-3.5">{workout.focus}</p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {workout.exercises.slice(0, 4).map(ex => (
                <span key={ex.id} className="text-[11px] bg-slate-700/70 text-slate-300 px-2.5 py-1 rounded-lg">
                  {ex.name.split(' ').slice(-2).join(' ')}
                </span>
              ))}
            </div>

            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
              loggedToday ? 'text-green-400' : 'text-orange-400'
            }`}>
              {loggedToday ? 'Review or edit' : 'Start training'}
              <Icon name="arrow" size={15} strokeWidth={2.1}
                    className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>
      ) : (
        <div className="card mb-4 border-blue-400/25">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="leaf" size={16} className="text-blue-400" />
            <span className="eyebrow text-blue-400">Rest day</span>
          </div>
          <p className="text-xl font-semibold text-slate-50 tracking-tightest">Active recovery</p>
          <p className="text-slate-400 text-sm mt-1">
            Walk 20–30 min · {settings.stepsTarget.toLocaleString()} steps · {settings.sleepTarget} hrs sleep
          </p>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard
          icon="flame"
          label="Calories"
          value={calTarget}
          unit="kcal"
          valueColor="text-orange-400"
          sub={todayLog.calories ? `${todayLog.calories} logged` : 'Not logged yet'}
        />
        <StatCard
          icon="egg"
          label="Protein"
          value={proteinTarget}
          unit="g"
          valueColor="text-green-400"
          sub={todayLog.protein ? `${todayLog.protein}g logged` : 'Not logged yet'}
        />
        <StatCard
          icon="steps"
          label="Steps"
          value={todayLog.steps ? todayLog.steps.toLocaleString() : '—'}
          valueColor={todayLog.steps >= settings.stepsTarget ? 'text-green-400' : 'text-slate-50'}
          sub={`Target ${settings.stepsTarget.toLocaleString()}`}
        />
        <StatCard
          icon="scale"
          label="Weight"
          value={latestStat.weight}
          unit="kg"
          sub={bodyStats.length > 1
            ? `${weightDelta > 0 ? '+' : ''}${weightDelta} kg from start`
            : 'Starting weight'}
        />
      </div>

      {/* This week + non-negotiables */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="eyebrow mb-2">This week</p>
          <p className={`text-3xl font-semibold tracking-tightest tabular-nums ${
            weekSessions >= 5 ? 'text-green-400' : 'text-slate-50'
          }`}>
            {weekSessions}<span className="text-lg text-slate-500 font-normal">/5</span>
          </p>
          {/* Named days beat anonymous dots — you can see *which* session you
              missed, which is what actually prompts making it up. */}
          <div className="flex gap-1 mt-2.5">
            {weekDates.slice(0, 5).map((d, i) => {
              const hit = workoutLogs.some(l => l.date === d)
              const future = d > currentDate
              return (
                <div key={d} className="flex-1 text-center">
                  <div className={`h-1.5 rounded-full mb-1 ${
                    hit ? 'bg-green-400' : future ? 'bg-slate-700' : 'bg-red-400/45'
                  }`} />
                  <span className={`text-[9px] ${hit ? 'text-green-400' : 'text-slate-600'}`}>
                    {['M','T','W','T','F'][i]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <p className="eyebrow mb-2.5">Non-negotiables</p>
          <div className="space-y-2">
            {[
              { icon: 'droplet', text: `${settings.waterTargetL}L water` },
              { icon: 'moon',    text: `${settings.sleepTarget} hrs sleep` },
              { icon: 'egg',     text: `${proteinTarget}g protein` },
            ].map(item => (
              <p key={item.icon} className="flex items-center gap-2 text-sm text-slate-300">
                <Icon name={item.icon} size={14} className="text-slate-500 flex-shrink-0" />
                {item.text}
              </p>
            ))}
          </div>
        </div>
      </div>

      {workout?.tip && (
        <div className="mt-3 flex items-start gap-2.5 bg-slate-800/60 border-l-2 border-orange-400/50 rounded-r-xl px-3.5 py-3">
          <Icon name="flame" size={15} className="text-orange-400 flex-shrink-0 mt-0.5" />
          <p className="text-slate-300 text-sm leading-relaxed">{workout.tip}</p>
        </div>
      )}
    </div>
  )
}
