import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { createClient } = require('@supabase/supabase-js')

const s = createClient(
  'https://xyouvellfcqhsbkclfbk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5b3V2ZWxsZmNxaHNia2NsZmJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE5NjUzMSwiZXhwIjoyMDk0NzcyNTMxfQ.2f6JVxhbceJg_dK7LjqiTHfEBfD-mHgVYazNPmUDFAM',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

;(async () => {
  const [e, st] = await Promise.all([
    s.from('employees').select('*', { count: 'exact', head: false }).limit(3),
    s.from('students').select('*', { count: 'exact', head: false }).limit(3),
  ])
  console.log('employees:', e.count || e.data?.length, 'rows')
  console.log('  sample:', e.data?.[0]?.nama, e.data?.[0]?.sekolah)
  console.log('students:', st.count || st.data?.length, 'rows')
  console.log('  sample:', st.data?.[0]?.nama, st.data?.[0]?.sekolah)
})()
