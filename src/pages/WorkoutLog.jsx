import { useState, useEffect } from 'react'
import { useStorage, lastWeekday, formatDate } from '../hooks/useStorage'
import { WORKOUT_PLAN } from '../data/fitnessPlan'
import RestTimer from '../components/RestTimer'

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const SHORT_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const DRAFT_KEY = 'fitness_workout_draft'

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

/** Restore an in-progress workout (phone locked, tab switched, accidental nav
 *  away) or an already-saved one, so logged sets are never silently lost. */
function loadSession(day, logDate, workout, logs) {
  if (!workout) return { exercises: [], startedAt: Date.now(), restored: null }

  const saved = logs.find(l => l.date === logDate)
  if (saved?.exercises?.length) {
    return { exercises: saved.exercises, startedAt: Date.now(), restored: 'saved' }
  }
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null')
    if (draft?.date === logDate && draft?.day === day && draft.exercises?.length) {
      const anyDone = draft.exercises.some(e => e.sets.some(s => s.done))
      return {
        exercises: draft.exercises,
        startedAt: draft.startedAt || Date.now(),
        restored: anyDone ? 'draft' : null,
      }
    }
  } catch { /* corrupt draft — fall through to a fresh session */ }

  return { exercises: buildSession(workout), startedAt: Date.now(), restored: null }
}

function getBestWeight(exerciseId, workoutLogs, excludeDate) {
  let best = 0
  workoutLogs.forEach(l => {
    if (l.date === excludeDate) return
    l.exercises?.forEach(e => {
      if (e.exerciseId === exerciseId)
        e.sets?.filter(s => s.done).forEach(s => { if ((s.weight || 0) > best) best = s.weight })
    })
  })
  return best
}

function getLastPerformance(exerciseId, workoutLogs, excludeDate) {
  const past = workoutLogs
    .filter(l => l.date !== excludeDate &&
      l.exercises?.some(e => e.exerciseId === exerciseId && e.sets?.some(s => s.done)))
    .sort((a, b) => b.date.localeCompare(a.date))
  if (!past.length) return null
  const ex = past[0].exercises.find(e => e.exerciseId === exerciseId)
  const done = ex?.sets?.filter(s => s.done) || []
  return done.length ? { ...done[0], date: past[0].date } : null
}

export default function WorkoutLog() {
  const dow = new Date().getDay()
  const [workoutLogs, setWorkoutLogs] = useStorage('fitness_workout_logs', [])

  const [selectedDay, setSelectedDay] = useState(
    WORKOUT_PLAN[dow] ? dow : +(Object.keys(WORKOUT_PLAN).find(k => WORKOUT_PLAN[k] !== null) || 1)
  )
  const workout = WORKOUT_PLAN[selectedDay]
  // The date this workout belongs to — not always today. Picking "Tuesday" on a
  // Thursday logs against Tuesday's date, not Thursday's.
  const logDate = lastWeekday(selectedDay)

  const [init] = useState(() => loadSession(selectedDay, logDate, workout, workoutLogs))
  const [session, setSession] = useState(init.exercises)
  const [startedAt, setStartedAt] = useState(init.startedAt)
  const [restored, setRestored] = useState(init.restored)
  const [saved, setSaved] = useState(init.restored === 'saved')

  const [expanded, setExpanded] = useState(0)
  const [activeTimer, setActiveTimer] = useState(null)
  const [setModal, setSetModal] = useState(null)
  const [modalWeight, setModalWeight] = useState('')
  const [modalReps, setModalReps] = useState('')
  const [newPR, setNewPR] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const totalSets = session.reduce((a, e) => a + e.targetSets, 0)
  const doneSets  = session.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0)
  const allDone   = doneSets === totalSets && totalSets > 0

  // Persist every change so a locked screen or app switch never loses sets
  useEffect(() => {
    if (!workout || saved) return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        date: logDate, day: selectedDay, startedAt, exercises: session,
      }))
    } catch { /* storage full — in-memory state still works */ }
  }, [session, logDate, selectedDay, startedAt, saved, workout])

  function changeDay(d) {
    const day = +d
    const w = WORKOUT_PLAN[day]
    const date = lastWeekday(day)
    const next = loadSession(day, date, w, workoutLogs)
    setSelectedDay(day)
    setSession(next.exercises)
    setStartedAt(next.startedAt)
    setRestored(next.restored)
    setSaved(next.restored === 'saved')
    setExpanded(0)
  }

  function openSetModal(exIdx, setIdx) {
    const ex = session[exIdx]
    const existing = ex.sets[setIdx]
    const last = getLastPerformance(ex.exerciseId, workoutLogs, logDate)
    // Editing a logged set shows its own values; otherwise pre-fill from last
    // time, but only when that value was actually > 0.
    if (existing.done) {
      setModalWeight(existing.weight > 0 ? String(existing.weight) : '')
      setModalReps(existing.reps > 0 ? String(existing.reps) : '')
    } else {
      setModalWeight(last?.weight > 0 ? String(last.weight) : '')
      setModalReps(last?.reps > 0 ? String(last.reps) : ex.targetReps.split('-')[0] || '')
    }
    setNewPR(false)
    setSetModal({ exIdx, setIdx })
  }

  function confirmSet() {
    if (!setModal) return
    const { exIdx, setIdx } = setModal
    const ex = session[exIdx]
    const wasDone = ex.sets[setIdx].done
    const weightVal = parseFloat(modalWeight) || 0
    const repsVal   = parseInt(modalReps) || 0

    const prevBest = getBestWeight(ex.exerciseId, workoutLogs, logDate)
    const isPR = weightVal > 0 && weightVal > prevBest

    const newSession = session.map((e, ei) =>
      ei !== exIdx ? e : {
        ...e,
        sets: e.sets.map((s, si) =>
          si !== setIdx ? s : { ...s, weight: weightVal, reps: repsVal, done: true, at: Date.now() }
        ),
      }
    )
    setSession(newSession)
    setSetModal(null)
    setSaved(false)
    setRestored(null)
    if (isPR) setNewPR(true)

    // Editing an already-logged set shouldn't restart rest or jump you forward
    if (wasDone) return

    const exDone = newSession[exIdx].sets.every(s => s.done)
    if (exDone && exIdx < session.length - 1) {
      setTimeout(() => setExpanded(exIdx + 1), 300)
    }
    if (ex.rest > 0) {
      setActiveTimer({ seconds: ex.rest, name: `${ex.name} · Set ${setIdx + 1}` })
    }
  }

  function undoLastSet() {
    let exIdx = -1, setIdx = -1, latest = -1
    session.forEach((ex, ei) => ex.sets.forEach((s, si) => {
      if (s.done && (s.at || 0) >= latest) { latest = s.at || 0; exIdx = ei; setIdx = si }
    }))
    if (exIdx === -1) return
    setSession(s => s.map((ex, ei) =>
      ei !== exIdx ? ex : {
        ...ex,
        sets: ex.sets.map((set, si) =>
          si !== setIdx ? set : { ...set, weight: '', reps: '', done: false, at: undefined }
        ),
      }
    ))
    setExpanded(exIdx)
    setSaved(false)
  }

  function clearWorkout() {
    setSession(workout ? buildSession(workout) : [])
    setStartedAt(Date.now())
    setExpanded(0)
    setSaved(false)
    setRestored(null)
    setShowClearConfirm(false)
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
  }

  function saveWorkout() {
    const log = {
      date: logDate,
      dow: selectedDay,
      day: DAY_NAMES[selectedDay],
      workoutName: workout.name,
      durationMin: Math.max(1, Math.round((Date.now() - startedAt) / 60000)),
      exercises: session,
    }
    setWorkoutLogs(
      [...workoutLogs.filter(l => l.date !== logDate), log]
        .sort((a, b) => a.date.localeCompare(b.date))
    )
    setSaved(true)
    setRestored('saved')
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
  }

  function deleteWorkout() {
    setWorkoutLogs(workoutLogs.filter(l => l.date !== logDate))
    clearWorkout()
  }

  const isToday = selectedDay === dow

  if (!workout) {
    return (
      <div className="page">
        <h1 className="text-xl font-bold text-white mb-4">Log Workout</h1>
        <DaySelector selectedDay={selectedDay} onChange={changeDay} />
        <div className="card text-center py-12 mt-4">
          <p className="text-4xl mb-3">🌴</p>
          <p className="text-white font-semibold">Rest day</p>
          <p className="text-slate-400 text-sm mt-1">Pick a day above to log a missed session</p>
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
          onDone={() => { setActiveTimer(null); setNewPR(false) }}
        />
      )}

      {newPR && !activeTimer && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-yellow-500 text-slate-900 font-bold px-5 py-2.5 rounded-full shadow-lg text-sm animate-bounce">
          🏆 New Personal Record!
        </div>
      )}

      {/* Set logging modal */}
      {setModal !== null && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700">
            <p className="text-white font-bold text-base mb-0.5">{session[setModal.exIdx]?.name}</p>
            <p className="text-slate-400 text-sm mb-1">
              Set {setModal.setIdx + 1} of {session[setModal.exIdx]?.targetSets}
              {' · '}Target: {session[setModal.exIdx]?.targetReps} reps
            </p>
            {(() => {
              const last = getLastPerformance(session[setModal.exIdx]?.exerciseId, workoutLogs, logDate)
              return last?.weight > 0
                ? <p className="text-green-400 text-xs mb-3">Last time ({formatDate(last.date)}): {last.weight} kg × {last.reps} reps</p>
                : <p className="text-slate-500 text-xs mb-3">First time logging this exercise</p>
            })()}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Weight (kg)</label>
                <input
                  type="number" inputMode="decimal" placeholder="kg"
                  value={modalWeight}
                  onChange={e => setModalWeight(e.target.value)}
                  className="input-field text-center text-2xl font-bold h-16"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Reps done</label>
                <input
                  type="number" inputMode="numeric" placeholder="reps"
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
                {session[setModal.exIdx]?.sets[setModal.setIdx]?.done ? 'Update ✓' : 'Log Set ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-xs border border-slate-700 text-center">
            <p className="text-white font-bold mb-2">{saved ? 'Delete this workout?' : 'Reset workout?'}</p>
            <p className="text-slate-400 text-sm mb-5">
              {saved
                ? `The saved workout for ${formatDate(logDate)} will be removed.`
                : 'All logged sets will be cleared.'}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowClearConfirm(false)} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
              <button
                onClick={saved ? deleteWorkout : clearWorkout}
                className="flex-1 bg-red-500 hover:bg-red-400 text-white font-semibold py-2.5 rounded-xl text-sm"
              >
                {saved ? 'Delete' : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <h1 className="text-xl font-bold text-white">{workout.name} Day</h1>
        <DaySelector selectedDay={selectedDay} onChange={changeDay} />
      </div>
      <p className="text-slate-400 text-xs mb-3">
        Logging to {formatDate(logDate)}
        {isToday ? ' (today)' : ` · ${DAY_NAMES[selectedDay]}`}
      </p>

      {/* Restored-session banners */}
      {restored === 'draft' && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-2.5 mb-3 flex items-center justify-between gap-2">
          <p className="text-blue-300 text-xs">↻ Resumed your in-progress workout</p>
          <button onClick={() => setRestored(null)} className="text-blue-400 text-lg leading-none">×</button>
        </div>
      )}
      {saved && restored === 'saved' && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2.5 mb-3">
          <p className="text-green-300 text-xs">✓ Already logged — tap any set to edit, then re-save</p>
        </div>
      )}

      {/* Progress + actions */}
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
            {saved ? '🗑 Delete workout' : '🗑 Reset workout'}
          </button>
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-3 mb-4">
        {session.map((ex, exIdx) => {
          const exDone     = ex.sets.filter(s => s.done).length
          const isExpanded = expanded === exIdx
          const complete   = exDone === ex.targetSets
          const last       = getLastPerformance(ex.exerciseId, workoutLogs, logDate)
          const isNext     = !complete && session.slice(0, exIdx).every(e => e.sets.every(s => s.done))

          return (
            <div
              key={ex.exerciseId}
              className={`card transition-all ${
                complete ? 'border-green-500/40 bg-green-500/5' : isNext ? 'border-orange-400/40' : ''
              }`}
            >
              <button className="w-full text-left py-1" onClick={() => setExpanded(isExpanded ? -1 : exIdx)}>
                <div className="flex items-center gap-3">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: complete ? '#22c55e22' : isNext ? '#f9741622' : '#334155' }}
                  >
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
                    <span className="text-slate-600 text-xs w-4 text-center">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-700/60">
                  {/* 2 cols on mobile for a comfortable tap target */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ex.sets.map((s, si) => (
                      <button
                        key={si}
                        onClick={() => openSetModal(exIdx, si)}
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

              {!isExpanded && isNext && !complete && (
                <p className="text-orange-400 text-xs mt-2">↑ Tap to log sets</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Save */}
      {saved ? (
        <div className="card text-center bg-green-500/10 border-green-500/30">
          <p className="text-green-400 font-bold text-xl">🎉 Workout saved!</p>
          <p className="text-slate-400 text-sm mt-1">{doneSets} sets logged for {formatDate(logDate)}</p>
        </div>
      ) : (
        <button
          onClick={saveWorkout}
          disabled={doneSets === 0}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-colors ${
            allDone ? 'bg-green-500 hover:bg-green-400 text-white'
              : doneSets > 0 ? 'bg-slate-700 text-white'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          {allDone ? '🎉 Complete & Save'
            : doneSets > 0 ? `Save (${doneSets}/${totalSets} sets)`
            : 'Log sets above to save'}
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
      className="bg-slate-700 text-white text-sm rounded-xl px-3 py-2 outline-none border border-slate-600 max-w-[150px]"
    >
      {options.map(o => (
        <option key={o.day} value={o.day}>{SHORT_DAYS[o.day]} · {o.label}</option>
      ))}
    </select>
  )
}
