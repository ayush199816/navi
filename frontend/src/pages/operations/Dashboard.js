import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold mb-6">Operations Dashboard</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <DashboardCard 
        title="Bookings" 
        description="View and manage all bookings"
        to="/operations/bookings"
        className="bg-blue-50"
      />
      <DashboardCard 
        title="Quotes" 
        description="Manage all quotes and responses"
        to="/admin/quotes"
        className="bg-green-50"
      />
      <DashboardCard 
        title="Sightseeing" 
        description="Manage sightseeing activities"
        to="/operations/sightseeing"
        className="bg-purple-50"
      />
      <DashboardCard 
        title="Packages" 
        description="Manage travel packages"
        to="/operations/packages"
        className="bg-yellow-50"
      />
      <DashboardCard 
        title="Wallet Transactions" 
        description="View wallet transactions"
        to="/operations/wallet-transactions"
        className="bg-red-50"
      />
      <DashboardCard 
        title="Add Seller" 
        description="Add a new seller"
        to="/operations/add-seller"
        className="bg-indigo-50"
      />
    </div>
  </div>
);

const DashboardCard = ({ title, description, to, className = '' }) => (
  <Link 
    to={to}
    className={`block p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}
  >
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </Link>
);

export default Dashboard;
