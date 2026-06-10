import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Client privilégié pour les opérations serveur (cron, sync) qui doivent
// bypasser la RLS. Ne jamais exposer SUPABASE_SERVICE_ROLE_KEY au client.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
