import { useState } from "react";
import axios from "axios";

const IndicatorTable = ({ indicators, refresh, setIndicators }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Handle form input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Add Indicator
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/v1/admin/indicators", formData);
      if (res.data.status === 201) {
        refresh();
        setFormData({ name: "", description: "", category: "" });
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      console.error("Error adding indicator:", error);
      alert(error.response?.data?.message || "Server error");
    }
  };

  // Edit Indicator
  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`/api/v1/admin/indicators/${editId}`, formData);
      if (res.data.status === 200) {
        refresh();
        setIsEditing(false);
        setEditId(null);
        setFormData({ name: "", description: "", category: "" });
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      console.error("Error editing indicator:", error);
      alert(error.response?.data?.message || "Server error");
    }
  };

  // Delete Indicator
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this indicator?")) return;

    try {
      const res = await axios.delete(`/api/v1/admin/indicators/${id}`);
      if (res.data.status === 200) {
        // update state langsung
        setIndicators((prev) => prev.filter((indicator) => indicator._id !== id));
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        alert("Indicator already deleted or not found");
        setIndicators((prev) => prev.filter((indicator) => indicator._id !== id));
      } else {
        console.error("Error deleting indicator:", error);
        alert(error.response?.data?.message || "Server error");
      }
    }
  };

  // Prefill form when editing
  const startEdit = (indicator) => {
    setIsEditing(true);
    setEditId(indicator._id);
    setFormData({
      name: indicator.name,
      description: indicator.description,
      category: indicator.category,
    });
  };

  return (
    <div className="indicator-container">

      {/* Form Add/Edit */}
      <form onSubmit={isEditing ? handleEdit : handleAdd} className="indicator-form">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          required
        />
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        >
          <option value="">Select Category</option>
          <option value="IFE">IFE</option>
          <option value="ISL">ISL</option>
        </select>
        <button type="submit">{isEditing ? "Update" : "Add"}</button>
        {isEditing && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setEditId(null);
              setFormData({ name: "", description: "", category: "" });
            }}
          >
            Cancel
          </button>
        )}
      </form>

      {/* Table */}
      <table className="indicator-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {indicators.map((indicator) => (
            <tr key={indicator._id}>
              <td>{indicator.name}</td>
              <td>{indicator.description}</td>
              <td>{indicator.category}</td>
              <td>
                <button onClick={() => startEdit(indicator)}>Edit</button>
                <button onClick={() => handleDelete(indicator._id)}>Delete</button>
              </td>
            </tr>
          ))}
          {indicators.length === 0 && (
            <tr>
              <td colSpan="5">No indicators found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default IndicatorTable;
