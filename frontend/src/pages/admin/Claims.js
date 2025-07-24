import React, { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { Dialog, Transition } from '@headlessui/react';

const Claims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    agent: '',
    startDate: '',
    endDate: ''
  });
  const [agents, setAgents] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [stats, setStats] = useState({
    totalClaims: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    rejectedClaims: 0,
    totalAmount: 0
  });
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch claims
  const fetchClaims = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      
      if (filters.status) {
        params.append('status', filters.status);
      }
      
      if (filters.agent) {
        params.append('agent', filters.agent);
      }
      
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
      
      const response = await axios.get(`/api/claims?${params.toString()}`);
      
      setClaims(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching claims:', err);
      setError(err.response?.data?.message || 'Failed to fetch claims');
      toast.error(err.response?.data?.message || 'Failed to fetch claims');
    } finally {
      setLoading(false);
    }
  };

  // Fetch agents for filter dropdown
  const fetchAgents = async () => {
    setLoadingAgents(true);
    
    try {
      const response = await axios.get('/api/users?role=agent');
      setAgents(response.data.data);
    } catch (err) {
      console.error('Error fetching agents:', err);
      toast.error('Failed to load agent list');
    } finally {
      setLoadingAgents(false);
    }
  };

  // Fetch claim statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/claims/stats');
      setStats(response.data.data);
    } catch (err) {
      console.error('Error fetching claim stats:', err);
    }
  };

  useEffect(() => {
    fetchClaims();
    fetchStats();
  }, [page, limit, filters]);

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      agent: '',
      startDate: '',
      endDate: ''
    });
    setPage(1);
  };

  const openActionModal = (claim, type) => {
    setSelectedClaim(claim);
    setActionType(type);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleClaimAction = async () => {
    if (!selectedClaim || !actionType) return;
    
    setActionLoading(true);
    
    try {
      await axios.put(`/api/claims/${selectedClaim._id}/status`, {
        status: actionType,
        notes: notes
      });
      
      toast.success(`Claim ${actionType === 'approved' ? 'approved' : 'rejected'} successfully`);
      
      // Refresh claims and stats
      fetchClaims();
      fetchStats();
      setIsModalOpen(false);
    } catch (err) {
      console.error(`Error ${actionType} claim:`, err);
      toast.error(err.response?.data?.message || `Failed to ${actionType} claim`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    let bgColor = 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case 'pending':
        bgColor = 'bg-yellow-100 text-yellow-800';
        break;
      case 'approved':
        bgColor = 'bg-green-100 text-green-800';
        break;
      case 'rejected':
        bgColor = 'bg-red-100 text-red-800';
        break;
      default:
        bgColor = 'bg-gray-100 text-gray-800';
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Payment Claims Management</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-md shadow-sm">
          <div className="text-sm font-medium text-gray-500">Total Claims</div>
          <div className="text-3xl font-semibold">{stats.totalClaims}</div>
        </div>
        <div className="bg-white p-4 rounded-md shadow-sm">
          <div className="text-sm font-medium text-gray-500">Pending Claims</div>
          <div className="text-3xl font-semibold">{stats.pendingClaims}</div>
          <div className="text-sm text-gray-500">Awaiting Review</div>
        </div>
        <div className="bg-white p-4 rounded-md shadow-sm">
          <div className="text-sm font-medium text-gray-500">Approved Claims</div>
          <div className="text-3xl font-semibold">{stats.approvedClaims}</div>
        </div>
        <div className="bg-white p-4 rounded-md shadow-sm">
          <div className="text-sm font-medium text-gray-500">Rejected Claims</div>
          <div className="text-3xl font-semibold">{stats.rejectedClaims}</div>
        </div>
        <div className="bg-white p-4 rounded-md shadow-sm">
          <div className="text-sm font-medium text-gray-500">Total Amount (USD)</div>
          <div className="text-3xl font-semibold">${stats.totalAmount.toFixed(2)}</div>
          <div className="text-sm text-gray-500">Approved Claims</div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-md shadow-sm mb-6">
        <h3 className="text-lg font-medium mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              name="status" 
              value={filters.status} 
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
            <select 
              name="agent" 
              value={filters.agent} 
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              disabled={loadingAgents}
            >
              <option value="">All Agents</option>
              {agents.map(agent => (
                <option key={agent._id} value={agent._id}>
                  {agent.name} ({agent.companyName || agent.email})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date" 
              name="startDate" 
              value={filters.startDate} 
              onChange={handleFilterChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date" 
              name="endDate" 
              value={filters.endDate} 
              onChange={handleFilterChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>
        
        <button 
          onClick={handleClearFilters} 
          className="px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Clear Filters
        </button>
      </div>
      
      {/* Claims Table */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : claims.length === 0 ? (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">No claims found matching the selected filters.</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-white rounded-md shadow-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Reference</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claimed Amount (USD)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Passenger</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claim Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {claims.map(claim => (
                  <tr key={claim._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{claim.transactionId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{claim.agent?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {claim.booking?.bookingReference ? (
                        <Link to={`/admin/bookings/${claim.booking._id}`} className="text-indigo-600 hover:text-indigo-900">
                          {claim.booking.bookingReference}
                        </Link>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{claim.amount} {claim.currency}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${claim.claimedAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{claim.leadPaxName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(claim.claimDate), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getStatusBadge(claim.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {claim.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button 
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            onClick={() => openActionModal(claim, 'approved')}
                          >
                            Approve
                          </button>
                          <button 
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            onClick={() => openActionModal(claim, 'rejected')}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-gray-700">
              Showing {claims.length} of {totalPages * limit} claims
            </p>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setPage(prev => Math.max(prev - 1, 1))} 
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">Page {page} of {totalPages}</span>
              <button 
                onClick={() => setPage(prev => prev + 1)} 
                disabled={page === totalPages}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* Approval/Rejection Modal */}
      <Transition.Root show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed z-10 inset-0 overflow-y-auto" onClose={() => setIsModalOpen(false)}>
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mt-3 text-center sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
                      {actionType === 'approved' ? 'Approve Claim' : 'Reject Claim'}
                    </Dialog.Title>
                    
                    <div className="mt-4">
                      {selectedClaim && (
                        <div>
                          <p className="text-sm text-gray-500 mb-4">
                            Are you sure you want to {actionType === 'approved' ? 'approve' : 'reject'} this claim?
                          </p>
                          
                          <div className="bg-gray-50 p-4 rounded-md mb-4">
                            <p className="text-sm text-gray-700"><span className="font-medium">Transaction ID:</span> {selectedClaim.transactionId}</p>
                            <p className="text-sm text-gray-700"><span className="font-medium">Agent:</span> {selectedClaim.agent?.name}</p>
                            <p className="text-sm text-gray-700"><span className="font-medium">Amount:</span> {selectedClaim.amount} {selectedClaim.currency}</p>
                            <p className="text-sm text-gray-700"><span className="font-medium">Claimed Amount (USD):</span> ${selectedClaim.claimedAmount.toFixed(2)}</p>
                          </div>
                          
                          <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                            <div className="mt-1">
                              <textarea
                                id="notes"
                                name="notes"
                                rows={3}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any notes about this decision"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:col-start-2 sm:text-sm ${actionType === 'approved' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'} focus:outline-none focus:ring-2 focus:ring-offset-2`}
                    onClick={handleClaimAction}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      actionType === 'approved' ? 'Approve' : 'Reject'
                    )}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default Claims;
