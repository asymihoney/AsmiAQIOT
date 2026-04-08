import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, Filler, Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

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
      backgroundColor: col + '22',
      tension: 0.38,
      pointRadius: 2,
      fill: true,
      borderWidth: 1.5,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { font: { size: 9 }, color: tickColor, maxTicksLimit: 6 },
        grid: { display: false },
      },
      y: {
        ticks: { font: { size: 9 }, color: tickColor, maxTicksLimit: 4 },
        grid: { color: gridColor },
      },
    },
    animation: { duration: 250 },
  }

  return (
    <div style={{ height: 90, width: '100%' }}>
      <Line data={data} options={options} />
    </div>
  )
}
