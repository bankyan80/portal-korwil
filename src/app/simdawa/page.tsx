"use client";

import { useEffect, useMemo, useState } from "react";

type SimdawaRow = {
  tahun_pelajaran?: string;
  jenjang?: string;
  nama_sekolah?: string;
  npsn?: string;
  rombel?: number;
  laki_laki?: number;
  perempuan?: number;
  total_siswa?: number;
  siswa_baru?: number;
  mutasi_masuk?: number;
  mutasi_keluar?: number;
  alumni?: number;
  terakhir_update?: string;

  kelas_1_l?: number;
  kelas_1_p?: number;
  kelas_2_l?: number;
  kelas_2_p?: number;
  kelas_3_l?: number;
  kelas_3_p?: number;
  kelas_4_l?: number;
  kelas_4_p?: number;
  kelas_5_l?: number;
  kelas_5_p?: number;
  kelas_6_l?: number;
  kelas_6_p?: number;

  kelompok_a_l?: number;
  kelompok_a_p?: number;
  kelompok_b_l?: number;
  kelompok_b_p?: number;

  kb_a_l?: number;
  kb_a_p?: number;
  kb_b_l?: number;
  kb_b_p?: number;
  usia_2_3_l?: number;
  usia_2_3_p?: number;
  usia_3_4_l?: number;
  usia_3_4_p?: number;
  usia_5_6_l?: number;
  usia_5_6_p?: number;
};

type SimdawaResponse = {
  success?: boolean;
  updated_at?: string;
  data?: SimdawaRow[];
};

function toNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export default function SimdawaPage() {
  const [rows, setRows] = useState<SimdawaRow[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>("-");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [tahunPelajaran, setTahunPelajaran] = useState("2026/2027");
  const [jenjang, setJenjang] = useState("SEMUA");
  const [sekolah, setSekolah] = useState("SEMUA");
  const [search, setSearch] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_SIMDAWA_APPS_SCRIPT_URL || "";

      let json: SimdawaResponse | null = null;

      if (APPS_SCRIPT_URL && !APPS_SCRIPT_URL.includes("GANTI_DENGAN")) {
        try {
          const res = await fetch(APPS_SCRIPT_URL, { cache: "no-store" });
          if (res.ok) json = await res.json();
        } catch {}
      }

      if (!json?.data?.length) {
        const fallbackRes = await fetch("/api/simdawa-data");
        if (!fallbackRes.ok) throw new Error("Gagal memuat data SIMDAWA");
        json = await fallbackRes.json();
      }

      setRows(Array.isArray(json.data) ? json.data : []);
      setUpdatedAt(json.updated_at || "-");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Data SIMDAWA belum dapat dimuat.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const tahunOptions = useMemo(() => {
    const values = Array.from(
      new Set(rows.map((r) => r.tahun_pelajaran).filter(Boolean))
    ) as string[];
    return values.length ? values : ["2026/2027"];
  }, [rows]);

  const sekolahOptions = useMemo(() => {
    return Array.from(
      new Set(rows.map((r) => r.nama_sekolah).filter(Boolean))
    ) as string[];
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchTahun = !tahunPelajaran || row.tahun_pelajaran === tahunPelajaran;
      const matchJenjang = jenjang === "SEMUA" || row.jenjang === jenjang;
      const matchSekolah = sekolah === "SEMUA" || row.nama_sekolah === sekolah;
      const q = search.toLowerCase().trim();

      const matchSearch =
        !q ||
        String(row.nama_sekolah || "").toLowerCase().includes(q) ||
        String(row.npsn || "").toLowerCase().includes(q);

      return matchTahun && matchJenjang && matchSekolah && matchSearch;
    });
  }, [rows, tahunPelajaran, jenjang, sekolah, search]);

  const summary = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        acc.totalSiswa += toNumber(row.total_siswa);
        acc.sd += row.jenjang === "SD" ? toNumber(row.total_siswa) : 0;
        acc.tk += row.jenjang === "TK" ? toNumber(row.total_siswa) : 0;
        acc.kb += row.jenjang === "KB" ? toNumber(row.total_siswa) : 0;
        acc.laki += toNumber(row.laki_laki);
        acc.perempuan += toNumber(row.perempuan);
        acc.rombel += toNumber(row.rombel);
        acc.siswaBaru += toNumber(row.siswa_baru);
        acc.mutasiMasuk += toNumber(row.mutasi_masuk);
        acc.mutasiKeluar += toNumber(row.mutasi_keluar);
        acc.alumni += toNumber(row.alumni);
        return acc;
      },
      {
        totalSiswa: 0,
        sd: 0,
        tk: 0,
        kb: 0,
        laki: 0,
        perempuan: 0,
        rombel: 0,
        siswaBaru: 0,
        mutasiMasuk: 0,
        mutasiKeluar: 0,
        alumni: 0,
      }
    );
  }, [filteredRows]);

  const sdRows = filteredRows.filter((row) => row.jenjang === "SD");
  const tkRows = filteredRows.filter((row) => row.jenjang === "TK");
  const kbRows = filteredRows.filter((row) => row.jenjang === "KB");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl bg-white p-5 shadow-sm border">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Google Sheet &middot; Apps Script</p>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">SIMDAWA</h1>
              <p className="text-sm text-slate-600">
                Sistem Informasi Manajemen Data Siswa SD/TK/KB
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Tahun Pelajaran aktif: {tahunPelajaran} &middot; Terakhir update: {updatedAt}
              </p>
            </div>

            <button
              onClick={loadData}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl bg-white p-5 text-slate-600 shadow-sm border">
            Memuat data SIMDAWA...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
              <SummaryCard title="Total Siswa" value={summary.totalSiswa} />
              <SummaryCard title="Siswa SD" value={summary.sd} />
              <SummaryCard title="Siswa TK" value={summary.tk} />
              <SummaryCard title="Siswa KB" value={summary.kb} />
              <SummaryCard title="Laki-laki" value={summary.laki} />
              <SummaryCard title="Perempuan" value={summary.perempuan} />
              <SummaryCard title="Rombel" value={summary.rombel} />
              <SummaryCard title="Siswa Baru" value={summary.siswaBaru} />
              <SummaryCard title="Mutasi Masuk" value={summary.mutasiMasuk} />
              <SummaryCard title="Mutasi Keluar" value={summary.mutasiKeluar} />
              <SummaryCard title="Alumni" value={summary.alumni} />
              <SummaryCard title="Lembaga" value={filteredRows.length} />
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm border">
              <div className="grid gap-3 md:grid-cols-4">
                <select
                  value={tahunPelajaran}
                  onChange={(e) => setTahunPelajaran(e.target.value)}
                  className="rounded-xl border px-3 py-2 text-sm"
                >
                  {tahunOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <select
                  value={jenjang}
                  onChange={(e) => setJenjang(e.target.value)}
                  className="rounded-xl border px-3 py-2 text-sm"
                >
                  <option value="SEMUA">Semua Jenjang</option>
                  <option value="SD">SD</option>
                  <option value="TK">TK</option>
                  <option value="KB">KB</option>
                </select>

                <select
                  value={sekolah}
                  onChange={(e) => setSekolah(e.target.value)}
                  className="rounded-xl border px-3 py-2 text-sm"
                >
                  <option value="SEMUA">Semua Sekolah/Lembaga</option>
                  {sekolahOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari sekolah atau NPSN..."
                  className="rounded-xl border px-3 py-2 text-sm"
                />
              </div>
            </div>

            {filteredRows.length === 0 ? (
              <div className="rounded-2xl bg-white p-5 text-slate-600 shadow-sm border">
                Belum ada data siswa pada tahun pelajaran yang dipilih.
              </div>
            ) : (
              <>
                <TableAll rows={filteredRows} />
                <TableSD rows={sdRows} />
                <TableTK rows={tkRows} />
                <TableKB rows={kbRows} />
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm border">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">
        {value.toLocaleString("id-ID")}
      </p>
    </div>
  );
}

function TableWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm border">
      <h2 className="mb-3 text-lg font-bold text-slate-900">{title}</h2>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap border-b px-3 py-2 text-left text-xs font-semibold text-slate-600">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="whitespace-nowrap border-b px-3 py-2 text-sm text-slate-700">
      {children ?? "-"}
    </td>
  );
}

function TableAll({ rows }: { rows: SimdawaRow[] }) {
  return (
    <TableWrapper title="Rekap Semua Jenjang">
      <table className="w-full min-w-[1100px] border-collapse">
        <thead>
          <tr>
            {[
              "No",
              "Tahun Pelajaran",
              "Jenjang",
              "Nama Sekolah/Lembaga",
              "NPSN",
              "Rombel",
              "L",
              "P",
              "Total",
              "Siswa Baru",
              "Mutasi Masuk",
              "Mutasi Keluar",
              "Alumni",
              "Update",
            ].map((item) => (
              <Th key={item}>{item}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.npsn}-${index}`}>
              <Td>{index + 1}</Td>
              <Td>{row.tahun_pelajaran}</Td>
              <Td>{row.jenjang}</Td>
              <Td>{row.nama_sekolah}</Td>
              <Td>{row.npsn}</Td>
              <Td>{row.rombel}</Td>
              <Td>{row.laki_laki}</Td>
              <Td>{row.perempuan}</Td>
              <Td>{row.total_siswa}</Td>
              <Td>{row.siswa_baru}</Td>
              <Td>{row.mutasi_masuk}</Td>
              <Td>{row.mutasi_keluar}</Td>
              <Td>{row.alumni}</Td>
              <Td>{row.terakhir_update}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrapper>
  );
}

function TableSD({ rows }: { rows: SimdawaRow[] }) {
  if (!rows.length) return null;

  return (
    <TableWrapper title="Rekap Khusus SD">
      <table className="w-full min-w-[1300px] border-collapse">
        <thead>
          <tr>
            {[
              "No",
              "Nama Sekolah",
              "NPSN",
              "I L",
              "I P",
              "II L",
              "II P",
              "III L",
              "III P",
              "IV L",
              "IV P",
              "V L",
              "V P",
              "VI L",
              "VI P",
              "Total L",
              "Total P",
              "Total",
            ].map((item) => (
              <Th key={item}>{item}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.npsn}-sd-${index}`}>
              <Td>{index + 1}</Td>
              <Td>{row.nama_sekolah}</Td>
              <Td>{row.npsn}</Td>
              <Td>{row.kelas_1_l}</Td>
              <Td>{row.kelas_1_p}</Td>
              <Td>{row.kelas_2_l}</Td>
              <Td>{row.kelas_2_p}</Td>
              <Td>{row.kelas_3_l}</Td>
              <Td>{row.kelas_3_p}</Td>
              <Td>{row.kelas_4_l}</Td>
              <Td>{row.kelas_4_p}</Td>
              <Td>{row.kelas_5_l}</Td>
              <Td>{row.kelas_5_p}</Td>
              <Td>{row.kelas_6_l}</Td>
              <Td>{row.kelas_6_p}</Td>
              <Td>{row.laki_laki}</Td>
              <Td>{row.perempuan}</Td>
              <Td>{row.total_siswa}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrapper>
  );
}

function TableTK({ rows }: { rows: SimdawaRow[] }) {
  if (!rows.length) return null;

  return (
    <TableWrapper title="Rekap Khusus TK">
      <table className="w-full min-w-[800px] border-collapse">
        <thead>
          <tr>
            {["No", "Nama Lembaga", "NPSN", "A L", "A P", "B L", "B P", "Total L", "Total P", "Total"].map(
              (item) => (
                <Th key={item}>{item}</Th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.npsn}-tk-${index}`}>
              <Td>{index + 1}</Td>
              <Td>{row.nama_sekolah}</Td>
              <Td>{row.npsn}</Td>
              <Td>{row.kelompok_a_l}</Td>
              <Td>{row.kelompok_a_p}</Td>
              <Td>{row.kelompok_b_l}</Td>
              <Td>{row.kelompok_b_p}</Td>
              <Td>{row.laki_laki}</Td>
              <Td>{row.perempuan}</Td>
              <Td>{row.total_siswa}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrapper>
  );
}

function TableKB({ rows }: { rows: SimdawaRow[] }) {
  if (!rows.length) return null;

  return (
    <TableWrapper title="Rekap Khusus KB (Berdasarkan Kelompok & Usia)">
      <table className="w-full min-w-[1200px] border-collapse">
        <thead>
          <tr>
            {[
              "No",
              "Nama Lembaga",
              "NPSN",
              "Kel. Bermain A L",
              "Kel. Bermain A P",
              "Kel. Bermain B L",
              "Kel. Bermain B P",
              "Usia 2-3 L",
              "Usia 2-3 P",
              "Usia 3-4 L",
              "Usia 3-4 P",
              "Usia 5-6 L",
              "Usia 5-6 P",
              "Total L",
              "Total P",
              "Total",
            ].map((item) => (
              <Th key={item}>{item}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.npsn}-kb-${index}`}>
              <Td>{index + 1}</Td>
              <Td>{row.nama_sekolah}</Td>
              <Td>{row.npsn}</Td>
              <Td>{row.kb_a_l}</Td>
              <Td>{row.kb_a_p}</Td>
              <Td>{row.kb_b_l}</Td>
              <Td>{row.kb_b_p}</Td>
              <Td>{row.usia_2_3_l}</Td>
              <Td>{row.usia_2_3_p}</Td>
              <Td>{row.usia_3_4_l}</Td>
              <Td>{row.usia_3_4_p}</Td>
              <Td>{row.usia_5_6_l}</Td>
              <Td>{row.usia_5_6_p}</Td>
              <Td>{row.laki_laki}</Td>
              <Td>{row.perempuan}</Td>
              <Td>{row.total_siswa}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrapper>
  );
}
