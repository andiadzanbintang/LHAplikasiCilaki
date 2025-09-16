import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const ComparisonTable = () => {
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchComparisons = async () => {
    try {
      const { data } = await axios.get("/api/v1/admin/comparisons");
      setComparisons(data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data comparisons");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus data ini?")) return;
    try {
      await axios.delete(`/api/v1/admin/comparisons/${id}`);
      toast.success("Data berhasil dihapus");
      setComparisons((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus data");
    }
  };

  useEffect(() => {
    fetchComparisons();
  }, []);

  if (loading) return <p>Memuat data comparisons...</p>;

  return (
    <div className="comparison-table-wrapper">
      <h2>Data Evaluasi Penilaian</h2>
      <table className="comparison-table">
        <thead>
          <tr>
            <th>Nama</th>
            <th>Jabatan</th>
            <th>Instansi</th>
            <th>Iteration</th>
            <th>CR IFE</th>
            <th>CR ISL</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {comparisons.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>
                Tidak ada data.
              </td>
            </tr>
          ) : (
            comparisons.map((c) => (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td>{c.title}</td>
                <td>{c.instansi}</td>
                <td>{c.iteration}</td>
                <td style={{ color: c.cr?.IFE > 0.1 ? "red" : "green" }}>
                  {c.cr?.IFE?.toFixed(3) ?? "—"}
                </td>
                <td style={{ color: c.cr?.ISL > 0.1 ? "red" : "green" }}>
                  {c.cr?.ISL?.toFixed(3) ?? "—"}
                </td>
                <td>
                  <button
                    className="btn-edit"
                    disabled
                    title="Fitur edit belum tersedia"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(c._id)}
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ComparisonTable;
