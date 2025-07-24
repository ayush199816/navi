import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { register } from '../../redux/slices/authSlice';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(state => state.auth);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});

  // Validation schemas for each step
  const validationSchemaStep1 = Yup.object({
    name: Yup.string()
      .required('Name is required')
      .min(3, 'Name must be at least 3 characters'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required'),
    phone: Yup.string()
      .required('Phone number is required')
      .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
  });

  const validationSchemaStep2 = Yup.object({
    agencyName: Yup.string()
      .required('Agency name is required'),
    address: Yup.string()
      .required('Address is required'),
    city: Yup.string()
      .required('City is required'),
    state: Yup.string()
      .required('State is required'),
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

  // Initial values for each step
  const initialValuesStep1 = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  };

  const initialValuesStep2 = {
    agencyName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    panNumber: '',
    documents: {
      gstCertificate: null,
      udyamCertificate: null,
    },
  };

  // Handle form submission for step 1
  const handleSubmitStep1 = (values) => {
    setFormData({ ...formData, ...values });
    setStep(2);
    window.scrollTo(0, 0);
  };

  // Handle form submission for step 2
  const handleSubmitStep2 = async (values) => {
    try {
      // Combine form data from both steps
      const registrationData = {
        ...formData,
        ...values,
        role: 'agent' // Default role for registration
      };
      
      // Register the user
      await dispatch(register(registrationData)).unwrap();
      
      // Redirect to onboarding for agents
      navigate('/onboarding');
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  // Handle file change
  const handleFileChange = (setFieldValue, field, event) => {
    if (event.currentTarget.files && event.currentTarget.files[0]) {
      setFieldValue(field, event.currentTarget.files[0]);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        {step === 1 ? 'Create your account' : 'Agency Information'}
      </h2>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      {step === 1 ? (
        <Formik
          initialValues={initialValuesStep1}
          validationSchema={validationSchemaStep1}
          onSubmit={handleSubmitStep1}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <label htmlFor="name" className="form-label">Full Name</label>
                <Field
                  id="name"
                  name="name"
                  type="text"
                  className="form-input"
                />
                <ErrorMessage name="name" component="div" className="form-error" />
              </div>

              <div>
                <label htmlFor="email" className="form-label">Email Address</label>
                <Field
                  id="email"
                  name="email"
                  type="email"
                  className="form-input"
                />
                <ErrorMessage name="email" component="div" className="form-error" />
              </div>

              <div>
                <label htmlFor="phone" className="form-label">Phone Number</label>
                <Field
                  id="phone"
                  name="phone"
                  type="text"
                  className="form-input"
                />
                <ErrorMessage name="phone" component="div" className="form-error" />
              </div>

              <div>
                <label htmlFor="password" className="form-label">Password</label>
                <Field
                  id="password"
                  name="password"
                  type="password"
                  className="form-input"
                />
                <ErrorMessage name="password" component="div" className="form-error" />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <Field
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className="form-input"
                />
                <ErrorMessage name="confirmPassword" component="div" className="form-error" />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary flex justify-center py-2 px-4"
                >
                  Continue
                </button>
              </div>
            </Form>
          )}
        </Formik>
      ) : (
        <Formik
          initialValues={initialValuesStep2}
          validationSchema={validationSchemaStep2}
          onSubmit={handleSubmitStep2}
        >
          {({ isSubmitting, setFieldValue, errors, touched }) => (
            <Form className="space-y-4">
              <div>
                <label htmlFor="agencyName" className="form-label">Agency Name</label>
                <Field
                  id="agencyName"
                  name="agencyName"
                  type="text"
                  className="form-input"
                />
                <ErrorMessage name="agencyName" component="div" className="form-error" />
              </div>

              <div>
                <label htmlFor="address" className="form-label">Address</label>
                <Field
                  id="address"
                  name="address"
                  as="textarea"
                  rows="3"
                  className="form-input"
                />
                <ErrorMessage name="address" component="div" className="form-error" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="form-label">City</label>
                  <Field
                    id="city"
                    name="city"
                    type="text"
                    className="form-input"
                  />
                  <ErrorMessage name="city" component="div" className="form-error" />
                </div>

                <div>
                  <label htmlFor="state" className="form-label">State</label>
                  <Field
                    id="state"
                    name="state"
                    type="text"
                    className="form-input"
                  />
                  <ErrorMessage name="state" component="div" className="form-error" />
                </div>
              </div>

              <div>
                <label htmlFor="pincode" className="form-label">Pincode</label>
                <Field
                  id="pincode"
                  name="pincode"
                  type="text"
                  className="form-input"
                />
                <ErrorMessage name="pincode" component="div" className="form-error" />
              </div>

              <div>
                <label htmlFor="gstNumber" className="form-label">GST Number (Optional)</label>
                <Field
                  id="gstNumber"
                  name="gstNumber"
                  type="text"
                  className="form-input"
                />
                <ErrorMessage name="gstNumber" component="div" className="form-error" />
              </div>

              <div>
                <label htmlFor="panNumber" className="form-label">PAN Number</label>
                <Field
                  id="panNumber"
                  name="panNumber"
                  type="text"
                  className="form-input"
                />
                <ErrorMessage name="panNumber" component="div" className="form-error" />
              </div>

              <div>
                <label className="form-label">GST Certificate (Optional)</label>
                <input
                  type="file"
                  name="gstCertificate"
                  onChange={(event) => handleFileChange(setFieldValue, 'gstCertificate', event)}
                  className="mt-1 block w-full text-sm text-gray-700"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                {errors.gstCertificate && touched.gstCertificate && (
                  <div className="text-red-500 text-sm mt-1">{errors.gstCertificate}</div>
                )}
              </div>

              <div>
                <label className="form-label">Udyam Certificate (Optional)</label>
                <input
                  type="file"
                  name="udyamCertificate"
                  onChange={(event) => handleFileChange(setFieldValue, 'udyamCertificate', event)}
                  className="mt-1 block w-full text-sm text-gray-700"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                {errors.udyamCertificate && touched.udyamCertificate && (
                  <div className="text-red-500 text-sm mt-1">{errors.udyamCertificate}</div>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/2 btn-outline flex justify-center py-2 px-4"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="w-1/2 btn-primary flex justify-center py-2 px-4"
                >
                  {loading ? 'Registering...' : 'Register'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      )}
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
