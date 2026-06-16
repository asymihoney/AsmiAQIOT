export default function AirInfoPanel({ isDark, isModal }) {
  return (
    <div className={`air-info-panel${isModal ? ' air-info-modal' : ''}`}>

      {/* ── Header ── */}
      <div className="aip-header">
        <span className="aip-title">Panduan Kualitas Udara</span>
        <span className="aip-sub">Berikut adalah informasi tentang parameter kualitas udara yang dipantau dan standar yang digunakan.</span>
      </div>

      {/* ── Parameter ── */}
      <div className="aip-section">
        <div className="aip-section-title">Parameter</div>
        <div className="aip-param-list">
          <div className="aip-param">
            <div>
              <div className="aip-param-name">CO₂ <span className="aip-param-unit">ppm</span></div>
              <div className="aip-param-desc">Karbon dioksida dari pernapasan & pembakaran. Tinggi di ruangan tertutup padat orang.</div>
            </div>
          </div>
          <div className="aip-param">
            <div>
              <div className="aip-param-name">PM1 <span className="aip-param-unit">µg/m³</span></div>
              <div className="aip-param-desc">Partikel sangat halus ≤1 µm. Bisa masuk aliran darah lewat paru-paru.</div>
            </div>
          </div>
          <div className="aip-param">
            <div>
              <div className="aip-param-name">PM2.5 <span className="aip-param-unit">µg/m³</span></div>
              <div className="aip-param-desc">Partikel halus ≤2.5 µm. Indikator utama polusi udara & risiko kesehatan.</div>
            </div>
          </div>
          <div className="aip-param">
            <div>
              <div className="aip-param-name">PM10 <span className="aip-param-unit">µg/m³</span></div>
              <div className="aip-param-desc">Partikel kasar ≤10 µm. Umumnya dari debu jalanan & konstruksi.</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabel ISPU ── */}
      <div className="aip-section">
        <div className="aip-section-title">Indeks Standar Pencemar Udara (ISPU)</div>
        <div className="aip-section-sub">Sumber: KLHK — pengukuran rata-rata 24 jam</div>
        <table className="aip-table">
          <thead>
            <tr>
              <th>Kategori</th>
              <th>ISPU</th>
              <th>PM2.5 µg/m³</th>
              <th>PM10 µg/m³</th>
            </tr>
          </thead>
          <tbody>
            <tr className="aip-row-baik">
              <td>🟢 Baik</td>
              <td>0–50</td>
              <td>0–15.5</td>
              <td>0–50</td>
            </tr>
            <tr className="aip-row-sedang">
              <td>🟡 Sedang</td>
              <td>51–100</td>
              <td>15.5–55.4</td>
              <td>51–150</td>
            </tr>
            <tr className="aip-row-tsehat">
              <td>🟠 Tidak Sehat</td>
              <td>101–200</td>
              <td>55.4–150.4</td>
              <td>151–350</td>
            </tr>
            <tr className="aip-row-stsehat">
              <td>🔴 Sangat Tidak Sehat</td>
              <td>201–300</td>
              <td>150.4–250.4</td>
              <td>351–420</td>
            </tr>
            <tr className="aip-row-bahaya">
              <td>🟣 Berbahaya</td>
              <td>&gt;300</td>
              <td>&gt;250.4</td>
              <td>&gt;420</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Tabel CO₂ ASHRAE ── */}
      <div className="aip-section">
        <div className="aip-section-title">Standar CO₂ Indoor (ASHRAE)</div>
        <div className="aip-section-sub">Sumber: ASHRAE 62.1 — konsentrasi ruangan tertutup</div>
        <table className="aip-table">
          <thead>
            <tr>
              <th>Rentang</th>
              <th>Kondisi</th>
            </tr>
          </thead>
          <tbody>
            <tr className="aip-row-baik">
              <td>400–1.000 ppm</td>
              <td>Normal, kualitas udara baik</td>
            </tr>
            <tr className="aip-row-sedang">
              <td>1.000–2.000 ppm</td>
              <td>Mulai pengap, kantuk & keluhan umum</td>
            </tr>
            <tr className="aip-row-tsehat">
              <td>2.000–5.000 ppm</td>
              <td>Sakit kepala, lelah, sulit fokus, mual</td>
            </tr>
            <tr className="aip-row-bahaya">
              <td>&gt;5.000 ppm</td>
              <td>Berbahaya, perlu evakuasi segera</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  )
}