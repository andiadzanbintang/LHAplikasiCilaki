import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function SetIteration() {
  const [iteration, setIteration] = useState(""); // input
  const [currentIteration, setCurrentIteration] = useState(""); // data dari server
  const [loading, setLoading] = useState(false);

  // ambil iterasi dari backend
  useEffect(() => {
    const getIteration = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/v1/admin/getIteration");
        if (response.data?.iteration !== undefined) {
          setCurrentIteration(response.data.iteration);
          setIteration(response.data.iteration.toString());
        } else {
          toast.error("Gagal mendapatkan iterasi");
        }
      } catch (error) {
        console.error("Error fetching iteration:", error);
        toast.error("Gagal memuat iterasi");
      } finally {
        setLoading(false);
      }
    };
    getIteration();
  }, []);

  // simpan ke backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d+$/.test(iteration)) {
      return toast.error("Iterasi harus berupa angka positif!");
    }

    try {
      const res = await axios.put("/api/v1/admin/editIteration", {
        iteration: parseInt(iteration, 10),
      });
      setCurrentIteration(res.data.iteration);
      toast.success("Iterasi berhasil diperbarui!");
    } catch (error) {
      console.error("Error updating iteration:", error);
      toast.error("Gagal update iterasi");
    }
  };

  // helper increment/decrement
  const changeIteration = (delta) => {
    setIteration((prev) => {
      const newVal = Math.max(0, parseInt(prev || "0", 10) + delta);
      return newVal.toString();
    });
  };

  return (
    <div className="set-iteration-container">
      <h2>Pengaturan Iterasi</h2>

      {loading ? (
        <p>Memuat iterasi saat ini...</p>
      ) : (
        <p>
          Iterasi saat ini: <strong>{currentIteration}</strong>
        </p>
      )}

      <form onSubmit={handleSubmit} className="set-iteration-form">
        <label htmlFor="iteration">Ganti Iterasi:</label>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => changeIteration(-1)}
            className="set-iteration-btn"
          >
            –
          </button>
          <input
            type="text"
            id="iteration"
            value={iteration}
            onChange={(e) => setIteration(e.target.value)}
            placeholder="Masukkan angka iterasi"
          />
          <button
            type="button"
            onClick={() => changeIteration(1)}
            className="set-iteration-btn"
          >
            +
          </button>
        </div>
        <button
          type="submit"
          disabled={loading || iteration === ""}
          className="set-iteration-btn"
          style={{ marginTop: "12px" }}
        >
          Simpan
        </button>
      </form>
    </div>
  );
}
