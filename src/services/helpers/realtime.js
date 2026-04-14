import { supabase } from '../supabase/client'

export const subscribeToChanges = (table, callback) => {
  const subscription = supabase
    .channel(`${table}_changes`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe()

  return () => supabase.removeChannel(subscription)
}
