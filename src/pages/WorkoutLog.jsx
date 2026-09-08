import { useState, useRef } from 'react'
import { useStorage, today } from '../hooks/useStorage'
import { WORKOUT_PLAN } from '../data/fitnessPlan'
import RestTimer from '../components/RestTimer'

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function buildSession(workout) {
  return workout.exercises.map(ex => ({
    exerciseId: ex.id,
    name: ex.name,
    targetSets: ex.sets,
    targetReps: ex.reps,
    rest: ex.rest,
    sets: Array.from({ length: ex.sets }, (_, i) => ({
      setNum: i + 1,
      weight: '',
      reps: '',
      done: false,
    })),
  }))
}

function getLastPerformance(exerciseId, workoutLogs) {
  const past = workoutLogs
    .filter(l => l.exercises?.some(e => e.exerciseId === exerciseId && e.sets?.some(s => s.done)))
    .sort((a, b) => b.date.localeCompare(a.date))
  if (!past.length) return null
  const ex = past[0].exercises.find(e => e.exerciseId === exerciseId)
  const doneSets = ex?.sets?.filter(s => s.done) || []
  if (!doneSets.length) return null
  return doneSets[0]
}

export default function WorkoutLog() {
  const dow = new Date().getDay()
  const defaultWorkout = WORKOUT_PLAN[dow]

  const [selectedDay, setSelectedDay] = useState(
    defaultWorkout ? dow : Object.keys(WORKOUT_PLAN).find(k => WORKOUT_PLAN[k] !== null && +k !== 0)
  )
  const workout = WORKOUT_PLAN[selectedDay]

  const [session, setSession] = useState(() => workout ? buildSession(workout) : [])
  const [expanded, setExpanded] = useState(0)
  const [activeTimer, setActiveTimer] = useState(null) // { seconds, name }
  const [setModal, setSetModal] = useState(null) // { exIdx, setIdx }
  const [modalWeight, setModalWeight] = useState('')
  const [modalReps, setModalReps] = useState('')
  const [startTime] = useState(Date.now())
  const [saved, setSaved] = useState(false)

  const [workoutLogs, setWorkoutLogs] = useStorage('fitness_workout_logs', [])

  const totalSets = session.reduce((a, e) => a + e.targetSets, 0)
  const doneSets = session.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0)
  const allDone = doneSets === totalSets && totalSets > 0

  function changeDay(d) {
    setSelectedDay(+d)
    const w = WORKOUT_PLAN[+d]
    setSession(w ? buildSession(w) : [])
    setExpanded(0)
    setSaved(false)
  }

  function openSetModal(exIdx, setIdx) {
    const ex = session[exIdx]
    const last = getLastPerformance(ex.exerciseId, workoutLogs)
    setModalWeight(last?.weight?.toString() || '')
    setModalReps(last?.reps?.toString() || ex.targetReps.split('-')[0] || '')
    setSetModal({ exIdx, setIdx })
  }

  function confirmSet() {
    if (!setModal) return
    const { exIdx, setIdx } = setModal
    const ex = session[exIdx]
    const newSession = session.map((e, ei) =>
      ei !== exIdx ? e : {
        ...e,
        sets: e.sets.map((s, si) =>
          si !== setIdx ? s : {
            ...s,
            weight: parseFloat(modalWeight) || 0,
            reps: parseInt(modalReps) || 0,
            done: true,
          }
        ),
      }
    )
    setSession(newSession)
    setSetModal(null)

    if (ex.rest > 0) {
      setActiveTimer({ seconds: ex.rest, name: `${ex.name} · Set ${setIdx + 1}` })
    }
  }

  function saveWorkout() {
    const log = {
      date: today(),
      day: DAY_NAMES[selectedDay],
      workoutName: workout.name,
      durationMin: Math.round((Date.now() - startTime) / 60000),
      exercises: session,
    }
    const filtered = workoutLogs.filter(l => l.date !== today())
    setWorkoutLogs([...filtered, log])
    setSaved(true)
  }

  if (!workout) {
    return (
      <div className="page">
        <h1 className="text-xl font-bold text-white mb-4">Log Workout</h1>
        <DaySelector selectedDay={selectedDay} onChange={changeDay} />
        <div className="card text-center py-12 mt-4">
          <p className="text-4xl mb-3">🌴</p>
          <p className="text-white font-semibold">Rest day</p>
          <p className="text-slate-400 text-sm mt-1">Select a different day to log</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      {activeTimer && (
        <RestTimer
          seconds={activeTimer.seconds}
          exerciseName={activeTimer.name}
          onDone={() => setActiveTimer(null)}
        />
      )}

      {setModal !== null && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700">
            <p className="text-white font-semibold mb-1">{session[setModal.exIdx]?.name}</p>
            <p className="text-slate-400 text-sm mb-4">
              Set {setModal.setIdx + 1} of {session[setModal.exIdx]?.targetSets} · Target: {session[setModal.exIdx]?.targetReps} reps
            </p>
            {getLastPerformance(session[setModal.exIdx]?.exerciseId, workoutLogs) && (
              <p className="text-green-400 text-xs mb-3">
                Last time: {getLastPerformance(session[setModal.exIdx]?.exerciseId, workoutLogs).weight}kg × {getLastPerformance(session[setModal.exIdx]?.exerciseId, workoutLogs).reps} reps
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Weight (kg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={modalWeight}
                  onChange={e => setModalWeight(e.target.value)}
                  className="input-field text-center text-xl font-bold"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Reps</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={modalReps}
                  onChange={e => setModalReps(e.target.value)}
                  className="input-field text-center text-xl font-bold"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSetModal(null)} className="btn-secondary flex-1 text-sm py-2.5">Cancel</button>
              <button onClick={confirmSet} className="btn-primary flex-1 text-sm py-2.5">Log Set ✓</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">{workout.name} Day</h1>
        <DaySelector selectedDay={selectedDay} onChange={changeDay} compact />
      </div>

      {/* Progress bar */}
      <div className="card mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>{workout.focus}</span>
          <span>{doneSets}/{totalSets} sets</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full">
          <div
            className="h-full bg-green-400 rounded-full transition-all"
            style={{ width: totalSets ? `${(doneSets / totalSets) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-3 mb-4">
        {session.map((ex, exIdx) => {
          const exDoneSets = ex.sets.filter(s => s.done).length
          const isExpanded = expanded === exIdx
          const exComplete = exDoneSets === ex.targetSets
          const last = getLastPerformance(ex.exerciseId, workoutLogs)

          return (
            <div
              key={ex.exerciseId}
              className={`card transition-all ${exComplete ? 'border-green-500/30 bg-green-500/5' : ''}`}
            >
              <button
                className="w-full text-left"
                onClick={() => setExpanded(isExpanded ? -1 : exIdx)}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-lg ${exComplete ? '✅' : ''}`}>
                    {exComplete ? '✅' : `${exIdx + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${exComplete ? 'text-green-400' : 'text-white'}`}>
                      {ex.name}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {ex.targetSets} × {ex.targetReps}
                      {ex.rest > 0 && ` · ${ex.rest}s rest`}
                      {last && ` · Last: ${last.weight}kg`}
                    </p>
                  </div>
                  <span className="text-slate-500 text-xs">{exDoneSets}/{ex.targetSets}</span>
                  <span className="text-slate-500 text-xs">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="grid grid-cols-3 gap-2">
                    {ex.sets.map((s, si) => (
                      <button
                        key={si}
                        onClick={() => !s.done && openSetModal(exIdx, si)}
                        className={`py-3 rounded-xl text-sm font-semibold transition-colors ${
                          s.done
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-slate-700 text-white hover:bg-slate-600'
                        }`}
                      >
                        {s.done ? (
                          <span>✓<br /><span className="text-xs font-normal">{s.weight}kg×{s.reps}</span></span>
                        ) : (
                          `Set ${s.setNum}`
                        )}
                      </button>
                    ))}
                  </div>
                  {exComplete && exIdx < session.length - 1 && (
                    <button
                      className="w-full mt-2 text-green-400 text-sm py-1"
                      onClick={() => setExpanded(exIdx + 1)}
                    >
                      Next exercise →
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Save button */}
      {saved ? (
        <div className="card text-center bg-green-500/10 border-green-500/30">
          <p className="text-green-400 font-semibold text-lg">🎉 Workout saved!</p>
          <p className="text-slate-400 text-sm mt-1">{Math.round((Date.now() - startTime) / 60000)} min · {doneSets} sets done</p>
        </div>
      ) : (
        <button
          onClick={saveWorkout}
          disabled={doneSets === 0}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-colors ${
            allDone
              ? 'bg-green-500 hover:bg-green-400 text-white'
              : doneSets > 0
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          {allDone ? '🎉 Complete & Save Workout' : doneSets > 0 ? 'Save Partial Workout' : 'Log sets to save'}
        </button>
      )}
    </div>
  )
}

function DaySelector({ selectedDay, onChange, compact }) {
  const options = Object.entries(WORKOUT_PLAN)
    .filter(([, v]) => v !== null)
    .map(([k, v]) => ({ day: +k, label: v.name }))

  if (compact) {
    return (
      <select
        value={selectedDay}
        onChange={e => onChange(e.target.value)}
        className="bg-slate-700 text-white text-sm rounded-xl px-3 py-2 outline-none"
      >
        {options.map(o => (
          <option key={o.day} value={o.day}>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][o.day]} · {o.label}</option>
        ))}
      </select>
    )
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
      {options.map(o => (
        <button
          key={o.day}
          onClick={() => onChange(o.day)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            +selectedDay === o.day ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-300'
          }`}
        >
          {['—','Mon','Tue','Wed','Thu','Fri','—'][o.day]} · {o.label}
        </button>
      ))}
    </div>
  )
}
