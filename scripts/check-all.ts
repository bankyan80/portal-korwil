import { getAllPegawai } from '../src/services/pegawai.service';
async function main() {
  const all = await getAllPegawai();
  const schools = [...new Set(all.map((x: any) => x.sekolah).filter(Boolean))].sort();
  console.log('Total records:', all.length);
  console.log('Total schools:', schools.length);
  schools.forEach(s => {
    const guru = all.filter(x => x.sekolah === s && x.jenis_ptk === 'Guru').length;
    const tendik = all.filter(x => x.sekolah === s && x.jenis_ptk === 'Tenaga Kependidikan').length;
    const other = all.filter(x => x.sekolah === s && x.jenis_ptk !== 'Guru' && x.jenis_ptk !== 'Tenaga Kependidikan').length;
    console.log(` - ${s} | ${guru} guru + ${tendik} tendik + ${other} lain = ${guru+tendik+other}`);
  });
}
main();
