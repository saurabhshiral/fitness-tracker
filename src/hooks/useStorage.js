import { useState, useEffect } from 'react'

export function useStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      console.warn('localStorage full or unavailable')
    }
  }, [key, value])

  return [value, setValue]
}

export function today() {
  return new Date().toISOString().split('T')[0]
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getWeekNumber(startDate) {
  const start = new Date(startDate + 'T00:00:00')
  const now = new Date()
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24))
  return Math.max(1, Math.min(12, Math.floor(diffDays / 7) + 1))
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
