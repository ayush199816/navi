import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const PaymentCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('verifying');
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const handlePaymentCallback = async () => {
      try {
        const orderId = searchParams.get('order_id') || searchParams.get('orderId');
        const status = searchParams.get('payment_status') || searchParams.get('status');

        const debugData = {
          orderId,
          paymentStatus: status,
          allParams: Object.fromEntries(searchParams.entries())
        };

        console.log('Payment callback received:', debugData);
        setDebugInfo(debugData);

        if (status === 'SUCCESS' || status === 'success') {
          setPaymentStatus('success');
          console.log('Payment completed successfully');

          // Booking status should already be updated by the Checkout component
          // This callback is just for user confirmation
          toast.success('Payment successful! Your booking is confirmed.');
          setTimeout(() => navigate('/my-bookings'), 2000);
        } else {
          setPaymentStatus('failed');
          console.warn('Payment not successful:', status);
          toast.error('Payment was not completed successfully. Please try again.');
          setTimeout(() => navigate('/my-bookings?payment=failed'), 2000);
        }
      } catch (error) {
        setPaymentStatus('error');
        console.error('Error in payment callback:', error);
        toast.error('Error processing your payment. Please contact support.');
        setTimeout(() => navigate('/my-bookings?payment=error'), 2000);
      } finally {
        setIsLoading(false);
      }
    };

    handlePaymentCallback();
  }, [navigate, searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-gray-800 mb-2">Processing Your Payment</h2>
          <div className="mb-6">
            <p className="text-gray-600">Status: <span className="font-medium">{paymentStatus}</span></p>
            {paymentStatus === 'verifying' && (
              <p className="text-sm text-gray-500 mt-1">Please wait while we verify your payment...</p>
            )}
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-left">
            <h3 className="font-medium text-gray-700 mb-2">Debug Information:</h3>
            <div className="bg-gray-50 p-3 rounded overflow-x-auto text-xs">
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          </div>

          {paymentStatus === 'error' && (
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentCallback;