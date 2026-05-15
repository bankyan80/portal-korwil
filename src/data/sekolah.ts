export interface BaseSekolah {
  nama: string;
  npsn: string;
  nss: string;
  status: 'NEGERI' | 'SWASTA';
  akreditasi: string;
  address: string;
  desa: string;
  jenjang: 'SD' | 'TK' | 'KB';
  dayaTampung: number;
}

export const sekolahSD: BaseSekolah[] = [
  { nama: 'SD NEGERI 1 ASEM', npsn: '20215216', nss: '101021706002', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Abdurachman Saleh No. 328, Asem', desa: 'ASEM', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 1 BELAWA', npsn: '20215230', nss: '101021706025', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Cikuya 1, Belawa', desa: 'BELAWA', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 2 BELAWA', npsn: '20215564', nss: '101021706026', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Inpres Blok A, Belawa', desa: 'BELAWA', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 1 CIPEUJEUH KULON', npsn: '20215287', nss: '101021706004', status: 'NEGERI', akreditasi: 'B', address: 'Jl. K.H. Hasyim Asyari No. 07, Cipeujeuh Kulon', desa: 'CIPEUJEUH KULON', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 2 CIPEUJEUH KULON', npsn: '20215381', nss: '101021706005', status: 'NEGERI', akreditasi: 'A', address: 'Jl. KH. Hasyim Asyari No. 500, Cipeujeuh Kulon', desa: 'CIPEUJEUH KULON', jenjang: 'SD', dayaTampung: 60 },
  { nama: 'SD NEGERI 1 CIPEUJEUH WETAN', npsn: '20215286', nss: '101021706007', status: 'NEGERI', akreditasi: 'A', address: 'Jl. MT. Haryono No. 62, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 2 CIPEUJEUH WETAN', npsn: '20215380', nss: '101021706008', status: 'NEGERI', akreditasi: 'A', address: 'Jl. MT. Haryono No. 3B, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 3 CIPEUJEUH WETAN', npsn: '20214479', nss: '101021706009', status: 'NEGERI', akreditasi: 'B', address: 'Jl. KH. Wahid Hasyim No. 66, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 1 LEMAHABANG', npsn: '20215162', nss: '101021706015', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Ki Hajar Dewantoro No. 35, Lemahabang', desa: 'LEMAHABANG', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 2 LEMAHABANG', npsn: '20214656', nss: '101021706016', status: 'NEGERI', akreditasi: 'A', address: 'Jl. R.A. Kartini No. 26, Lemahabang', desa: 'LEMAHABANG', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 1 LEMAHABANG KULON', npsn: '20215161', nss: '101021706013', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Syech Lemahabang No. 5, Lemahabang Kulon', desa: 'LEMAHABANG KULON', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 1 LEUWIDINGDING', npsn: '20215164', nss: '101021706001', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Abdurahman Saleh, Leuwidingding', desa: 'LEUWIDINGDING', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 1 PICUNGPUGUR', npsn: '20246442', nss: '101021706023', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Raya Desa Picungpugur, Picungpugur', desa: 'PICUNGPUGUR', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 1 SARAJAYA', npsn: '20215517', nss: '101021706021', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Raya Sarajaya No. 63, Sarajaya', desa: 'SARAJAYA', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 2 SARAJAYA', npsn: '20214726', nss: '101021706022', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Raya Sarajaya Subur No. 1, Sarajaya', desa: 'SARAJAYA', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 1 SIGONG', npsn: '20215506', nss: '101021706018', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Pelita No. 101, Sigong', desa: 'SIGONG', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 3 SIGONG', npsn: '20214570', nss: '101021706020', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Raya Sigong, Sigong', desa: 'SIGONG', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 4 SIGONG', npsn: '20244513', nss: '101021706014', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Cantilan, Sigong', desa: 'SIGONG', jenjang: 'SD', dayaTampung: 56 },
  { nama: 'SD NEGERI 1 SINDANGLAUT', npsn: '20215464', nss: '101021706011', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Arief Rahman Hakim No. 24, Sindanglaut', desa: 'SINDANGLAUT', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 1 TUK KARANGSUWUNG', npsn: '20246445', nss: '101021706024', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Pulo Undrus Ujung, Tuk Karangsuwung', desa: 'TUK KARANGSUWUNG', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 1 WANGKELANG', npsn: '20215584', nss: '101021706027', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Raya Wangkelang No. 40, Wangkelang', desa: 'WANGKELANG', jenjang: 'SD', dayaTampung: 56 },
  { nama: 'SD IT AL IRSYAD AL ISLAMIYYAH', npsn: '20215221', nss: '102021706028', status: 'SWASTA', akreditasi: 'A', address: 'Jl. Syech Lemahabang No. 54, Lemahabang Kulon', desa: 'LEMAHABANG KULON', jenjang: 'SD', dayaTampung: 160 },
];

export const sekolahTK: BaseSekolah[] = [
  { nama: 'TK NEGERI LEMAHABANG', npsn: '20270605', nss: '002021706002', status: 'NEGERI', akreditasi: 'B', address: 'Jl. KH. Wakhid Hasyim, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', jenjang: 'TK', dayaTampung: 56 },
  { nama: 'TK AISYIYAH LEMAHABANG', npsn: '20254372', nss: '002021706003', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Ki Hajar Dewantoro No. 25, Lemahabang', desa: 'LEMAHABANG', jenjang: 'TK', dayaTampung: 56 },
  { nama: 'TK AL-AQSO', npsn: '20254376', nss: '002021706008', status: 'SWASTA', akreditasi: 'A', address: 'Jl. Desa Tuk Karangsuwung, Tuk Karangsuwung', desa: 'TUK KARANGSUWUNG', jenjang: 'TK', dayaTampung: 56 },
  { nama: 'TK AL-IRSYAD AL-ISLAMIYYAH', npsn: '20254373', nss: '002021706004', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Syekh Lemahabang No. 54, Lemahabang Kulon', desa: 'LEMAHABANG KULON', jenjang: 'TK', dayaTampung: 56 },
  { nama: 'TK BPP KENANGA', npsn: '20254374', nss: '002021706006', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Abdurahman Saleh No. 24, Asem', desa: 'ASEM', jenjang: 'TK', dayaTampung: 56 },
  { nama: 'TK GELATIK', npsn: '20254370', nss: '002021706001', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Raya Dr. Wahidin No. 57A, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', jenjang: 'TK', dayaTampung: 56 },
  { nama: 'TK MELATI', npsn: '20254378', nss: '002021706007', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Desa Wangkelang, Wangkelang', desa: 'WANGKELANG', jenjang: 'TK', dayaTampung: 56 },
  { nama: 'TK MUSLIMAT NU', npsn: '20254375', nss: '002021706005', status: 'SWASTA', akreditasi: 'B', address: 'Jl. R.A. Kartini No. 5, Lemahabang', desa: 'LEMAHABANG', jenjang: 'TK', dayaTampung: 56 },
];

export const sekolahKB: BaseSekolah[] = [
  { nama: 'KB A.H. PLUS', npsn: '70039880', nss: '012021706020', status: 'SWASTA', akreditasi: '-', address: 'Jl. Pelita Dusun 4, Sigong', desa: 'SIGONG', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'KB AMALIA SALSABILA', npsn: '69804039', nss: '012021706017', status: 'SWASTA', akreditasi: 'B', address: 'Jl. K.H. Hasyim Asyari No. 112, Cipeujeuh Kulon', desa: 'CIPEUJEUH KULON', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'KB AZ-ZAHRA', npsn: '69804068', nss: '012021706012', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Pelita Dusun 02, Sigong', desa: 'SIGONG', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'KB MUTIARA', npsn: '70044538', nss: '012021706019', status: 'SWASTA', akreditasi: '-', address: 'Jl. KH. Hasyim Asyari No. 48, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'KB PALAPA', npsn: '69870486', nss: '012021706014', status: 'SWASTA', akreditasi: '-', address: 'Jl. Syech Lemahabang, Lemahabang Kulon', desa: 'LEMAHABANG KULON', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'KB PERMATA BUNDA', npsn: '70024652', nss: '012021706018', status: 'SWASTA', akreditasi: 'C', address: 'Jl. Palasah Nunggal, Picungpugur', desa: 'PICUNGPUGUR', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'PAUD AL HAMBRA', npsn: '69947715', nss: '012021706015', status: 'SWASTA', akreditasi: 'C', address: 'Desa Lemahabang, Lemahabang', desa: 'LEMAHABANG', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'PAUD AL-HIDAYAH', npsn: '69870488', nss: '012021706011', status: 'SWASTA', akreditasi: 'C', address: 'Jl. Cantilan, Sigong', desa: 'SIGONG', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'PAUD AL-HUSNA', npsn: '69870479', nss: '012021706010', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Mbah Ardisela Desa Asem, Asem', desa: 'ASEM', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'PAUD AMANAH', npsn: '69870482', nss: '012021706003', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Sidaresmi No. 1, Lemahabang Kulon', desa: 'LEMAHABANG KULON', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'PAUD AN NAIM', npsn: '69870484', nss: '012021706006', status: 'SWASTA', akreditasi: 'C', address: 'Blok Kliwon, Sindanglaut', desa: 'SINDANGLAUT', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'PAUD ASY-SYAFIIYAH', npsn: '69870485', nss: '012021706001', status: 'SWASTA', akreditasi: 'C', address: 'Jl. Stasiun No. 15, Lemahabang Kulon', desa: 'LEMAHABANG KULON', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'PAUD BUDGENVIL', npsn: '69870489', nss: '012021706013', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Inpres, Belawa', desa: 'BELAWA', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'PAUD TUNAS HARAPAN', npsn: '69870490', nss: '012021706004', status: 'SWASTA', akreditasi: 'C', address: 'Blok Pahing, Wangkelang', desa: 'WANGKELANG', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'PAUD SPS MELATI', npsn: '69804044', nss: '012021706016', status: 'SWASTA', akreditasi: 'C', address: 'Dusun 02, Sarajaya', desa: 'SARAJAYA', jenjang: 'KB', dayaTampung: 28 },
];

export const allSekolah: BaseSekolah[] = [...sekolahSD, ...sekolahTK, ...sekolahKB];


