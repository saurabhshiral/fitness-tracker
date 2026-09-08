import { useStorage } from './useStorage'

export const DEFAULT_SETTINGS = {
  heightCm: 175,
  age: 30,
  activity: 'moderate',
  goal: 'recomp',
  calorieMode: 'auto',        // 'auto' = derived from TDEE, 'manual' = you set it
  manualCalories: 1950,
  proteinPerKg: 2.2,
  fatPct: 0.25,
  stepsTarget: 8000,
  waterTargetL: 3.5,
  sleepTarget: 7.5,
  calorieAdjustment: 0,       // cumulative nudge applied by weekly check-ins
  lastCheckIn: null,          // YYYY-MM-DD of the last applied/dismissed check-in
  checkInHistory: [],         // [{ date, delta, reason }]
}

/** Merges stored settings over defaults so fields added later don't break
 *  existing users with a partial object in localStorage. */
export function useSettings() {
  const [stored, setStored] = useStorage('fitness_settings', DEFAULT_SETTINGS)
  const settings = { ...DEFAULT_SETTINGS, ...(stored || {}) }
  return [settings, setStored]
}
