import { useEffect, useState } from "react";
import axios from "axios";

// Header untuk setiap level
const headers = {
  level1: ["IFE", "ISL"],
  level2: ["Financial & Economy", "Social & Environment"],
  level3: [
    // IFE
    "Dampak terhadap pengembangan ekonomi lokal",
    "Dampak terhadap keuntungan ekonomi jangka panjang",
    "Dampak terhadap pemanfaatan sumber daya lokal",
    "Kontribusi terhadap kehidupan lebih baik warga kota",
    "Dampak multiplier & jejaring ekonomi/industri lain",
    "Penerimaan langsung dari proyek",
    "Pengaruh terhadap alokasi anggaran berjalan",
    "Pengalokasian proyek di dalam APBD/APBN",
    "Kebutuhan dukungan eksternal",
    "Risiko finansial/ekonomi terhadap keberlanjutan proyek",
    "Risiko politik terhadap keberlanjutan proyek",
    "Strategi mitigasi risiko dalam penyelenggaraan proyek",
    // ISL
    "Dampak terhadap kualitas lingkungan sekitar",
    "Kontribusi dalam keberlanjutan jangka panjang",
    "Kontribusi terhadap kesehatan masyarakat lokal",
    "Kontribusi terhadap adaptasi perubahan iklim",
    "Kontribusi terhadap mitigasi perubahan iklim",
    "Kontribusi peningkatan kualitas ruang publik kota",
    "Dampak/risiko terhadap keanekaragaman hayati",
    "Inovasi/keterbaruan untuk perbaikan masa depan",
    "Dampak ke masyarakat akibat alih fungsi lahan",
    "Perbaikan lingkungan masyarakat berpenghasilan rendah",
  ],
};

const NormalizedMat = () => {
  const [normalizedMatrices, setNormalizedMatrices] = useState({
    normalizedMatrixLevel1: [],
    normalizedMatrixLevel2: [],
    normalizedMatrixLevel3: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNormalizedMatrices = async () => {
      try {
        const response = await axios.get("/api/v1/form/calculate");
        const {
          normalizedMatrixLevel1 = [],
          normalizedMatrixLevel2 = [],
          normalizedMatrixLevel3 = [],
        } = response.data;

        setNormalizedMatrices({
          normalizedMatrixLevel1,
          normalizedMatrixLevel2,
          normalizedMatrixLevel3,
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching normalized matrices:", err);
        setError("Error fetching normalized matrices.");
        setLoading(false);
      }
    };

    fetchNormalizedMatrices();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  // Fungsi untuk render matriks dengan header
  const renderMatrixWithHeader = (matrix, header) => {
    if (!Array.isArray(matrix) || matrix.length === 0) {
      return <p>Tidak ada data matriks.</p>;
    }

    return (
      <table style={{ borderCollapse: "collapse", marginBottom: "20px" }}>
        <thead>
          <tr>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}></th> {/* Kosong */}
            {header.map((colName, index) => (
              <th key={index} style={{ padding: "8px", border: "1px solid #ddd" }}>
                {colName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <th style={{ padding: "8px", border: "1px solid #ddd" }}>
                {header[rowIndex]}
              </th>
              {row.map((value, colIndex) => (
                <td key={colIndex} style={{ padding: "8px", border: "1px solid #ddd" }}>
                  {value.toFixed(3)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div>
      <div>
        <h3>Normalized Matrix - Level 1</h3>
        {renderMatrixWithHeader(normalizedMatrices.normalizedMatrixLevel1, headers.level1)}
      </div>

      <div>
        <h3>Normalized Matrix - Level 2</h3>
        {renderMatrixWithHeader(normalizedMatrices.normalizedMatrixLevel2, headers.level2)}
      </div>

      <div>
        <h3>Normalized Matrix - Level 3</h3>
        {renderMatrixWithHeader(normalizedMatrices.normalizedMatrixLevel3, headers.level3)}
      </div>
    </div>
  );
};

export default NormalizedMat;
