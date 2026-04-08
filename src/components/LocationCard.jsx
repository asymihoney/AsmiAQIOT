import { useState } from 'react'
import { useLocationData } from '../hooks/useAirQuality'
import { calcStatus, tempColor, trendPredict, STATUS_COLOR } from '../lib/utils'
import AQChart from './AQChart'

const METRIKS = ['co2', 'pm1', 'pm25', 'pm10']
const METRIK_LABEL = { co2: 'CO₂', pm1: 'PM1', pm25: 'PM2.5', pm10: 'PM10' }

export default function LocationCard({ lokasi, isOpen, onToggle, onInfo, isDark }) {
  const { rows, latest, loading } = useLocationData(isOpen ? lokasi : null)
  const [metrik, setMetrik] = useState('co2')

  // Pakai latest snapshot untuk header (bisa load ringan)
  const { suhu = '--', kelembapan = '--', co2 = '--', pm1 = '--', pm25 = '--', pm10 = '--' } = latest
  const status = (co2 !== '--' && pm25 !== '--') ? calcStatus(co2, pm25) : '...'
  const tc = (typeof suhu === 'number') ? tempColor(suhu) : '#ccc'

  const pillCls =
    status === 'Baik'   ? 'pill pill-b' :
    status === 'Sedang' ? 'pill pill-s' :
    status === 'Buruk'  ? 'pill pill-u' : 'pill pill-loading'

  function handleInfo(e) {
    e.stopPropagation()
    if (!rows.length) return
    const co2Series = rows.map(r => r.co2)
    const { pred, dir } = trendPredict(co2Series)
    const predStatus = pred > 1000 ? 'Buruk' : pred > 700 ? 'Sedang' : 'Baik'
    onInfo({ lokasi, status, suhu, kelembapan, co2, pm1, pm25, pm10, predCO2: pred, predStatus, dir })
  }

  return (
    <div className={`card ${isOpen ? 'card-open' : ''}`}>
      {/* ── Header ── */}
      <div className="card-header" onClick={onToggle}>
        <div className="card-thumb">
          <span className="thumb-lbl">Foto Area</span>
        </div>
        <div className="card-meta">
          <span className="card-title">{lokasi}</span>
          <span className={pillCls}>{status}</span>
        </div>
        <button className="ibtn" onClick={handleInfo} title="Info & Prediksi" aria-label="Info">
          i
        </button>
      </div>

      {/* ── Expand ── */}
      {isOpen && (
        <div className="card-expand">
          {loading ? (
            <div className="loading-row">Memuat data...</div>
          ) : (
            <>
              {/* Suhu + Kelembapan */}
              <div className="expand-top">
                <div className="temp-circle" style={{ borderColor: tc }}>
                  <span className="temp-val">{typeof suhu === 'number' ? suhu : '--'}°</span>
                  <span className="temp-unit">Celsius</span>
                </div>
                <div className="hum-block">
                  <div className="hum-label">Kelembapan: {kelembapan}{typeof kelembapan === 'number' ? '%' : ''}</div>
                  <div className="hum-bar-bg">
                    <div
                      className="hum-bar-fill"
                      style={{ width: typeof kelembapan === 'number' ? `${kelembapan}%` : '0%' }}
                    />
                  </div>
                  <div className="hum-sub">
                    CO₂: {co2}{typeof co2 === 'number' ? ' ppm' : ''} &nbsp;|&nbsp;
                    PM2.5: {pm25}{typeof pm25 === 'number' ? ' µg/m³' : ''}
                  </div>
                </div>
              </div>

              {/* Tab metrik */}
              <div className="chart-tabs">
                {METRIKS.map(m => (
                  <button
                    key={m}
                    className={`ctab${metrik === m ? ' ctab-on' : ''}`}
                    onClick={() => setMetrik(m)}
                  >
                    {METRIK_LABEL[m]}
                  </button>
                ))}
              </div>

              {/* Line chart */}
              <AQChart rows={rows} metrik={metrik} isDark={isDark} />
              <div className="chart-lbl">
                {METRIK_LABEL[metrik]} — {rows.length} data terbaru
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
