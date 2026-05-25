import { readFileSync } from 'fs'
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
    s.from('employees').select('count', { count: 'exact', head: true }),
    s.from('students').select('count', { count: 'exact', head: true }),
  ])
  console.log('employees:', e.status, e.statusText)
  console.log('students:', st.status, st.statusText)
  if (e.status === 200 || e.status === 206) console.log('✅ TABEL SUDAH ADA')
  else console.log('❌ TABEL BELUM ADA — jalankan SQL dulu')
})()
