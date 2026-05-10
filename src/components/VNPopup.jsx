import Maskot from './Maskot'
import { STATUS_COLOR } from '../lib/utils'

export default function VNPopup({ data, onClose }) {
  if (!data) return null
  const { lokasi, status, suhu, kelembapan, co2, pm1, pm25, pm10, predCO2, predStatus, dir } = data
  const sc = STATUS_COLOR[status] ?? '#4caf50'
  const pc = STATUS_COLOR[predStatus] ?? '#4caf50'

  return (
    <div className="vn-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="vn-row" onClick={e => e.stopPropagation()}>
        {/* Maskot selalu di kiri */}
        <div className="vn-mascot-wrap" onClick={onClose} style={{ cursor: 'pointer' }}>
          <Maskot status={status} size={58} />
        </div>
        <div className="vn-box" onClick={onClose}>
          <div className="vn-name">Anila</div>
          <p className="vn-text">
            Kualitas udara pada elemen {' '}
            <span style={{ color: sc, fontWeight: 600 }}>{status}</span> untuk lokasi <span style={{ color: '#1D9E75', fontWeight: 600 }}>{lokasi}</span>. <br></br> {' Kondisi udara saat ini tercatat dengan rincian: '} <br></br>
            CO₂ <strong>{co2}</strong> ppm, PM1 <strong>{pm1}</strong>,
            PM2.5 <strong>{pm25}</strong>, PM10 <strong>{pm10}</strong> µg/m³.
            Suhu <strong>{suhu}°C</strong>, kelembapan <strong>{kelembapan}%</strong>.
          </p>
          <p className="vn-pred">
            Tren CO₂ sedang <strong>{dir}</strong> — prediksi jam berikutnya:{' '}
            ~{predCO2} ppm,{' '}
            kualitas <span style={{ color: pc, fontWeight: 600 }}>{predStatus}</span>.
          </p>
          <div className="vn-tap">ketuk di mana saja untuk tutup ▼</div>
        </div>
      </div>
    </div>
  )
}