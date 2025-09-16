import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import CustomSlider from "./CustomSlider";

// helper: build all pairwise keys for a set of indicator codes
const buildDefaultPairs = (keys) => {
  const obj = {};
  for (let i = 0; i < keys.length; i++) { 
    for (let j = i + 1; j < keys.length; j++) {
      obj[`${keys[i]}_${keys[j]}`] = 1;
    }
  }
  return obj;
};

// Random Index table dari Saaty
  const RI_TABLE = {
    1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12,
    6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49
  };

  // Bangun matriks dari pairwise comparisons
  const buildMatrix = (keys, comparisons) => {
    const n = keys.length;
    const matrix = Array.from({ length: n }, () => Array(n).fill(1));

    keys.forEach((k1, i) => {
      keys.forEach((k2, j) => {
        if (i === j) return;
        const key = `${k1}_${k2}`;
        const keyRev = `${k2}_${k1}`;
        let v = comparisons[key] ?? (comparisons[keyRev] ? 1 / comparisons[keyRev] : 1);
        if (!Number.isFinite(v) || v <= 0) v = 1;
        matrix[i][j] = v;
      });
    });

    return matrix;
  };

  // Normalisasi & bobot rata-rata baris
  const calculateWeights = (matrix) => {
    const n = matrix.length;
    const colSums = Array(n).fill(0);
    matrix.forEach(row => row.forEach((val, j) => colSums[j] += val));

    const normalized = matrix.map(row => row.map((val, j) => val / (colSums[j] || 1)));
    return normalized.map(row => row.reduce((a, b) => a + b, 0) / n);
  };

  // Hitung Consistency Ratio
  const calculateCR = (matrix, weights) => {
    const n = matrix.length;
    if (n < 3) return 0; // matriks kecil selalu konsisten

    const weightedSum = matrix.map(row =>
      row.reduce((sum, val, j) => sum + val * weights[j], 0)
    );

    const lambdaMax = weightedSum.reduce((s, val, i) => s + val / weights[i], 0) / n;
    const CI = (lambdaMax - n) / (n - 1);
    const RI = RI_TABLE[n] || 1.49;
    return CI / RI;
  };

const Form = () => {
  const navigate = useNavigate();

  // data diri
  const [name, setName] = useState("");
  const [instansi, setInstansi] = useState("");
  const [jabatan, setJabatan] = useState("");

  // indikator dinamis
  const [loadingInd, setLoadingInd] = useState(true);
  const [indicators, setIndicators] = useState([]);

  // pairwise Level 3 (dinamis)
  const [level3, setLevel3] = useState({});

  // live CR state
  const [crIFE, setCrIFE] = useState(0);
  const [crISL, setCrISL] = useState(0);


  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await axios.get("/api/v1/admin/indicators");
        if (!mounted) return;

        const list = Array.isArray(data?.data) ? data.data : [];
        setIndicators(list);
      } catch (e) {
        console.error(e);
        if (mounted) setIndicators([]);
        toast.error("Gagal memuat indikator.");
      } finally {
        if (mounted) setLoadingInd(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // kelompokkan ke IFE & ISL
  const { IFE_KEYS, ISL_KEYS, IFE_MAP, ISL_MAP } = useMemo(() => {
    const IFE = indicators.filter((x) => x.category === "IFE");
    const ISL = indicators.filter((x) => x.category === "ISL");
    return {
      IFE_KEYS: IFE.map((x) => x.name),
      ISL_KEYS: ISL.map((x) => x.name),
      IFE_MAP: Object.fromEntries(IFE.map((x) => [x.name, x])),
      ISL_MAP: Object.fromEntries(ISL.map((x) => [x.name, x])),
    };
  }, [indicators]);

  // setiap kali indikator berubah, prefill semua pasangan
  useEffect(() => {
    if (loadingInd) return;
    setLevel3((prev) => ({
      ...buildDefaultPairs(IFE_KEYS),
      ...buildDefaultPairs(ISL_KEYS),
      ...prev,
    }));
  }, [loadingInd, IFE_KEYS, ISL_KEYS]);

    // hitung CR live setiap kali level3 berubah
  useEffect(() => {
    const adjustedLevel3 = Object.keys(level3).reduce((acc, k) => {
      acc[k] = adjustValue(level3[k] ?? 1);
      return acc;
    }, {});

    if (IFE_KEYS.length >= 3) {
      const mIFE = buildMatrix(IFE_KEYS, adjustedLevel3);
      const wIFE = calculateWeights(mIFE);
      setCrIFE(calculateCR(mIFE, wIFE));
    }

    if (ISL_KEYS.length >= 3) {
      const mISL = buildMatrix(ISL_KEYS, adjustedLevel3);
      const wISL = calculateWeights(mISL);
      setCrISL(calculateCR(mISL, wISL));
    }
  }, [level3, IFE_KEYS, ISL_KEYS]);

  const validateInput = () => {
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!name) return toast.error("Nama tidak boleh kosong."), false;
    if (!nameRegex.test(name)) return toast.error("Nama hanya huruf & spasi."), false;
    if (name.length < 2 || name.length > 50) return toast.error("Nama 2-50 karakter."), false;

    if (!jabatan) return toast.error("Jabatan tidak boleh kosong."), false;
    if (!instansi) return toast.error("Instansi harus dipilih."), false;

    return true;
  };

  const adjustValue = (value) => {
    const v = Number(value);
    if (!Number.isFinite(v) || v === 0 || v === -1) return 1;
    if (v < 0) return Math.abs(v);
    if (v > 1) return 1 / v;
    return v;
  };

  const showValue = (value) => {
    const v = Number(value);
    if (!Number.isFinite(v) || v === 0 || v === -1) return 1;
    if (v < 0) return Math.abs(v);
    return v;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInput()) return;

    const adjustedLevel1 = { IFE_ISL: 1 };
    const adjustedLevel2 = { financial_economy: 1, social_environment: 1 };

    const adjustedLevel3 = Object.keys(level3).reduce((acc, k) => {
      acc[k] = adjustValue(level3[k] ?? 1);
      return acc;
    }, {});

    // ====== CEK CONSISTENCY RATIO ======
    const matrixIFE = buildMatrix(IFE_KEYS, adjustedLevel3);
    const weightsIFE = calculateWeights(matrixIFE);
    const CR_IFE = calculateCR(matrixIFE, weightsIFE);

    const matrixISL = buildMatrix(ISL_KEYS, adjustedLevel3);
    const weightsISL = calculateWeights(matrixISL);
    const CR_ISL = calculateCR(matrixISL, weightsISL);

    // kalau CR > 0.1, minta konfirmasi
    if (CR_IFE > 0.1 || CR_ISL > 0.1) {
      const confirmSubmit = window.confirm(
        `CR melebihi 0.1 (IFE=${CR_IFE.toFixed(3)}, ISL=${CR_ISL.toFixed(3)}).\n` +
        "Apakah Anda yakin ingin tetap submit?"
      );
      if (!confirmSubmit) return; // batal submit
    }

    const data = {
      name,
      title: jabatan,
      instansi,
      level_1: adjustedLevel1,
      level_2: adjustedLevel2,
      level_3: adjustedLevel3,
      cr: { IFE: CR_IFE, ISL: CR_ISL },
    };

    try {
      await axios.post("/api/v1/form/submit", data);
      toast.success("Data berhasil dikirim!");
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      console.error(err);
      toast.error("Gagal submit data.");
    }
  };

  if (loadingInd) return <p>Memuat indikator…</p>;

  return (
    <form onSubmit={handleSubmit}>
      {/* Data Diri */}
      <div className="data-diri">
        <label>Nama</label>
        <input required type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="data-diri">
        <label>Posisi</label>
        <input required type="text" value={jabatan} onChange={(e) => setJabatan(e.target.value)} />
      </div>
      <div className="data-diri">
        <label>Instansi</label>
        <select required value={instansi} onChange={(e) => setInstansi(e.target.value)}>
          <option value="" disabled>Pilih Instansi</option>
          <option value="Pemerintah Daerah Kota Bitung">Pemerintah Daerah Kota Bitung</option>
          <option value="Pemerintah Daerah Kota Palembang">Pemerintah Daerah Kota Palembang</option>
          <option value="Pemerintah Daerah Kota Semarang">Pemerintah Daerah Kota Semarang</option>
          <option value="Pemerintah Daerah Kota Balikpapan">Pemerintah Daerah Kota Balikpapan</option>
          <option value="Pemerintah Daerah Provinsi DKI Jakarta">Pemerintah Daerah Provinsi DKI Jakarta</option>
          <option value="Akademisi/Ahli/Praktisi">Akademisi/Ahli/Praktisi</option>
          <option value="Kementerian PPN/Bappenas">Kementerian PPN/Bappenas</option>
          <option value="World Bank">World Bank</option>
        </select>
      </div>

      {/* LEVEL 3 - IFE */}
      <h3>Perbandingan Indikator IFE</h3>
      {IFE_KEYS.map((k1, i) =>
        IFE_KEYS.slice(i + 1).map((k2) => (
          <div className="comparison" key={`${k1}_${k2}`}>
            <label title={`${IFE_MAP[k1]?.name} - ${IFE_MAP[k1]?.description}`} style={{ cursor: "help" }}>{IFE_MAP[k1]?.name || k1}</label>
            <div className="range-container">
              <CustomSlider
                onChange={(newValue) =>
                  setLevel3((prev) => ({ ...prev, [`${k1}_${k2}`]: newValue }))
                }
              />
              <p className="slider-value">Nilai: {showValue(level3[`${k1}_${k2}`] ?? 1)}</p>
            </div>
            <label  title={`${IFE_MAP[k2]?.name} - ${IFE_MAP[k2]?.description}`} style={{ cursor: "help" }}>{IFE_MAP[k2]?.name || k2}</label>
          </div>
        ))
      )}

      {/* LEVEL 3 - ISL */}
      <h3>Perbandingan Indikator ISL</h3>
      {ISL_KEYS.map((k1, i) =>
        ISL_KEYS.slice(i + 1).map((k2) => (
          <div className="comparison" key={`${k1}_${k2}`}> 
            <label title={`${ISL_MAP[k1]?.name} - ${ISL_MAP[k1]?.description}`} style={{ cursor: "help" }}>{ISL_MAP[k1]?.name || k1}</label>
            <div className="range-container">
              <CustomSlider
                onChange={(newValue) =>
                  setLevel3((prev) => ({ ...prev, [`${k1}_${k2}`]: newValue }))
                }
              />
              <p className="slider-value">Nilai: {showValue(level3[`${k1}_${k2}`] ?? 1)}</p>
            </div>
            <label title={`${ISL_MAP[k2]?.name} - ${ISL_MAP[k2]?.description}`} style={{ cursor: "help" }}>{ISL_MAP[k2]?.name || k2}</label>
          </div>
        ))
      )}

      <button type="submit" className="submit-btn">Submit</button>

      {/* Floating CR Panel */}
      {/* <div
        className="floating-cr"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: "white",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "12px 16px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
          zIndex: 1000,
        }}
      >
        <p style={{ margin: 0, fontWeight: "bold" }}>Consistency Ratio</p>
        <p style={{ margin: "4px 0" }}>
          IFE: {crIFE.toFixed(3)}{" "}
          {crIFE > 0.1 && <span style={{ color: "red" }}>❌</span>}
          {crIFE <= 0.1 && <span style={{ color: "green" }}>✔</span>}
        </p>
        <p style={{ margin: 0 }}>
          ISL: {crISL.toFixed(3)}{" "}
          {crISL > 0.1 && <span style={{ color: "red" }}>❌</span>}
          {crISL <= 0.1 && <span style={{ color: "green" }}>✔</span>}
        </p>
      </div> */}
    </form>
  );
};

export default Form;
