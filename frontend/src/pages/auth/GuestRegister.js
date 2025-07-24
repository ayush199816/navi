import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { register } from '../../redux/slices/authSlice';

const GuestRegister = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector(state => state.auth);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/guest-dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Name is required'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required'),
    phone: Yup.string()
      .required('Phone number is required')
      .matches(/^\+?[1-9]\d{1,14}$/, 'Phone number is invalid'),
    address: Yup.string()
      .required('Address is required')
  });

  // Initial values
  const initialValues = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: ''
  };

  // Handle form submission
  const handleSubmit = (values) => {
    dispatch(register({ 
      ...values, 
      role: 'user',
      user_type: 'guest' 
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join our community of travel enthusiasts
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
              <p className="font-medium">{error}</p>
            </div>
          )}

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched }) => (
              <Form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1">
                    <Field
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.name && touched.name ? 'border-red-500' : ''
                      }`}
                    />
                    <ErrorMessage 
                      name="name" 
                      component="div" 
                      className="mt-1 text-sm text-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.email && touched.email ? 'border-red-500' : ''
                      }`}
                    />
                    <ErrorMessage 
                      name="email" 
                      component="div" 
                      className="mt-1 text-sm text-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <Field
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.password && touched.password ? 'border-red-500' : ''
                      }`}
                    />
                    <ErrorMessage 
                      name="password" 
                      component="div" 
                      className="mt-1 text-sm text-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="mt-1">
                    <Field
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : ''
                      }`}
                    />
                    <ErrorMessage 
                      name="confirmPassword" 
                      component="div" 
                      className="mt-1 text-sm text-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1">
                    <Field
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.phone && touched.phone ? 'border-red-500' : ''
                      }`}
                    />
                    <ErrorMessage 
                      name="phone" 
                      component="div" 
                      className="mt-1 text-sm text-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <div className="mt-1">
                    <Field
                      id="address"
                      name="address"
                      type="text"
                      autoComplete="street-address"
                      className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.address && touched.address ? 'border-red-500' : ''
                      }`}
                    />
                    <ErrorMessage 
                      name="address" 
                      component="div" 
                      className="mt-1 text-sm text-red-600"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating account...
                      </>
                    ) : (
                      'Create account'
                    )}
                  </button>
                </div>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or</span>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                      Already have an account?{' '}
                      <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                        Sign in
                      </Link>
                    </p>
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                      Are you an agent?{' '}
                      <Link to="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
                        Register as agent
                      </Link>
                    </p>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default GuestRegister;
