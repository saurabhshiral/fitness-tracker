import { useState, useEffect, useRef } from 'react'
import { pushToSupabase } from '../lib/supabase'

export function useStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  // Skip the first fire (initial mount) — only push on real user-driven changes
  const isFirst = useRef(true)

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      console.warn('localStorage full or unavailable')
    }

    if (isFirst.current) {
      isFirst.current = false
      return
    }

    // Fire-and-forget Supabase sync — pages never wait on this
    pushToSupabase(key, value)
  }, [key, value])

  return [value, setValue]
}

/** Local-timezone YYYY-MM-DD. Never use toISOString() — it shifts to UTC, so
 *  anything logged before 05:30 IST would land on the previous day. */
export function dateStr(d = new Date()) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function today() {
  return dateStr()
}

/** YYYY-MM-DD n days before today (n positive = past) */
export function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return dateStr(d)
}

/** Most recent date (today or earlier) falling on the given weekday 0-6 */
export function lastWeekday(dow) {
  const d = new Date()
  const diff = (d.getDay() - dow + 7) % 7
  d.setDate(d.getDate() - diff)
  return dateStr(d)
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Returns the stored program start date if the user has restarted at least
 *  once, otherwise the hardcoded constant. This way the first program keeps
 *  its original date in charts even after a restart. */
export function getProgramStartDate() {
  try {
    return localStorage.getItem('fitness_program_start') || null
  } catch {
    return null
  }
}

/** Call when the user finishes week 12 and wants to run the program again.
 *  Persists today's date so all week/phase calculations reset to week 1. */
export function restartProgram() {
  try {
    localStorage.setItem('fitness_program_start', today())
  } catch {}
  window.location.reload()
}

export function getWeekNumber(startDate) {
  const start = new Date(startDate + 'T00:00:00')
  const now = new Date()
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24))
  // No upper clamp — callers that need to detect "past 12" can check > 12
  return Math.max(1, Math.floor(diffDays / 7) + 1)
}

export function getCurrentPhase(startDate) {
  const week = getWeekNumber(startDate)
  if (week <= 4) return { phase: 1, name: 'Foundation', weeks: '1-4' }
  if (week <= 8) return { phase: 2, name: 'Overload', weeks: '5-8' }
  return { phase: 3, name: 'Intensification', weeks: '9-12' }
}

export function exportData() {
  const data = {}
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('fitness_')) {
      try { data[key] = JSON.parse(localStorage.getItem(key)) } catch { data[key] = localStorage.getItem(key) }
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fitness-backup-${today()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        Object.entries(data).forEach(([k, v]) => {
          if (k.startsWith('fitness_')) localStorage.setItem(k, JSON.stringify(v))
        })
        resolve()
      } catch {
        reject(new Error('Invalid backup file'))
      }
    }
    reader.readAsText(file)
  })
}
