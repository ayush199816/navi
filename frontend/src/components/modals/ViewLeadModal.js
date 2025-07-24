import React from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useDispatch } from 'react-redux';
import { closeModal } from '../../redux/slices/uiSlice';
import SalesLeadQuoteView from '../../pages/sales/leads/components/SalesLeadQuoteView';

const ViewLeadModal = ({ lead, onSuccess }) => {
  const dispatch = useDispatch();

  const handleClose = () => {
    if (onSuccess) onSuccess();
    dispatch(closeModal());
  };

  if (!lead) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true" 
          onClick={handleClose}
        />
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
        
        <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                Lead & Quote Details
              </Dialog.Title>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={handleClose}
              >
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            
            <div className="mt-4">
              <SalesLeadQuoteView 
                lead={lead} 
                onClose={handleClose}
                onUpdate={() => {
                  if (onSuccess) onSuccess();
                }}
              />
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </div>
  );
};

export default ViewLeadModal;
