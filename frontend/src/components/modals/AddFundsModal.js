import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { CurrencyRupeeIcon, CreditCardIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-toastify';
import { closeModal } from '../../redux/slices/uiSlice';

const AddFundsModal = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const [paymentMethod, setPaymentMethod] = useState('upi');

  const validationSchema = Yup.object({
    amount: Yup.number()
      .required('Amount is required')
      .min(1000, 'Minimum amount is ₹1,000')
      .max(100000, 'Maximum amount is ₹100,000'),
    paymentReference: Yup.string()
      .when('paymentMethod', {
        is: (val) => val === 'bank_transfer',
        then: Yup.string().required('Reference number is required')
      })
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // In a real app, this would be an API call
      // await axios.post('/api/wallets/add-funds', {
      //   amount: values.amount,
      //   paymentMethod: paymentMethod,
      //   paymentReference: values.paymentReference || undefined
      // });
      
      // Mock successful response
      setTimeout(() => {
        toast.success('Funds added successfully!');
        setSubmitting(false);
        
        if (onSuccess) {
          onSuccess();
        }
        
        dispatch(closeModal());
      }, 1000);
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error(error.response?.data?.message || 'Failed to add funds. Please try again.');
      setSubmitting(false);
    }
  };

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI',
      icon: CreditCardIcon,
      description: 'Instant transfer via UPI'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: BuildingLibraryIcon,
      description: 'NEFT/RTGS/IMPS transfer'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          <CurrencyRupeeIcon className="h-5 w-5 text-primary-500 mr-2" />
          Add Funds to Wallet
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Add funds to your wallet to make bookings and manage your travel business.
        </p>
      </div>

      <Formik
        initialValues={{
          amount: 5000,
          paymentReference: ''
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, values }) => (
          <Form className="space-y-6">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount (₹)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <Field
                  type="number"
                  name="amount"
                  id="amount"
                  className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="0.00"
                />
              </div>
              <ErrorMessage name="amount" component="div" className="mt-1 text-sm text-red-600" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <div className="mt-2 space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`relative rounded-lg border ${
                      paymentMethod === method.id
                        ? 'bg-primary-50 border-primary-200'
                        : 'border-gray-300'
                    } p-4 flex cursor-pointer focus:outline-none`}
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    <div className="flex items-center h-5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                      />
                    </div>
                    <div className="ml-3 flex flex-col">
                      <span className="block text-sm font-medium text-gray-900 flex items-center">
                        <method.icon className="h-5 w-5 text-gray-400 mr-2" />
                        {method.name}
                      </span>
                      <span className="block text-sm text-gray-500">{method.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {paymentMethod === 'bank_transfer' && (
              <div>
                <label htmlFor="paymentReference" className="block text-sm font-medium text-gray-700">
                  Payment Reference Number
                </label>
                <Field
                  type="text"
                  name="paymentReference"
                  id="paymentReference"
                  className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="UTR/Reference Number"
                />
                <ErrorMessage name="paymentReference" component="div" className="mt-1 text-sm text-red-600" />
              </div>
            )}

            {paymentMethod === 'upi' && (
              <div className="rounded-md bg-blue-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CreditCardIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">UPI Payment Instructions</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Scan the QR code or use the UPI ID below to make the payment:
                      </p>
                      <p className="mt-2 font-medium">UPI ID: navigatio@ybl</p>
                      <p className="mt-1 text-xs">
                        After payment, you will receive a confirmation and funds will be added to your wallet.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {isSubmitting ? 'Processing...' : 'Add Funds'}
              </button>
              <button
                type="button"
                onClick={() => dispatch(closeModal())}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default AddFundsModal;
