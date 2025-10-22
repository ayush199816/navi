import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { load } from '@cashfree/pg-sdk-web';
import axios from 'axios';

const CASHFREE_CONFIG = {
  mode: process.env.REACT_APP_CASHFREE_MODE || 'sandbox',
  returnUrl: `${window.location.origin}/payment/callback`
};

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cashfree, setCashfree] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [customerDetails, setCustomerDetails] = useState({
    name: 'Test User',
    email: 'test@example.com',
    phone: '9876543210'
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      // No cleanup needed since we're not using timeouts
    };
  }, []);

  // Get booking details from location state if available
  useEffect(() => {
    if (location.state?.booking) {
      const { booking } = location.state;
      setAmount(booking.amount || '');
      setCustomerDetails({
        name: booking.customerName || 'Test User',
        email: booking.customerEmail || 'test@example.com',
        phone: booking.customerPhone || '9876543210'
      });
    }
  }, [location.state]);

  // Initialize Cashfree
  useEffect(() => {
    const initializeCashfree = async () => {
      try {
        const appId = process.env.REACT_APP_CASHFREE_APP_ID;
        if (!appId) {
          throw new Error('Cashfree App ID is not configured');
        }
        const cf = await load(appId, CASHFREE_CONFIG.mode);
        setCashfree(cf);
      } catch (error) {
        console.error('Failed to load Cashfree:', error);
        toast.error('Failed to initialize payment gateway. Please try again later.');
      }
    };

    initializeCashfree();
  }, []);

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!amount) {
    toast.error('Please enter an amount');
    return;
  }

  setIsLoading(true);
  
  try {
    // Call backend to create payment session
    const response = await axios.post('/api/payments/create-session', {
      amount: parseFloat(amount),
      customerDetails
    });

    const { paymentSessionId, orderId } = response.data.data;
    setCurrentOrderId(orderId);
    
    console.log('Payment session created:', { paymentSessionId, orderId });

    if (cashfree) {
      const checkoutOptions = {
        paymentSessionId,
        redirectTarget: "_self"
      };
      
      console.log('Redirecting to Cashfree with options:', checkoutOptions);
      
      cashfree.redirect(checkoutOptions);
    } else {
      throw new Error('Payment gateway not initialized');
    }
  } catch (error) {
    console.error('Payment error:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });
    
    const errorMessage = error.response?.data?.message || 
                       error.message || 
                       'Failed to process payment. Please try again.';
    
    toast.error(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  const handleTestPayment = (testAmount) => {
    setAmount(testAmount.toString());
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-center">
          <h2 className="text-3xl font-extrabold text-white">Secure Payment</h2>
          <p className="mt-2 text-blue-100">Enter payment details to continue</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Test Mode</span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  Sandbox
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Use test card: 4111 1111 1111 1111
              </p>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount (₹)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-3"
                  placeholder="0.00"
                  required
                  min="1"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isLoading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Pay Now'
                )}
              </button>

              <button
                type="button"
                onClick={() => setAmount('100')}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Quick Pay ₹100
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Test Payment Methods
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-4">
              <div className="p-3 border rounded-lg text-center hover:bg-gray-50 cursor-pointer">
                <div className="mx-auto h-12 w-12 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <p className="mt-2 text-xs text-gray-500">Card</p>
              </div>
              <div className="p-3 border rounded-lg text-center hover:bg-gray-50 cursor-pointer">
                <div className="mx-auto h-12 w-12 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="mt-2 text-xs text-gray-500">UPI</p>
              </div>
              <div className="p-3 border rounded-lg text-center hover:bg-gray-50 cursor-pointer">
                <div className="mx-auto h-12 w-12 text-purple-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                </div>
                <p className="mt-2 text-xs text-gray-500">Net Banking</p>
              </div>
              <div className="p-3 border rounded-lg text-center hover:bg-gray-50 cursor-pointer">
                <div className="mx-auto h-12 w-12 text-yellow-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="mt-2 text-xs text-gray-500">Wallets</p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-center space-x-6">
              <span className="text-gray-500 text-sm">Secure payment by</span>
              <div className="h-8">
                <svg viewBox="0 0 100 40" className="h-full w-auto">
                  <path d="M31.8 12.7h-3.6v15.5h3.6V12.7zm-20.3 0H8.2v15.5h3.3v-5.8h5.4c2.8 0 5.1-2.3 5.1-5.1v-.1c0-2.5-2-4.5-4.5-4.5zm-.3 8.1h-5.1v-6h5.1c1.4 0 2.5 1.1 2.5 2.5v1c0 1.4-1.1 2.5-2.5 2.5zM45.5 12.7h-3.6v15.5h3.6V12.7zm-10.5 0h-3.6v15.5h3.6V12.7zm-6.8 0h-3.6v15.5h3.6V12.7z" fill="#00A94C"/>
                  <path d="M60.8 20.8c0 4.6-3.7 8.3-8.3 8.3s-8.3-3.7-8.3-8.3 3.7-8.3 8.3-8.3 8.3 3.7 8.3 8.3zm-3.6 0c0-2.6-2.1-4.7-4.7-4.7s-4.7 2.1-4.7 4.7 2.1 4.7 4.7 4.7 4.7-2.1 4.7-4.7z" fill="#00A94C"/>
                  <path d="M71.8 12.7h-3.6v15.5h3.6V12.7z" fill="#00A94C"/>
                  <path d="M90.2 12.7h-3.6v15.5h3.6V12.7z" fill="#00A94C"/>
                  <path d="M100 12.7h-3.6v15.5H100V12.7z" fill="#00A94C"/>
                </svg>
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-gray-500">
              Your payment is securely processed by Cashfree. We do not store your card details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;