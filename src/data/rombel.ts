export interface RombelDetail {
  name: string;
  total: number;
  l: number;
  p: number;
}

export interface RombelEntry {
  name: string;
  jenjang: string;
  total: number;
  rombels: number;
  details: RombelDetail[];
}

export const rombelData: RombelEntry[] = [
  { name: 'SD IT AL IRSYAD AL ISLAMIYYAH', jenjang: 'SD', total: 549, rombels: 18, details: [
    { name: 'I A', total: 34, l: 18, p: 16 }, { name: 'I B', total: 31, l: 17, p: 14 }, { name: 'I C', total: 31, l: 16, p: 15 },
    { name: 'II A', total: 35, l: 19, p: 16 }, { name: 'II B', total: 36, l: 18, p: 18 }, { name: 'II C', total: 34, l: 16, p: 18 },
    { name: 'III A', total: 30, l: 13, p: 17 }, { name: 'III B', total: 33, l: 15, p: 18 }, { name: 'III C', total: 33, l: 19, p: 14 },
    { name: 'IV A', total: 32, l: 14, p: 18 }, { name: 'IV B', total: 28, l: 13, p: 15 }, { name: 'IV C', total: 30, l: 16, p: 14 },
    { name: 'V A', total: 27, l: 12, p: 15 }, { name: 'V B', total: 26, l: 16, p: 10 }, { name: 'V C', total: 25, l: 16, p: 9 },
    { name: 'VI A', total: 31, l: 22, p: 9 }, { name: 'VI B', total: 26, l: 16, p: 10 }, { name: 'VI C', total: 27, l: 18, p: 9 },
  ]},
  { name: 'SD NEGERI 1 BELAWA', jenjang: 'SD', total: 323, rombels: 10, details: [
    { name: '1A', total: 32, l: 19, p: 13 }, { name: '1B', total: 31, l: 20, p: 11 }, { name: '2', total: 48, l: 25, p: 23 },
    { name: '3A', total: 30, l: 16, p: 14 }, { name: '3B', total: 31, l: 13, p: 18 },
    { name: '4A', total: 31, l: 17, p: 14 }, { name: '4B', total: 29, l: 14, p: 15 },
    { name: '5A', total: 29, l: 17, p: 12 }, { name: '5B', total: 24, l: 11, p: 13 }, { name: '6', total: 38, l: 25, p: 13 },
  ]},
  { name: 'SD NEGERI 1 CIPEUJEUH KULON', jenjang: 'SD', total: 274, rombels: 12, details: [
    { name: '1A', total: 17, l: 10, p: 7 }, { name: '1B', total: 17, l: 8, p: 9 },
    { name: '2A', total: 19, l: 9, p: 10 }, { name: '2B', total: 29, l: 17, p: 12 },
    { name: '3A', total: 21, l: 14, p: 7 }, { name: '3B', total: 26, l: 13, p: 13 },
    { name: '4A', total: 26, l: 16, p: 10 }, { name: '4B', total: 19, l: 10, p: 9 },
    { name: '5A', total: 28, l: 7, p: 21 }, { name: '5B', total: 35, l: 14, p: 21 },
    { name: '6A', total: 14, l: 5, p: 9 }, { name: '6B', total: 23, l: 11, p: 12 },
  ]},
  { name: 'SD NEGERI 1 CIPEUJEUH WETAN', jenjang: 'SD', total: 392, rombels: 12, details: [
    { name: '1 A', total: 30, l: 19, p: 11 }, { name: '1 B', total: 31, l: 14, p: 17 },
    { name: '2 A', total: 38, l: 20, p: 18 }, { name: '2 B', total: 36, l: 16, p: 20 },
    { name: '3 A', total: 25, l: 14, p: 11 }, { name: '3 B', total: 24, l: 12, p: 12 },
    { name: '4 A', total: 37, l: 19, p: 18 }, { name: '4 B', total: 36, l: 17, p: 19 },
    { name: '5 A', total: 34, l: 15, p: 19 }, { name: '5 B', total: 35, l: 20, p: 15 },
    { name: '6 A', total: 33, l: 15, p: 18 }, { name: '6 B', total: 33, l: 18, p: 15 },
  ]},
  { name: 'SD NEGERI 1 LEMAHABANG', jenjang: 'SD', total: 149, rombels: 6, details: [
    { name: '1', total: 40, l: 19, p: 21 }, { name: '2', total: 26, l: 9, p: 17 },
    { name: '3', total: 24, l: 17, p: 7 }, { name: '4', total: 21, l: 7, p: 14 },
    { name: '5', total: 23, l: 9, p: 14 }, { name: '6', total: 15, l: 8, p: 7 },
  ]},
  { name: 'SD NEGERI 1 LEMAHABANG KULON', jenjang: 'SD', total: 242, rombels: 8, details: [
    { name: '1', total: 40, l: 17, p: 23 }, { name: '2', total: 39, l: 24, p: 15 },
    { name: '3 A', total: 21, l: 13, p: 8 }, { name: '3 B', total: 22, l: 14, p: 8 },
    { name: '4 A', total: 23, l: 14, p: 9 }, { name: '4 B', total: 27, l: 13, p: 14 },
    { name: '5', total: 36, l: 20, p: 16 }, { name: '6', total: 34, l: 17, p: 17 },
  ]},
  { name: 'SD NEGERI 1 LEUWIDINGDING', jenjang: 'SD', total: 194, rombels: 6, details: [
    { name: '1', total: 40, l: 22, p: 18 }, { name: '2', total: 35, l: 16, p: 19 },
    { name: '3', total: 32, l: 14, p: 18 }, { name: '4', total: 29, l: 13, p: 16 },
    { name: '5', total: 39, l: 21, p: 18 }, { name: '6', total: 19, l: 11, p: 8 },
  ]},
  { name: 'SD NEGERI 1 PICUNGPUGUR', jenjang: 'SD', total: 123, rombels: 6, details: [
    { name: '1', total: 15, l: 10, p: 5 }, { name: '2', total: 18, l: 10, p: 8 },
    { name: '3', total: 25, l: 10, p: 15 }, { name: '4', total: 27, l: 16, p: 11 },
    { name: '5', total: 22, l: 9, p: 13 }, { name: '6', total: 16, l: 8, p: 8 },
  ]},
  { name: 'SD NEGERI 1 SARAJAYA', jenjang: 'SD', total: 163, rombels: 7, details: [
    { name: '1A', total: 23, l: 7, p: 16 }, { name: '1B', total: 21, l: 8, p: 13 },
    { name: '2', total: 29, l: 17, p: 12 }, { name: '3', total: 12, l: 7, p: 5 },
    { name: '4', total: 25, l: 17, p: 8 }, { name: '5', total: 26, l: 14, p: 12 },
    { name: '6', total: 27, l: 17, p: 10 },
  ]},
  { name: 'SD NEGERI 1 SINDANGLAUT', jenjang: 'SD', total: 411, rombels: 12, details: [
    { name: '1A', total: 38, l: 22, p: 16 }, { name: '1B', total: 39, l: 24, p: 15 },
    { name: '2A', total: 30, l: 15, p: 15 }, { name: '2B', total: 30, l: 16, p: 14 },
    { name: '3A', total: 31, l: 14, p: 17 }, { name: '3B', total: 32, l: 16, p: 16 },
    { name: '4A', total: 43, l: 20, p: 23 }, { name: '4B', total: 43, l: 19, p: 24 },
    { name: '5A', total: 28, l: 15, p: 13 }, { name: '5B', total: 32, l: 17, p: 15 },
    { name: '6A', total: 34, l: 15, p: 19 }, { name: '6B', total: 31, l: 15, p: 16 },
  ]},
  { name: 'SD NEGERI 1 TUK KARANGSUWUNG', jenjang: 'SD', total: 224, rombels: 8, details: [
    { name: '1A', total: 20, l: 13, p: 7 }, { name: '1B', total: 23, l: 18, p: 5 },
    { name: '2A', total: 28, l: 14, p: 14 }, { name: '2B', total: 28, l: 12, p: 16 },
    { name: '3', total: 34, l: 13, p: 21 }, { name: '4', total: 33, l: 20, p: 13 },
    { name: '5', total: 32, l: 12, p: 20 }, { name: '6', total: 26, l: 16, p: 10 },
  ]},
  { name: 'SD NEGERI 1 WANGKELANG', jenjang: 'SD', total: 269, rombels: 8, details: [
    { name: '1', total: 28, l: 21, p: 7 }, { name: '2', total: 49, l: 23, p: 26 },
    { name: '3', total: 43, l: 18, p: 25 }, { name: '4 A', total: 26, l: 12, p: 14 },
    { name: '4 B', total: 25, l: 12, p: 13 }, { name: '5A', total: 28, l: 14, p: 14 },
    { name: '5B', total: 27, l: 16, p: 11 }, { name: '6', total: 43, l: 25, p: 18 },
  ]},
  { name: 'SD NEGERI 2 BELAWA', jenjang: 'SD', total: 256, rombels: 7, details: [
    { name: '1A', total: 30, l: 15, p: 15 }, { name: '1B', total: 33, l: 13, p: 20 },
    { name: '2', total: 43, l: 19, p: 24 }, { name: '3', total: 43, l: 22, p: 21 },
    { name: '4', total: 36, l: 16, p: 20 }, { name: '5', total: 37, l: 24, p: 13 },
    { name: '6', total: 34, l: 18, p: 16 },
  ]},
  { name: 'SD NEGERI 2 CIPEUJEUH KULON', jenjang: 'SD', total: 310, rombels: 12, details: [
    { name: '1A', total: 26, l: 11, p: 15 }, { name: '1B', total: 23, l: 15, p: 8 },
    { name: '2A', total: 34, l: 10, p: 24 }, { name: '2B', total: 34, l: 17, p: 17 },
    { name: '3A', total: 30, l: 13, p: 17 }, { name: '3B', total: 29, l: 17, p: 12 },
    { name: '4A', total: 26, l: 10, p: 16 }, { name: '4B', total: 24, l: 12, p: 12 },
    { name: '5A', total: 21, l: 10, p: 11 }, { name: '5B', total: 21, l: 5, p: 16 },
    { name: '6A', total: 21, l: 11, p: 10 }, { name: '6B', total: 21, l: 11, p: 10 },
  ]},
  { name: 'SD NEGERI 2 CIPEUJEUH WETAN', jenjang: 'SD', total: 207, rombels: 6, details: [
    { name: '1', total: 39, l: 23, p: 16 }, { name: '2', total: 41, l: 17, p: 24 },
    { name: '3', total: 36, l: 21, p: 15 }, { name: '4', total: 25, l: 11, p: 14 },
    { name: '5', total: 29, l: 11, p: 18 }, { name: '6', total: 37, l: 22, p: 15 },
  ]},
  { name: 'SD NEGERI 2 LEMAHABANG', jenjang: 'SD', total: 383, rombels: 12, details: [
    { name: '1.A', total: 39, l: 20, p: 19 }, { name: '1.B', total: 39, l: 25, p: 14 },
    { name: '2.A', total: 31, l: 10, p: 21 }, { name: '2.B', total: 28, l: 16, p: 12 },
    { name: '3.A', total: 29, l: 11, p: 18 }, { name: '3.B', total: 30, l: 18, p: 12 },
    { name: '4.A', total: 33, l: 17, p: 16 }, { name: '4.B', total: 34, l: 20, p: 14 },
    { name: '5.A', total: 29, l: 13, p: 16 }, { name: '5.B', total: 32, l: 21, p: 11 },
    { name: '6.A', total: 30, l: 13, p: 17 }, { name: '6.B', total: 29, l: 15, p: 14 },
  ]},
  { name: 'SD NEGERI 2 SARAJAYA', jenjang: 'SD', total: 170, rombels: 7, details: [
    { name: '1', total: 30, l: 16, p: 14 }, { name: '2 A', total: 19, l: 9, p: 10 },
    { name: '2 B', total: 23, l: 9, p: 14 }, { name: '3', total: 24, l: 12, p: 12 },
    { name: '4', total: 22, l: 12, p: 10 }, { name: '5', total: 23, l: 12, p: 11 },
    { name: '6', total: 29, l: 16, p: 13 },
  ]},
  { name: 'SD NEGERI 3 CIPEUJEUH WETAN', jenjang: 'SD', total: 355, rombels: 11, details: [
    { name: '1 A', total: 36, l: 15, p: 21 }, { name: '1 B', total: 33, l: 15, p: 18 },
    { name: '2 A', total: 28, l: 14, p: 14 }, { name: '2 B', total: 26, l: 17, p: 9 },
    { name: '3 A', total: 34, l: 21, p: 13 }, { name: '3 B', total: 35, l: 18, p: 17 },
    { name: '4 A', total: 31, l: 20, p: 11 }, { name: '4 B', total: 32, l: 19, p: 13 },
    { name: '5', total: 43, l: 22, p: 21 }, { name: '6 A', total: 28, l: 20, p: 8 },
    { name: '6 B', total: 29, l: 9, p: 20 },
  ]},
  { name: 'SD NEGERI 3 SIGONG', jenjang: 'SD', total: 216, rombels: 7, details: [
    { name: '1', total: 28, l: 16, p: 12 }, { name: '2', total: 34, l: 18, p: 16 },
    { name: '3A', total: 26, l: 12, p: 14 }, { name: '3B', total: 29, l: 21, p: 8 },
    { name: '4', total: 34, l: 16, p: 18 }, { name: '5', total: 27, l: 12, p: 15 },
    { name: '6', total: 38, l: 22, p: 16 },
  ]},
  { name: 'SD NEGERI 4 SIGONG', jenjang: 'SD', total: 217, rombels: 7, details: [
    { name: '1', total: 37, l: 21, p: 16 }, { name: '2', total: 36, l: 20, p: 16 },
    { name: '3', total: 36, l: 14, p: 22 }, { name: '4A', total: 20, l: 10, p: 10 },
    { name: '4B', total: 20, l: 9, p: 11 }, { name: '5', total: 28, l: 19, p: 9 },
    { name: '6', total: 40, l: 16, p: 24 },
  ]},
  { name: 'TK AL-IRSYAD AL-ISLAMIYYAH', jenjang: 'TK', total: 120, rombels: 8, details: [
    { name: 'A1', total: 15, l: 6, p: 9 }, { name: 'A2', total: 15, l: 4, p: 11 }, { name: 'A3', total: 15, l: 9, p: 6 },
    { name: 'B1', total: 14, l: 7, p: 7 }, { name: 'B2', total: 15, l: 7, p: 8 },
    { name: 'B3', total: 16, l: 8, p: 8 }, { name: 'B4', total: 15, l: 9, p: 6 }, { name: 'B5', total: 15, l: 7, p: 8 },
  ]},
  { name: 'TK BPP KENANGA', jenjang: 'TK', total: 18, rombels: 2, details: [
    { name: 'Kelompok A', total: 7, l: 3, p: 4 }, { name: 'Kelompok B', total: 11, l: 5, p: 6 },
  ]},
  { name: 'TK GELATIK', jenjang: 'TK', total: 97, rombels: 5, details: [
    { name: 'A1', total: 17, l: 6, p: 11 }, { name: 'A2', total: 16, l: 9, p: 7 },
    { name: 'B1', total: 21, l: 15, p: 6 }, { name: 'B2', total: 21, l: 9, p: 12 }, { name: 'B3', total: 22, l: 12, p: 10 },
  ]},
  { name: 'TK MELATI', jenjang: 'TK', total: 50, rombels: 3, details: [
    { name: 'A', total: 16, l: 8, p: 8 }, { name: 'B1', total: 15, l: 8, p: 7 }, { name: 'B2', total: 19, l: 12, p: 7 },
  ]},
  { name: 'TK MUSLIMAT NU', jenjang: 'TK', total: 75, rombels: 5, details: [
    { name: 'A.1', total: 10, l: 5, p: 5 }, { name: 'A.2', total: 16, l: 7, p: 9 },
    { name: 'B.1', total: 18, l: 10, p: 8 }, { name: 'B.2', total: 15, l: 9, p: 6 }, { name: 'B.3', total: 16, l: 6, p: 10 },
  ]},
  { name: 'TK NEGERI LEMAHABANG', jenjang: 'TK', total: 131, rombels: 8, details: [
    { name: 'A1', total: 17, l: 9, p: 8 }, { name: 'A2', total: 16, l: 8, p: 8 }, { name: 'A3', total: 16, l: 9, p: 7 },
    { name: 'B1', total: 17, l: 8, p: 9 }, { name: 'B2', total: 17, l: 6, p: 11 },
    { name: 'B3', total: 16, l: 9, p: 7 }, { name: 'B4', total: 16, l: 6, p: 10 }, { name: 'B5', total: 16, l: 6, p: 10 },
  ]},
  { name: 'KB AH PLUS', jenjang: 'KB', total: 65, rombels: 5, details: [
    { name: 'A1', total: 12, l: 6, p: 6 }, { name: 'A2', total: 12, l: 7, p: 5 },
    { name: 'B1', total: 15, l: 8, p: 7 }, { name: 'B2', total: 15, l: 12, p: 3 }, { name: 'C', total: 11, l: 1, p: 10 },
  ]},
  { name: 'KB AMALIA SALSABILA', jenjang: 'KB', total: 66, rombels: 4, details: [
    { name: 'A', total: 17, l: 5, p: 12 }, { name: 'B1', total: 17, l: 12, p: 5 },
    { name: 'B2', total: 15, l: 9, p: 6 }, { name: 'B3', total: 17, l: 13, p: 4 },
  ]},
  { name: 'KB AZ-ZAHRA', jenjang: 'KB', total: 43, rombels: 4, details: [
    { name: 'CERDAS', total: 11, l: 8, p: 3 }, { name: 'CERIA', total: 11, l: 4, p: 7 },
    { name: 'KREATIF', total: 8, l: 3, p: 5 }, { name: 'SEHAT', total: 13, l: 7, p: 6 },
  ]},
  { name: 'KB PALAPA', jenjang: 'KB', total: 23, rombels: 2, details: [
    { name: 'A', total: 12, l: 7, p: 5 }, { name: 'B', total: 11, l: 4, p: 7 },
  ]},
  { name: 'PAUD AL-HUSNA', jenjang: 'KB', total: 33, rombels: 2, details: [
    { name: 'A', total: 18, l: 9, p: 9 }, { name: 'B', total: 15, l: 9, p: 6 },
  ]},
  { name: 'PAUD AMANAH', jenjang: 'KB', total: 27, rombels: 2, details: [
    { name: 'A', total: 15, l: 9, p: 6 }, { name: 'B', total: 12, l: 6, p: 6 },
  ]},
  { name: 'PAUD AN NAIM', jenjang: 'KB', total: 70, rombels: 3, details: [
    { name: 'A', total: 34, l: 18, p: 16 }, { name: 'B1', total: 18, l: 11, p: 7 }, { name: 'B2', total: 18, l: 10, p: 8 },
  ]},
  { name: 'PAUD ASY - SYAFIIYAH', jenjang: 'KB', total: 32, rombels: 2, details: [
    { name: 'A1', total: 17, l: 9, p: 8 }, { name: 'A2', total: 15, l: 7, p: 8 },
  ]},
  { name: 'PAUD BUDGENVIL', jenjang: 'KB', total: 25, rombels: 2, details: [
    { name: 'A', total: 12, l: 4, p: 8 }, { name: 'B', total: 13, l: 5, p: 8 },
  ]},
  { name: 'PAUD SPS MELATI', jenjang: 'KB', total: 19, rombels: 2, details: [
    { name: 'A', total: 7, l: 2, p: 5 }, { name: 'B', total: 12, l: 7, p: 5 },
  ]},
  { name: 'PAUD TUNAS HARAPAN', jenjang: 'KB', total: 30, rombels: 2, details: [
    { name: 'A', total: 17, l: 4, p: 13 }, { name: 'B', total: 13, l: 4, p: 9 },
  ]},
];

const romanMap: Record<string, string> = {
  I: '1', II: '2', III: '3', IV: '4', V: '5', VI: '6',
};

export function extractKelas(rombelName: string, jenjang: string): string {
  if (jenjang === 'SD') {
    let clean = rombelName.replace(/[\s.]+/g, '');
    clean = clean.replace(/^KELAS/i, '');
    const arabic = clean.match(/^(\d+)/);
    if (arabic) return arabic[1];
    const roman = clean.match(/^(IV|VI|I{1,3}|V)/);
    if (roman) return romanMap[roman[1]];
    return '-';
  }
  if (jenjang === 'TK') {
    const kelompok = rombelName.match(/^Kelompok\s+([A-Z])/i);
    if (kelompok) return kelompok[1].toUpperCase();
    const clean = rombelName.replace(/[\s.]+/g, '');
    const match = clean.match(/^([A-Z])/);
    return match ? match[1] : '-';
  }
  if (jenjang === 'KB') {
    const clean = rombelName.replace(/[\s.]+/g, '');
    // letter + optional digits → group by letter, otherwise use full name
    const simple = clean.match(/^([A-Z])\d*$/);
    if (simple) return simple[1];
    return rombelName.trim();
  }
  return '-';
}

export function getKelasSummary(rombelData: RombelEntry[]) {
  const map = new Map<string, { jenjang: string; kelas: string; l: number; p: number }>();
  for (const school of rombelData) {
    for (const d of school.details) {
      const k = extractKelas(d.name, school.jenjang);
      const key = `${school.jenjang}||${k}`;
      if (!map.has(key)) map.set(key, { jenjang: school.jenjang, kelas: k, l: 0, p: 0 });
      const entry = map.get(key)!;
      entry.l += d.l;
      entry.p += d.p;
    }
  }
  const sd = Array.from(map.values()).filter(x => x.jenjang === 'SD').sort((a, b) => a.kelas.localeCompare(b.kelas));
  const nonSd = Array.from(map.values()).filter(x => x.jenjang !== 'SD');
  return [...sd, ...nonSd];
}
