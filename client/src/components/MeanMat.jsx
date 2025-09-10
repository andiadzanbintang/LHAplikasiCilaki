import { useEffect, useState } from "react";
import axios from "axios";

// Nama-nama indikator berdasarkan level
const headers = {
  level1: ["IFE", "ISL"],
  level2: ["Financial", "Economy", "Social", "Environment"],
  level3: [
    "FNPV", "FNBC", "FIRR", "ENPV", "ENBC", "EIRR",
    "PDRB", "Multiplier", "Backward", "Forward",
    "Serapan", "Jumlah Penerima"
  ],
};

const MeanMat = () => {
  const [meanMatrices, setMeanMatrices] = useState({
    meanMatrixLevel1: [],
    meanMatrixLevel2: [],
    meanMatrixLevel3: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMeanMatrices = async () => {
      try {
        const response = await axios.get("/api/v1/form/calculate");
        
        const {
          meanMatrixLevel1 = {},
          meanMatrixLevel2 = {},
          meanMatrixLevel3 = {},
        } = response.data;

        // Ambil hanya bagian 'data' dari setiap matriks
        setMeanMatrices({
          meanMatrixLevel1: meanMatrixLevel1.data || [],
          meanMatrixLevel2: meanMatrixLevel2.data || [],
          meanMatrixLevel3: meanMatrixLevel3.data || [],
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching mean matrices:", err);
        setError("Error fetching mean matrices.");
        setLoading(false);
      }
    };

    fetchMeanMatrices();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  // Fungsi untuk menampilkan matriks dengan header
  const renderMatrixWithHeader = (matrix, header) => {
    if (!Array.isArray(matrix) || matrix.length === 0) {
      return <p>Tidak ada data matriks.</p>; // Validasi agar tidak crash
    }

    return (
      <table>
        <thead>
          <tr>
            <th></th> {/* Cell kosong di pojok kiri atas */}
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
      {/* Matriks Rata-rata Level 1 */}
      <div>
        <h3>Matriks Rata Rata Level 1</h3>
        {renderMatrixWithHeader(meanMatrices.meanMatrixLevel1, headers.level1)}
      </div>

      {/* Matriks Rata-rata Level 2 */}
      <div>
        <h3>Matriks Rata Rata Level 2</h3>
        {renderMatrixWithHeader(meanMatrices.meanMatrixLevel2, headers.level2)}
      </div>

      {/* Matriks Rata-rata Level 3 */}
      <div>
        <h3>Matriks Rata Rata Level 3</h3>
        {renderMatrixWithHeader(meanMatrices.meanMatrixLevel3, headers.level3)}
      </div>
    </div>
  );
};

export default MeanMat;
