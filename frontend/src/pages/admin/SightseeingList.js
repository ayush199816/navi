import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { formatPrice } from '../../utils/currencyFormatter';

const SightseeingList = () => {
  const [sightseeing, setSightseeing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  // Add, Edit, Delete handlers would go here (scaffold only)

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Manage Sightseeing</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Location</th>
              <th className="border px-4 py-2">Duration</th>
              <th className="border px-4 py-2">Price</th>
              <th className="border px-4 py-2">Active</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sightseeing.map((s) => (
              <tr key={s._id}>
                <td className="border px-4 py-2">{s.name}</td>
                <td className="border px-4 py-2">{s.location}</td>
                <td className="border px-4 py-2">{s.duration} min</td>
                <td className="border px-4 py-2">{formatPrice(s.sellingPrice, s.currency)}</td>
                <td className="border px-4 py-2">{formatPrice(s.costPrice, s.currency)}</td>
                <td className="border px-4 py-2">{s.isActive ? 'Yes' : 'No'}</td>
                <td className="border px-4 py-2">Edit | Delete</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SightseeingList;
