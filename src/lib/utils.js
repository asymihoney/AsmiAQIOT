// Rank severity masing-masing polutan (index makin besar = makin parah)
export const CO2_RANK = ['Baik', 'Sedang', 'Buruk', 'Berbahaya', 'Kritis']
export const PM25_RANK = ['Baik', 'Sedang', 'Tidak Sehat', 'Sangat Tidak Sehat', 'Berbahaya']

function co2Level(co2) {
  if (co2 > 40000) return 'Kritis'
  if (co2 > 5000) return 'Berbahaya'
  if (co2 > 2000) return 'Buruk'
  if (co2 > 1000) return 'Sedang'
  return 'Baik'
}

function pm25Level(pm25) {
  if (pm25 > 250.4) return 'Berbahaya'
  if (pm25 > 150.4) return 'Sangat Tidak Sehat'
  if (pm25 > 55.4)  return 'Tidak Sehat'
  if (pm25 > 15.5)  return 'Sedang'
  return 'Baik'
}

export function calcStatus(co2, pm25) {
  const c = co2Level(co2)
  const p = pm25Level(pm25)

  const cRank = CO2_RANK.indexOf(c)
  const pRank = PM25_RANK.indexOf(p)

  if (cRank === pRank) {
    // rank sama, tapi nama bisa beda (mis. CO2 'Berbahaya' rank3 vs PM 'Berbahaya' rank4 → gasama)
    // hanya gabungkan kalau NAMA-nya juga sama
    if (c === p) return `CO₂ & PM2.5 - ${c}`
    // rank sama tapi nama beda → tampilkan keduanya terpisah
    return `CO₂ - ${c} & PM2.5 - ${p}`
  }

  return cRank > pRank ? `CO₂ - ${c}` : `PM2.5 - ${p}`
}

export { co2Level, pm25Level }

// ── Warna circle suhu 15°C (biru) → 27°C (hijau) → 40°C (merah) ──────────
export function tempColor(t) {
  const lo = 15, hi = 40, mid = 27
  t = Math.max(lo, Math.min(hi, t))
  const lerp = (a, b, r) => Math.round(a + (b - a) * r)
  if (t <= mid) {
    const ratio = (t - lo) / (mid - lo)
    return `rgb(${lerp(55, 29, ratio)},${lerp(130, 158, ratio)},${lerp(210, 117, ratio)})`
  } else {
    const ratio = (t - mid) / (hi - mid)
    return `rgb(${lerp(29, 226, ratio)},${lerp(158, 75, ratio)},${lerp(117, 74, ratio)})`
  }
}

// ── Status warna ──────────────────────────────────────────────────────────
export const STATUS_COLOR = {
  'CO₂ & PM2.5 - Baik': '#4caf50',
  'CO₂ & PM2.5 - Sedang': '#ff9800',
  'CO₂ - Sedang': '#ff9800',
  'PM2.5 - Sedang': '#ff9800',
  'CO₂ & PM2.5 - Buruk': '#f44336',
  'CO₂ - Buruk': '#f44336',
  'PM2.5 - Buruk': '#f44336',
  'CO₂ & PM2.5 - Berbahaya': '#991b1b',
  'CO₂ - Berbahaya': '#991b1b',
  'PM2.5 - Berbahaya': '#991b1b',
  'CO₂ & PM2.5 - Kritis': '#4c1d95',
  'CO₂ - Kritis': '#4c1d95',
  'PM2.5 - Kritis': '#4c1d95',
  'CO₂ & PM2.5 - Tidak Sehat': '#f97316',
  'CO₂ - Tidak Sehat': '#f97316',
  'PM2.5 - Tidak Sehat': '#f97316',
  'CO₂ & PM2.5 - Sangat Tidak Sehat': '#dc2626',
  'CO₂ - Sangat Tidak Sehat': '#dc2626',
  'PM2.5 - Sangat Tidak Sehat': '#dc2626',

  // fallback standalone (dipakai VNPopup via co2Level/pm25Level langsung)
  'Baik': '#4caf50',
  'Sedang': '#ff9800',
  'Buruk': '#f44336',
  'Tidak Sehat': '#f97316',
  'Sangat Tidak Sehat': '#dc2626',
  'Berbahaya': '#991b1b',
  'Kritis': '#4c1d95',
}

// ── Mock data (dipakai jika Supabase belum dikonfigurasi) ─────────────────
export const MOCK_LOCATIONS = [
  'Kampus E - Koridor E1',
  'Kampus E - Koridor E2',
  'Kampus G - Kelas G1',
  'Kampus G - Parking Lot',
]

function mockSeries(base, n = 24) {
  let v = base
  return Array.from({ length: n }, () => {
    v += (Math.random() - 0.48) * base * 0.09
    return Math.max(0, Math.round(v))
  })
}

export function buildMockRows(lokasi) {
  const base = {
    'Kampus E - Koridor E1': { suhu: 10, kelembapan: 62, co2: 10, pm1: 10, pm25: 10, pm10: 10 },
    'Kampus E - Koridor E2': { suhu: 31, kelembapan: 70, co2: 820, pm1: 22, pm25: 38, pm10: 55 },
    'Kampus G - Kelas G1': { suhu: 34, kelembapan: 78, co2: 1450, pm1: 55, pm25: 85, pm10: 120 },
    'Kampus G - Parking Lot': { suhu: 29, kelembapan: 58, co2: 480, pm1: 10, pm25: 15, pm10: 22 },
  }[lokasi] ?? { suhu: 29, kelembapan: 65, co2: 600, pm1: 12, pm25: 20, pm10: 30 }

  const now = Date.now()
  return Array.from({ length: 24 }, (_, i) => ({
    id: i,
    created_at: new Date(now - (23 - i) * 5 * 60 * 1000).toISOString(),
    lokasi,
    ...base,
    co2: mockSeries(base.co2, 24)[i],
    pm1: mockSeries(base.pm1, 24)[i],
    pm25: mockSeries(base.pm25, 24)[i],
    pm10: mockSeries(base.pm10, 24)[i],
  }))
}
