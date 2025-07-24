import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FiUser, FiCalendar, FiCreditCard, FiMapPin } from 'react-icons/fi';
import { addToCart, removeFromCart, updateQuantity, clearCart } from '../../redux/slices/cartSlice';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const cart = useSelector(state => state.cart);
  const user = useSelector(state => state.auth.user);
  const [sightseeings, setSightseeings] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Calculate pax counts based on the new requirements
  const calculatePaxCounts = () => {
    if (cart.items.length === 0) return { totalPax: 0, displayPax: 0, allSamePax: true };
    
    // Get all pax counts
    const paxCounts = cart.items.map(item => item.pax || 1);
    
    // Check if all pax counts are the same
    const allSamePax = paxCounts.every(count => count === paxCounts[0]);
    
    // Calculate total pax
    const totalPax = paxCounts.reduce((sum, count) => sum + count, 0);
    
    // Calculate display pax based on the rules
    let displayPax;
    if (allSamePax) {
      // If all pax counts are the same, use that count
      displayPax = paxCounts[0];
    } else {
      // If pax counts are different, sum them up
      displayPax = totalPax;
    }
    
    return { totalPax, displayPax, allSamePax };
  };
  
  const { totalPax, displayPax, allSamePax } = calculatePaxCounts();
  
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
        // Get unique sightseeing IDs from cart
        const sightseeingIds = [...new Set(cart.items.map(item => item.originalId || item.id))];
        
        // Fetch all sightseeings in parallel
        const sightseeingPromises = sightseeingIds.map(id => 
          axios.get(`/api/guest-sightseeing/${id}`).then(res => res.data.data)
        );
        
        const sightseeingsData = await Promise.all(sightseeingPromises);
        
        // Create a map of sightseeing ID to sightseeing data
        const sightseeingsMap = {};
        sightseeingsData.forEach(sightseeing => {
          sightseeingsMap[sightseeing._id] = sightseeing;
        });
        
        setSightseeings(sightseeingsMap);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sightseeings:', error);
        toast.error('Failed to load sightseeing details');
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
    bookingDate: Yup.date()
      .required('Booking date is required')
      .min(new Date(), 'Booking date cannot be in the past'),
    leadPax: Yup.object().shape({
      name: Yup.string().required('Name is required'),
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

  // Initial values
  const initialValues = {
    bookingDate: new Date(),
    leadPax: {
      name: user?.name || '',
      age: '',
      passportNumber: '',
      panNumber: '',
    },
    additionalPax: Array(Math.max(0, totalPax - 1)).fill({
      name: '',
      age: '',
      passportNumber: '',
    }),
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      // Prepare booking data for each item in cart
      const bookingPromises = cart.items.map(async (item) => {
        const bookingData = {
          sightseeingId: item.originalId || item.id,
          userId: user?._id,
          leadPax: values.leadPax,
          additionalPax: values.additionalPax.slice(0, Math.max(0, (item.pax || 1) - 1)),
          bookingDate: item.date || values.bookingDate,
          totalAmount: item.totalPrice || (item.price * (item.pax || 1)),
          paxCount: item.pax || 1,
          itemDetails: {
            name: item.name,
            price: item.price,
            date: item.date,
            pax: item.pax || 1
          }
        };
        
        return axios.post('/api/bookings/guest', bookingData);
      });
      
      // Create all bookings in parallel
      const responses = await Promise.all(bookingPromises);
      
      if (responses.length > 0) {
        // Clear cart after successful booking
        dispatch(clearCart());
        
        // Redirect to booking confirmation for the first booking
        // TODO: Consider creating a multi-booking confirmation page
        navigate(`/guest/booking/${responses[0].data.booking._id}`);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking. Please try again.');
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
                  const sightseeing = sightseeings[item.originalId || item.id] || {};
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
                                  <span className="text-gray-500 line-through mr-2">${(item.price * itemPax).toFixed(2)}</span>
                                  <span className="text-green-600 font-medium">${itemTotal.toFixed(2)}</span>
                                </div>
                              ) : (
                                <span>${itemTotal.toFixed(2)}</span>
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
                    <span>${totalPrice.toFixed(2)}</span>
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

                {/* Booking Date */}
                <div className="mb-6">
                  <label htmlFor="bookingDate" className="block text-sm font-medium text-gray-700">
                    Booking Date
                  </label>
                  <Field
                    type="date"
                    name="bookingDate"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <ErrorMessage name="bookingDate" component="div" className="text-red-500 text-sm" />
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
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Book Now
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
