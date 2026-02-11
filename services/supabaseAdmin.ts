import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!, // 🔥
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
)
await supabase.auth.signInWithPassword({
  email: 'policenol@gmail.com',
  password: 'luisf14789'
})
