import { useState } from "react";
import { useNavigate } from 'react-router-dom'
import axios from "axios";
import toast from "react-hot-toast";
import CustomSlider from "./CustomSlider";

// Random Index (RI) untuk ukuran matriks
const RI_VALUES = { 2: 0, 3: 0.58, 4: 0.9, 5: 1.12, 6: 1.24, 7: 1.32 };

// Daftar indikator IFE & ISL
const IFE_INDICATORS = {
  IFE1: "Dampak terhadap pengembangan ekonomi lokal",
  IFE2: "Dampak terhadap keuntungan ekonomi jangka panjang",
  IFE3: "Dampak terhadap pemanfaatan sumber daya lokal",
  IFE4: "Kontribusi terhadap kehidupan lebih baik warga kota",
  IFE5: "Dampak multiplier & jejaring ekonomi/industri lain",
  IFE6: "Penerimaan langsung dari proyek",
  IFE7: "Pengaruh terhadap alokasi anggaran berjalan",
  IFE8: "Pengalokasian proyek di dalam APBD/APBN",
  IFE9: "Kebutuhan dukungan eksternal",
  IFE10: "Risiko finansial/ekonomi terhadap keberlanjutan proyek",
  IFE11: "Risiko politik terhadap keberlanjutan proyek",
  IFE12: "Strategi mitigasi risiko dalam penyelenggaraan proyek",
};

const ISL_INDICATORS = {
  ISL1: "Dampak terhadap kualitas lingkungan sekitar",
  ISL2: "Kontribusi dalam keberlanjutan jangka panjang",
  ISL3: "Kontribusi terhadap kesehatan masyarakat lokal",
  ISL4: "Kontribusi terhadap adaptasi perubahan iklim",
  ISL5: "Kontribusi terhadap mitigasi perubahan iklim",
  ISL6: "Kontribusi peningkatan kualitas ruang publik kota",
  ISL7: "Dampak/risiko terhadap keanekaragaman hayati",
  ISL8: "Inovasi/keterbaruan untuk perbaikan masa depan",
  ISL9: "Dampak ke masyarakat akibat alih fungsi lahan",
  ISL10: "Perbaikan lingkungan masyarakat berpenghasilan rendah",
};

// === REVISI: helper untuk generate semua pasangan pairwise per kelompok ===
const buildDefaultPairs = (keys) => {
  const obj = {};
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      obj[`${keys[i]}_${keys[j]}`] = 1; // default sama penting
    }
  }
  return obj;
};

const IFE_KEYS = Object.keys(IFE_INDICATORS);
const ISL_KEYS = Object.keys(ISL_INDICATORS);

const Form = () => {
  const navigate = useNavigate()
  const [name, setName] = useState("");
  const [instansi, setInstansi] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [city, setCity] = useState("");

  // Level 1 & 2 fixed = 1 (tidak perlu ditampilkan)
  const [level1] = useState({ IFE_ISL: 1 }); 
  const [level2] = useState({
    financial_economy: 1,
    social_environment: 1,
  });

  // === REVISI: Prefill SEMUA kombinasi pairwise IFE & ISL ===
  const [level3, setLevel3] = useState(() => ({
    ...buildDefaultPairs(IFE_KEYS),
    ...buildDefaultPairs(ISL_KEYS),
  }));

  const validateInput = () => {
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!name) { toast.error("Nama tidak boleh kosong."); return false; }
    if (!nameRegex.test(name)) { toast.error("Nama hanya huruf & spasi."); return false; }
    if (name.length < 2 || name.length > 50) { toast.error("Nama 2-50 karakter."); return false; }

    const jabatanRegex = /^[A-Za-z0-9\s]+$/;
    if (!jabatan) { toast.error("Jabatan tidak boleh kosong."); return false; }
    if (!jabatanRegex.test(jabatan)) { toast.error("Jabatan hanya huruf/angka."); return false; }

    const instansiRegex = /^[A-Za-z0-9\s]+$/;
    if (!instansi) { toast.error("Instansi tidak boleh kosong."); return false; }
    if (!instansiRegex.test(instansi)) { toast.error("Instansi hanya huruf/angka."); return false; }

    return true;
  };

  // === REVISI: adjustValue & showValue lebih aman ===
  const adjustValue = (value) => {
    const v = Number(value);
    if (!Number.isFinite(v) || v === 0 || v === -1) return 1;
    if (v < 0) return Math.abs(v);
    if (v > 1) return 1 / v;
    return v;
  };

  // helper buat nampilin nilai
  const showValue = (value) => {
    const v = Number(value);
    if (!Number.isFinite(v) || v === 0 || v === -1) return 1;
    if (v < 0) return Math.abs(v);
    return v;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInput()) return;

    const adjustedLevel1 = { IFE_ISL: adjustValue(level1.IFE_ISL) };
    const adjustedLevel2 = {
      financial_economy: adjustValue(level2.financial_economy),
      social_environment: adjustValue(level2.social_environment),
    };

    // === REVISI: fallback 1 jika ada undefined di level3 ===
    const adjustedLevel3 = Object.keys(level3).reduce((acc, key) => {
      acc[key] = adjustValue(level3[key] ?? 1);
      return acc;
    }, {});

    const data = {
      name,
      title: jabatan,
      instansi,
      city,
      level_1: adjustedLevel1,
      level_2: adjustedLevel2,
      level_3: adjustedLevel3,
    };

    try {
      await axios.post("/api/v1/form/submit", data); 
      toast.success("Data successfully submitted!");
      setTimeout(() => { navigate("/"); }, 2000);
    } catch (error) {
      console.error("Something went wrong:", error);
      toast.error("Failed to submit data.", error);
    }
  };

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
        <input required type="text" value={instansi} onChange={(e) => setInstansi(e.target.value)} />
      </div>
      <div className="data-diri">
        <label>Kota</label>
        <select required value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="" disabled>Pilih Kota</option>
          <option value="Bitung">Bitung</option>
          <option value="Jakarta">Jakarta</option>
          <option value="Palembang">Palembang</option>
          <option value="Balikpapan">Balikpapan</option>
          <option value="Semarang">Semarang</option>
        </select>
      </div>

      {/* LEVEL 3 - IFE */}
      {Object.entries(IFE_INDICATORS).map(([key, label], idx) => (
        Object.entries(IFE_INDICATORS).slice(idx + 1).map(([key2, label2]) => (
          <div className="comparison" key={`${key}_${key2}`}>
            <label>{label}</label>
            <div className="range-container">
              <CustomSlider
                onChange={(newValue) => {
                  // === REVISI: functional update ===
                  setLevel3(prev => ({ ...prev, [`${key}_${key2}`]: newValue }));
                }}
              />
              <p className="slider-value">
                Nilai: {showValue(level3[`${key}_${key2}`] ?? 1)}
              </p>
            </div>
            <label>{label2}</label>
          </div>
        ))
      ))}

      {/* LEVEL 3 - ISL */}
      {Object.entries(ISL_INDICATORS).map(([key, label], idx) => (
        Object.entries(ISL_INDICATORS).slice(idx + 1).map(([key2, label2]) => (
          <div className="comparison" key={`${key}_${key2}`}>
            <label>{label}</label>
            <div className="range-container">
              <CustomSlider
                onChange={(newValue) => {
                  // === REVISI: functional update ===
                  setLevel3(prev => ({ ...prev, [`${key}_${key2}`]: newValue }));
                }}
              />
              <p className="slider-value">
                Nilai: {showValue(level3[`${key}_${key2}`] ?? 1)}
              </p>
            </div>
            <label>{label2}</label>
          </div>
        ))
      ))}

      <button type="submit">Submit</button>
    </form>
  );

}

export default Form;