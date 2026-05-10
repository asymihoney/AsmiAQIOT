import { useState } from 'react'
import { useLocationData, useLatestData } from '../hooks/useAirQuality'
import { calcStatus, tempColor, trendPredict } from '../lib/utils'
import AQChart from './AQChart'

const METRIKS = ['co2', 'pm1', 'pm25', 'pm10']
const METRIK_LABEL = { co2: 'CO₂', pm1: 'PM1', pm25: 'PM2.5', pm10: 'PM10' }

export default function LocationCard({ lokasi, isOpen, onToggle, onInfo, isDark }) {
  // PERBAIKAN: Selalu ambil latest data untuk preview
  const { latest: previewLatest, loading: previewLoading } = useLatestData(lokasi)
  
  // Data lengkap hanya diambil saat card dibuka
  const { rows, latest: fullLatest, loading: fullLoading } = useLocationData(isOpen ? lokasi : null)
  
  const [metrik, setMetrik] = useState('co2')

  // Gunakan data preview untuk header, data full untuk expand
  const latest = isOpen && rows.length > 0 ? fullLatest : previewLatest
  const loading = isOpen ? fullLoading : previewLoading

  const suhu = latest?.suhu ?? '--'
  const kelembapan = latest?.kelembapan ?? '--'
  const co2 = latest?.co2 ?? '--'
  const pm1 = latest?.pm1 ?? '--'
  const pm25 = latest?.pm25 ?? '--'
  const pm10 = latest?.pm10 ?? '--'
  
  const status = (typeof co2 === 'number' && typeof pm25 === 'number') 
    ? calcStatus(co2, pm25) 
    : '...'
  const tc = (typeof suhu === 'number') ? tempColor(suhu) : '#ccc'

  const pillCls =
    status === 'CO₂ & PM2.5 - Baik'  ? 'pill pill-b' :

    status === 'CO₂ - Sedang' ? 'pill pill-s' :
    status === 'PM2.5 - Sedang' ? 'pill pill-s' :
    status === 'CO₂ & PM2.5 - Sedang' ? 'pill pill-s' :
    
    status === 'CO₂ - Buruk'  ? 'pill pill-u' :
    status === 'PM2.5 - Buruk'  ? 'pill pill-u' :
    status === 'CO₂ & PM2.5 - Buruk'  ? 'pill pill-u' : 'pill pill-loading'

  function handleInfo(e) {
    e.stopPropagation()
    if (!rows.length) return
    
    try {
      const co2Series = rows.map(r => r.co2).filter(v => typeof v === 'number')
      if (co2Series.length === 0) return
      
      const { pred, dir } = trendPredict(co2Series)
      const predStatus = pred > 1000 ? 'Buruk' : pred > 400 ? 'Sedang' : 'Baik'
      onInfo({ 
        lokasi, 
        status, 
        suhu, 
        kelembapan, 
        co2, 
        pm1, 
        pm25, 
        pm10, 
        predCO2: pred, 
        predStatus, 
        dir 
      })
    } catch (error) {
      console.error('Error calculating prediction:', error)
    }
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
          {previewLoading ? (
            <span className="pill pill-loading">...</span>
          ) : (
            <span className={pillCls}>{status}</span>
          )}
        </div>
        <button className="ibtn" onClick={handleInfo} title="Info & Prediksi" aria-label="Info">
          i
        </button>
      </div>

      {/* ── Expand ── */}
      {isOpen && (
        <div className="card-expand">
          {fullLoading ? (
            <div className="loading-row">Memuat data...</div>
          ) : rows.length === 0 ? (
            <div className="loading-row">Tidak ada data tersedia</div>
          ) : (
            <>
              {/* Suhu + Kelembapan */}
              <div className="expand-top">
                <div className="temp-circle" style={{ borderColor: tc }}>
                  <span className="temp-val">{typeof suhu === 'number' ? suhu.toFixed(1) : '--'}°</span>
                  <span className="temp-unit">Celsius</span>
                </div>
                <div className="hum-block">
                  <div className="hum-label">
                    Kelembapan: {typeof kelembapan === 'number' ? `${kelembapan.toFixed(1)}%` : '--'}
                  </div>
                  <div className="hum-bar-bg">
                    <div
                      className="hum-bar-fill"
                      style={{ width: typeof kelembapan === 'number' ? `${kelembapan}%` : '0%' }}
                    />
                  </div>
                  <div className="hum-sub">
                    CO₂: {typeof co2 === 'number' ? `${co2} ppm` : '--'} &nbsp;|&nbsp;
                    PM2.5: {typeof pm25 === 'number' ? `${pm25} µg/m³` : '--'}
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