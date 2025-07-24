import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal } from '../../redux/slices/uiSlice';

// Modal Components
import ViewQuoteModal from './ViewQuoteModal';
import ViewBookingModal from './ViewBookingModal';
import CancelBookingModal from './CancelBookingModal';
import AddFundsModal from './AddFundsModal';
import WithdrawFundsModal from './WithdrawFundsModal';
import CreateLeadModal from './CreateLeadModal';
import EditLeadModal from './EditLeadModal';
import ViewLeadModal from './ViewLeadModal';

const Modal = () => {
  const dispatch = useDispatch();
  const { modalOpen, modalType, modalData } = useSelector(state => state.ui);

  const handleClose = () => {
    dispatch(closeModal());
  };

  const renderModalContent = () => {
    switch (modalType) {
      case 'VIEW_QUOTE':
        return <ViewQuoteModal quote={modalData.quote} />;
      case 'VIEW_BOOKING':
        return <ViewBookingModal booking={modalData.booking} />;
      case 'CANCEL_BOOKING':
        return <CancelBookingModal bookingId={modalData.bookingId} onConfirm={modalData.onConfirm} onClose={handleClose} />;
      case 'ADD_FUNDS':
        return <AddFundsModal {...modalData} />;
      case 'WITHDRAW_FUNDS':
        return <WithdrawFundsModal {...modalData} />;
      case 'CREATE_LEAD':
        return <CreateLeadModal {...modalData} />;
      case 'EDIT_LEAD':
        return <EditLeadModal {...modalData} />;
      case 'VIEW_LEAD':
        return <ViewLeadModal {...modalData} />;
      case 'CONFIRM_DELETE':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">{modalData?.title || 'Confirm'}</h3>
            <p className="mt-2 text-sm text-gray-500">{modalData?.message || 'Are you sure you want to proceed?'}</p>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                className="btn-outline"
                onClick={() => dispatch(closeModal())}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  if (modalData?.onConfirm) modalData.onConfirm();
                  dispatch(closeModal());
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        );
      default:
        return <div>Modal content not found</div>;
    }
  };

  return (
    <Transition.Root show={modalOpen} as={Fragment}>
      <Dialog as="div" className="fixed z-10 inset-0 overflow-y-auto" onClose={handleClose}>
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>
          
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 lg:max-w-2xl">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={handleClose}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              {renderModalContent()}
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default Modal;
