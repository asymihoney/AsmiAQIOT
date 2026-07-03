import { useState, useEffect } from 'react'
import { useLocations } from './hooks/useAirQuality'
import LocationCard from './components/LocationCard'
import VNPopup from './components/VNPopup'
import Maskot from './components/Maskot'
import AirInfoPanel from './components/AirInfoPanel'
import './App.css'

export default function App() {
  const [isDark, setIsDark] = useState(false)
  const [search, setSearch] = useState('')
  const [openCard, setOpenCard] = useState(null)
  const [vnData, setVnData] = useState(null)
  const [globalStatus, setGlobal] = useState('Idle')
  const [showMaskot, setShowMaskot] = useState(false)
  const [showInfoPanel, setShowInfoPanel] = useState(false)

  useEffect(() => {
    function handleKey(e) {
      if (e.key === '[') setShowMaskot(prev => !prev)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const { locations, loading } = useLocations()

  const filtered = locations.filter(l =>
    l.toLowerCase().includes(search.toLowerCase())
  )

  // Ekspresi maskot ikuti status saat popup terbuka,
  // kembali idle saat popup ditutup
  useEffect(() => {
    if (vnData?.status) setGlobal(vnData.status)
    else setGlobal('Idle')
  }, [vnData])

  function toggleCard(lokasi) {
    setOpenCard(prev => prev === lokasi ? null : lokasi)
  }

  return (
    <div className={`app${isDark ? ' dk' : ''}`}>

      {/* Topbar full width */}
      <header className="topbar">
        <span className="logo">asmiaqiot</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="dk-btn info-panel-btn" onClick={() => setShowInfoPanel(p => !p)}>
            Info
          </button>
          <button className="dk-btn" onClick={() => setIsDark(d => !d)}>
            {isDark ? '☽ Dark' : '☀ Light'}
          </button>
        </div>
      </header>

      <div className="layout">
        {/* Kolom kiri — maskot atau info panel */}
        <div
          className="mascot-col"
          style={{ zIndex: showMaskot ? 200 : 1 }} /* Dinamis berdasarkan showMaskot */
        >
          {showMaskot
            ? <Maskot status={vnData ? vnData.status : globalStatus} />
            : <AirInfoPanel isDark={isDark} />
          }
        </div>

        {/* Kolom kanan — konten */}
        <div className="content-col">
          <input
            className="searchbox"
            placeholder="Cari lokasi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="hero">
            <span className="hero-txt">
              Pemantauan Kualitas Udara — Kampus Universitas Gunadarma Depok
            </span>
          </div>
          <main className="cards-list">
            {loading && <div className="loading-full">Memuat lokasi...</div>}
            {filtered.map(lokasi => (
              <LocationCard
                key={lokasi}
                lokasi={lokasi}
                isOpen={openCard === lokasi}
                onToggle={() => toggleCard(lokasi)}
                onInfo={data => setVnData(data)}
                isDark={isDark}
              />
            ))}
            {!loading && filtered.length === 0 && (
              <div className="empty">Tidak ada lokasi ditemukan.</div>
            )}
          </main>
        </div>
      </div>

      {/* DI SINI PERBAIKANNYA: Dipindahkan ke dalam return sebelum tag penutup div .app */}
      {vnData && (
        <VNPopup data={vnData} onClose={() => setVnData(null)} showMaskot={showMaskot} />
      )}

      {showInfoPanel && (
        <div className="info-panel-overlay" onClick={() => setShowInfoPanel(false)}>
          <div className="info-panel-modal" onClick={e => e.stopPropagation()}>
            <AirInfoPanel isDark={isDark} isModal />
            <button className="info-panel-close" onClick={() => setShowInfoPanel(false)}>✕ Tutup</button>
          </div>
        </div>
      )}

    </div>
  )
}