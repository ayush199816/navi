import React, { useState, useEffect } from 'react';
import { XMarkIcon as XIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-toastify';

const ActivityEditModal = ({ open, onClose, booking, onUpdate }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Initialize activities when booking changes
  useEffect(() => {
    if (booking && booking.activities) {
      setActivities(booking.activities.map(activity => ({
        ...activity,
        date: activity.date ? new Date(activity.date).toISOString().split('T')[0] : '',
      })));
    } else {
      setActivities([]);
    }
  }, [booking]);

  // Add a new empty activity
  const handleAddActivity = () => {
    const newActivity = {
      sightseeingName: '',
      date: '',
      pickupTime: '',
      dropTime: '',
      pickupLocation: '',
      dropLocation: '',
      isSameAsPickup: false,
      isConnectingActivity: false,
      notes: ''
    };
    
    // If there are existing activities and the last one has connecting activity enabled,
    // set the pickup location of the new activity to the last activity's name
    if (activities.length > 0 && activities[activities.length - 1].isConnectingActivity) {
      newActivity.pickupLocation = `From: ${activities[activities.length - 1].sightseeingName}`;
    }
    
    setActivities([...activities, newActivity]);
  };

  // Remove an activity
  const handleRemoveActivity = (index) => {
    const updatedActivities = [...activities];
    
    // Check if this activity is connected to others
    const isConnectingToNext = activities[index].isConnectingActivity;
    const isPreviousConnecting = index > 0 && activities[index - 1].isConnectingActivity;
    
    // Remove the activity
    updatedActivities.splice(index, 1);
    
    // If the removed activity was connecting to the next one and there was a previous activity,
    // connect the previous activity to the next one
    if (isConnectingToNext && isPreviousConnecting && index < updatedActivities.length) {
      updatedActivities[index - 1].isConnectingActivity = true;
      updatedActivities[index - 1].dropLocation = `Next: ${updatedActivities[index].sightseeingName || 'Activity'}`;
      updatedActivities[index].pickupLocation = `From: ${updatedActivities[index - 1].sightseeingName}`;
    }
    // If the removed activity had a previous activity connecting to it,
    // update the previous activity to not connect anymore
    else if (isPreviousConnecting) {
      updatedActivities[index - 1].isConnectingActivity = false;
      // Reset the drop location if it was set to connect to the removed activity
      if (updatedActivities[index - 1].dropLocation.startsWith('Next:')) {
        updatedActivities[index - 1].dropLocation = '';
      }
    }
    // If the removed activity was connecting to the next one,
    // reset the next activity's pickup location
    else if (isConnectingToNext && index < updatedActivities.length) {
      if (updatedActivities[index].pickupLocation.startsWith('From:')) {
        updatedActivities[index].pickupLocation = '';
      }
    }
    
    setActivities(updatedActivities);
  };

  // Handle form field changes
  const handleChange = (index, field, value) => {
    const updatedActivities = [...activities];
    updatedActivities[index][field] = value;
    
    // If isSameAsPickup is checked, set dropLocation to pickupLocation
    if (field === 'isSameAsPickup' && value === true) {
      updatedActivities[index].dropLocation = updatedActivities[index].pickupLocation;
    }
    
    // If pickupLocation changes and isSameAsPickup is checked, update dropLocation
    if (field === 'pickupLocation' && updatedActivities[index].isSameAsPickup) {
      updatedActivities[index].dropLocation = value;
    }
    
    // If isConnectingActivity is checked, set dropLocation to next activity's name
    if (field === 'isConnectingActivity' && value === true && index < activities.length - 1) {
      updatedActivities[index].dropLocation = `Next: ${activities[index + 1].sightseeingName || 'Activity'}`;
      
      // Also update the next activity's pickup location to this activity's name
      if (index < activities.length - 1) {
        updatedActivities[index + 1].pickupLocation = `From: ${updatedActivities[index].sightseeingName}`;
      }
    }
    
    // If sightseeingName changes and the previous activity is connecting to this one,
    // update the previous activity's drop location
    if (field === 'sightseeingName' && index > 0 && activities[index - 1].isConnectingActivity) {
      updatedActivities[index - 1].dropLocation = `Next: ${value || 'Activity'}`;
    }
    
    setActivities(updatedActivities);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.put(`/api/bookings/${booking._id}`, {
        activities: activities
      });

      if (response.data.success) {
        setSuccess(true);
        toast.success('Activities updated successfully!');
        
        // Call the onUpdate callback with the updated booking
        if (onUpdate) {
          onUpdate(response.data.data);
        }
        
        // Close the modal after a delay
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update activities');
      toast.error(err.response?.data?.message || 'Failed to update activities');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Activities & Sightseeing</h2>
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
            Activities updated successfully!
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No activities added yet.</p>
              <button
                type="button"
                className="btn-primary flex items-center mx-auto"
                onClick={handleAddActivity}
              >
                <PlusIcon className="h-5 w-5 mr-1" /> Add Activity
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {activities.map((activity, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Activity #{index + 1}</h3>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleRemoveActivity(index)}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Sightseeing Name*
                      </label>
                      <input
                        type="text"
                        className="form-input w-full"
                        value={activity.sightseeingName}
                        onChange={(e) => handleChange(index, 'sightseeingName', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Date*
                      </label>
                      <input
                        type="date"
                        className="form-input w-full"
                        value={activity.date}
                        onChange={(e) => handleChange(index, 'date', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Pickup Time
                      </label>
                      <input
                        type="time"
                        className="form-input w-full"
                        value={activity.pickupTime}
                        onChange={(e) => handleChange(index, 'pickupTime', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Drop Time
                      </label>
                      <input
                        type="time"
                        className="form-input w-full"
                        value={activity.dropTime}
                        onChange={(e) => handleChange(index, 'dropTime', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Pickup Location
                      </label>
                      <input
                        type="text"
                        className="form-input w-full"
                        value={activity.pickupLocation}
                        onChange={(e) => handleChange(index, 'pickupLocation', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Drop Location
                      </label>
                      <input
                        type="text"
                        className="form-input w-full"
                        value={activity.dropLocation}
                        onChange={(e) => handleChange(index, 'dropLocation', e.target.value)}
                        disabled={activity.isSameAsPickup || activity.isConnectingActivity}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`sameAsPickup-${index}`}
                          className="form-checkbox h-4 w-4"
                          checked={activity.isSameAsPickup}
                          onChange={(e) => handleChange(index, 'isSameAsPickup', e.target.checked)}
                          disabled={activity.isConnectingActivity}
                        />
                        <label htmlFor={`sameAsPickup-${index}`} className="ml-2 text-sm">
                          Same location as pickup
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`connectingActivity-${index}`}
                          className="form-checkbox h-4 w-4"
                          checked={activity.isConnectingActivity}
                          onChange={(e) => handleChange(index, 'isConnectingActivity', e.target.checked)}
                          disabled={index === activities.length - 1 || activity.isSameAsPickup}
                        />
                        <label htmlFor={`connectingActivity-${index}`} className="ml-2 text-sm">
                          Connect to next activity
                        </label>
                      </div>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium mb-1">
                        Notes
                      </label>
                      <textarea
                        className="form-textarea w-full"
                        rows="3"
                        value={activity.notes}
                        onChange={(e) => handleChange(index, 'notes', e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-center">
                <button
                  type="button"
                  className="btn-outline flex items-center"
                  onClick={handleAddActivity}
                >
                  <PlusIcon className="h-5 w-5 mr-1" /> Add Another Activity
                </button>
              </div>
            </div>
          )}
          
          <div className="flex justify-end mt-6 space-x-2">
            <button
              type="button"
              className="btn-outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || activities.length === 0}
            >
              {loading ? 'Saving...' : 'Save Activities'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityEditModal;
