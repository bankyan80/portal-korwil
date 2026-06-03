import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { createClient } = require('@supabase/supabase-js')
import { readFileSync } from 'fs'

const supabase = createClient(
  'https://xyouvellfcqhsbkclfbk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5b3V2ZWxsZmNxaHNia2NsZmJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE5NjUzMSwiZXhwIjoyMDk0NzcyNTMxfQ.2f6JVxhbceJg_dK7LjqiTHfEBfD-mHgVYazNPmUDFAM',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const siswa = JSON.parse(readFileSync(new URL('../src/data/data-siswa.json', import.meta.url), 'utf-8'))
const lookup = new Map()
for (const s of siswa) {
  if (s.nik && !lookup.has(s.nik)) {
    lookup.set(s.nik, { kelas: s.kelas != null ? String(s.kelas) : '', nama: s.nama, sekolah: s.sekolah })
  }
}

const { data: rows, error } = await supabase
  .from('app_data')
  .select('*')
  .eq('collection', 'yatim_piatu')

if (error) { console.error('Error fetching:', error); process.exit(1) }

console.log(`Found ${rows.length} yatim_piatu records`)

let updated = 0
let skipped = 0

for (const row of rows) {
  const data = row.data || {}
  if (data.kelas) {
    skipped++
    continue
  }
  const match = lookup.get(data.nik)
  if (match && match.kelas) {
    const { error: err } = await supabase
      .from('app_data')
      .update({ data: { ...data, kelas: match.kelas } })
      .eq('id', row.id)
    if (err) {
      console.error(`Error updating ${data.nik} (${data.nama}):`, err)
    } else {
      updated++
      console.log(`Updated: ${data.nik} ${data.nama} → kelas ${match.kelas}`)
    }
  } else {
    console.log(`No match: ${data.nik} ${data.nama}`)
  }
}

console.log(`\nDone: ${updated} updated, ${skipped} already had kelas`)
