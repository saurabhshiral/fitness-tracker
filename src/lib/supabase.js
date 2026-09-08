import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// null when env vars aren't set — app falls back to PasswordGate + localStorage
export const supabase = (url && key) ? createClient(url, key) : null

// Maps localStorage keys → Supabase table columns
const KEY_TO_COL = {
  fitness_body_stats:   'body_stats',
  fitness_workout_logs: 'workout_logs',
  fitness_daily_logs:   'daily_logs',
}

/** On login: pull all data from Supabase → localStorage so pages read instantly */
export async function pullFromSupabase(userId) {
  if (!supabase) return
  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('body_stats, workout_logs, daily_logs')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) return

    Object.entries(KEY_TO_COL).forEach(([lsKey, col]) => {
      if (Array.isArray(data[col]) && data[col].length > 0) {
        localStorage.setItem(lsKey, JSON.stringify(data[col]))
      }
    })
  } catch (e) {
    console.warn('Supabase pull failed (offline?):', e.message)
  }
}

/** On every save: push the updated array to Supabase in the background */
export async function pushToSupabase(key, value) {
  if (!supabase) return
  const col = KEY_TO_COL[key]
  if (!col || !Array.isArray(value)) return

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('user_data')
      .upsert(
        { user_id: user.id, [col]: value, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    if (error) console.warn('Supabase push error:', error.message)
  } catch (e) {
    console.warn('Supabase push failed (offline?):', e.message)
  }
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}
