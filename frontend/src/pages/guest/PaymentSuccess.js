import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    toast.success('Payment successful! Your booking has been confirmed.');
    // Redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      navigate('/guest-dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-green-500 text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">Thank you for your booking.</p>
        <p className="text-gray-500 text-sm">You'll be redirected to your dashboard shortly...</p>
      </div>
    </div>
  );
};

export default PaymentSuccess;