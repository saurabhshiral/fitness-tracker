import { useState } from 'react'
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
      setNum: i + 1, weight: '', reps: '', done: false,
    })),
  }))
}

function getBestWeight(exerciseId, workoutLogs) {
  let best = 0
  workoutLogs.forEach(l =>
    l.exercises?.forEach(e => {
      if (e.exerciseId === exerciseId)
        e.sets?.filter(s => s.done).forEach(s => { if ((s.weight || 0) > best) best = s.weight })
    })
  )
  return best
}

function getLastPerformance(exerciseId, workoutLogs) {
  const past = workoutLogs
    .filter(l => l.exercises?.some(e => e.exerciseId === exerciseId && e.sets?.some(s => s.done)))
    .sort((a, b) => b.date.localeCompare(a.date))
  if (!past.length) return null
  const ex = past[0].exercises.find(e => e.exerciseId === exerciseId)
  const done = ex?.sets?.filter(s => s.done) || []
  return done[0] || null
}

export default function WorkoutLog() {
  const dow = new Date().getDay()
  const defaultWorkout = WORKOUT_PLAN[dow]

  const [selectedDay, setSelectedDay] = useState(
    defaultWorkout ? dow : +(Object.keys(WORKOUT_PLAN).find(k => WORKOUT_PLAN[k] !== null && +k !== 0) || 1)
  )
  const workout = WORKOUT_PLAN[selectedDay]

  const [session, setSession] = useState(() => workout ? buildSession(workout) : [])
  const [expanded, setExpanded] = useState(0)
  const [activeTimer, setActiveTimer] = useState(null)
  const [setModal, setSetModal] = useState(null) // { exIdx, setIdx }
  const [modalWeight, setModalWeight] = useState('')
  const [modalReps, setModalReps] = useState('')
  const [newPR, setNewPR] = useState(false)
  const [startTime] = useState(Date.now())
  const [saved, setSaved] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const [workoutLogs, setWorkoutLogs] = useStorage('fitness_workout_logs', [])

  const totalSets = session.reduce((a, e) => a + e.targetSets, 0)
  const doneSets  = session.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0)
  const allDone   = doneSets === totalSets && totalSets > 0

  function changeDay(d) {
    const w = WORKOUT_PLAN[+d]
    setSelectedDay(+d)
    setSession(w ? buildSession(w) : [])
    setExpanded(0)
    setSaved(false)
  }

  function openSetModal(exIdx, setIdx) {
    const ex = session[exIdx]
    const last = getLastPerformance(ex.exerciseId, workoutLogs)
    // Only pre-fill weight if the previous value was > 0
    setModalWeight(last?.weight > 0 ? String(last.weight) : '')
    setModalReps(last?.reps > 0 ? String(last.reps) : ex.targetReps.split('-')[0] || '')
    setNewPR(false)
    setSetModal({ exIdx, setIdx })
  }

  function confirmSet() {
    if (!setModal) return
    const { exIdx, setIdx } = setModal
    const ex = session[exIdx]
    const weightVal = parseFloat(modalWeight) || 0
    const repsVal   = parseInt(modalReps) || 0

    // Detect PR
    const prev = getBestWeight(ex.exerciseId, workoutLogs)
    const isPR = weightVal > 0 && weightVal > prev

    const newSession = session.map((e, ei) =>
      ei !== exIdx ? e : {
        ...e,
        sets: e.sets.map((s, si) =>
          si !== setIdx ? s : { ...s, weight: weightVal, reps: repsVal, done: true }
        ),
      }
    )
    setSession(newSession)
    setSetModal(null)

    if (isPR) setNewPR(true)

    // Auto-advance to next exercise when this one is complete
    const exDone = newSession[exIdx].sets.every(s => s.done)
    if (exDone && exIdx < session.length - 1) {
      setTimeout(() => setExpanded(exIdx + 1), 300)
    }

    if (ex.rest > 0) {
      setActiveTimer({ seconds: ex.rest, name: `${ex.name} · Set ${setIdx + 1}` })
    }
  }

  function undoLastSet() {
    // Find the most recently done set across all exercises and undo it
    let lastExIdx = -1, lastSetIdx = -1, lastTime = -1
    session.forEach((ex, ei) =>
      ex.sets.forEach((s, si) => {
        if (s.done && (s.timestamp || 0) >= lastTime) {
          lastTime = s.timestamp || 0; lastExIdx = ei; lastSetIdx = si
        }
      })
    )
    // Fallback: find last done set by scanning backwards
    if (lastExIdx === -1) {
      outer: for (let ei = session.length - 1; ei >= 0; ei--) {
        for (let si = session[ei].sets.length - 1; si >= 0; si--) {
          if (session[ei].sets[si].done) { lastExIdx = ei; lastSetIdx = si; break outer }
        }
      }
    }
    if (lastExIdx === -1) return
    setSession(s => s.map((ex, ei) =>
      ei !== lastExIdx ? ex : {
        ...ex,
        sets: ex.sets.map((set, si) =>
          si !== lastSetIdx ? set : { ...set, weight: '', reps: '', done: false }
        ),
      }
    ))
  }

  function clearWorkout() {
    setSession(workout ? buildSession(workout) : [])
    setExpanded(0)
    setSaved(false)
    setShowClearConfirm(false)
  }

  function saveWorkout() {
    const log = {
      date: today(),
      day: DAY_NAMES[selectedDay],
      workoutName: workout.name,
      durationMin: Math.round((Date.now() - startTime) / 60000),
      exercises: session,
    }
    setWorkoutLogs([...workoutLogs.filter(l => l.date !== today()), log])
    setSaved(true)
  }

  if (!workout) {
    return (
      <div className="page">
        <h1 className="text-xl font-bold text-white mb-4">Log Workout</h1>
        <DayPills selectedDay={selectedDay} onChange={changeDay} />
        <div className="card text-center py-12 mt-4">
          <p className="text-4xl mb-3">🌴</p>
          <p className="text-white font-semibold">Rest day — select a day above to log</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      {/* Rest timer overlay */}
      {activeTimer && (
        <RestTimer
          seconds={activeTimer.seconds}
          exerciseName={activeTimer.name}
          onDone={() => { setActiveTimer(null); setNewPR(false) }}
        />
      )}

      {/* PR celebration */}
      {newPR && !activeTimer && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-yellow-500 text-slate-900 font-bold px-5 py-2.5 rounded-full shadow-lg text-sm animate-bounce">
          🏆 New Personal Record!
        </div>
      )}

      {/* Set logging modal */}
      {setModal !== null && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700">
            <p className="text-white font-bold text-base mb-0.5">
              {session[setModal.exIdx]?.name}
            </p>
            <p className="text-slate-400 text-sm mb-1">
              Set {setModal.setIdx + 1} of {session[setModal.exIdx]?.targetSets}
              {' · '}Target: {session[setModal.exIdx]?.targetReps} reps
            </p>
            {(() => {
              const last = getLastPerformance(session[setModal.exIdx]?.exerciseId, workoutLogs)
              return last?.weight > 0
                ? <p className="text-green-400 text-xs mb-3">Last time: {last.weight} kg × {last.reps} reps</p>
                : <p className="text-slate-500 text-xs mb-3">First time logging this exercise</p>
            })()}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Weight (kg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="kg"
                  value={modalWeight}
                  onChange={e => setModalWeight(e.target.value)}
                  className="input-field text-center text-2xl font-bold h-16"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Reps done</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="reps"
                  value={modalReps}
                  onChange={e => setModalReps(e.target.value)}
                  className="input-field text-center text-2xl font-bold h-16"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSetModal(null)} className="btn-secondary flex-1 py-3">Cancel</button>
              <button
                onClick={confirmSet}
                disabled={!modalWeight && !modalReps}
                className="btn-primary flex-1 py-3 disabled:opacity-40"
              >
                Log Set ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear confirm dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-xs border border-slate-700 text-center">
            <p className="text-white font-bold mb-2">Reset workout?</p>
            <p className="text-slate-400 text-sm mb-5">All logged sets will be cleared.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowClearConfirm(false)} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
              <button onClick={clearWorkout} className="flex-1 bg-red-500 hover:bg-red-400 text-white font-semibold py-2.5 rounded-xl text-sm">Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-white">{workout.name} Day</h1>
        <DaySelector selectedDay={selectedDay} onChange={changeDay} />
      </div>

      {/* Progress + action row */}
      <div className="card mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>{workout.focus}</span>
          <span className="font-medium">{doneSets}/{totalSets} sets</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full mb-3">
          <div
            className="h-full bg-green-400 rounded-full transition-all duration-500"
            style={{ width: totalSets ? `${(doneSets / totalSets) * 100}%` : '0%' }}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={undoLastSet}
            disabled={doneSets === 0}
            className="flex-1 bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-medium py-2 rounded-xl"
          >
            ↩ Undo last set
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={doneSets === 0}
            className="flex-1 bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-medium py-2 rounded-xl"
          >
            🗑 Reset workout
          </button>
        </div>
      </div>

      {/* Exercise list */}
      <div className="space-y-3 mb-4">
        {session.map((ex, exIdx) => {
          const exDone   = ex.sets.filter(s => s.done).length
          const isExpanded = expanded === exIdx
          const complete   = exDone === ex.targetSets
          const last       = getLastPerformance(ex.exerciseId, workoutLogs)
          const isNext     = !complete && session.slice(0, exIdx).every(e => e.sets.every(s => s.done))

          return (
            <div
              key={ex.exerciseId}
              className={`card transition-all ${
                complete   ? 'border-green-500/40 bg-green-500/5' :
                isNext     ? 'border-orange-400/40' : ''
              }`}
            >
              {/* Exercise header — tap to expand/collapse */}
              <button className="w-full text-left py-1" onClick={() => setExpanded(isExpanded ? -1 : exIdx)}>
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: complete ? '#22c55e22' : isNext ? '#f9741622' : '#334155' }}>
                    <span className={complete ? 'text-green-400' : isNext ? 'text-orange-400' : 'text-slate-300'}>
                      {complete ? '✓' : exIdx + 1}
                    </span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${complete ? 'text-green-400' : isNext ? 'text-white' : 'text-slate-300'}`}>
                      {ex.name}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {ex.targetSets} × {ex.targetReps}
                      {ex.rest > 0 && ` · ${ex.rest}s rest`}
                      {last?.weight > 0 && ` · prev ${last.weight}kg`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium ${complete ? 'text-green-400' : 'text-slate-400'}`}>
                      {exDone}/{ex.targetSets}
                    </span>
                    <span className="text-slate-600 text-xs w-4 text-center">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </div>
              </button>

              {/* Set buttons — shown when expanded */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-700/60">
                  {/* 2 cols on mobile, 3 cols on md+ for bigger tap targets */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ex.sets.map((s, si) => (
                      <button
                        key={si}
                        onClick={() => !s.done && openSetModal(exIdx, si)}
                        className={`rounded-2xl font-semibold transition-all active:scale-95 ${
                          s.done
                            ? 'bg-green-500/20 border border-green-500/40 text-green-400 py-4'
                            : 'bg-slate-700 active:bg-slate-600 text-white py-5'
                        }`}
                      >
                        {s.done ? (
                          <div className="text-center leading-tight">
                            <p className="text-lg">✓</p>
                            <p className="text-xs font-normal mt-0.5 opacity-80">
                              {s.weight > 0 ? `${s.weight}kg` : 'BW'} × {s.reps}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm">Set {s.setNum}</p>
                        )}
                      </button>
                    ))}
                  </div>

                  {complete && exIdx < session.length - 1 && (
                    <button
                      className="w-full mt-3 bg-orange-400/10 text-orange-400 text-sm font-semibold py-2.5 rounded-xl"
                      onClick={() => setExpanded(exIdx + 1)}
                    >
                      Next: {session[exIdx + 1].name} →
                    </button>
                  )}
                </div>
              )}

              {/* If not expanded but is the next exercise, show a nudge */}
              {!isExpanded && isNext && !complete && (
                <p className="text-orange-400 text-xs mt-2">↑ Tap to log sets</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Save / saved */}
      {saved ? (
        <div className="card text-center bg-green-500/10 border-green-500/30">
          <p className="text-green-400 font-bold text-xl">🎉 Workout saved!</p>
          <p className="text-slate-400 text-sm mt-1">
            {Math.round((Date.now() - startTime) / 60000)} min · {doneSets} sets
          </p>
        </div>
      ) : (
        <button
          onClick={saveWorkout}
          disabled={doneSets === 0}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-colors ${
            allDone  ? 'bg-green-500 hover:bg-green-400 text-white' :
            doneSets > 0 ? 'bg-slate-700 text-white' :
            'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          {allDone ? '🎉 Complete & Save' : doneSets > 0 ? `Save (${doneSets}/${totalSets} sets)` : 'Log sets above to save'}
        </button>
      )}
    </div>
  )
}

function DaySelector({ selectedDay, onChange }) {
  const options = Object.entries(WORKOUT_PLAN)
    .filter(([, v]) => v !== null)
    .map(([k, v]) => ({ day: +k, label: v.name }))

  return (
    <select
      value={selectedDay}
      onChange={e => onChange(e.target.value)}
      className="bg-slate-700 text-white text-sm rounded-xl px-3 py-2 outline-none border border-slate-600 max-w-[140px]"
    >
      {options.map(o => (
        <option key={o.day} value={o.day}>
          {['—','Mon','Tue','Wed','Thu','Fri','—'][o.day]} · {o.label}
        </option>
      ))}
    </select>
  )
}

function DayPills({ selectedDay, onChange }) {
  const options = Object.entries(WORKOUT_PLAN)
    .filter(([, v]) => v !== null)
    .map(([k, v]) => ({ day: +k, label: v.name }))

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {options.map(o => (
        <button
          key={o.day}
          onClick={() => onChange(o.day)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            +selectedDay === o.day ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-300'
          }`}
        >
          {['—','Mon','Tue','Wed','Thu','Fri','—'][o.day]}
        </button>
      ))}
    </div>
  )
}
