import { useEffect, useState } from "react";
import axios from "axios";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

// === Daftar indikator (lengkap 22) dengan kode ===
const indikatorData = [
  { code: "IFE1",  title: "Dampak terhadap pengembangan ekonomi lokal",
    description: "Mengukur kontribusi proyek dalam mengembangkan potensi ekonomi daerah.",
    unit: ["Skor 0–1"], kriteria: ["Semakin besar kontribusi, semakin baik"] },
  { code: "IFE2",  title: "Dampak terhadap keuntungan ekonomi jangka panjang",
    description: "Mengukur keberlanjutan keuntungan ekonomi dari proyek.",
    unit: ["Skor 0–1"], kriteria: ["Semakin tinggi keberlanjutan, semakin baik"] },
  { code: "IFE3",  title: "Dampak terhadap pemanfaatan sumber daya lokal",
    description: "Mengukur sejauh mana proyek menggunakan sumber daya lokal.",
    unit: ["Skor 0–1"], kriteria: ["Semakin besar pemanfaatan lokal, semakin baik"] },
  { code: "IFE4",  title: "Kontribusi terhadap kehidupan lebih baik warga kota",
    description: "Mengukur dampak proyek terhadap kualitas hidup masyarakat.",
    unit: ["Skor 0–1"], kriteria: ["Semakin positif dampaknya, semakin baik"] },
  { code: "IFE5",  title: "Dampak multiplier & jejaring ekonomi/industri lain",
    description: "Mengukur seberapa besar proyek memicu efek pengganda ekonomi.",
    unit: ["Skor 0–1"], kriteria: ["Semakin tinggi multiplier, semakin baik"] },
  { code: "IFE6",  title: "Penerimaan langsung dari proyek",
    description: "Mengukur penerimaan (revenue) yang diperoleh langsung dari proyek.",
    unit: ["Rp"], kriteria: ["Semakin tinggi penerimaan, semakin baik"] },
  { code: "IFE7",  title: "Pengaruh terhadap alokasi anggaran berjalan",
    description: "Mengukur apakah proyek mengganggu atau mendukung alokasi anggaran rutin.",
    unit: ["Skor 0–1"], kriteria: ["Tidak mengganggu anggaran rutin"] },
  { code: "IFE8",  title: "Pengalokasian proyek di dalam APBD/APBN",
    description: "Mengukur kesiapan proyek dimasukkan dalam anggaran pemerintah.",
    unit: ["Skor 0–1"], kriteria: ["Semakin jelas alokasinya, semakin baik"] },
  { code: "IFE9",  title: "Kebutuhan dukungan eksternal",
    description: "Mengukur ketergantungan proyek pada dukungan eksternal.",
    unit: ["Skor 0–1"], kriteria: ["Semakin rendah ketergantungan, semakin baik"] },
  { code: "IFE10", title: "Risiko finansial/ekonomi terhadap keberlanjutan proyek",
    description: "Mengidentifikasi potensi risiko finansial atau ekonomi.",
    unit: ["Skor 0–1"], kriteria: ["Semakin rendah risiko, semakin baik"] },
  { code: "IFE11", title: "Risiko politik terhadap keberlanjutan proyek",
    description: "Mengukur sejauh mana stabilitas politik memengaruhi proyek.",
    unit: ["Skor 0–1"], kriteria: ["Semakin rendah risiko politik, semakin baik"] },
  { code: "IFE12", title: "Strategi mitigasi risiko dalam penyelenggaraan proyek",
    description: "Menilai kesiapan mitigasi risiko yang disiapkan proyek.",
    unit: ["Skor 0–1"], kriteria: ["Semakin lengkap mitigasi, semakin baik"] },

  { code: "ISL1",  title: "Dampak terhadap kualitas lingkungan sekitar",
    description: "Mengukur dampak proyek pada kualitas lingkungan (air, udara, tanah).",
    unit: ["Skor 0–1"], kriteria: ["Dampak positif lebih tinggi lebih baik"] },
  { code: "ISL2",  title: "Kontribusi dalam keberlanjutan jangka panjang",
    description: "Mengukur keberlanjutan proyek untuk lingkungan.",
    unit: ["Skor 0–1"], kriteria: ["Semakin tinggi kontribusi, semakin baik"] },
  { code: "ISL3",  title: "Kontribusi terhadap kesehatan masyarakat lokal",
    description: "Mengukur pengaruh proyek pada kesehatan publik.",
    unit: ["Skor 0–1"], kriteria: ["Semakin besar kontribusi, semakin baik"] },
  { code: "ISL4",  title: "Kontribusi terhadap adaptasi perubahan iklim",
    description: "Menilai kontribusi proyek dalam adaptasi perubahan iklim.",
    unit: ["Skor 0–1"], kriteria: ["Semakin adaptif, semakin baik"] },
  { code: "ISL5",  title: "Kontribusi terhadap mitigasi perubahan iklim",
    description: "Menilai kontribusi proyek dalam mengurangi emisi atau risiko iklim.",
    unit: ["Skor 0–1"], kriteria: ["Semakin tinggi kontribusi mitigasi, semakin baik"] },
  { code: "ISL6",  title: "Kontribusi peningkatan kualitas ruang publik kota",
    description: "Mengukur dampak proyek pada kualitas ruang publik.",
    unit: ["Skor 0–1"], kriteria: ["Semakin positif dampaknya, semakin baik"] },
  { code: "ISL7",  title: "Dampak/risiko terhadap keanekaragaman hayati",
    description: "Menilai apakah proyek mengancam atau mendukung biodiversitas.",
    unit: ["Skor 0–1"], kriteria: ["Semakin kecil risiko, semakin baik"] },
  { code: "ISL8",  title: "Inovasi/keterbaruan untuk perbaikan masa depan",
    description: "Mengukur tingkat inovasi proyek untuk keberlanjutan.",
    unit: ["Skor 0–1"], kriteria: ["Semakin tinggi inovasi, semakin baik"] },
  { code: "ISL9",  title: "Dampak ke masyarakat akibat alih fungsi lahan",
    description: "Mengukur dampak sosial akibat perubahan penggunaan lahan.",
    unit: ["Skor 0–1"], kriteria: ["Semakin kecil dampak negatif, semakin baik"] },
  { code: "ISL10", title: "Perbaikan lingkungan masyarakat berpenghasilan rendah",
    description: "Mengukur manfaat proyek bagi masyarakat berpenghasilan rendah.",
    unit: ["Skor 0–1"], kriteria: ["Semakin besar manfaat, semakin baik"] },
];

// ===== UI Helpers: Skeleton & Empty State (Tampilan saja) =====
const PlaceholderRow = () => (
  <tr>
    <td style={{ padding: 8 }}>
      <div style={{ height: 12, background: "#f3f4f6", borderRadius: 4, width: "90%" }} />
    </td>
    <td style={{ padding: 8, textAlign: "right" }}>
      <div style={{ height: 12, background: "#f3f4f6", borderRadius: 4, width: 64, marginLeft: "auto" }} />
    </td>
  </tr>
);

const PlaceholderTable = ({ title, rows = 6 }) => (
  <div className="table-card">
    <h4 style={{ marginBottom: 8 }}>{title}</h4>
    <table className="weights-table" style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>Indikator</th>
          <th style={{ textAlign: "right", borderBottom: "1px solid #eee", padding: 8 }}>Bobot</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => <PlaceholderRow key={i} />)}
        <tr>
          <td style={{ padding: 8, borderTop: "2px solid #000", fontWeight: 600 }}>Total</td>
          <td style={{ padding: 8, borderTop: "2px solid #000", textAlign: "right", fontWeight: 600 }}>—</td>
        </tr>
      </tbody>
    </table>
  </div>
);

const LoadingState = () => (
  <div className="tables-wrapper" style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
    <PlaceholderTable title="Indeks Finansial & Ekonomi (IFE)" />
    <PlaceholderTable title="Indeks Sosial & Lingkungan (ISL)" />
  </div>
);

const EmptyState = ({ message = "Belum ada data perhitungan.", onRetry }) => (
  <div style={{ textAlign: "center", padding: "32px 16px" }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
    <h4 style={{ margin: 0 }}>{message}</h4>
    <p style={{ color: "#6b7280", marginTop: 8, marginBottom: 16 }}>
      Lengkapi penilaian atau coba hitung ulang untuk melihat bobot IFE & ISL.
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          background: "white",
          cursor: "pointer",
        }}
      >
        🔄 Coba Hitung Ulang
      </button>
    )}

    {/* tampilkan placeholder tabel agar tetap informatif dan menarik */}
    <div className="tables-wrapper" style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", marginTop: 24 }}>
      <PlaceholderTable title="Indeks Finansial & Ekonomi (IFE)" />
      <PlaceholderTable title="Indeks Sosial & Lingkungan (ISL)" />
    </div>
  </div>
);


const CITY_BY_ITERATION = ["Bitung", "Jakarta", "Palembang", "Balikpapan", "Semarang"];

export default function AllResult() {
  const [results, setResults] = useState([]);
  const [selectedIteration, setSelectedIteration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogData, setDialogData] = useState({ title: "", description: "" });

  const formatNumber = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n.toFixed(4) : "0.0000";
  };

  const fetchFinalWeights = async () => {
    try {
      await axios.get("/api/v1/form/calculate");          // memicu perhitungan
      const response = await axios.get("/api/v1/form/getAllResult");
      setResults(response.data.result || []);
      setLoading(false);
    } catch (err) {
      setError("Error fetching AHP final weights.", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinalWeights();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <EmptyState message="Saat ini data belum bisa dimuat." onRetry={fetchFinalWeights} />;
  if (results.length === 0) return <EmptyState onRetry={fetchFinalWeights} />;


  const result = results.find((r) => r.iteration === selectedIteration) || {};

  const handleIndicatorClick = (title) => {
    const indicator = indikatorData.find((ind) => ind.title === title);
    if (indicator) {
      setDialogData(indicator);
      setOpenDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogData({ title: "", description: "" });
  };

  // === PEMISAHAN DATA UNTUK TAMPILAN TABEL ===
  const indikatorIFE = indikatorData.filter(ind => ind.code.startsWith("IFE"));
  const indikatorISL = indikatorData.filter(ind => ind.code.startsWith("ISL"));
  const getWeight = (code) => Number(result.level3Weights?.[code]) || 0;

  const totalIFE = indikatorIFE.reduce((s, ind) => s + getWeight(ind.code), 0);
  const totalISL = indikatorISL.reduce((s, ind) => s + getWeight(ind.code), 0);

  return (
    <div className="all-result-container">
      <h3 className="all-result-head">
        Hasil Perhitungan AHP Kota {CITY_BY_ITERATION[selectedIteration] ?? "—"}
      </h3>

      {/* Pilih Iterasi */}
      <div className="iteration-selector">
        <span>Pilih Iterasi:</span>
        <div className="iteration-buttons">
          {results.map((res) => (
            <button
              key={res.iteration}
              onClick={() => setSelectedIteration(res.iteration)}
            >
              {CITY_BY_ITERATION[res.iteration] ?? `Iterasi ${res.iteration}`}
            </button>
          ))}
        </div>
      </div>

      {/* === TAMPILAN: TABEL TERPISAH IFE & ISL === */}
      <div className="tables-wrapper" style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        {/* Tabel IFE */}
        <div className="table-card">
          <h4>Indeks Finansial & Ekonomi (IFE)</h4>
          <table className="weights-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>Indikator</th>
                <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: "8px" }}>Bobot</th>
              </tr>
            </thead>
            <tbody>
              {indikatorIFE.map(ind => (
                <tr key={ind.code}>
                  <td
                    style={{ padding: "8px", cursor: "pointer" }}
                    onClick={() => handleIndicatorClick(ind.title)}
                    title="Klik untuk detail"
                  >
                    {ind.title}
                  </td>
                  <td style={{ padding: "8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {formatNumber(getWeight(ind.code))}
                  </td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: "8px", borderTop: "2px solid #000", fontWeight: 600 }}>Total</td>
                <td style={{ padding: "8px", borderTop: "2px solid #000", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {formatNumber(totalIFE)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tabel ISL */}
        <div className="table-card">
          <h4>Indeks Sosial & Lingkungan (ISL)</h4>
          <table className="weights-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>Indikator</th>
                <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: "8px" }}>Bobot</th>
              </tr>
            </thead>
            <tbody>
              {indikatorISL.map(ind => (
                <tr key={ind.code}>
                  <td
                    style={{ padding: "8px", cursor: "pointer" }}
                    onClick={() => handleIndicatorClick(ind.title)}
                    title="Klik untuk detail"
                  >
                    {ind.title}
                  </td>
                  <td style={{ padding: "8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {formatNumber(getWeight(ind.code))}
                  </td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: "8px", borderTop: "2px solid #000", fontWeight: 600 }}>Total</td>
                <td style={{ padding: "8px", borderTop: "2px solid #000", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {formatNumber(totalISL)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog Box */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{dialogData.title}</DialogTitle>
        <DialogContent>
          <p>{dialogData.description}</p>
          {dialogData.unit && (
            <div>
              <h4>Unit:</h4>
              <ul>
                {dialogData.unit.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {dialogData.kriteria && (
            <div>
              <h4>Kriteria:</h4>
              <ul>
                {dialogData.kriteria.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Tutup</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
