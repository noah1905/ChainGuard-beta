import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uprveordqyluvqyaslfx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwcnZlb3JkcXlsdXZxeWFzbGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzUwMjUsImV4cCI6MjA2MTAxMTAyNX0.50FI4uJAPKbnhA0C9U8puR_3EXVd8qEZ3s_Rb6RExEMkey';

function getSupabaseClient() {
    if (!supabaseInstance) {
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    }
    return supabaseInstance;
}

export const supabase = getSupabaseClient();