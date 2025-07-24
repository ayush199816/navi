import React, { useState } from 'react';
import api from '../utils/api';

const QuoteDetailModal = ({ open, onClose, quote, isAdmin, children }) => {
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [isEditingItinerary, setIsEditingItinerary] = useState(false);
  const [newItinerary, setNewItinerary] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  
  if (!open || !quote) return null;
  
  const {
    quoteId,
    agent,
    customerName,
    customerEmail,
    customerPhone,
    destination,
    travelDates,
    numberOfTravelers,
    hotelRequired,
    flightBooked,
    requirements,
    status,
    totalAmount,
    createdAt,
    updatedAt,
    response,
    packageSuggestion,
    itinerary,
    respondedBy
  } = quote;
  
  const handleUpdatePrice = async () => {
    try {
      setUpdateError('');
      setUpdateMessage('');
      
      if (!newPrice || isNaN(Number(newPrice))) {
        setUpdateError('Please enter a valid price');
        return;
      }
      
      const response = await api.put(
        `/quotes/${quote._id}`,
        { 
          quotedPrice: Number(newPrice),
          discussion: [...(Array.isArray(quote.discussion) ? quote.discussion : []), {
            message: `Price updated from ₹${quote.quotedPrice || quote.totalAmount} to ₹${newPrice}`,
            timestamp: new Date(),
            user: localStorage.getItem('userName') || 'Admin/Operations',
            type: 'price_update'
          }]
        }
      );
      
      if (response.data) {
        setUpdateMessage('Price updated successfully!');
        setIsEditingPrice(false);
        // Update the local quote object to reflect the new price
        quote.quotedPrice = Number(newPrice);
        quote.totalAmount = Number(newPrice);
        
        // If we have the updated quote from the response, use that
        if (response.data.quote) {
          Object.assign(quote, response.data.quote);
        }
      }
    } catch (error) {
      console.error('Error updating price:', error);
      setUpdateError(error.response?.data?.message || 'Failed to update price');
    }
  };

  const handleUpdateItinerary = async () => {
    try {
      setUpdateError('');
      setUpdateMessage('');
      
      if (!newItinerary.trim()) {
        setUpdateError('Please enter a valid itinerary');
        return;
      }
      
      const response = await api.put(
        `/quotes/${quote._id}`,
        { 
          itinerary: newItinerary,
          discussion: [...(Array.isArray(quote.discussion) ? quote.discussion : []), {
            message: `Itinerary was edited`,
            timestamp: new Date(),
            user: localStorage.getItem('userName') || 'Admin/Operations',
            type: 'system'
          }]
        }
      );
      
      if (response.data) {
        setUpdateMessage('Itinerary updated successfully!');
        setIsEditingItinerary(false);
        // Update the local quote object to reflect the new itinerary
        quote.itinerary = newItinerary;
        
        // If we have the updated quote from the response, use that
        if (response.data.data) {
          Object.assign(quote, response.data.data);
        }
      }
    } catch (error) {
      console.error('Error updating itinerary:', error);
      setUpdateError(error.response?.data?.message || 'Failed to update itinerary');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-auto">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl overflow-y-auto max-h-[95vh]">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold">Quote Details</h3>
          <button className="btn-outline px-2 py-1" onClick={onClose}>&times;</button>
        </div>
        <div className="mb-3">
          <span className="font-semibold">Quote ID:</span> <span className="font-mono">{quoteId || quote._id.slice(-6)}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="mb-1"><span className="font-semibold">Customer:</span> {customerName} ({customerEmail})</div>
            <div className="mb-1"><span className="font-semibold">Phone:</span> {customerPhone}</div>
          </div>
          <div>
            <div className="mb-1"><span className="font-semibold">Destination:</span> {destination}</div>
            <div className="mb-1"><span className="font-semibold">Travel Dates:</span> {new Date(travelDates?.startDate).toLocaleDateString()} - {new Date(travelDates?.endDate).toLocaleDateString()}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="mb-1">
              <span className="font-semibold">Number of Travelers:</span> {numberOfTravelers?.adults || 1} {numberOfTravelers?.adults === 1 ? 'Adult' : 'Adults'}
              {numberOfTravelers?.children > 0 && `, ${numberOfTravelers.children} ${numberOfTravelers.children === 1 ? 'Child' : 'Children'}`}
            </div>
          </div>
          <div>
            <div className="mb-1">
              <span className="font-semibold">Hotel Required:</span> {hotelRequired ? 'Yes' : 'No'}
            </div>
            <div className="mb-1">
              <span className="font-semibold">Flight Already Booked:</span> {flightBooked ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Status:</span> 
          <span className={`capitalize ml-1 px-2 py-0.5 rounded-full text-xs font-medium
            ${status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
              status === 'accepted by agent' || status === 'accepted' ? 'bg-green-100 text-green-800' : 
              status === 'rejected' ? 'bg-red-100 text-red-800' : 
              'bg-gray-100 text-gray-800'}`}
          >
            {status}
          </span>
        </div>
        {requirements && (
          <div className="mb-2"><span className="font-semibold">Requirements:</span> {requirements}</div>
        )}
        {packageSuggestion && (
          <div className="mb-2"><span className="font-semibold">Suggested Package:</span> {packageSuggestion?.name}</div>
        )}
        {itinerary && isAdmin && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold">Itinerary:</span>
              {(isAdmin || ['admin', 'operations'].includes(localStorage.getItem('userRole'))) && !isEditingItinerary && (
                <button 
                  onClick={() => {
                    setIsEditingItinerary(true);
                    setNewItinerary(itinerary);
                  }} 
                  className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                >
                  Edit Itinerary
                </button>
              )}
            </div>
            
            {!isEditingItinerary ? (
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto mb-2">{typeof itinerary === 'string' ? itinerary : JSON.stringify(itinerary, null, 2)}</pre>
            ) : (
              <div className="mb-2">
                <textarea
                  value={newItinerary}
                  onChange={(e) => setNewItinerary(e.target.value)}
                  className="form-input w-full h-64 font-mono text-xs"
                />
                <div className="flex space-x-2 mt-2">
                  <button 
                    onClick={handleUpdateItinerary} 
                    className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                  >
                    Save Changes
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingItinerary(false);
                      setUpdateError('');
                    }} 
                    className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
                {updateError && <div className="text-red-500 text-xs mt-1">{updateError}</div>}
                {updateMessage && <div className="text-green-500 text-xs mt-1">{updateMessage}</div>}
              </div>
            )}
          </div>
        )}
        {response && (
          <div className="mb-3 p-3 bg-blue-50 rounded-md border border-blue-200">
            <div className="font-semibold mb-1">Response:</div>
            <div className="whitespace-pre-wrap">{response}</div>
            {quote.respondedBy && (
              <div className="text-xs text-gray-500 mt-1">
                Responded by: {quote.respondedBy.name} ({quote.respondedBy.role}) on {new Date(quote.respondedBy.date).toLocaleString()}
              </div>
            )}
          </div>
        )}
        
        {/* History Button */}
        {quote.discussion && quote.discussion.length > 0 && (
          <div className="mb-3">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-1 px-3 rounded-md transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showHistory ? 'Hide History' : 'Show History'} ({quote.discussion.length} {quote.discussion.length === 1 ? 'entry' : 'entries'})
            </button>
          </div>
        )}
        
        {/* Discussion History */}
        {quote.discussion && quote.discussion.length > 0 && showHistory && (
          <div className="mb-3 animate-fadeIn">
            <div className="font-semibold mb-2">Discussion History:</div>
            <div className="border rounded-md overflow-hidden max-h-60 overflow-y-auto">
              {quote.discussion.map((item, index) => (
                <div key={index} className={`p-3 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b last:border-b-0`}>
                  <div className="whitespace-pre-wrap">{item.message}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.user} - {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mb-2">
          <div className="flex items-center">
            <span className="font-semibold">Total Amount:</span> 
            {!isEditingPrice ? (
              <>
                <span className="mx-1">₹{(quote.quotedPrice || totalAmount)?.toLocaleString()}</span>
                {(isAdmin || ['admin', 'operations'].includes(localStorage.getItem('userRole'))) && (
                  <button 
                    onClick={() => {
                      setIsEditingPrice(true);
                      setNewPrice(totalAmount || '');
                    }} 
                    className="ml-2 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                  >
                    Edit Price
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-col space-y-2 ml-2">
                <div className="flex items-center">
                  <span className="mr-1">₹</span>
                  <input 
                    type="number" 
                    value={newPrice} 
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="border rounded px-2 py-1 w-32"
                  />
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleUpdatePrice} 
                    className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingPrice(false);
                      setUpdateError('');
                    }} 
                    className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
                {updateError && <div className="text-red-500 text-xs">{updateError}</div>}
                {updateMessage && <div className="text-green-500 text-xs">{updateMessage}</div>}
              </div>
            )}
          </div>
        </div>
        {isAdmin && agent && (
          <div className="mb-2"><span className="font-semibold">Agent:</span> {agent?.name} ({agent?.email})</div>
        )}
        <div className="mb-2 text-xs text-gray-500">Created: {new Date(createdAt).toLocaleString()} | Updated: {new Date(updatedAt).toLocaleString()}</div>
        
        {/* Render children (response controls) */}
        {children}
        
        <div className="flex justify-end mt-4">
          <button className="btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default QuoteDetailModal;
