import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SightseeingAddModal from './SightseeingAddModal';
import SightseeingEditModal from './SightseeingEditModal';
import { formatPrice } from '../../utils/currencyFormatter';

const SightseeingList = () => {
  const [sightseeing, setSightseeing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedSightseeing, setSelectedSightseeing] = useState(null);

  useEffect(() => {
    fetchSightseeing();
  }, []);

  const fetchSightseeing = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/sightseeing');
      setSightseeing(res.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sightseeing');
    }
    setLoading(false);
  };

  // Delete handler
  const handleDeleteSightseeing = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sightseeing?')) return;
    try {
      await axios.delete(`/api/sightseeing/${id}`);
      fetchSightseeing();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete sightseeing');
    }
  };

  const handleAddSightseeing = async (formData) => {
    try {
      await axios.post('/api/sightseeing', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchSightseeing();
    } catch (err) {
      throw err;
    }
  };

  const handleEditSightseeing = async (formData) => {
    try {
      if (!selectedSightseeing) return;
      await axios.put(`/api/sightseeing/${selectedSightseeing._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchSightseeing();
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Manage Sightseeing</h2>
      <button
        className="btn-primary mb-4"
        onClick={() => setAddOpen(true)}
      >
        + Add Sightseeing
      </button>
      <SightseeingAddModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAddSightseeing}
      />
      <SightseeingEditModal
        open={editOpen}
        onClose={() => { setEditOpen(false); setSelectedSightseeing(null); }}
        onEdit={handleEditSightseeing}
        sightseeing={selectedSightseeing}
      />
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="border px-4 py-2">Picture</th>
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Country</th>
              <th className="border px-4 py-2">Transfer Type</th>
              <th className="border px-4 py-2">Selling Price</th>
              <th className="border px-4 py-2">Cost Price</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sightseeing.map((s) => (
              <tr key={s._id}>
                <td className="border px-4 py-2">
                  {s.picture ? (
                    <img src={s.picture.startsWith('http') ? s.picture : `${s.picture}`} alt={s.name} className="w-16 h-16 object-cover rounded" />
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="border px-4 py-2">{s.name || '-'}</td>
                <td className="border px-4 py-2">{s.country || '-'}</td>
                <td className="border px-4 py-2">{s.transferType || '-'}</td>
                <td className="border px-4 py-2">{formatPrice(s.sellingPrice, s.currency)}</td>
                <td className="border px-4 py-2">{formatPrice(s.costPrice, s.currency)}</td>
                <td className="border px-4 py-2">
                  <button className="btn-outline mr-2" onClick={() => { setSelectedSightseeing(s); setEditOpen(true); }}>Edit</button>
                  <button className="btn-danger" onClick={() => handleDeleteSightseeing(s._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SightseeingList;
