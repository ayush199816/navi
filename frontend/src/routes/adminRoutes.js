import React from 'react';
import { Routes, Route } from 'react-router-dom';
import GuestSightseeings from '../pages/admin/GuestSightseeings';
import GuestSightseeingForm from '../pages/admin/GuestSightseeingForm';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="guest-sightseeings" element={<GuestSightseeings />} />
      <Route 
        path="guest-sightseeings/new" 
        element={
          <div className="p-6">
            <GuestSightseeingForm 
              onSuccess={() => window.location.href = '/admin/guest-sightseeings'} 
            />
          </div>
        } 
      />
      <Route 
        path="guest-sightseeings/edit/:id" 
        element={
          <div className="p-6">
            <GuestSightseeingForm 
              onSuccess={() => window.location.href = '/admin/guest-sightseeings'} 
            />
          </div>
        } 
      />
    </Routes>
  );
};

export default AdminRoutes;
