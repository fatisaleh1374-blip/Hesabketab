
import { createClient } from '@supabase/supabase-js'

// IMPORTANT: These values should be stored in your .env.local file.
// See: https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs#initialize-the-supabase-client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

