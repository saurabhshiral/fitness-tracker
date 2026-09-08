/**
 * Adaptive coaching engine.
 *
 * Everything here runs on your own logged data — there is no external service,
 * model, or API. The core idea is the same one used by adaptive-TDEE apps:
 * a calculated TDEE is only a starting guess, so the real number is inferred
 * from how your weight actually responds over time, and calories are nudged
 * to close the gap between your observed rate of change and your goal rate.
 */

import { WORKOUT_PLAN } from '../data/fitnessPlan'

export const ACTIVITY_LEVELS = {
  sedentary: { label: 'Sedentary — desk job, little walking', mult: 1.2 },
  light:     { label: 'Lightly active — some daily walking',  mult: 1.375 },
  moderate:  { label: 'Moderately active — 5 sessions/week',  mult: 1.55 },
  high:      { label: 'Very active — physical job + gym',     mult: 1.725 },
}

export const GOALS = {
  recomp:   { label: 'Recomp — lose fat, hold muscle', rateKgWk: -0.35, deficitPct: 0.18 },
  cut:      { label: 'Cut — faster fat loss',          rateKgWk: -0.65, deficitPct: 0.25 },
  maintain: { label: 'Maintain current weight',        rateKgWk: 0,     deficitPct: 0 },
  leanbulk: { label: 'Lean bulk — build muscle',       rateKgWk: +0.20, deficitPct: -0.10 },
}

/* ------------------------------------------------------------------ */
/* Energy expenditure                                                  */
/* ------------------------------------------------------------------ */

export function leanMass(weight, bodyFatPct) {
  return weight * (1 - bodyFatPct / 100)
}

/**
 * Katch-McArdle when body fat % is known — it keys off lean mass, so it stays
 * accurate as composition changes and needs no height/age/sex input.
 * Falls back to a weight-only approximation when body fat is unavailable.
 */
export function bmr(latestStat) {
  if (latestStat?.bodyFat > 0 && latestStat?.weight > 0) {
    return Math.round(370 + 21.6 * leanMass(latestStat.weight, latestStat.bodyFat))
  }
  if (latestStat?.weight > 0) return Math.round(latestStat.weight * 22)
  return null
}

export function tdee(latestStat, activity = 'moderate') {
  const base = bmr(latestStat)
  if (!base) return null
  return Math.round(base * (ACTIVITY_LEVELS[activity]?.mult ?? 1.55))
}

/* ------------------------------------------------------------------ */
/* Daily targets                                                       */
/* ------------------------------------------------------------------ */

/** Counts each day type in the plan so the calorie cycle nets to the weekly average. */
function planComposition() {
  const days = Object.values(WORKOUT_PLAN)
  const rest = days.filter(d => !d).length
  const cardio = days.filter(d => d && /cardio/i.test(d.name)).length
  const lifting = days.filter(d => d && !/cardio/i.test(d.name)).length
  return { lifting, cardio, rest }
}

export function dayTypeFor(dow) {
  const w = WORKOUT_PLAN[dow]
  if (!w) return 'rest'
  return /cardio/i.test(w.name) ? 'cardio' : 'workout'
}

/**
 * Calorie cycling that averages out to `base` across the week.
 * Lifting days get +LIFT_BONUS; rest days absorb the offset so the weekly
 * mean is exactly the target. Without this, cycling silently raises intake.
 */
const LIFT_BONUS = 75

export function dayOffsets() {
  const { lifting, rest } = planComposition()
  const restPenalty = rest > 0 ? (lifting * LIFT_BONUS) / rest : 0
  return { workout: LIFT_BONUS, cardio: 0, rest: -Math.round(restPenalty) }
}

/** Weekly-average calorie target before day-type cycling. */
export function baseCalories(settings, latestStat) {
  if (settings.calorieMode === 'manual') {
    return Math.round(settings.manualCalories + (settings.calorieAdjustment || 0))
  }
  const total = tdee(latestStat, settings.activity)
  if (!total) return null
  const goal = GOALS[settings.goal] ?? GOALS.recomp
  return Math.round(total * (1 - goal.deficitPct) + (settings.calorieAdjustment || 0))
}

/**
 * Full macro target for a given day type. Protein is set per kg bodyweight and
 * fat as a share of calories; carbohydrate takes the remainder — so the macros
 * always sum to the calorie target instead of drifting apart.
 */
export function targetsFor(settings, latestStat, dayType) {
  const base = baseCalories(settings, latestStat)
  if (!base) return null

  const calories = Math.max(1200, base + (dayOffsets()[dayType] ?? 0))
  const weight = latestStat?.weight || 70
  const protein = Math.round((settings.proteinPerKg ?? 2.2) * weight)

  // Floor fat at 0.6 g/kg — below that, hormone production suffers
  const fatFromPct = (calories * (settings.fatPct ?? 0.25)) / 9
  const fat = Math.round(Math.max(fatFromPct, 0.6 * weight))

  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4))
  return { calories, protein, carbs, fat }
}

/* ------------------------------------------------------------------ */
/* Weight trend                                                        */
/* ------------------------------------------------------------------ */

function daysBetween(a, b) {
  return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000)
}

/** Least-squares slope. Regression on raw scale readings is the right tool
 *  here — a moving average would add lag on top of already-noisy data. */
function slope(xs, ys) {
  const n = xs.length
  if (n < 2) return null
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my)
    den += (xs[i] - mx) ** 2
  }
  return den === 0 ? null : num / den
}

/**
 * Observed kg/week over the trailing window. Returns null until there are
 * enough spread-out data points to mean anything — a single day-to-day
 * change is water and gut content, not fat.
 */
export function weightTrend(bodyStats, windowDays = 21) {
  const sorted = [...(bodyStats || [])]
    .filter(s => s?.date && s?.weight > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length < 3) return { rate: null, points: sorted.length, spanDays: 0 }

  const last = sorted[sorted.length - 1].date
  const recent = sorted.filter(s => daysBetween(s.date, last) <= windowDays)
  if (recent.length < 3) return { rate: null, points: recent.length, spanDays: 0 }

  const first = recent[0].date
  const spanDays = daysBetween(first, last)
  if (spanDays < 7) return { rate: null, points: recent.length, spanDays }

  const xs = recent.map(s => daysBetween(first, s.date))
  const ys = recent.map(s => s.weight)
  const perDay = slope(xs, ys)
  if (perDay === null) return { rate: null, points: recent.length, spanDays }

  return {
    rate: perDay * 7,
    points: recent.length,
    spanDays,
    from: recent[0].weight,
    to: recent[recent.length - 1].weight,
  }
}

/* ------------------------------------------------------------------ */
/* Logging adherence                                                   */
/* ------------------------------------------------------------------ */

export function adherence(dailyLogs, settings, latestStat, days = 7) {
  const logs = [...(dailyLogs || [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, days)
  const withCals = logs.filter(l => (l.calories || 0) > 0)
  if (!withCals.length) return { loggedDays: 0, avgCalories: 0, avgProtein: 0, deltaVsTarget: 0 }

  const avgCalories = Math.round(withCals.reduce((a, l) => a + l.calories, 0) / withCals.length)
  const avgProtein = Math.round(withCals.reduce((a, l) => a + (l.protein || 0), 0) / withCals.length)

  // Compare against each day's own target, since targets cycle by day type
  const deltas = withCals.map(l => {
    const dow = new Date(l.date + 'T00:00:00').getDay()
    const t = targetsFor(settings, latestStat, dayTypeFor(dow))
    return t ? l.calories - t.calories : 0
  })
  const deltaVsTarget = Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length)

  return { loggedDays: withCals.length, avgCalories, avgProtein, deltaVsTarget }
}

/* ------------------------------------------------------------------ */
/* The weekly recommendation                                           */
/* ------------------------------------------------------------------ */

const MAX_STEP = 150   // never move calories more than this in one check-in
const MIN_DAYS = 7     // never adjust more often than weekly

/**
 * Decides whether to move calories, and by how much.
 *
 * Order matters: adherence is checked before the target is touched. If you
 * are eating 300 kcal over target, the target is not the problem, and
 * lowering it just widens the gap.
 */
export function calorieAdvice({ bodyStats, dailyLogs, settings, latestStat }) {
  const goal = GOALS[settings.goal] ?? GOALS.recomp
  const trend = weightTrend(bodyStats)
  const adh = adherence(dailyLogs, settings, latestStat)
  const base = baseCalories(settings, latestStat)
  const floor = Math.max(1200, bmr(latestStat) || 1200)

  const common = { trend, adherence: adh, base, goalRate: goal.rateKgWk }

  if (trend.rate === null) {
    const need = Math.max(0, 3 - trend.points)
    return {
      ...common,
      status: 'need-data',
      headline: 'Not enough data yet',
      detail: trend.points <= 1
        ? 'Weigh in 3–4 times a week. Day-to-day swings are water and food weight — a trend needs at least 7 days and 3 weigh-ins before it means anything.'
        : `${need} more weigh-in${need === 1 ? '' : 's'} across at least 7 days and I can start adjusting your calories.`,
      delta: 0,
    }
  }

  if (adh.loggedDays < 4) {
    return {
      ...common,
      status: 'need-logging',
      headline: 'Log your food more consistently',
      detail: `Only ${adh.loggedDays} of the last 7 days have calories logged. I can't tell whether the target is wrong or just unmet.`,
      delta: 0,
    }
  }

  if (Math.abs(adh.deltaVsTarget) > 200) {
    const over = adh.deltaVsTarget > 0
    return {
      ...common,
      status: 'adherence',
      headline: over ? 'Eating over target' : 'Eating under target',
      detail: over
        ? `You're averaging ${adh.deltaVsTarget} kcal/day over target. Close that gap before changing the number — moving the target down now just widens it.`
        : `You're averaging ${Math.abs(adh.deltaVsTarget)} kcal/day under target. Under-eating on a recomp costs muscle. Hit the target before we adjust it.`,
      delta: 0,
    }
  }

  const diff = trend.rate - goal.rateKgWk   // >0 = losing slower than goal
  const rounded = trend.rate.toFixed(2)

  if (Math.abs(diff) <= 0.15) {
    return {
      ...common,
      status: 'hold',
      headline: 'On track — hold current calories',
      detail: `You're trending ${rounded} kg/week against a goal of ${goal.rateKgWk} kg/week. That's within noise. Change nothing this week.`,
      delta: 0,
    }
  }

  if (diff > 0.15) {
    const delta = -Math.min(MAX_STEP, Math.round((diff * 1100) / 50) * 50)
    const next = Math.max(floor, base + delta)
    const applied = next - base
    return {
      ...common,
      status: applied < 0 ? 'decrease' : 'floor',
      headline: applied < 0 ? `Drop calories by ${Math.abs(applied)}` : 'Already at your floor',
      detail: applied < 0
        ? `Trending ${rounded} kg/week vs a goal of ${goal.rateKgWk}. A ${Math.abs(applied)} kcal cut should bring the rate in line. Re-check in 7 days.`
        : `You're at your BMR floor (${floor} kcal). Don't cut further — add activity instead: +2,000 steps/day is worth roughly 80–100 kcal.`,
      delta: applied,
      newBase: next,
    }
  }

  const delta = Math.min(MAX_STEP, Math.round((Math.abs(diff) * 1100) / 50) * 50)
  return {
    ...common,
    status: 'increase',
    headline: `Add ${delta} calories`,
    detail: `Trending ${rounded} kg/week — faster than your ${goal.rateKgWk} kg/week goal. Losing this quickly on a recomp costs lean mass. Adding ${delta} kcal protects it.`,
    delta,
    newBase: base + delta,
  }
}

/* ------------------------------------------------------------------ */
/* Progressive overload                                                */
/* ------------------------------------------------------------------ */

/** Top of a rep range: '10-12' → 12, '15' → 15, '10 each side' → 10 */
function topRep(reps) {
  const nums = String(reps || '').match(/\d+/g)
  return nums ? Math.max(...nums.map(Number)) : null
}

/** Lower-body and machine work jumps in bigger increments than dumbbell work. */
function increment(name) {
  return /leg press|leg extension|leg curl|squat|deadlift|calf/i.test(name) ? 5 : 2.5
}

/**
 * Reads your set logs and flags exercises ready for more weight, plus any
 * showing regression or chronic near-failure grinding.
 */
export function overloadAdvice(workoutLogs, limit = 6) {
  const byExercise = new Map()

  ;(workoutLogs || []).forEach(log => {
    log.exercises?.forEach(ex => {
      const done = ex.sets?.filter(s => s.done) || []
      if (!done.length) return
      const top = topRep(ex.targetReps)
      const rpes = done.filter(s => s.rpe > 0).map(s => s.rpe)

      const entry = byExercise.get(ex.exerciseId) || {
        name: ex.name, targetReps: ex.targetReps, sessions: [],
      }
      entry.sessions.push({
        date: log.date,
        topWeight: Math.max(...done.map(s => s.weight || 0)),
        allHitTop: top !== null && done.every(s => (s.reps || 0) >= top),
        avgRpe: rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null,
      })
      byExercise.set(ex.exerciseId, entry)
    })
  })

  const out = []
  byExercise.forEach(entry => {
    const sessions = entry.sessions.sort((a, b) => b.date.localeCompare(a.date))
    const [latest, prev] = sessions
    if (!latest || latest.topWeight <= 0) return
    const step = increment(entry.name)
    const top = topRep(entry.targetReps)

    if (latest.allHitTop && (latest.avgRpe === null || latest.avgRpe <= 8)) {
      out.push({
        type: 'increase',
        exercise: entry.name,
        date: latest.date,
        detail: `Hit ${top} reps on every set${latest.avgRpe ? ` at RPE ${latest.avgRpe.toFixed(0)}` : ''} — go up to ${latest.topWeight + step} kg`,
        from: latest.topWeight,
        to: latest.topWeight + step,
      })
    } else if (prev && latest.topWeight < prev.topWeight * 0.9) {
      out.push({
        type: 'regression',
        exercise: entry.name,
        date: latest.date,
        detail: `Dropped from ${prev.topWeight} to ${latest.topWeight} kg — check sleep, protein and rest days`,
        from: prev.topWeight,
        to: latest.topWeight,
      })
    } else if (latest.avgRpe !== null && latest.avgRpe >= 9.5) {
      out.push({
        type: 'caution',
        exercise: entry.name,
        date: latest.date,
        detail: `Averaging RPE ${latest.avgRpe.toFixed(1)} — grinding every set. Hold ${latest.topWeight} kg one more session`,
      })
    }
  })

  const rank = { increase: 0, regression: 1, caution: 2 }
  return out
    .sort((a, b) => rank[a.type] - rank[b.type] || b.date.localeCompare(a.date))
    .slice(0, limit)
}

/* ------------------------------------------------------------------ */
/* Training adherence                                                  */
/* ------------------------------------------------------------------ */

export function sessionAdherence(workoutLogs, weeks = 4) {
  const planned = Object.values(WORKOUT_PLAN).filter(Boolean).length
  const now = new Date()
  const out = []
  for (let w = 0; w < weeks; w++) {
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) - w * 7)
    const p = n => String(n).padStart(2, '0')
    const key = d => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i); return key(d)
    })
    out.push({
      weekStart: dates[0],
      done: dates.filter(d => (workoutLogs || []).some(l => l.date === d)).length,
      planned,
    })
  }
  return out
}
