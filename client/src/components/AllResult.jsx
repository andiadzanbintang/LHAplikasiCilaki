import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

/* ===== UI Helpers: Skeleton & Empty State (tetap) ===== */
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

    <div className="tables-wrapper" style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", marginTop: 24 }}>
      <PlaceholderTable title="Indeks Finansial & Ekonomi (IFE)" />
      <PlaceholderTable title="Indeks Sosial & Lingkungan (ISL)" />
    </div>
  </div>
);


export default function AllResult() {
  // === state hasil & iterasi ===
  const [results, setResults] = useState([]);
  const [selectedIteration, setSelectedIteration] = useState(0);

  // === state indikator dinamis ===
  const [indicators, setIndicators] = useState([]); // [{_id, name, description, category}, ...]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // === dialog detail indikator ===
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogData, setDialogData] = useState({ title: "", description: "", unit: null, kriteria: null });

  const formatNumber = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n.toFixed(4) : "0.0000";
  };

  const fetchAll = async () => {
    try {
      // 1) trigger kalkulasi (server akan menyimpan AHPResult iterasi terbaru)
      await axios.get("/api/v1/form/calculate");

      // 2) ambil hasil & indikator paralel
      const [resResults, resIndicators] = await Promise.all([
        axios.get("/api/v1/form/getAllResult"),
        axios.get("/api/v1/admin/indicators"),
      ]);

      const listResults = Array.isArray(resResults?.data?.result) ? resResults.data.result : [];
      const listIndicators = Array.isArray(resIndicators?.data?.data) ? resIndicators.data.data : [];

      setResults(listResults);
      setIndicators(listIndicators);

      // pilih iterasi terbaru secara otomatis bila ada
      if (listResults.length > 0) {
        const latest = Math.max(...listResults.map((r) => Number(r.iteration) || 0));
        setSelectedIteration(latest);
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Error fetching AHP final weights.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

    // ==== pemetaan indikator per kategori (dinamis) ====
  const { indikatorIFE, indikatorISL } = useMemo(() => {
    const IFE = indicators.filter((x) => x.category === "IFE");
    const ISL = indicators.filter((x) => x.category === "ISL");
    return { indikatorIFE: IFE, indikatorISL: ISL };
  }, [indicators]);

  if (loading) return <LoadingState />;
  if (error) return <EmptyState message="Saat ini data belum bisa dimuat." onRetry={fetchAll} />;
  if (results.length === 0) return <EmptyState onRetry={fetchAll} />;

  // ==== ambil dokumen hasil sesuai iterasi terpilih ====
  const result = results.find((r) => r.iteration === selectedIteration) || {};

  // ==== akses bobot: pakai name (dinamis), fallback code kalau ada ====
  const getWeight = (ind) => {
    const obj = result?.level3Weights || {};
    // prefer name (karena pairwise & perhitungan pakai name)
    if (ind?.name && obj[ind.name] != null) return Number(obj[ind.name]) || 0;
    // fallback code kalau server kebetulan pakai kode
    if (ind?.code && obj[ind.code] != null) return Number(obj[ind.code]) || 0;
    return 0;
  };

  const totalIFE = indikatorIFE.reduce((s, ind) => s + getWeight(ind), 0);
  const totalISL = indikatorISL.reduce((s, ind) => s + getWeight(ind), 0);

  // ==== dialog: klik baris indikator ====
  const handleIndicatorClick = (ind) => {
    setDialogData({
      title: ind?.name || "-",
      description: ind?.description || "Belum ada deskripsi indikator.",
      // unit & kriteria tidak ada di schema indikator bawaan → biarkan null / tampil jika ada
      unit: ind?.unit || null,
      kriteria: ind?.kriteria || null,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogData({ title: "", description: "", unit: null, kriteria: null });
  };

  return (
    <div className="all-result-container">
      <h3 className="all-result-head">
        Hasil Perhitungan AHP – Iterasi {selectedIteration}
      </h3>

      {/* Pilih Iterasi */}
      <div className="iteration-selector" style={{ marginBottom: 16 }}>
        <span>Pilih Iterasi:</span>
        <div
          className="iteration-buttons"
          style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}
        >
          {results.map((res) => (
            <button
              key={res.iteration}
              onClick={() => setSelectedIteration(res.iteration)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background:
                  res.iteration === selectedIteration ? "#111827" : "white",
                color: res.iteration === selectedIteration ? "white" : "#111827",
                cursor: "pointer",
              }}
              title={`Iterasi ${res.iteration}`}
            >
              {`Iterasi ${res.iteration}`}
            </button>
          ))}
        </div>
      </div>

      {/* === TAMPILAN: TABEL TERPISAH IFE & ISL (DINAMIS) === */}
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
              {indikatorIFE.map((ind) => (
                <tr key={ind._id || ind.name}>
                  <td
                    style={{ padding: "8px", cursor: "pointer" }}
                    onClick={() => handleIndicatorClick(ind)}
                    title="Klik untuk detail"
                  >
                    {ind.name}
                  </td>
                  <td style={{ padding: "8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {formatNumber(getWeight(ind))}
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
              {indikatorISL.map((ind) => (
                <tr key={ind._id || ind.name}>
                  <td
                    style={{ padding: "8px", cursor: "pointer" }}
                    onClick={() => handleIndicatorClick(ind)}
                    title="Klik untuk detail"
                  >
                    {ind.name}
                  </td>
                  <td style={{ padding: "8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {formatNumber(getWeight(ind))}
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

      {/* Dialog Detail Indikator */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{dialogData.title}</DialogTitle>
        <DialogContent>
          <p>{dialogData.description}</p>

          {dialogData.unit && Array.isArray(dialogData.unit) && (
            <div>
              <h4>Unit:</h4>
              <ul>
                {dialogData.unit.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {dialogData.kriteria && Array.isArray(dialogData.kriteria) && (
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
