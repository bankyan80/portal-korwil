export interface SekolahMap {
  npsn: string;
  nama: string;
  status: 'Negeri' | 'Swasta';
  latitude: number;
  longitude: number;
}

function dmsToDecimal(dms: string): number {
  const trimmed = dms.trim();
  const dir = trimmed.slice(-1);
  const num = trimmed.slice(0, -1).trim();
  const parts = num.split(/[°'"]/).filter(Boolean);
  let deg = parseFloat(parts[0] || '0');
  let min = parseFloat(parts[1] || '0');
  let sec = parseFloat(parts[2] || '0');
  let decimal = deg + min / 60 + sec / 3600;
  if (dir === 'S' || dir === 'W') decimal = -decimal;
  return decimal;
}

const rawData = [
  { npsn: '20215287', nama: 'SD NEGERI 1 CIPEUJEUH KULON', status: 'Negeri' as const, lat: "6°49'54\"S", lng: "108°36'54\"E" },
  { npsn: '20215230', nama: 'SD NEGERI 1 BELAWA', status: 'Negeri' as const, lat: "6°49'51\"S", lng: "108°35'8\"E" },
  { npsn: '20215216', nama: 'SD NEGERI 1 ASEM', status: 'Negeri' as const, lat: "6°50'40\"S", lng: "108°37'12\"E" },
  { npsn: '20214570', nama: 'SD NEGERI 3 SIGONG', status: 'Negeri' as const, lat: "6°50'8\"S", lng: "108°38'23\"E" },
  { npsn: '20214479', nama: 'SD NEGERI 3 CIPEUJEUH WETAN', status: 'Negeri' as const, lat: "6°49'38\"S", lng: "108°37'14\"E" },
  { npsn: '20214656', nama: 'SD NEGERI 2 LEMAHABANG', status: 'Negeri' as const, lat: "6°49'53\"S", lng: "108°37'41\"E" },
  { npsn: '20214726', nama: 'SD NEGERI 2 SARAJAYA', status: 'Negeri' as const, lat: "6°50'19\"S", lng: "108°38'37\"E" },
  { npsn: '20215464', nama: 'SD NEGERI 1 SINDANGLAUT', status: 'Negeri' as const, lat: "6°50'10\"S", lng: "108°37'13\"E" },
  { npsn: '20215161', nama: 'SD NEGERI 1 LEMAHABANG KULON', status: 'Negeri' as const, lat: "6°49'28\"S", lng: "108°37'43\"E" },
  { npsn: '20215164', nama: 'SD NEGERI 1 LEUWIDINGDING', status: 'Negeri' as const, lat: "6°50'37\"S", lng: "108°37'28\"E" },
  { npsn: '20215221', nama: 'SDIT AL IRSYAD AL ISLAMIYAH', status: 'Swasta' as const, lat: "6°49'37\"S", lng: "108°37'42\"E" },
  { npsn: '20215381', nama: 'SD NEGERI 2 CIPEUJEUH KULON', status: 'Negeri' as const, lat: "6°49'55\"S", lng: "108°36'25\"E" },
  { npsn: '20215380', nama: 'SD NEGERI 2 CIPEUJEUH WETAN', status: 'Negeri' as const, lat: "6°49'50\"S", lng: "108°37'32\"E" },
  { npsn: '20215286', nama: 'SD NEGERI 1 CIPEUJEUH WETAN', status: 'Negeri' as const, lat: "6°49'50\"S", lng: "108°37'16\"E" },
  { npsn: '20215506', nama: 'SD NEGERI 1 SIGONG', status: 'Negeri' as const, lat: "6°50'15\"S", lng: "108°38'23\"E" },
  { npsn: '20215517', nama: 'SD NEGERI 1 SARAJAYA', status: 'Negeri' as const, lat: "6°50'36\"S", lng: "108°38'35\"E" },
  { npsn: '20215564', nama: 'SD NEGERI 2 BELAWA', status: 'Negeri' as const, lat: "6°50'8\"S", lng: "108°34'56\"E" },
  { npsn: '20246442', nama: 'SD NEGERI 1 PICUNGPUGUR', status: 'Negeri' as const, lat: "6°51'05.6\"S", lng: "108°37'31.6\"E" },
  { npsn: '20246445', nama: 'SD NEGERI 1 TUK KARANGSUWUNG', status: 'Negeri' as const, lat: "6°50'6\"S", lng: "108°37'48\"E" },
  { npsn: '20215162', nama: 'SD NEGERI 1 LEMAHABANG', status: 'Negeri' as const, lat: "6°49'55\"S", lng: "108°37'46\"E" },
  { npsn: '20215584', nama: 'SD NEGERI 1 WANGKELANG', status: 'Negeri' as const, lat: "6°50'2\"S", lng: "108°34'29\"E" },
  { npsn: '20244513', nama: 'SD NEGERI 4 SIGONG', status: 'Negeri' as const, lat: "-6.8272064", lng: "108.647168" },
];

export const sekolahLemahabangMap: SekolahMap[] = rawData.map((s) => {
  const lat = s.lat.includes('°') ? dmsToDecimal(s.lat) : parseFloat(s.lat);
  const lng = s.lng.includes('°') ? dmsToDecimal(s.lng) : parseFloat(s.lng);
  return { npsn: s.npsn, nama: s.nama, status: s.status, latitude: lat, longitude: lng };
});
