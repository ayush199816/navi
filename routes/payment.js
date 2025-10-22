// routes/payment.js
const express = require('express');
const router = express.Router();
const { 
  createPaymentSession, 
  handleWebhook, 
  verifyPayment, 
  getPaymentStatus 
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Add this route
router.post('/webhook', handleWebhook);

// Create payment session
router.post('/create-session', createPaymentSession);

// Get payment status
router.get('/status/:orderId', getPaymentStatus);

router.get('/callback', async (req, res) => {
  try {
    console.log('Payment callback received:', req.query);
    const { order_id, payment_status, payment_message, orderId } = req.query;
    
    // Log the callback for debugging
    console.log('Payment callback details:', {
      order_id,
      payment_status,
      payment_message,
      orderId
    });

    if (payment_status === 'SUCCESS') {
      // If we have an orderId (which should be the booking ID)
      if (orderId) {
        try {
          // Update the booking status in the database
          await GuestSightseeingBooking.findByIdAndUpdate(
            orderId,
            {
              $set: {
                'paymentStatus': 'paid',
                'status': 'confirmed',
                'bookingStatus': 'confirmed',
                'payment.paymentId': order_id,
                'payment.status': 'PAID',
                'payment.paymentDate': new Date(),
                'payment.paymentDetails': req.query
              }
            }
          );
          console.log(`Updated booking ${orderId} payment status to PAID`);
        } catch (updateError) {
          console.error('Error updating booking status:', updateError);
          // Continue with redirect even if update fails
        }
      }
      
      // Always redirect to my-bookings on success
      return res.redirect('/my-bookings?payment=success');
    } else {
      // On payment failure
      console.log('Payment failed:', { order_id, payment_status, payment_message });
      return res.redirect('/my-bookings?payment=failed');
    }
  } catch (error) {
    console.error('Error in payment callback:', error);
    // On error, still redirect to my-bookings but with error flag
    return res.redirect('/my-bookings?payment=error');
  }
});
router.get('/verify/:orderId', (req, res, next) => {
  console.log('Payment verification endpoint hit with orderId:', req.params.orderId);
  return verifyPayment(req, res, next);
});

module.exports = router;