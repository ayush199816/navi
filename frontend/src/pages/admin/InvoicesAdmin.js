import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import RequireAuth from '../auth/RequireAuth';
import { EyeIcon, DocumentPlusIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import InvoiceDetailModal from '../../components/InvoiceDetailModal';
import CreateInvoiceModal from '../../components/CreateInvoiceModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const InvoicesAdmin = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line
  }, [page, search, status]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let url = `/invoices?page=${page}&limit=${pageSize}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status) url += `&status=${status}`;
      const res = await api.get(url);
      setInvoices(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch invoices');
    }
    setLoading(false);
  };

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const handleDelete = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    
    setActionLoading(true);
    try {
      await api.delete(`/invoices/${invoiceId}`);
      toast.success('Invoice deleted successfully!');
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete invoice');
    }
    setActionLoading(false);
  };

  const handleMarkAsPaid = async (invoiceId) => {
    setActionLoading(true);
    try {
      await api.put(`/invoices/${invoiceId}/mark-paid`, {
        paymentMethod: 'bank_transfer',
        paymentDetails: {
          notes: 'Marked as paid by admin'
        }
      });
      toast.success('Invoice marked as paid!');
      fetchInvoices();
      setShowViewModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark invoice as paid');
    }
    setActionLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <RequireAuth roles={['admin', 'operations']}>
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Invoices</h2>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <DocumentPlusIcon className="w-5 h-5" />
            Create Invoice
          </button>
        </div>
        
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <input
            className="form-input sm:w-1/3"
            type="text"
            placeholder="Search by invoice ID, customer, destination"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <select
            className="form-input sm:w-1/5"
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Invoice ID</th>
                <th className="px-4 py-2 border">Quote ID</th>
                <th className="px-4 py-2 border">Customer</th>
                <th className="px-4 py-2 border">Destination</th>
                <th className="px-4 py-2 border">Amount</th>
                <th className="px-4 py-2 border">Due Date</th>
                <th className="px-4 py-2 border">Status</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">No invoices found.</td>
                </tr>
              ) : (
                invoices.map(invoice => (
                  <tr key={invoice._id}>
                    <td className="px-4 py-2 border font-mono">{invoice.invoiceId}</td>
                    <td className="px-4 py-2 border font-mono">
                      {invoice.quote?.quoteId || '-'}
                    </td>
                    <td className="px-4 py-2 border">{invoice.customerName}</td>
                    <td className="px-4 py-2 border">{invoice.destination}</td>
                    <td className="px-4 py-2 border whitespace-nowrap">
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }).format(invoice.total || invoice.totalAmount || 0)}
                    </td>
                    <td className="px-4 py-2 border">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 border">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 border">
                      <div className="flex gap-1">
                        <button 
                          className="btn-outline px-2 py-1 flex items-center gap-1" 
                          onClick={() => handleView(invoice)}
                        >
                          <EyeIcon className="w-4 h-4" /> View
                        </button>
                        {invoice.status !== 'paid' && (
                          <button
                            className="btn-outline px-2 py-1 flex items-center gap-1"
                            onClick={() => handleMarkAsPaid(invoice._id)}
                            disabled={actionLoading}
                            title="Mark as Paid"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        {invoice.status !== 'paid' && (
                          <button
                            className="btn-outline px-2 py-1 text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(invoice._id)}
                            disabled={actionLoading}
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
        
        {/* View Invoice Modal */}
        <InvoiceDetailModal
          open={showViewModal}
          onClose={() => setShowViewModal(false)}
          invoice={selectedInvoice}
          onMarkAsPaid={handleMarkAsPaid}
          onRefresh={fetchInvoices}
        />
        
        {/* Create Invoice Modal */}
        <CreateInvoiceModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchInvoices();
          }}
        />
        
        <ToastContainer position="top-center" autoClose={3000} />
      </div>
    </RequireAuth>
  );
};

export default InvoicesAdmin;
