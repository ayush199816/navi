import React from 'react';
import { useDispatch } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { CurrencyRupeeIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-toastify';
import { closeModal } from '../../redux/slices/uiSlice';

const WithdrawFundsModal = ({ maxAmount, onSuccess }) => {
  const dispatch = useDispatch();

  const validationSchema = Yup.object({
    amount: Yup.number()
      .required('Amount is required')
      .min(1000, 'Minimum withdrawal amount is ₹1,000')
      .max(maxAmount, `Maximum withdrawal amount is ₹${maxAmount.toLocaleString()}`),
    accountName: Yup.string()
      .required('Account holder name is required'),
    accountNumber: Yup.string()
      .required('Account number is required')
      .matches(/^\d{9,18}$/, 'Invalid account number'),
    ifscCode: Yup.string()
      .required('IFSC code is required')
      .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'),
    bankName: Yup.string()
      .required('Bank name is required')
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // In a real app, this would be an API call
      // await axios.post('/api/wallets/withdraw-funds', {
      //   amount: values.amount,
      //   accountName: values.accountName,
      //   accountNumber: values.accountNumber,
      //   ifscCode: values.ifscCode,
      //   bankName: values.bankName
      // });
      
      // Mock successful response
      setTimeout(() => {
        toast.success('Withdrawal request submitted successfully!');
        setSubmitting(false);
        
        if (onSuccess) {
          onSuccess();
        }
        
        dispatch(closeModal());
      }, 1000);
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      toast.error(error.response?.data?.message || 'Failed to withdraw funds. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          <CurrencyRupeeIcon className="h-5 w-5 text-primary-500 mr-2" />
          Withdraw Funds
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Withdraw funds from your wallet to your bank account. Processing may take 1-3 business days.
        </p>
      </div>

      <Formik
        initialValues={{
          amount: Math.min(5000, maxAmount),
          accountName: '',
          accountNumber: '',
          ifscCode: '',
          bankName: ''
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
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
              <p className="mt-1 text-xs text-gray-500">
                Available balance: ₹{maxAmount.toLocaleString()}
              </p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 flex items-center mb-4">
                <BuildingLibraryIcon className="h-5 w-5 text-gray-400 mr-2" />
                Bank Account Details
              </h4>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
                    Account Holder Name
                  </label>
                  <Field
                    type="text"
                    name="accountName"
                    id="accountName"
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                  <ErrorMessage name="accountName" component="div" className="mt-1 text-sm text-red-600" />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                    Account Number
                  </label>
                  <Field
                    type="text"
                    name="accountNumber"
                    id="accountNumber"
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                  <ErrorMessage name="accountNumber" component="div" className="mt-1 text-sm text-red-600" />
                </div>

                <div>
                  <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700">
                    IFSC Code
                  </label>
                  <Field
                    type="text"
                    name="ifscCode"
                    id="ifscCode"
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                  <ErrorMessage name="ifscCode" component="div" className="mt-1 text-sm text-red-600" />
                </div>

                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                    Bank Name
                  </label>
                  <Field
                    type="text"
                    name="bankName"
                    id="bankName"
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                  <ErrorMessage name="bankName" component="div" className="mt-1 text-sm text-red-600" />
                </div>
              </div>
            </div>

            <div className="rounded-md bg-yellow-50 p-4 mt-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Important Note</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Withdrawal requests are processed within 1-3 business days. Funds will be transferred to the bank account provided above.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {isSubmitting ? 'Processing...' : 'Withdraw Funds'}
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

export default WithdrawFundsModal;
