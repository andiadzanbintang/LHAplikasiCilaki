import { useEffect, useState } from "react";
import axios from "axios";
import IndicatorTable from "../components/IndicatorTable";

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
      <h1>Admin Dashboard</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <IndicatorTable
          indicators={indicators}
          setIndicators={setIndicators} // 👉 oper ke child
          refresh={fetchIndicators}     // kalau mau tetap ada opsi refresh
        />
      )}
    </div>
  );
};

export default AdminDashboard;
