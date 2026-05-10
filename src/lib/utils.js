// ── Status kualitas udara berdasarkan CO2 + PM2.5 ──────────────────────────
export function calcStatus(co2, pm25) {
  // Cek kondisi 'Buruk'
  if (co2 > 1000 || pm25 > 55) {
    if (co2 > 1000 && pm25 > 55) return 'CO₂ & PM2.5 - Buruk';
    if (co2 > 1000) return 'CO₂ - Buruk';
    if (pm25 > 55) return 'PM2.5 - Buruk';
  }

  // Cek kondisi 'Sedang'
  if (co2 > 400 || pm25 > 15) {
    if (co2 > 400 && pm25 > 15) return 'CO₂ & PM2.5 - Sedang';
    if (co2 > 400) return 'CO₂ - Sedang';
    if (pm25 > 15) return 'PM2.5 - Sedang';
  }

  // Jika semua di bawah ambang batas
  return 'CO₂ & PM2.5 - Baik';
}

// ── Warna circle suhu 15°C (biru) → 27°C (hijau) → 40°C (merah) ──────────
export function tempColor(t) {
  const lo = 15, hi = 40, mid = 27
  t = Math.max(lo, Math.min(hi, t))
  const lerp = (a, b, r) => Math.round(a + (b - a) * r)
  if (t <= mid) {
    const ratio = (t - lo) / (mid - lo)
    return `rgb(${lerp(55,29,ratio)},${lerp(130,158,ratio)},${lerp(210,117,ratio)})`
  } else {
    const ratio = (t - mid) / (hi - mid)
    return `rgb(${lerp(29,226,ratio)},${lerp(158,75,ratio)},${lerp(117,74,ratio)})`
  }
}

// ── Weighted moving average trend prediction ──────────────────────────────
// Menggunakan delta tertimbang (data terbaru diberi bobot lebih besar)
export function trendPredict(series) {
  if (!series || series.length < 3) return { pred: series?.at(-1) ?? 0, dir: 'stabil' }
  const last = series.slice(-6)
  const deltas = last.slice(1).map((v, i) => v - last[i])
  // bobot: index terbaru = bobot tertinggi
  const weights = deltas.map((_, i) => i + 1)
  const sumW = weights.reduce((a, b) => a + b, 0)
  const wAvg = deltas.reduce((a, d, i) => a + d * weights[i], 0) / sumW
  const pred = Math.round(last.at(-1) + wAvg * 3)
  const dir = wAvg > 5 ? 'meningkat' : wAvg < -5 ? 'menurun' : 'stabil'
  return { pred: Math.max(0, pred), dir }
}

// ── Status warna ──────────────────────────────────────────────────────────
export const STATUS_COLOR = {
  'CO₂ & PM2.5 - Baik':   '#4caf50',
  'CO₂ & PM2.5 - Sedang': '#ff9800',
  'CO₂ - Sedang':         '#ff9800',
  'PM2.5 - Sedang':       '#ff9800',
  'Sedang':               '#ff9800',
  'CO₂ & PM2.5 - Buruk':  '#f44336',
  'CO₂ - Buruk':          '#f44336',
  'PM2.5 - Buruk':        '#f44336',
  'Buruk':                '#f44336'
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
    'Kampus E - Koridor E1': { suhu:10, kelembapan:62, co2:10,  pm1:10,  pm25:10, pm10:10  },
    'Kampus E - Koridor E2': { suhu:31, kelembapan:70, co2:820,  pm1:22, pm25:38, pm10:55  },
    'Kampus G - Kelas G1':   { suhu:34, kelembapan:78, co2:1450, pm1:55, pm25:85, pm10:120 },
    'Kampus G - Parking Lot':{ suhu:29, kelembapan:58, co2:480,  pm1:10, pm25:15, pm10:22  },
  }[lokasi] ?? { suhu:29, kelembapan:65, co2:600, pm1:12, pm25:20, pm10:30 }

  const now = Date.now()
  return Array.from({ length: 24 }, (_, i) => ({
    id: i,
    created_at: new Date(now - (23 - i) * 5 * 60 * 1000).toISOString(),
    lokasi,
    ...base,
    co2:  mockSeries(base.co2,  24)[i],
    pm1:  mockSeries(base.pm1,  24)[i],
    pm25: mockSeries(base.pm25, 24)[i],
    pm10: mockSeries(base.pm10, 24)[i],
  }))
}
