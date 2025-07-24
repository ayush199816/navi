import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationCircleIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ClaimForm from './ClaimForm';
import axios from 'axios';
import { toast } from 'react-toastify';

const ClaimModal = ({ isOpen, onClose, booking }) => {
  const [existingClaim, setExistingClaim] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && booking?._id) {
      checkExistingClaim();
    }
  }, [isOpen, booking]);

  const checkExistingClaim = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if a claim already exists for this booking
      const response = await axios.get(`/api/claims/my-claims?booking=${booking._id}`);
      
      if (response.data.data && response.data.data.length > 0) {
        setExistingClaim(response.data.data[0]);
      } else {
        setExistingClaim(null);
      }
    } catch (err) {
      console.error('Error checking existing claim:', err);
      setError('Failed to check for existing claims');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimSuccess = (claim) => {
    setExistingClaim(claim);
    toast.success('Your claim has been submitted successfully and is pending approval');
  };

  const getStatusBadge = (status) => {
    let bgColor = 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case 'pending':
        bgColor = 'bg-yellow-100 text-yellow-800';
        break;
      case 'approved':
        bgColor = 'bg-green-100 text-green-800';
        break;
      case 'rejected':
        bgColor = 'bg-red-100 text-red-800';
        break;
      default:
        bgColor = 'bg-gray-100 text-gray-800';
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      Payment Claim
                    </Dialog.Title>
                    <div className="mt-4">
                      {loading ? (
                        <div className="flex justify-center items-center h-48">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                        </div>
                      ) : error ? (
                        <div className="rounded-md bg-red-50 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">{error}</h3>
                            </div>
                          </div>
                        </div>
                      ) : existingClaim ? (
                        <div>
                          <div className="rounded-md bg-blue-50 p-4 mb-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <CheckCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm text-blue-700">A claim has already been submitted for this booking</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border border-gray-200 rounded-md p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">Claim ID:</span>
                              <span>{existingClaim.transactionId}</span>
                            </div>
                            
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">Status:</span>
                              {getStatusBadge(existingClaim.status)}
                            </div>
                            
                            <hr className="my-3" />
                            
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">Amount:</span>
                              <span>{existingClaim.amount} {existingClaim.currency}</span>
                            </div>
                            
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">Rate of Exchange:</span>
                              <span>{existingClaim.rateOfExchange}</span>
                            </div>
                            
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">Claimed Amount (USD):</span>
                              <span className="font-bold">${existingClaim.claimedAmount.toFixed(2)}</span>
                            </div>
                            
                            <hr className="my-3" />
                            
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">Lead Passenger:</span>
                              <span>{existingClaim.leadPaxName}</span>
                            </div>
                            
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">Travel Date:</span>
                              <span>{new Date(existingClaim.travelDate).toLocaleDateString()}</span>
                            </div>
                            
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">Claim Date:</span>
                              <span>{new Date(existingClaim.claimDate).toLocaleDateString()}</span>
                            </div>
                            
                            {existingClaim.notes && (
                              <>
                                <hr className="my-3" />
                                <div className="mb-1 font-medium">Notes:</div>
                                <p>{existingClaim.notes}</p>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <ClaimForm booking={booking} onSuccess={handleClaimSuccess} />
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ClaimModal;
