import { useEffect, useState } from "react";
import axios from "axios";
import IndicatorTable from "../components/IndicatorTable";
import ComparisonTable from "../components/ComparisonTable";
import SetIteration from "../components/SetIteration";

const AdminDashboard = () => {
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all indicators
  const fetchIndicators = async () => {
    try {
      const res = await axios.get("/api/v1/admin/indicators");

      if (res.data?.status === 200 && Array.isArray(res.data.data)) {
        if (res.data.data.length > 0) {
          setIndicators(res.data.data);
        } else {
          console.warn("No indicators found");
          setIndicators([]); // kosong biar tabel bisa tampil pesan "No indicators found"
        }
      } else {
        console.error(res.data?.message || "Invalid response from server");
      }
    } catch (error) {
      console.error("Error fetching indicators:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndicators();
  }, []);

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">📊 Admin Dashboard</h1>

      <div className="dashboard-section">
        <h2>Manajemen Indikator</h2>
        {loading ? (
          <p>Loading indikator...</p>
        ) : (
          <IndicatorTable
            indicators={indicators}
            setIndicators={setIndicators}
            refresh={fetchIndicators}
          />
        )}
      </div>

      <div className="dashboard-section">
        <h2>Evaluasi Penilaian</h2>
        <ComparisonTable />
      </div>

      <div className="dashboard-section">
        <h2>Atur Iterasi</h2>
        <SetIteration />
      </div>
    </div>
  );
};

export default AdminDashboard;
