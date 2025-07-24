import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { updateProfile } from '../../redux/slices/authSlice';

const Onboarding = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validation schema
  const validationSchema = Yup.object({
    agencyName: Yup.string().required('Agency name is required'),
    phone: Yup.string()
      .required('Phone number is required')
      .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
    address: Yup.string().required('Address is required'),
    city: Yup.string().required('City is required'),
    state: Yup.string().required('State is required'),
    country: Yup.string().required('Country is required'),
    pincode: Yup.string()
      .required('Pincode is required')
      .matches(/^[0-9]{6}$/, 'Pincode must be 6 digits'),
    gstNumber: Yup.string()
      .matches(/^[0-9A-Z]{15}$/, 'Invalid GST number format')
      .notRequired(),
    panNumber: Yup.string()
      .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number format')
      .required('PAN number is required'),
  });

  const initialValues = {
    agencyName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    gstNumber: '',
    panNumber: '',
    documents: {
      gstCertificate: null,
      udyamCertificate: null,
    },
  };

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      const formData = new FormData();
      
      // Append all form fields to formData
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && values[key] !== null) {
          formData.append(key, values[key]);
        }
      });
      
      // Mark onboarding as completed
      formData.append('onboardingCompleted', 'true');
      
      // Append files if they exist
      if (values.documents.gstCertificate) {
        formData.append('gstCertificate', values.documents.gstCertificate);
      }
      if (values.documents.udyamCertificate) {
        formData.append('udyamCertificate', values.documents.udyamCertificate);
      }
      
      await dispatch(updateProfile(formData)).unwrap();
      
      // Redirect to pending approval page
      navigate('/pending-approval');
    } catch (error) {
      setErrors({ submit: error });
      toast.error(error || 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Complete Your Profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please complete your agency details to proceed
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue, isSubmitting }) => (
              <Form className="space-y-6">
                <div>
                  <label htmlFor="agencyName" className="block text-sm font-medium text-gray-700">
                    Agency Name <span className="text-red-500">*</span>
                  </label>
                  <Field
                    id="agencyName"
                    name="agencyName"
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <ErrorMessage name="agencyName" component="div" className="mt-1 text-sm text-red-600" />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Field
                    id="phone"
                    name="phone"
                    type="tel"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <ErrorMessage name="phone" component="div" className="mt-1 text-sm text-red-600" />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <Field
                    id="address"
                    name="address"
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <ErrorMessage name="address" component="div" className="mt-1 text-sm text-red-600" />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City <span className="text-red-500">*</span>
                    </label>
                    <Field
                      id="city"
                      name="city"
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <ErrorMessage name="city" component="div" className="mt-1 text-sm text-red-600" />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                      State <span className="text-red-500">*</span>
                    </label>
                    <Field
                      id="state"
                      name="state"
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <ErrorMessage name="state" component="div" className="mt-1 text-sm text-red-600" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <Field
                      id="country"
                      name="country"
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <ErrorMessage name="country" component="div" className="mt-1 text-sm text-red-600" />
                  </div>

                  <div>
                    <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <Field
                      id="pincode"
                      name="pincode"
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <ErrorMessage name="pincode" component="div" className="mt-1 text-sm text-red-600" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700">
                      GST Number
                    </label>
                    <Field
                      id="gstNumber"
                      name="gstNumber"
                      type="text"
                      placeholder="22AAAAA0000A1Z5"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <ErrorMessage name="gstNumber" component="div" className="mt-1 text-sm text-red-600" />
                  </div>

                  <div>
                    <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700">
                      PAN Number <span className="text-red-500">*</span>
                    </label>
                    <Field
                      id="panNumber"
                      name="panNumber"
                      type="text"
                      placeholder="AAAAA0000A"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <ErrorMessage name="panNumber" component="div" className="mt-1 text-sm text-red-600" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Documents</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v12a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="gstCertificate"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload GST Certificate</span>
                          <input
                            id="gstCertificate"
                            name="gstCertificate"
                            type="file"
                            className="sr-only"
                            onChange={(event) => {
                              setFieldValue(
                                'documents.gstCertificate',
                                event.currentTarget.files[0]
                              );
                            }}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {values.documents.gstCertificate
                          ? values.documents.gstCertificate.name
                          : 'PDF, PNG, JPG up to 5MB'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading || isSubmitting}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading || isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
