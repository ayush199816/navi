import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { removeFromCart, clearCart } from '../../redux/slices/cartSlice';
import { useCurrency } from '../../contexts/CurrencyContext';
import { convertUSDToINR } from '../../utils/currencyConverter';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import { load } from "@cashfreepayments/cashfree-js";

const Checkout = () => {

  const [cashfree, setCashfree] = useState(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  
  // Initialize Cashfree
  useEffect(() => {
    const initializeCashfree = async () => {
      try {
        const cashfreeInstance = await load({
          mode: "production" // or "production" for live
        });
        setCashfree(cashfreeInstance);
      } catch (error) {
        toast.error('Failed to initialize payment gateway');
      }
    };
    
    initializeCashfree();
  }, []);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  useParams(); // We're not using the id parameter, but keeping the hook call
  const cart = useSelector(state => state.cart);
  const user = useSelector(state => state.auth.user);
  const [loading, setLoading] = useState(true);
  const currentOrderIdRef = useRef(null);
  const currentBookingIdRef = useRef(null);
  const { formatPrice } = useCurrency();
  
  // Calculate pax counts based on the new requirements
  const calculatePaxCounts = () => {
    if (cart.items.length === 0) return { totalPax: 0, displayPax: 0, allSamePax: true };
    
    // Get all pax counts
    const paxCounts = cart.items.map(item => item.pax || 1);
    
    // Check if all pax counts are the same
    const allSamePax = paxCounts.every(count => count === paxCounts[0]);
    
    // Calculate total pax (sum of all pax counts)
    const totalPax = paxCounts.reduce((sum, count) => sum + count, 0);
    
    // For display in the form, we want to show the max pax count if all are the same,
    // otherwise show the sum of all pax counts
    let displayPax;
    if (allSamePax && cart.items.length > 0) {
      // If all pax counts are the same, use that count (not the sum)
      displayPax = paxCounts[0];
    } else {
      // If pax counts are different, sum them up
      displayPax = totalPax;
    }
    
    return { 
      totalPax,    // Total pax (sum of all pax counts)
      displayPax,  // Either the common pax count or the sum if different
      allSamePax   // Boolean indicating if all pax counts are the same
    };
  };
  
  const { displayPax, totalPax } = calculatePaxCounts();
  
  // Alias for paxCount to match the template
  const paxCount = displayPax;
  
  // Calculate total price from all items in cart
  const totalPrice = cart.items.reduce((total, item) => {
    if (item.type === 'sightseeing') {
      const hasOffer = item.hasOffer || (item.offerPrice !== undefined && item.offerPrice !== null);
      const price = hasOffer ? item.offerPrice : item.price;
      const quantity = item.pax || 1;
      return total + (price * quantity);
    }
    return total + (item.price * (item.quantity || 1));
  }, 0);

  useEffect(() => {
    // Fetch sightseeing details for all items in cart
    const fetchSightseeings = async () => {
      try {
        // Get unique sightseeing IDs from cart, filtering out any undefined or invalid IDs
        const validItems = cart.items.filter(item => {
          const id = item.originalId || item.id;
          return id && id !== 'undefined' && id !== 'null';
        });

        if (validItems.length === 0) {
          toast.error('No valid items found in your cart');
          navigate('/guest-dashboard');
          return;
        }

        const sightseeingIds = [...new Set(validItems.map(item => item.originalId || item.id))];
        
        // Fetch all sightseeings in parallel with error handling for each request
        const sightseeingPromises = sightseeingIds.map(id => 
          axios.get(`/api/guest-sightseeing/${id}`)
            .then(res => ({
              success: true,
              data: res.data.data
            }))
            .catch(() => ({
              success: false,
              id,
              error: 'Failed to fetch sightseeing details'
            }))
        );
        
        const results = await Promise.all(sightseeingPromises);
        
        // Process successful and failed requests
        const failedItems = results.filter(result => !result.success).map(result => result.id);
        setLoading(false);
        
        if (failedItems.length > 0) {
          toast.error(`Failed to load ${failedItems.length} item(s) from your cart`);
        }
        
        if (results.every(result => !result.success)) {
          toast.error('Could not load any items from your cart');
          navigate('/guest-dashboard');
        }
      } catch (error) {
        toast.error('An error occurred while loading your cart');
        navigate('/guest-dashboard');
      }
    };
    
    if (cart.items.length > 0) {
      fetchSightseeings();
    } else {
      navigate('/tours');
    }
  }, [cart.items, navigate]);

  // Validation schema
  const validationSchema = Yup.object().shape({
    items: Yup.array().of(
      Yup.object().shape({
        id: Yup.string().required(),
        bookingDate: Yup.date()
          .required('Booking date is required')
          .min(new Date(), 'Booking date cannot be in the past')
      })
    ),
    leadPax: Yup.object().shape({
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      phone: Yup.string()
        .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits')
        .required('Phone number is required'),
      age: Yup.number().required('Age is required').min(1),
      passportNumber: Yup.string().required('Passport number is required'),
      panNumber: Yup.string().required('PAN number is required'),
    }),
    additionalPax: Yup.array().of(
      Yup.object().shape({
        name: Yup.string().required('Name is required'),
        age: Yup.number().required('Age is required').min(1),
        passportNumber: Yup.string().required('Passport number is required'),
      })
    ),
  });

  // Calculate the number of additional passengers needed
  // For multiple activities, we need to consider the pax count for each activity
  const calculateAdditionalPaxCount = () => {
    if (cart.items.length === 0) return 0;
    
    // If only one activity, use its pax count
    if (cart.items.length === 1) {
      return Math.max(0, (cart.items[0].pax || 1) - 1);
    }
    
    // For multiple activities, use the displayPax which is already calculated
    // based on whether pax counts are the same or different
    return Math.max(0, displayPax - 1);
  };
  
  // Initial values with booking dates for each item
  const initialValues = {
    items: Array.isArray(cart?.items) 
      ? cart.items.map(item => ({
          id: item.id || '',
          bookingDate: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        }))
      : [],
    leadPax: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      age: '',
      passportNumber: '',
      panNumber: '',
    },
    additionalPax: Array(calculateAdditionalPaxCount()).fill().map(() => ({
      name: '',
      age: '',
      passportNumber: '',
    })),
  };
  // Create payment session
const createPaymentSession = async (bookingId, amount, customerDetails) => {
  setIsPaymentProcessing(true);
  try {
    // Convert USD amount to INR for payment gateway
    const totalAmountINR = await convertUSDToINR(amount);

    const response = await axios.post('/api/payments/create-session', {
      bookingId,
      amount: totalAmountINR, // ← Send INR amount to payment gateway
      customerDetails
    });

    const { paymentSessionId, orderId } = response.data.data || {};
    
    if (!paymentSessionId) {
      throw new Error('Missing payment session ID in response');
    }

      // Create payment record in the tracking system
      try {
        await axios.post('/api/payment-tracking', {
          bookingId,
          orderId,
          amount: totalAmountINR, // ← Use INR amount for tracking
          currency: 'INR',
          paymentMethod: 'cashfree',
          paymentDetails: {
            paymentSessionId,
            customerDetails,
            originalUSDAmount: amount // ← Track original USD amount
          }
        });
      } catch (paymentRecordError) {
        // Don't fail the payment flow if payment record creation fails
      }

    // Store both orderId and bookingId for later use in verification
    if (orderId) {
      currentOrderIdRef.current = orderId;
    }
    if (bookingId) {
      currentBookingIdRef.current = bookingId;
    }

    if (!cashfree) {
      throw new Error('Payment gateway not initialized');
    }

    // Open Cashfree checkout
    const checkoutOptions = {
      paymentSessionId,
      redirectTarget: "_modal",
      onSuccess: async (data) => {
        try {
          // Use the stored bookingId for verification
          const bookingId = currentBookingIdRef.current;
          if (!bookingId) {
            throw new Error('No booking ID available for payment verification');
          }

          // Check payment status from backend
          const statusResponse = await axios.get(`/api/payments/verify/${currentOrderIdRef.current}`);
          const { status } = statusResponse.data;

          if (status === 'PAID' || status === 'SUCCESS') {
            // Payment is actually successful, update booking
            try {
              await axios.put(`/api/guest-sightseeing-bookings/${bookingId}/payment-success`, {
                paymentId: data.paymentId || data.referenceId,
                paymentDetails: data,
                status: 'paid'
              });

              // Clear cart and show success message
              dispatch(clearCart());
              toast.success('Payment successful! Your booking is confirmed.');

              // Redirect to my-bookings page
              navigate('/my-bookings');
            } catch (updateError) {
              if (updateError.response?.status === 403) {
                toast.error('Payment successful but booking update failed due to permission issue. Please contact support.');
              } else {
                toast.error('Payment successful but booking update failed. Please contact support.');
              }
              // Still clear cart and redirect even if booking update fails
              dispatch(clearCart());
              navigate('/my-bookings');
            }
          } else {
            // Payment status is not successful
            toast.error(`Payment completed but status is: ${status}. Please contact support.`);
            setIsPaymentProcessing(false);
          }
        } catch (error) {
          toast.error('Payment was processed, but there was an error verifying the status. Please contact support.');
          setIsPaymentProcessing(false);
        }
      },
      onFailure: () => {
        toast.error('Payment failed. Please try again.');
        setIsPaymentProcessing(false);
      },
      onClose: () => {
        setIsPaymentProcessing(false);
      }
    };

    cashfree.checkout(checkoutOptions).then((result) => {
      if (result.error) {
        toast.error('Payment initialization failed');
        setIsPaymentProcessing(false);
      }

      if (result.paymentDetails) {
        // Use the stored bookingId for verification (since payment details doesn't contain it)
        const bookingId = currentBookingIdRef.current;
        const orderId = currentOrderIdRef.current;

        if (bookingId && orderId) {
          // Immediately verify payment status using the verification API
          axios.get(`/api/payments/verify/${orderId}`)
            .then(async (verifyResponse) => {
              if (verifyResponse.data.success && verifyResponse.data.data.status === 'SUCCESS') {
                try {
                  // Update booking status to paid
                  await axios.put(`/api/guest-sightseeing-bookings/${bookingId}/payment-success`, {
                    paymentId: verifyResponse.data.data.payments?.[0]?.paymentId || orderId,
                    paymentDetails: verifyResponse.data,
                    status: 'paid'
                  });

                  toast.success('Payment successful! Your booking is confirmed.');
                } catch (updateError) {
                  if (updateError.response?.status === 403) {
                    toast.error('Payment successful but booking update failed due to permission issue. Please contact support.');
                  } else {
                    toast.error('Payment successful but booking update failed. Please contact support.');
                  }
                  // Still redirect even if booking update fails
                }

                // Redirect to callback URL after updating booking
                window.location.href = `/payment/callback?orderId=${orderId}&status=success`;
              } else {
                toast.error('Payment verification failed. Please contact support.');
              }
            })
            .catch(() => {
              toast.error('Payment completed but verification failed. Please contact support.');
            });
        }
      }

      // Reset processing state since modal is closed
      setIsPaymentProcessing(false);
    });

  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to process payment. Please try again.');
    setIsPaymentProcessing(false);
  }
};
  // Handle form submission
  const handleSubmit = async (values) => {
  try {
    // For multiple activities, distribute the additional pax appropriately
    let additionalPaxIndex = 0;
    
    // Prepare booking data for each item in cart
    const bookingPromises = cart.items.map(async (item, index) => {
      const itemPax = item.pax || 1;
      const itemAdditionalPaxCount = Math.max(0, itemPax - 1);
      
      // Get the slice of additionalPax for this item
      const itemAdditionalPax = values.additionalPax.slice(
        additionalPaxIndex, 
        additionalPaxIndex + itemAdditionalPaxCount
      );
      
      // Move the index for the next item
      additionalPaxIndex += itemAdditionalPaxCount;
      
      // Get the booking date for this specific item
      const itemBookingDate = values.items.find(i => i.id === item.id)?.bookingDate || new Date();
      
      // Calculate the total amount for this item
      const hasOffer = item.hasOffer || (item.offerPrice !== undefined && item.offerPrice !== null);
      const itemPrice = hasOffer ? item.offerPrice : item.price;
      const totalAmount = itemPrice * itemPax;
      
      // Ensure all required fields are present
      const leadGuest = {
        name: values.leadPax.name || 'Not Provided',
        email: values.leadPax.email || `${Date.now()}@temp.com`,
        phone: values.leadPax.phone || '0000000000',
        passportNumber: values.leadPax.passportNumber || 'NOT_PROVIDED',
        panNumber: values.leadPax.panNumber || 'NOT_PROVIDED'
      };

      const bookingData = {
        sightseeingId: item.originalId || item.id,
        sightseeingName: item.name,
        dateOfTravel: new Date(itemBookingDate).toISOString().split('T')[0],
        numberOfPax: itemPax,
        leadGuest,
        additionalGuests: itemAdditionalPax.map(pax => ({
          name: pax.name || 'Additional Guest',
          passportNumber: pax.passportNumber || 'NOT_PROVIDED'
        })),
        notes: values.notes || '',
        totalAmount: totalAmount,
        status: 'pending',
        paymentStatus: 'pending'
      };
      
      return axios.post('/api/guest-sightseeing-bookings', bookingData);
    });
    
    // Create all bookings sequentially to ensure they're committed before payment
    const responses = [];
    for (const bookingPromise of bookingPromises) {
      const response = await bookingPromise;
      responses.push(response);
    }
    
    if (responses && responses.length > 0 && responses[0]?.data?.data?._id) {
      const firstBooking = responses[0].data.data;
      const totalAmount = cart.items.reduce((total, item) => {
        const hasOffer = item.hasOffer || (item.offerPrice !== undefined && item.offerPrice !== null);
        const price = hasOffer ? item.offerPrice : item.price;
        return total + (price * (item.pax || 1));
      }, 0);

      // Create payment session with the first booking ID
      await createPaymentSession(
        firstBooking._id,
        totalAmount, // ← Pass USD amount - conversion happens inside function
        {
          name: values.leadPax.name,
          email: values.leadPax.email,
          phone: values.leadPax.phone
        }
      );
      
      // Don't clear cart or navigate here - the payment flow will handle that
    } else {
      // If we can't create a payment session, still save the booking
      dispatch(clearCart());
      toast.success('Booking created successfully!');
      navigate('/guest-dashboard');
    }
  } catch (error) {
    if (error.response && error.response.status >= 200 && error.response.status < 300) {
      dispatch(clearCart());
      toast.success('Booking created successfully!');
      navigate('/guest-dashboard');
    } else {
      toast.error(error.response?.data?.message || 'Failed to process booking. Please try again.');
    }
  }
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Booking Details</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Review your booking details before proceeding.</p>
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="bg-white shadow sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Your Cart ({cart.items.length} items)</h3>
            
            {cart.items.length === 0 ? (
              <p className="text-gray-500">Your cart is empty</p>
            ) : (
              <div className="space-y-6">
                {cart.items.map((item, index) => {
                  const itemDate = item.date ? new Date(item.date).toLocaleDateString() : 'Date not specified';
                  const itemPax = item.pax || 1;
                  const hasOffer = item.hasOffer || (item.offerPrice !== undefined && item.offerPrice !== null);
                  const displayPrice = hasOffer ? item.offerPrice : item.price;
                  const itemTotal = displayPrice * itemPax;
                  
                  return (
                    <div key={item.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            {hasOffer && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Special Offer
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            <p>Date: {itemDate}</p>
                            <p>Pax: {itemPax}</p>
                            <div className="mt-1">
                              {hasOffer ? (
                                <div>
                                  <span className="text-gray-500 line-through mr-2">{formatPrice(item.price * itemPax)}</span>
                                  <span className="text-green-600 font-medium">{formatPrice(itemTotal)}</span>
                                </div>
                              ) : (
                                <span>{formatPrice(itemTotal)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => dispatch(removeFromCart(item.id))}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {/* Order Summary */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between text-lg font-medium text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {totalPax} {totalPax === 1 ? 'person' : 'people'} in total
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Booking Form */}
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue }) => (
            <Form className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                {/* Lead Passenger Details */}
                <div className="mb-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Lead Passenger Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="leadPax.name" className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <Field
                        type="text"
                        name="leadPax.name"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <ErrorMessage name="leadPax.name" component="div" className="text-red-500 text-sm" />
                    </div>
                    <div>
                      <label htmlFor="leadPax.email" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <Field
                        type="email"
                        name="leadPax.email"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <ErrorMessage name="leadPax.email" component="div" className="text-red-500 text-sm" />
                    </div>
                    <div>
                      <label htmlFor="leadPax.phone" className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <Field
                        type="tel"
                        name="leadPax.phone"
                        placeholder="10-digit number"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <ErrorMessage name="leadPax.phone" component="div" className="text-red-500 text-sm" />
                    </div>
                    <div>
                      <label htmlFor="leadPax.age" className="block text-sm font-medium text-gray-700">
                        Age
                      </label>
                      <Field
                        type="number"
                        name="leadPax.age"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <ErrorMessage name="leadPax.age" component="div" className="text-red-500 text-sm" />
                    </div>
                    <div>
                      <label htmlFor="leadPax.passportNumber" className="block text-sm font-medium text-gray-700">
                        Passport Number
                      </label>
                      <Field
                        type="text"
                        name="leadPax.passportNumber"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <ErrorMessage name="leadPax.passportNumber" component="div" className="text-red-500 text-sm" />
                    </div>
                    <div>
                      <label htmlFor="leadPax.panNumber" className="block text-sm font-medium text-gray-700">
                        PAN Number
                      </label>
                      <Field
                        type="text"
                        name="leadPax.panNumber"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <ErrorMessage name="leadPax.panNumber" component="div" className="text-red-500 text-sm" />
                    </div>
                  </div>
                </div>

                {/* Additional Passenger Details */}
                {paxCount > 1 && (
                  <div className="mb-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Additional Passenger Details</h3>
                    {values.additionalPax.map((_, index) => (
                      <div key={index} className="mb-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Passenger {index + 2}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor={`additionalPax.${index}.name`} className="block text-sm font-medium text-gray-700">
                              Name
                            </label>
                            <Field
                              type="text"
                              name={`additionalPax.${index}.name`}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                            <ErrorMessage name={`additionalPax.${index}.name`} component="div" className="text-red-500 text-sm" />
                          </div>
                          <div>
                            <label htmlFor={`additionalPax.${index}.age`} className="block text-sm font-medium text-gray-700">
                              Age
                            </label>
                            <Field
                              type="number"
                              name={`additionalPax.${index}.age`}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                            <ErrorMessage name={`additionalPax.${index}.age`} component="div" className="text-red-500 text-sm" />
                          </div>
                          <div>
                            <label htmlFor={`additionalPax.${index}.passportNumber`} className="block text-sm font-medium text-gray-700">
                              Passport Number
                            </label>
                            <Field
                              type="text"
                              name={`additionalPax.${index}.passportNumber`}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                            <ErrorMessage name={`additionalPax.${index}.passportNumber`} component="div" className="text-red-500 text-sm" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Booking Dates */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Dates</h3>
                  <div className="space-y-4">
                    {Array.isArray(values.items) ? values.items.map((item, index) => {
                      const cartItem = cart?.items?.find(cartItem => cartItem.id === item.id);
                      if (!cartItem) return null;
                      
                      return (
                        <div key={item.id || index} className="p-4 border rounded-lg bg-gray-50 mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            {cartItem.name}
                          </h4>
                          <div className="flex items-center">
                            <label 
                              htmlFor={`items.${index}.bookingDate`} 
                              className="block text-sm font-medium text-gray-700 mr-2 whitespace-nowrap"
                            >
                              Booking Date:
                            </label>
                            <Field
                              type="date"
                              id={`items.${index}.bookingDate`}
                              name={`items.${index}.bookingDate`}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <ErrorMessage 
                            name={`items.${index}.bookingDate`} 
                            component="div" 
                            className="text-red-500 text-sm mt-1" 
                          />
                        </div>
                      );
                    }) : null}
                  </div>
                </div>

                {/* Total Amount */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Total Amount
                  </label>
                  <div className="mt-1 text-xl font-bold text-blue-600">
                    ${totalPrice.toFixed(2)}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-6">
                  <button
  type="submit"
  disabled={!cashfree || isPaymentProcessing}
  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
>
  {isPaymentProcessing ? 'Processing Payment...' : 'Proceed to Payment'}
</button>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Checkout;