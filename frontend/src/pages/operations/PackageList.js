import React, { useEffect, useState } from 'react';
import axios from 'axios';
import RequireAuth from '../auth/RequireAuth';
import PackageFormModal from './PackageFormModal';

const PackageList = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [destination, setDestination] = useState('');
  const [isActive, setIsActive] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPackage, setEditPackage] = useState(null);
  const pageSize = 10;


  useEffect(() => {
    fetchPackages();
    // eslint-disable-next-line
  }, [page, search, destination, isActive]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      let url = `/api/packages?page=${page}&limit=${pageSize}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (destination) url += `&destination=${encodeURIComponent(destination)}`;
      if (isActive !== 'all') url += `&isActive=${isActive}`;
      const res = await axios.get(url);
      setPackages(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch packages');
    }
    setLoading(false);
  };

  const handleToggleStatus = async (id) => {
    try {
      await axios.put(`/api/packages/${id}/toggle-status`);
      fetchPackages();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;
    try {
      await axios.delete(`/api/packages/${id}`);
      fetchPackages();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete package');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <RequireAuth allowedRoles={['admin', 'operations']}>
      <div className="max-w-6xl mx-auto p-8">
        <h2 className="text-2xl font-bold mb-6">Package Management</h2>
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <input
            className="form-input sm:w-1/3"
            type="text"
            placeholder="Search by name, description, destination"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <input
            className="form-input sm:w-1/4"
            type="text"
            placeholder="Filter by destination"
            value={destination}
            onChange={e => { setDestination(e.target.value); setPage(1); }}
          />
          <select
            className="form-input sm:w-1/5"
            value={isActive}
            onChange={e => { setIsActive(e.target.value); setPage(1); }}
          >
            <option value="all">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button className="btn-primary" onClick={() => { setEditPackage(null); setModalOpen(true); }}>+ Create Package</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Destination</th>
                <th className="px-4 py-2 border">Duration</th>
                <th className="px-4 py-2 border">Price</th>
                <th className="px-4 py-2 border">Offer Price</th>
                <th className="px-4 py-2 border">Offer End Date</th>
                <th className="px-4 py-2 border">Agent Price</th>
                <th className="px-4 py-2 border">Active</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-4 text-gray-500">No packages found.</td>
                </tr>
              ) : (
                packages.map(pkg => (
                  <tr key={pkg._id}>
                    <td className="px-4 py-2 border font-semibold">{pkg.name}</td>
                    <td className="px-4 py-2 border">{pkg.destination}</td>
                    <td className="px-4 py-2 border">{pkg.duration} days</td>
                    <td className="px-4 py-2 border">₹{pkg.price.toLocaleString()}</td>
                    <td className="px-4 py-2 border">
                      {pkg.offerPrice ? (
                        <span className="text-green-600 font-semibold">₹{pkg.offerPrice.toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2 border">
                      {pkg.endDate ? (
                        <span className={new Date(pkg.endDate) >= new Date() ? 'text-green-600' : 'text-red-500'}>
                          {new Date(pkg.endDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2 border">₹{pkg.agentPrice.toLocaleString()}</td>
                    <td className="px-4 py-2 border">
                      <span className={pkg.isActive ? 'text-green-600 font-bold' : 'text-gray-400'}>
                        {pkg.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2 border space-x-2">
                      <button className="btn-outline px-2 py-1" onClick={() => { setEditPackage(pkg); setModalOpen(true); }}>View/Edit</button>
                      <button className="btn-outline px-2 py-1" onClick={() => handleToggleStatus(pkg._id)}>
                        {pkg.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn-outline px-2 py-1" onClick={() => handleDelete(pkg._id)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            <button
              className="btn-outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Prev
            </button>
            <span className="px-2">Page {page} of {totalPages}</span>
            <button
              className="btn-outline"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
      <PackageFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); setEditPackage(null); fetchPackages(); }}
        editPackage={editPackage}
      />
    </RequireAuth>
  );
};

export default PackageList;
