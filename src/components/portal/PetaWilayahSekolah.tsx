'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Search, X, School, Layers, LocateFixed } from 'lucide-react';
import { BlueBarHeader } from '@/components/shared/SectionTitle';
import { sekolahLemahabangMap, type SekolahMap } from '@/data/sekolahLemahabangMap';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER: [number, number] = [-6.832, 108.625];
const DEFAULT_ZOOM = 13;

const negeriIcon = L.divIcon({
  className: '',
  html: `<div style="background:#0d3b66;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const swastaIcon = L.divIcon({
  className: '',
  html: `<div style="background:#16a34a;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const highlightIcon = L.divIcon({
  className: '',
  html: `<div style="background:#eab308;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 0 16px rgba(234,179,8,.6);"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 17, { duration: 1 });
  }, [map, lat, lng]);
  return null;
}

function openRoute(lat: number, lng: number) {
  const dest = `${lat},${lng}`;
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`, '_blank');
}

function openRouteFromUser(lat: number, lng: number) {
  if (!navigator.geolocation) {
    openRoute(lat, lng);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const origin = `${pos.coords.latitude},${pos.coords.longitude}`;
      const dest = `${lat},${lng}`;
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}`,
        '_blank'
      );
    },
    () => {
      openRoute(lat, lng);
    },
    { timeout: 5000 }
  );
}

function openGoogleMaps(lat: number, lng: number) {
  window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
}

function getUserLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}

function MarkerLayer({
  schools,
  highlightedNpsn,
  onFocus,
}: {
  schools: SekolahMap[];
  highlightedNpsn: string | null;
  onFocus: (s: SekolahMap) => void;
}) {
  return (
    <>
      {schools.map((s) => (
        <Marker
          key={s.npsn}
          position={[s.latitude, s.longitude]}
          icon={s.npsn === highlightedNpsn ? highlightIcon : s.status === 'Negeri' ? negeriIcon : swastaIcon}
        >
          <Popup>
            <div className="text-center min-w-[160px]">
              <p className="font-bold text-[#0d3b66] text-sm mb-1">{s.nama}</p>
              <p className="text-xs text-gray-500 mb-0.5">NPSN: {s.npsn}</p>
              <p className="text-xs text-gray-500 mb-2">Status: {s.status}</p>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => openRoute(s.latitude, s.longitude)}
                  className="w-full text-xs bg-[#0d3b66] text-white rounded-md py-1.5 px-3 hover:bg-[#1a5276] transition-colors flex items-center justify-center gap-1"
                >
                  <Navigation className="w-3 h-3" />
                  Lihat Rute
                </button>
                <button
                  onClick={() => openGoogleMaps(s.latitude, s.longitude)}
                  className="w-full text-xs border border-gray-300 text-gray-700 rounded-md py-1.5 px-3 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  Buka Google Maps
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export default function PetaWilayahSekolah() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Negeri' | 'Swasta'>('all');
  const [highlightedNpsn, setHighlightedNpsn] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [focusSchool, setFocusSchool] = useState<SekolahMap | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<SekolahMap | null>(null);

  const filtered = useMemo(() => {
    let result = [...sekolahLemahabangMap];
    if (filterStatus !== 'all') {
      result = result.filter((s) => s.status === filterStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((s) => s.nama.toLowerCase().includes(q) || s.npsn.includes(q));
    }
    return result;
  }, [search, filterStatus]);

  const totalNegeri = useMemo(() => sekolahLemahabangMap.filter((s) => s.status === 'Negeri').length, []);
  const totalSwasta = useMemo(() => sekolahLemahabangMap.filter((s) => s.status === 'Swasta').length, []);

  const handleLocate = useCallback(async () => {
    setLocating(true);
    const loc = await getUserLocation();
    if (loc) {
      setUserLocation(loc);
    }
    setLocating(false);
  }, []);

  const handleFocus = useCallback((s: SekolahMap) => {
    setHighlightedNpsn(s.npsn);
    setFocusSchool(s);
    setSelectedSchool(s);
    setTimeout(() => setHighlightedNpsn(null), 3000);
  }, []);

  const handleResetView = useCallback(() => {
    setFocusSchool(null);
    setSelectedSchool(null);
    setHighlightedNpsn(null);
    setSearch('');
    setFilterStatus('all');
  }, []);

  return (
    <section>
      <div className="rounded-lg overflow-hidden shadow-sm border border-gray-100 bg-white">
        <BlueBarHeader title="Peta Wilayah Sekolah" />
        <div className="p-4 sm:p-5">
          <p className="text-xs sm:text-sm text-gray-500 mb-4">
            Titik lokasi sekolah di lingkungan pendidikan Kecamatan Lemahabang
          </p>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-xl sm:text-2xl font-bold text-[#0d3b66]">{sekolahLemahabangMap.length}</p>
              <p className="text-xs text-gray-600">Total Sekolah</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-xl sm:text-2xl font-bold text-[#0d3b66]">{totalNegeri}</p>
              <p className="text-xs text-gray-600">SD Negeri</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xl sm:text-2xl font-bold text-green-700">{totalSwasta}</p>
              <p className="text-xs text-gray-600">SD Swasta</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-xl sm:text-2xl font-bold text-amber-700">1</p>
              <p className="text-xs text-gray-600">Kecamatan</p>
            </div>
          </div>

          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama sekolah atau NPSN..."
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d3b66]/20 focus:border-[#0d3b66]"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'Negeri' | 'Swasta')}
                className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0d3b66]/20 focus:border-[#0d3b66] bg-white"
              >
                <option value="all">Semua Status</option>
                <option value="Negeri">Negeri</option>
                <option value="Swasta">Swasta</option>
              </select>
              <button
                onClick={handleLocate}
                disabled={locating}
                className="flex items-center gap-1.5 text-sm border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Gunakan Lokasi Saya"
              >
                <LocateFixed className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Lokasi Saya</span>
              </button>
              <button
                onClick={handleResetView}
                className="flex items-center gap-1.5 text-sm border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50 transition-colors"
                title="Reset Peta"
              >
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>

          {/* Map and school list */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Map */}
            <div className="flex-1">
              <div className="rounded-lg overflow-hidden border border-gray-200 h-[520px] max-md:h-[420px]">
                <MapContainer
                  center={DEFAULT_CENTER}
                  zoom={DEFAULT_ZOOM}
                  scrollWheelZoom={true}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MarkerLayer schools={filtered} highlightedNpsn={highlightedNpsn} onFocus={handleFocus} />
                  {focusSchool && <FlyTo lat={focusSchool.latitude} lng={focusSchool.longitude} />}
                  {userLocation && (
                    <Marker
                      position={[userLocation.lat, userLocation.lng]}
                      icon={L.divIcon({
                        className: '',
                        html: `<div style="background:#ef4444;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);"><div class="animate-peta-pulse" style="position:absolute;top:-6px;left:-6px;width:32px;height:32px;border-radius:50%;background:rgba(239,68,68,.2);"></div></div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10],
                      })}
                    >
                      <Popup>
                        <div className="text-center">
                          <p className="text-xs font-semibold">Lokasi Saya</p>
                          <p className="text-xs text-gray-500">
                            {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </div>

            {/* School list */}
            <div className="lg:w-80 xl:w-96">
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-700">
                    Daftar Sekolah
                    <span className="text-xs font-normal text-gray-400 ml-1">({filtered.length})</span>
                  </p>
                </div>
                <div className="divide-y divide-gray-100 max-h-[470px] overflow-y-auto">
                  {filtered.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-400">
                      <School className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      Tidak ada sekolah ditemukan
                    </div>
                  ) : (
                    filtered.map((s) => (
                      <div
                        key={s.npsn}
                        className={`flex items-center justify-between p-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                          selectedSchool?.npsn === s.npsn ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleFocus(s)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate">{s.nama}</p>
                          <p className="text-xs text-gray-400">
                            NPSN: {s.npsn} • {s.status}
                          </p>
                        </div>
                        <div className="flex gap-1.5 ml-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFocus(s);
                            }}
                            className="p-1.5 rounded-md hover:bg-blue-100 text-[#0d3b66] transition-colors"
                            title="Fokus di Peta"
                          >
                            <MapPin className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openRouteFromUser(s.latitude, s.longitude);
                            }}
                            className="p-1.5 rounded-md hover:bg-blue-100 text-[#0d3b66] transition-colors"
                            title="Lihat Rute"
                          >
                            <Navigation className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
