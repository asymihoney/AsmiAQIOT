// AQChart.jsx
import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, Filler, Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import zoomPlugin from 'chartjs-plugin-zoom'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, zoomPlugin)

const COLORS = {
  co2:  '#1D9E75',
  pm1:  '#378ADD',
  pm25: '#D85A30',
  pm10: '#BA7517',
}

export default function AQChart({ rows, metrik, isDark }) {
  const labels = rows.map(r => {
    const d = new Date(r.created_at)
    return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0')
  })
  
  const values = rows.map(r => r[metrik] ?? 0)
  const col = COLORS[metrik] ?? '#1D9E75'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
  const tickColor = isDark ? '#888' : '#999'

  const data = {
    labels,
    datasets: [{
      data: values,
      borderColor: col,
      backgroundColor: col + '15', // Lebih transparan biar clean
      tension: 0.4,
      // Optimasi: Hilangkan titik jika data > 40 agar tidak "berisik"
      pointRadius: rows.length > 40 ? 0 : 3, 
      pointHoverRadius: 6,
      fill: true,
      borderWidth: 2,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    // Menambahkan padding di dalam area chart
    layout: {
      padding: {
        top: 10,
        bottom: 0,
        left: 5,
        right: 15
      }
    },
    plugins: { 
      legend: { display: false },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
          threshold: 5, // Lebih sensitif saat di-drag
        },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x',
        },
        limits: {
          x: { min: 'original', max: 'original' }
        }
      },
      tooltip: {
        enabled: true,
        // ... (styling tooltip Anda sudah bagus)
      }
    },
    scales: {
      x: {
        // Fokus ke 1000 data terakhir (sekitar 83 menit jika per 5 detik)
        // Pengguna bisa drag ke kiri untuk lihat histori lama
        min: rows.length > 1000 ? rows.length - 1000 : undefined,
        max: rows.length > 0 ? rows.length - 1 : undefined,
        ticks: { 
          font: { size: 10 },
          color: tickColor,
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
          padding: 10 // Jarak antara label waktu dan garis
        },
        grid: { display: false },
      },
      y: {
        ticks: { 
          font: { size: 10 },
          color: tickColor,
          maxTicksLimit: 5,
          padding: 8,
          callback: (value) => Math.round(value)
        },
        grid: { color: gridColor, drawBorder: false },
        beginAtZero: false,
      },
    },
    interaction: { mode: 'index', intersect: false },
  }

  return (
    <div className="relative group w-full pt-4"> 
      {/* Container utama dengan padding atas agar tidak nempel judul */}
      <div 
        className="transition-all duration-300"
        style={{ 
          height: 180, 
          width: '100%', 
          cursor: 'grab',
          touchAction: 'none' // Penting untuk kelancaran zoom di HP
        }}
      >
        <Line data={data} options={options} />
      </div>
      
      {/* Teks instruksi dengan padding lebih lega */}
      <div className="h-6 flex items-center justify-center mt-2">
        <p className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gray-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
          Scroll untuk zoom dan drag untuk pan.
        </p>
      </div>
    </div>
  )
}