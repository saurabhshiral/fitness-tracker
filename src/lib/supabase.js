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
  fitness_custom_foods: 'custom_foods',
  fitness_settings:     'settings',
}

/** On login: pull all data from Supabase → localStorage so pages read instantly */
export async function pullFromSupabase(userId) {
  if (!supabase) return
  try {
    // select('*') rather than named columns: if a column hasn't been added to
    // the table yet, a named select 400s and kills sync for everything else.
    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) return

    Object.entries(KEY_TO_COL).forEach(([lsKey, col]) => {
      const v = data[col]
      // Arrays must be non-empty (never clobber local data with an empty remote
      // list); settings is a plain object, so accept any non-null object too.
      const usable = Array.isArray(v)
        ? v.length > 0
        : v !== null && typeof v === 'object' && Object.keys(v).length > 0
      if (usable) localStorage.setItem(lsKey, JSON.stringify(v))
    })
  } catch (e) {
    console.warn('Supabase pull failed (offline?):', e.message)
  }
}

/** On every save: push the updated array to Supabase in the background */
export async function pushToSupabase(key, value) {
  if (!supabase) return
  const col = KEY_TO_COL[key]
  if (!col) return
  // Arrays (logs) and plain objects (settings) both sync; nothing else
  if (!Array.isArray(value) && (value === null || typeof value !== 'object')) return

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
