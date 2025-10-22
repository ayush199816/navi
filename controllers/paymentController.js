const { Cashfree, CFEnvironment } = require('cashfree-pg');
const ErrorResponse = require('../utils/errorResponse');
const Payment = require('../models/Payment');
const GuestSightseeingBooking = require('../models/GuestSightseeingBooking');

// Initialize Cashfree client
const cashfree = new Cashfree(
  CFEnvironment.SANDBOX,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
);

console.log('Cashfree Config:', {
  env: process.env.NODE_ENV,
  appId: process.env.CASHFREE_APP_ID ? '***' + String(process.env.CASHFREE_APP_ID).slice(-4) : 'Not set',
  secretKey: process.env.CASHFREE_SECRET_KEY ? '***' + String(process.env.CASHFREE_SECRET_KEY).slice(-4) : 'Not set'
});

// @desc    Create payment session
// @route   POST /api/payments/create-session
// @access  Public
const createPaymentSession = async (req, res, next) => {
  try {
    const { bookingId, amount, customerDetails, returnUrl } = req.body;

    console.log('Creating payment session with data:', {
      bookingId,
      amount,
      customerDetails: {
        ...customerDetails,
        phone: customerDetails.phone ? '***' + customerDetails.phone.slice(-3) : 'not provided'
      }
    });

    if (!bookingId || !amount || !customerDetails) {
      return next(new ErrorResponse('Missing required fields', 400));
    }

    // Input validation
    if (isNaN(amount) || amount <= 0) {
      return next(new ErrorResponse('Invalid amount', 400));
    }

    // Generate order ID and customer ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const customerId = `cust_${bookingId.toString().slice(-8)}_${Math.random().toString(36).substr(2, 6)}`;

    // Create payment request
    const paymentRequest = {
      order_amount: Number(amount),
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: customerId,
        customer_phone: customerDetails.phone,
        customer_name: customerDetails.name,
        customer_email: customerDetails.email
      },
      order_meta: {
        return_url: returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback?orderId=${orderId}`,
        notify_url: `${process.env.BACKEND_URL || `http://${req.headers.host}`}/api/payments/webhook` 
      }
    };

    console.log('Sending request to Cashfree:', JSON.stringify(paymentRequest, null, 2));

    // Create payment session
    const response = await cashfree.PGCreateOrder({
      order_id: orderId,
      order_amount: paymentRequest.order_amount,
      order_currency: paymentRequest.order_currency,
      customer_details: paymentRequest.customer_details,
      order_meta: paymentRequest.order_meta
    });
    
    // Extract only the data we need to avoid circular references
    const responseData = response?.data ? {
      payment_session_id: response.data.payment_session_id,
      payment_url: response.data.payment_url
    } : null;
    
    console.log('Cashfree API Response:', {
      status: response.status,
      statusText: response.statusText,
      data: {
        paymentSessionId: responseData?.payment_session_id,
        paymentUrl: responseData?.payment_url
      }
    });

    if (!responseData || !responseData.payment_session_id) {
      throw new Error('Invalid response from payment gateway: Missing payment_session_id');
    }

    // Return the payment URL and status to the frontend
    // In paymentController.js
    return res.status(200).json({
      success: true,
      data: {
        paymentSessionId: responseData.payment_session_id,
        orderId: orderId,  // Make sure this is included
        paymentUrl: responseData.payment_url || `https://sandbox.cashfree.com/pg/checkout/pay/${responseData.payment_session_id}`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating payment session:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    return next(new ErrorResponse('Error creating payment session: ' + error.message, 500));
  }
};

// @desc    Verify payment status
// @route   GET /api/payments/verify/:orderId
// @access  Private
const verifyPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    console.log('Verifying payment for order:', orderId);

    if (!orderId) {
      console.error('No orderId provided in request');
      return next(new ErrorResponse('Order ID is required', 400));
    }

    try {
      console.log('Fetching payment details from Cashfree for order:', orderId);
      // Add timeout to prevent hanging
      const response = await Promise.race([
        cashfree.PGOrderFetchPayments(orderId),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Cashfree API timeout after 30 seconds')), 30000)
        )
      ]);
      console.log('Cashfree API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data ? 'Data received' : 'No data in response'
      });

      const payments = response.data || [];
      console.log(`Found ${payments.length} payment(s) for order ${orderId}`);

      // Log all payment statuses for debugging
      payments.forEach((payment, index) => {
        console.log(`Payment ${index + 1} status:`, payment.payment_status);
      });

      // Determine order status
      let orderStatus = 'PENDING';
      if (payments.some(tx => tx.payment_status === 'SUCCESS' || tx.payment_status === 'SUCCESSFUL')) {
        orderStatus = 'SUCCESS';
      } else if (payments.some(tx => tx.payment_status === 'FAILED')) {
        orderStatus = 'FAILED';
      }

      console.log(`Final status for order ${orderId}:`, orderStatus);

      // Update or create payment record
      const paymentData = {
        orderId,
        paymentStatus: orderStatus.toLowerCase(),
        paymentDetails: { payments },
        cashfreeResponse: { payments },
        verified: true,
        verificationDate: new Date()
      };

      // Try to find existing payment record by orderId
      let payment = await Payment.findOne({ orderId });

      if (payment) {
        // Update existing payment record
        payment = await Payment.findByIdAndUpdate(
          payment._id,
          paymentData,
          { new: true }
        );
        console.log(`Updated payment record for order ${orderId}`);

        // Sync to booking if payment is successful
        if (orderStatus === 'SUCCESS') {
          try {
            await GuestSightseeingBooking.findByIdAndUpdate(
              payment.bookingId,
              {
                $set: {
                  paymentStatus: 'paid',
                  status: 'confirmed',
                  'payment.status': 'PAID',
                  'payment.paymentDate': new Date(),
                  'payment.verified': true,
                  'payment.verificationDate': new Date(),
                  updatedAt: new Date()
                }
              }
            );
            console.log(`✅ Synced successful payment to booking ${payment.bookingId}`);
          } catch (bookingError) {
            console.error('❌ Error syncing payment to booking:', bookingError);
          }
        }
      } else {
        console.log(`No payment record found for order ${orderId} - this is normal for webhook verification`);
      }

      return res.status(200).json({
        success: true,
        data: {
          orderId,
          status: orderStatus,
          payments: payments.map(p => ({
            payment_status: p.payment_status,
            payment_message: p.payment_message,
            payment_time: p.payment_time,
            payment_amount: p.payment_amount
          }))
        }
      });
    } catch (apiError) {
      console.error('Cashfree API Error:', {
        message: apiError.message,
        response: apiError.response?.data,
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        headers: apiError.response?.headers,
        config: {
          url: apiError.config?.url,
          method: apiError.config?.method,
          headers: apiError.config?.headers ? 'Headers present' : 'No headers'
        }
      });
      throw apiError; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error('Error in verifyPayment:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });
    return next(new ErrorResponse(`Error verifying payment status: ${error.message}`, 500));
  }
};

// @desc    Handle Cashfree Webhook
// @route   POST /api/payments/webhook
// @access  Public
const handleWebhook = async (req, res) => {
  try {
    const webhookData = req.body;
    console.log('Received webhook:', JSON.stringify(webhookData, null, 2));

    // Verify the webhook signature (important for security)
    // const webhookSignature = req.headers['x-webhook-signature'];
    // if (!verifyWebhookSignature(webhookSignature, webhookData)) {
    //   return res.status(400).json({ success: false, message: 'Invalid signature' });
    // }

    const { data } = webhookData;
    if (!data || !data.order || !data.payment) {
      return res.status(400).json({ success: false, message: 'Invalid webhook data' });
    }

    const { order, payment } = data;
    const orderId = order.order_id;
    
    // Verify payment status with Cashfree API
    const paymentResponse = await Promise.race([
      cashfree.PGOrderFetchPayments(orderId),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Cashfree API timeout after 30 seconds')), 30000)
      )
    ]);
    const payments = paymentResponse.data || [];
    
    // Determine order status based on payment statuses
    let orderStatus = 'FAILED';
    if (payments.some(tx => tx.payment_status === 'SUCCESS' || tx.payment_status === 'SUCCESSFUL')) {
      orderStatus = 'SUCCESS';
    } else if (payments.some(tx => tx.payment_status === 'PENDING')) {
      orderStatus = 'PENDING';
    }

    console.log(`Processing webhook for order ${orderId} with status: ${orderStatus}`);

    // Update your database based on payment status
    if (orderStatus === 'SUCCESS') {
      // Update payment record if it exists
      const paymentRecord = await Payment.findOneAndUpdate(
        { orderId },
        {
          paymentStatus: 'paid',
          verified: true,
          verificationDate: new Date(),
          cashfreeResponse: paymentResponse.data
        },
        { new: true }
      );

      if (paymentRecord) {
        console.log(`Updated payment record for order ${orderId}`);
      }

      // Update Payment collection (already done above in paymentRecord)
      // const paymentUpdate = await Payment.findOneAndUpdate(...); // ← Removed duplicate

      if (paymentRecord) {
        console.log(`Updated Payment collection for order ${orderId}`);
      }

      // Find and update the booking
      const booking = await GuestSightseeingBooking.findOneAndUpdate(
        { 'payment.orderId': orderId },
        {
          $set: {
            'paymentStatus': 'paid',
            'status': 'confirmed',
            'bookingStatus': 'confirmed',
            'payment.status': 'PAID',
            'payment.paymentDate': new Date(),
            'payment.paymentDetails': payment,
            'payment.verified': true,
            'payment.verificationDate': new Date(),
            'updatedAt': new Date()
          }
        },
        { new: true }
      );

      if (!booking) {
        console.error(`Booking not found for order ID: ${orderId}`);
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      console.log(`Successfully updated booking for order ${orderId}`);
      return res.status(200).json({ success: true, message: 'Webhook processed successfully' });
    } else {
      console.log(`Payment for order ${orderId} is ${orderStatus}. No updates made.`);
      return res.status(200).json({ success: true, message: `Payment status: ${orderStatus}` });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error.message
    });
  }
};

const updatePaymentSession = async (req, res) => {
  try {
    const { paymentSessionId, returnUrl } = req.body;

    const response = await cashfree.PGOrder.updatePaymentSession(paymentSessionId, {
      order_meta: {
        return_url: returnUrl,
        notify_url: `${process.env.BACKEND_URL}/api/payments/webhook`
      }
    });

    res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error updating payment session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment session',
      error: error.message
    });
  }
};

// @desc    Get payment status by order ID
// @route   GET /api/payments/status/:orderId
// @access  Public
const getPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return next(new ErrorResponse('Order ID is required', 400));
    }

    // Get order details from Cashfree
    const orderDetails = await Promise.race([
      cashfree.orders.getOrderDetails(orderId),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Cashfree API timeout after 30 seconds')), 30000)
      )
    ]);
    
    if (!orderDetails || !orderDetails.data) {
      return next(new ErrorResponse('Order not found', 404));
    }

    const status = orderDetails.data.order_status;
    
    res.status(200).json({
      success: true,
      status: status.toUpperCase(),
      orderId,
      amount: orderDetails.data.order_amount,
      currency: orderDetails.data.order_currency,
      paymentTime: orderDetails.data.payment_time
    });
  } catch (error) {
    console.error('Error getting payment status:', error);
    next(new ErrorResponse('Error getting payment status', 500));
  }
};

module.exports = {
  createPaymentSession,
  handleWebhook,
  verifyPayment,
  updatePaymentSession,
  getPaymentStatus
};