import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowDownIcon, ArrowUpIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const AdminClaimModal = ({ isOpen, onClose, booking, onSuccess }) => {
  // Log the booking object to see its structure
  console.log('AdminClaimModal - Booking object:', booking);
  console.log('AdminClaimModal - Booking agent:', booking?.agent);

  // Initialize state
  const [formData, setFormData] = useState({
    paymentAmount: 0,
    paymentMethod: 'wallet',
    rateOfExchange: 1,
    transactionId: `TXN-${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`,
    agentId: booking?.agent?._id || '',
  });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agents, setAgents] = useState([]);
  const [finalAmount, setFinalAmount] = useState(0);

  // Calculate total amount and remaining balance
  const totalAmount = booking?.totalAmount || 0;
  const totalClaimed = paymentHistory?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
  const remainingBalance = Math.max(0, totalAmount - totalClaimed);

  // Update form data when booking changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      paymentAmount: remainingBalance > 0 ? remainingBalance : 0,
      agentId: booking?.agent?._id || prev.agentId,
    }));
  }, [booking, remainingBalance]);


  // Fetch agents list and payment history when booking changes
  useEffect(() => {
    // Set initial agent ID from booking if available
    if (booking?.agent?._id && !formData.agentId) {
      setFormData(prev => ({
        ...prev,
        agentId: booking.agent._id
      }));
    }
    
    const fetchAgents = async () => {
      try {
        const response = await axios.get('/api/users?role=agent');
        if (response.data.success) {
          // If booking has an agent, make sure it's in the agents list
          const agentsList = response.data.data;
          
          // If booking has an agent but it's not in the list, add it
          if (booking?.agent?._id) {
            const agentExists = agentsList.some(agent => agent._id === booking.agent._id);
            if (!agentExists) {
              agentsList.unshift({
                _id: booking.agent._id,
                name: booking.agent.name || 'Current Agent',
                firstName: booking.agent.firstName,
                lastName: booking.agent.lastName
              });
            }
          }
          
          setAgents(agentsList);
        }
      } catch (err) {
        console.error('Error fetching agents:', err);
      }
    };

    // Fetch payment history if booking ID is available
    const fetchPaymentHistory = async () => {
      if (booking?._id) {
        try {
          // First try to get payment history from wallet transactions
          const walletResponse = await axios.get(`/api/wallet/transactions?bookingId=${booking._id}`);
          if (walletResponse.data.success) {
            // Transform wallet transactions to match our payment history format
            const transactions = walletResponse.data.data || [];
            const paymentHistory = transactions.map(tx => ({
              date: tx.createdAt || tx.date,
              transactionId: tx.transactionId || tx._id,
              amount: Math.abs(tx.amount), // Convert to positive since we know these are debits
              type: tx.type || 'debit',
              description: tx.description || `Payment claimed for booking ${booking.bookingId || booking._id}`,
              status: 'completed', // Assuming wallet transactions are always completed
              method: tx.paymentMethod || 'wallet'
            }));
            setPaymentHistory(paymentHistory);
          }
        } catch (err) {
          console.error('Error fetching wallet transactions:', err);
          // Fallback to booking payment details if available
          setPaymentHistory(booking.paymentDetails || []);
        }
      } else {
        setPaymentHistory(booking.paymentDetails || []);
      }
    };

    fetchAgents();
    fetchPaymentHistory();
  }, [booking, formData.agentId]);

  // Calculate final amount whenever payment amount or ROE changes
  useEffect(() => {
    let amount = parseFloat(formData.paymentAmount) || 0;
    // Ensure the payment amount is not negative and doesn't exceed the remaining amount
    if (amount < 0) amount = 0;
    if (amount > remainingBalance) {
      amount = remainingBalance;
      setFormData(prev => ({
        ...prev,
        paymentAmount: remainingBalance
      }));
    }
    const roe = parseFloat(formData.rateOfExchange) || 1;
    setFinalAmount(amount * roe);
  }, [formData.paymentAmount, formData.rateOfExchange, remainingBalance]);



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const getLeadPassengerName = () => {
    if (!booking || !booking.passengers || booking.passengers.length === 0) {
      return 'N/A';
    }

    // Find the lead passenger (usually the first one)
    const leadPassenger = booking.passengers.find(p => p.isLead) || booking.passengers[0];
    return `${leadPassenger.firstName} ${leadPassenger.lastName}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare data with additional fields
      const claimData = {
        ...formData,
        agentId: booking?.agent?._id || formData.agentId, // Use booking's agent ID directly
        leadPaxName: getLeadPassengerName(),
        travelDate: booking?.travelDates?.startDate,
        claimDate: new Date(),
      };

      const response = await axios.post(`/api/bookings/${booking._id}/claim-payment`, claimData);

      if (response.data.success) {
        const { data } = response.data;
        const { paymentDetails } = data;
        
        // Update the booking data with the new claimed amount and status
        const updatedBooking = {
          ...booking,
          claimedAmount: paymentDetails.claimedAmount,
          paymentStatus: paymentDetails.paymentStatus,
          paymentDetails: [...(booking.paymentDetails || []), {
            amount: paymentDetails.amountClaimed,
            method: formData.paymentMethod,
            transactionId: formData.transactionId,
            date: new Date(),
            status: 'completed'
          }],
          // Ensure totalAmount is set correctly
          totalAmount: paymentDetails.totalAmount || totalAmount,
          pricing: {
            ...(booking.pricing || {}),
            totalAmount: paymentDetails.totalAmount || totalAmount
          }
        };
        
        // Reset form data for next payment
        setFormData(prev => ({
          ...prev,
          paymentAmount: paymentDetails.remainingAmount > 0 ? paymentDetails.remainingAmount : 0,
          transactionId: `TXN-${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`,
        }));

        toast.success(response.data.message || 'Payment claimed successfully');
        
        // Call onSuccess with the updated booking data
        onSuccess(updatedBooking);
        
        // Only close if fully paid, otherwise keep open for next payment
        if (paymentDetails.isFullyPaid) {
          onClose();
        }
      }
    } catch (err) {
      console.error('Error claiming payment:', err);
      const errorMsg = err.response?.data?.message || 'Failed to claim payment';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { value: 'wallet', label: 'Wallet' },
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'other', label: 'Other' },
  ];

  // Additional helper functions can be added here

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={() => {}}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white rounded-lg max-w-3xl w-full mx-auto p-6 shadow-xl overflow-y-auto max-h-[90vh]">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500"
              onClick={onClose}
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 mb-4">
            Claim Payment
          </Dialog.Title>

          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column - Booking Details */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Booking Details</h4>
                
                <div className="mb-4">
                  <label htmlFor="bookingId" className="block text-sm font-medium text-gray-700">
                    Booking ID
                  </label>
                  <input
                    type="text"
                    id="bookingId"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                    value={booking?.bookingId || ''}
                    readOnly
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                    value={booking?.customerDetails?.name || ''}
                    readOnly
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="leadPaxName" className="block text-sm font-medium text-gray-700">
                    Lead Passenger Name
                  </label>
                  <input
                    type="text"
                    id="leadPaxName"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                    value={getLeadPassengerName()}
                    readOnly
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="travelDate" className="block text-sm font-medium text-gray-700">
                    Date of Travel
                  </label>
                  <input
                    type="text"
                    id="travelDate"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                    value={formatDate(booking?.travelDates?.startDate)}
                    readOnly
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="claimDate" className="block text-sm font-medium text-gray-700">
                    Date of Claim
                  </label>
                  <input
                    type="text"
                    id="claimDate"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                    value={formatDate(new Date())}
                    readOnly
                  />
                </div>
              </div>
              
              {/* Right Column - Payment Details */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Payment Details</h4>
                
                <div className="mb-4">
                  <label htmlFor="agentId" className="block text-sm font-medium text-gray-700">
                    Agent
                  </label>
                  {/* Display current agent name as read-only text field */}
                  {booking?.agent && (
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                      value={booking.agent.name || `${booking.agent.firstName || ''} ${booking.agent.lastName || ''}`.trim() || 'Agent'}
                      readOnly
                    />
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700">
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    id="transactionId"
                    name="transactionId"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    value={formData.transactionId}
                    onChange={handleChange}
                    placeholder="TXN-XXXXXXXX"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700">
                    Payment Amount
                  </label>
                  <div className="mt-1 relative">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="number"
                        id="paymentAmount"
                        name="paymentAmount"
                        className="block w-full pl-7 border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        value={formData.paymentAmount || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setFormData(prev => ({
                            ...prev,
                            paymentAmount: value > 0 ? Math.min(value, remainingBalance) : ''
                          }));
                        }}
                        min="0"
                        max={remainingBalance}
                        step="0.01"
                        placeholder="0.00"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">
                          Max: ₹{remainingBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-gray-600">Total Amount:</div>
                        <div className="text-right font-medium">₹{totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</div>
                        
                        <div className="text-gray-600">Total Claimed:</div>
                        <div className="text-right">
                          <span className="font-medium">₹{totalClaimed?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                        </div>
                        
                        <div className="border-t border-gray-200 my-1 col-span-2"></div>
                        
                        <div className="font-medium">Remaining Balance:</div>
                        <div className="text-right">
                          <span className={`font-bold ${remainingBalance > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                            ₹{remainingBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            {remainingBalance <= 0 && ' (Fully Claimed)'}
                          </span>
                        </div>
                        
                        <div className="border-t border-gray-200 my-1 col-span-2"></div>
                        
                        <div className="text-gray-600">This Claim Amount:</div>
                        <div className="text-right">
                          <input
                            type="number"
                            name="paymentAmount"
                            className="w-32 text-right border rounded px-2 py-1 text-sm"
                            value={formData.paymentAmount || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              setFormData(prev => ({
                                ...prev,
                                paymentAmount: value > 0 ? Math.min(value, remainingBalance) : ''
                              }));
                            }}
                            min="0"
                            max={remainingBalance}
                            step="0.01"
                            placeholder="0.00"
                          />
                        </div>
                        
                        <div className="text-gray-600">After This Claim:</div>
                        <div className="text-right">
                          <span className={`font-medium ${(remainingBalance - (parseFloat(formData.paymentAmount) || 0)) > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                            ₹{(remainingBalance - (parseFloat(formData.paymentAmount) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            {(remainingBalance - (parseFloat(formData.paymentAmount) || 0)) <= 0 ? ' (Will be fully claimed)' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="rateOfExchange" className="block text-sm font-medium text-gray-700">
                    Rate of Exchange (ROE)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="rateOfExchange"
                    name="rateOfExchange"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    value={formData.rateOfExchange}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="finalAmount" className="block text-sm font-medium text-gray-700">
                    Final Amount (Amount × ROE)
                  </label>
                  <input
                    type="text"
                    id="finalAmount"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 font-medium"
                    value={`₹${finalAmount.toFixed(2)}`}
                    readOnly
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                    Payment Method
                  </label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    required
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Payment History Section */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-700 mb-3">Payment History</h4>
              {paymentHistory.length > 0 ? (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[...paymentHistory].reverse().map((payment, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm">
                            <div className="text-gray-900">{format(new Date(payment.date), 'dd/MM/yyyy')}</div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(payment.date), 'h:mm a')}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              payment.type === 'debit' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {payment.type?.toUpperCase()}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-medium">
                            <div className="text-gray-900">₹{payment.amount?.toLocaleString('en-IN')}</div>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            <div className="text-gray-900">{payment.description || 'Payment claimed'}</div>
                            {payment.method && (
                              <div className="text-xs text-gray-500 mt-1">
                                Method: {payment.method.replace('_', ' ')}
                              </div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-mono text-xs">
                            {payment.transactionId || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="5" className="px-4 py-3 text-sm text-gray-700">
                          <div className="flex justify-between items-center">
                            <span>Total Claimed:</span>
                            <span className="font-medium">
                              ₹{paymentHistory.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No payment history found for this booking.
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:opacity-50"
                disabled={loading || remainingBalance <= 0 || !formData.paymentAmount || parseFloat(formData.paymentAmount) <= 0}
              >
                {loading ? 'Processing...' : remainingBalance > 0 ? 'Claim Payment' : 'Fully Paid'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
};

export default AdminClaimModal;
