import React from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { closeModal } from '../../redux/slices/uiSlice';
import { updateLead } from '../../redux/slices/leadSlice';
import { toast } from 'react-toastify';

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  phone: Yup.string().matches(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
  source: Yup.string().required('Source is required'),
  budget: Yup.number().positive('Budget must be positive').nullable(),
  travelDate: Yup.date().nullable(),
  destination: Yup.string(),
  notes: Yup.string().max(500, 'Notes cannot exceed 500 characters'),
  status: Yup.string().required('Status is required')
});

const EditLeadModal = ({ lead, onSuccess }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.leads);

  // Format date for form input (YYYY-MM-DD)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const initialValues = {
    name: lead.name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    source: lead.source || 'website',
    budget: lead.budget || '',
    travelDate: formatDate(lead.travelDate),
    destination: lead.destination || '',
    notes: lead.notes || '',
    status: lead.status || 'new'
  };

  const handleSubmit = (values) => {
    // Convert empty strings to null for optional fields
    const formattedValues = {
      ...values,
      budget: values.budget ? Number(values.budget) : null,
      travelDate: values.travelDate || null
    };

    dispatch(updateLead({ id: lead._id, leadData: formattedValues }))
      .unwrap()
      .then(() => {
        toast.success('Lead updated successfully');
        dispatch(closeModal());
        if (onSuccess) onSuccess();
      })
      .catch((error) => {
        toast.error(error || 'Failed to update lead');
      });
  };

  return (
    <>
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <Dialog.Title className="text-lg font-medium text-gray-900">
          Edit Lead
        </Dialog.Title>
        <button
          type="button"
          className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
          onClick={() => dispatch(closeModal())}
        >
          <span className="sr-only">Close</span>
          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched }) => (
            <Form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name *
                </label>
                <Field
                  type="text"
                  name="name"
                  id="name"
                  className={`form-input ${errors.name && touched.name ? 'border-red-500' : ''}`}
                />
                <ErrorMessage name="name" component="p" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <Field
                  type="email"
                  name="email"
                  id="email"
                  className={`form-input ${errors.email && touched.email ? 'border-red-500' : ''}`}
                />
                <ErrorMessage name="email" component="p" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <Field
                  type="text"
                  name="phone"
                  id="phone"
                  className={`form-input ${errors.phone && touched.phone ? 'border-red-500' : ''}`}
                />
                <ErrorMessage name="phone" component="p" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                  Source *
                </label>
                <Field
                  as="select"
                  name="source"
                  id="source"
                  className="form-input"
                >
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="social_media">Social Media</option>
                  <option value="email_campaign">Email Campaign</option>
                  <option value="phone_inquiry">Phone Inquiry</option>
                  <option value="partner">Partner</option>
                  <option value="other">Other</option>
                </Field>
                <ErrorMessage name="source" component="p" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status *
                </label>
                <Field
                  as="select"
                  name="status"
                  id="status"
                  className="form-input"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </Field>
                <ErrorMessage name="status" component="p" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                  Budget (₹)
                </label>
                <Field
                  type="number"
                  name="budget"
                  id="budget"
                  className={`form-input ${errors.budget && touched.budget ? 'border-red-500' : ''}`}
                />
                <ErrorMessage name="budget" component="p" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label htmlFor="travelDate" className="block text-sm font-medium text-gray-700">
                  Travel Date
                </label>
                <Field
                  type="date"
                  name="travelDate"
                  id="travelDate"
                  className={`form-input ${errors.travelDate && touched.travelDate ? 'border-red-500' : ''}`}
                />
                <ErrorMessage name="travelDate" component="p" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                  Destination
                </label>
                <Field
                  type="text"
                  name="destination"
                  id="destination"
                  className={`form-input ${errors.destination && touched.destination ? 'border-red-500' : ''}`}
                />
                <ErrorMessage name="destination" component="p" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <Field
                  as="textarea"
                  name="notes"
                  id="notes"
                  rows={3}
                  className={`form-input ${errors.notes && touched.notes ? 'border-red-500' : ''}`}
                />
                <ErrorMessage name="notes" component="p" className="mt-1 text-sm text-red-600" />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => dispatch(closeModal())}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting || loading.updateLead}
                >
                  {loading.updateLead ? 'Updating...' : 'Update Lead'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </>
  );
};

export default EditLeadModal;
