import React from 'react';
const Dashboard = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Sightseeing Management</h3>
        <ul className="space-y-3">
          <li>
            <a 
              href="/admin/guest-sightseeings" 
              className="flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors"
            >
              <span className="ml-2">Guest Sightseeings</span>
            </a>
          </li>
          <li>
            <a 
              href="/admin/sightseeing" 
              className="flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors"
            >
              <span className="ml-2">Regular Sightseeing</span>
            </a>
          </li>
        </ul>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">User Management</h3>
        <ul className="space-y-3">
          <li>
            <a 
              href="/admin/users" 
              className="flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors"
            >
              <span className="ml-2">Manage Users</span>
            </a>
          </li>
          <li>
            <a 
              href="/admin/approvals" 
              className="flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors"
            >
              <span className="ml-2">Agent Approvals</span>
            </a>
          </li>
        </ul>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Operations</h3>
        <ul className="space-y-3">
          <li>
            <a 
              href="/admin/quotes" 
              className="flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors"
            >
              <span className="ml-2">Manage Quotes</span>
            </a>
          </li>
          <li>
            <a 
              href="/admin/claims" 
              className="flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors"
            >
              <span className="ml-2">View Claims</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
);
export default Dashboard;

