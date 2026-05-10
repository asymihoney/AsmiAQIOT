// AQChart.jsx
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js'
import { Line } from 'react-chartjs-2'
import zoomPlugin from 'chartjs-plugin-zoom'
import annotationPlugin from 'chartjs-plugin-annotation'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, zoomPlugin, annotationPlugin)

const THRESHOLDS_CONFIG = {
  co2: {
    baik: 400, sedang: 1000, buruk: 2000,
    labels: ['Baik', 'Sedang', 'Buruk'], colors: ['#22c55e', '#f59e0b', '#ef4444']
  },
  pm25: {
    baik: 15.5, sedang: 55.4, ts: 150.4, buruk: 250.4,
    labels: ['Baik', 'Sedang', 'Tidak Sehat', 'Buruk'], colors: ['#22c55e', '#f59e0b', '#f97316', '#ef4444']
  },
  pm10: {
    baik: 50, sedang: 150, ts: 350, buruk: 420,
    labels: ['Baik', 'Sedang', 'Tidak Sehat', 'Buruk'], colors: ['#22c55e', '#f59e0b', '#f97316', '#ef4444']
  },
  pm1: { value: null }
}

const COLORS = {
  co2: '#1D9E75', pm1: '#378ADD', pm25: '#D85A30', pm10: '#BA7517',
}

export default function AQChart({ rows, metrik, isDark }) {
  const labels = rows.map(r => {
    const d = new Date(r.created_at)
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
  })

  const values = rows.map(r => r[metrik] ?? 0)
  const col = COLORS[metrik] ?? '#1D9E75'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
  const tickColor = isDark ? '#888' : '#999'

  // --- LOGIKA ANNOTATION DINAMIS ---
  const conf = THRESHOLDS_CONFIG[metrik]
  const activeAnnotations = {}

  if (conf && conf.labels) {
    // 1. Buat Box Hijau otomatis untuk area "Baik"
    activeAnnotations.boxBaik = {
      type: 'box',
      yMin: 0,
      yMax: conf.baik,
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.02)' : 'rgba(34, 197, 94, 0.04)',
      borderWidth: 0,
    }

    // 2. Loop semua threshold yang ada (baik, sedang, ts, buruk, bahaya)
    // Kita ambil keys selain 'labels' dan 'colors'
    const keys = Object.keys(conf).filter(k => k !== 'labels' && k !== 'colors')

    keys.forEach((key, index) => {
      const val = conf[key]
      if (val) {
        activeAnnotations[`line_${key}`] = {
          type: 'line',
          yMin: val,
          yMax: val,
          borderColor: conf.colors[index] || '#ccc',
          borderWidth: 1.5,
          borderDash: [4, 4],
          label: {
            display: true,
            content: conf.labels[index],
            position: index % 2 === 0 ? 'start' : 'end', // Selang-seling agar tidak tabrakan
            backgroundColor: 'rgba(0,0,0,0.6)',
            font: { size: 9 }
          }
        }
      }
    })
  }

  const data = {
    labels,
    datasets: [{
      data: values,
      borderColor: col,
      backgroundColor: col + '15',
      tension: 0.4,
      pointRadius: rows.length > 40 ? 0 : 3,
      pointHoverRadius: 6,
      fill: true,
      borderWidth: 2,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 25, bottom: 0, left: 5, right: 15 } },
    plugins: {
      annotation: { annotations: activeAnnotations }, // Menggunakan objek hasil filter di atas
      legend: { display: false },
      zoom: {
        pan: { enabled: true, mode: 'x', threshold: 5 },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
        limits: { x: { min: 'original', max: 'original' } }
      },
      tooltip: { enabled: true }
    },
    scales: {
      x: {
        min: rows.length > 1000 ? rows.length - 1000 : undefined,
        max: rows.length > 0 ? rows.length - 1 : undefined,
        ticks: { font: { size: 10 }, color: tickColor, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
        grid: { display: false },
      },
      y: {
        // Biar chart selalu punya ruang untuk melihat garis threshold
        suggestedMax: (conf?.sedang || conf?.buruk || 100) * 1.2,
        ticks: { font: { size: 10 }, color: tickColor, maxTicksLimit: 5, callback: (value) => Math.round(value) },
        grid: { color: gridColor, drawBorder: false },
        beginAtZero: true,
      },
    },
    interaction: { mode: 'index', intersect: false },
  }

  return (
    <div className="relative group w-full pt-4">
      <div className="transition-all duration-300" style={{ height: 180, width: '100%', cursor: 'grab', touchAction: 'none' }}>
        <Line data={data} options={options} />
      </div>
      <div className="h-6 flex items-center justify-center mt-2">
        <p className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gray-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
          Scroll untuk zoom dan drag untuk pan.
        </p>
      </div>
    </div>
  )
}