'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6']

interface ChartData {
  name: string
  sudah: number
  belum: number
}

export function ProgressChart({ data }: { data: ChartData[] }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Progres Laporan per Jenjang</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="sudah" name="Sudah Lapor" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="belum" name="Belum Lapor" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface PieData {
  name: string
  value: number
}

export function StatPie({ data, title }: { data: PieData[]; title: string }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

interface MuridGtkData {
  name: string
  murid: number
  guru: number
  tendik: number
}

export function MuridGtkChart({ data }: { data: MuridGtkData[] }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Statistik Murid & GTK per Jenjang</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="murid" name="Murid" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="guru" name="Guru" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="tendik" name="Tendik" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface LaporanTrend {
  bulan: string
  lapor: number
}

export function LaporanTrendChart({ data }: { data: LaporanTrend[] }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Tren Laporan per Bulan</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="lapor" name="Sudah Lapor" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
