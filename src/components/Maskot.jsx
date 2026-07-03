// Maskot dengan 4 state gambar
// Letakkan file gambar di: src/assets/maskot-idle.png
//                           src/assets/maskot-baik.png
//                           src/assets/maskot-sedang.png
//                           src/assets/maskot-buruk.png
//
// Selama file belum ada, tampil SVG placeholder otomatis.

import { useState, useRef } from 'react'
import maskotIdle from '../assets/maskot-idle.png'
import maskotBaik from '../assets/maskot-baik.png'
import maskotSedang from '../assets/maskot-sedang.png'
import maskotBuruk from '../assets/maskot-buruk.png'
import maskotPats from '../assets/maskot-pats.png'

function pickMaskotImg(status) {
  if (!status || status === 'idle' || status === '...') return maskotIdle
  if (status.includes('Baik')) return maskotBaik
  if (status.includes('Sedang')) return maskotSedang
  if (
    status.includes('Buruk') ||
    status.includes('Tidak Sehat') ||
    status.includes('Berbahaya') ||
    status.includes('Kritis')
  ) return maskotBuruk
  return maskotIdle   // fallback aman kalau ada status tak dikenal
}

export default function Maskot({ status = 'idle', size, ...props }) {
  const timerRef = useRef(null)
  const [isPats, setIsPats] = useState(false)
  const [clickCount, setClickCount] = useState(0)

  const src = isPats ? maskotPats : pickMaskotImg(status)

  function handleHeadClick() {
    const next = clickCount + 1
    setClickCount(next)
    if (next >= 5) {
      setIsPats(true)
      setClickCount(0)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setIsPats(false), 1500)
    }
  }

  return (
    <div style={{
      position: 'relative',
      width: size,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <img
        src={src}
        alt={`Maskot — ${status}`}
        style={{
          width: '200%',
          height: 'auto',
          objectFit: 'contain',
          display: 'block'
        }}
        {...props}
      />

      {/* Area kepala — nanti jadikan komentar kalau sudah pas posisinya */}
      <div
        onClick={handleHeadClick}
        style={{
          position: 'absolute',
          top: '10%',
          left: '35%',
          width: '25%',
          height: '20%',
          // backgroundColor: 'rgba(255, 0, 0, 0.3)',
          // border: '2px solid red',
          // borderRadius: '50%',
          cursor: 'pointer',
          pointerEvents: 'all',
        }}
      />
    </div >
  )
}