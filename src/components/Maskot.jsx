// Maskot dengan 4 state gambar
// Letakkan file gambar di: src/assets/maskot-idle.png
//                           src/assets/maskot-baik.png
//                           src/assets/maskot-sedang.png
//                           src/assets/maskot-buruk.png
//
// Selama file belum ada, tampil SVG placeholder otomatis.

import maskotIdle   from '../assets/maskot-idle.png'
import maskotBaik   from '../assets/maskot-baik.png'
import maskotSedang from '../assets/maskot-sedang.png'
import maskotBuruk  from '../assets/maskot-buruk.png'

const IMG = {
  idle:   maskotIdle,
  'CO₂ & PM2.5 - Baik':   maskotBaik,
  'CO₂ & PM2.5 - Sedang': maskotSedang,
  'CO₂ - Sedang': maskotSedang,
  'PM2.5 - Sedang': maskotSedang,
  'CO₂ & PM2.5 - Buruk':  maskotBuruk,
  'CO₂ - Buruk':  maskotBuruk,
  'PM2.5 - Buruk':  maskotBuruk,
}

export default function Maskot({ status = 'idle', size = 2000, ...props }) {
  const src = IMG[status] ?? IMG.idle

  return (
    <img
      src={src}
      alt={`Maskot — ${status}`}
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block' }}
      {...props}
    />
  )
}