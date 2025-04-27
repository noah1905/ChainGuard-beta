import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uprveordqyluvqyaslfx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwcnZlb3JkcXlsdXZxeWFzbGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzUwMjUsImV4cCI6MjA2MTAxMTAyNX0.50FI4uJAPKbnhA0C9U8puR_3EXVd8qEZ3s_Rb6RExEM';
export const supabase = createClient(supabaseUrl, supabaseKey);