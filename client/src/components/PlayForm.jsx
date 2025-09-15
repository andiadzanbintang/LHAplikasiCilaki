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

const PlayForm = () => {
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

    const data = {
      name,
      title: jabatan,
      instansi,
      level_1: adjustedLevel1,
      level_2: adjustedLevel2,
      level_3: adjustedLevel3,
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
      <h1>PLAYFORM</h1>
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
            <label>{IFE_MAP[k1]?.name || k1}</label>
            <div className="range-container">
              <CustomSlider
                onChange={(newValue) =>
                  setLevel3((prev) => ({ ...prev, [`${k1}_${k2}`]: newValue }))
                }
              />
              <p className="slider-value">Nilai: {showValue(level3[`${k1}_${k2}`] ?? 1)}</p>
            </div>
            <label>{IFE_MAP[k2]?.name || k2}</label>
          </div>
        ))
      )}

      {/* LEVEL 3 - ISL */}
      <h3>Perbandingan Indikator ISL</h3>
      {ISL_KEYS.map((k1, i) =>
        ISL_KEYS.slice(i + 1).map((k2) => (
          <div className="comparison" key={`${k1}_${k2}`}>
            <label>{ISL_MAP[k1]?.name || k1}</label>
            <div className="range-container">
              <CustomSlider
                onChange={(newValue) =>
                  setLevel3((prev) => ({ ...prev, [`${k1}_${k2}`]: newValue }))
                }
              />
              <p className="slider-value">Nilai: {showValue(level3[`${k1}_${k2}`] ?? 1)}</p>
            </div>
            <label>{ISL_MAP[k2]?.name || k2}</label>
          </div>
        ))
      )}

      <button type="submit">Submit</button>
    </form>
  );
};

export default PlayForm;
