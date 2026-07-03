import { STATUS_COLOR, co2Level, pm25Level, CO2_RANK, PM25_RANK } from '../lib/utils'

export default function VNPopup({ data, onClose, showMaskot }) {
  if (!data) return null
  const { lokasi, status, suhu, kelembapan, co2, pm1, pm25, pm10 } = data

  const cLvl = co2Level(co2)
  const pLvl = pm25Level(pm25)
  const cRank = CO2_RANK.indexOf(cLvl)
  const pRank = PM25_RANK.indexOf(pLvl)
  const sc = (cRank >= pRank ? STATUS_COLOR[cLvl] : STATUS_COLOR[pLvl]) ?? '#4caf50'

return (
  <>
    {/* Layer 1: gradasi hitam — di belakang maskot */}
    <div className="vn-backdrop" onClick={onClose} />

    {/* Layer 2: bubble chat — di depan maskot */}
    <div className="vn-row" onClick={e => e.stopPropagation()}>
      <div className="vn-box" onClick={onClose}>
          {showMaskot && <div className="vn-name">Anila</div>}
          <p className="vn-text">
            Kualitas udara pada elemen{' '}
            <span style={{ color: sc, fontWeight: 600 }}>{status}</span> untuk lokasi{' '}
            <span style={{ color: '#1D9E75', fontWeight: 600 }}>{lokasi}</span>.<br />
            {' Kondisi udara saat ini tercatat dengan rincian: '}<br />
            CO₂ <strong>{co2}</strong> ppm, PM1 <strong>{pm1}</strong>,
            PM2.5 <strong>{pm25}</strong>, PM10 <strong>{pm10}</strong> µg/m³.
            Suhu <strong>{suhu}°C</strong>, kelembapan <strong>{kelembapan}%</strong>.
          </p>
          <div className="vn-tap">ketuk di mana saja untuk tutup ▼</div>
        </div>
      </div>
  </>
  )
}