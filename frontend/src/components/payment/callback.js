// pages/PaymentCallback.js
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../utils/axiosConfig';

export default function PaymentCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paymentStatus = searchParams.get('payment_status');
  const bookingId = searchParams.get('bookingId');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (!orderId && !bookingId) {
          throw new Error('Missing order or booking ID');
        }

        // If we have a booking ID, verify payment status
        if (bookingId) {
          const response = await axios.get(`/api/guest-sightseeing-bookings/${bookingId}/verify-payment`);
          
          if (response.data.success) {
            toast.success('Payment verified successfully!');
            navigate('/my-bookings', { 
              state: { 
                paymentSuccess: true,
                booking: response.data.data 
              } 
            });
            return;
          }
        }

        // Fallback to orderId if bookingId verification fails or not available
        if (orderId) {
          const response = await axios.get(`/api/payments/verify/${orderId}`);
          
          if (response.data.success) {
            toast.success('Payment verified successfully!');
            navigate('/my-bookings', { 
              state: { 
                paymentSuccess: true,
                order: response.data.data 
              } 
            });
            return;
          }
        }

        throw new Error('Could not verify payment status');
        
      } catch (error) {
        console.error('Payment verification error:', error);
        toast.error(error.response?.data?.message || 'Error verifying payment status');
        navigate('/my-bookings', { state: { paymentSuccess: false } });
      }
    };

    verifyPayment();
  }, [orderId, bookingId, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-6 max-w-md w-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-medium text-gray-800">Verifying your payment...</h2>
        <p className="text-gray-600 mt-2">Please wait while we confirm your payment status</p>
      </div>
    </div>
  );
}