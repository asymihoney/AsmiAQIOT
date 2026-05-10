import { useState, useEffect } from 'react'
import { useLocations } from './hooks/useAirQuality'
import LocationCard from './components/LocationCard'
import VNPopup from './components/VNPopup'
import Maskot from './components/Maskot'
import './App.css'

export default function App() {
  const [isDark, setIsDark]       = useState(false)
  const [search, setSearch]       = useState('')
  const [openCard, setOpenCard]   = useState(null)
  const [vnData, setVnData]       = useState(null)
  const [globalStatus, setGlobal] = useState('Idle')

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
      <div className="app-inner">

        <header className="topbar">
          <span className="logo">asmiaqiot</span>
          <button className="dk-btn" onClick={() => setIsDark(d => !d)}>
            {isDark ? '☽ Dark' : '☀ Light'}
          </button>
        </header>

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

      {/* Maskot float - HANYA MUNCUL saat popup TIDAK aktif */}
      {!vnData && (
        <div className="mascot-float">
          <Maskot status={globalStatus} size={50} />
          <span className="mascot-lbl">Maskot</span>
        </div>
      )}

      {/* Popup - HANYA MUNCUL saat vnData ada */}
      {vnData && (
        <VNPopup data={vnData} onClose={() => setVnData(null)} />
      )}
    </div>
  )
}