import React from 'react';

const Dashboard = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold mb-4">Operations Dashboard</h2>
    <ul className="space-y-4">
      <li>
        <a href="/operations/sightseeing" className="text-blue-600 underline">Manage Sightseeing</a>
      </li>
      {/* Add other operations dashboard links here */}
    </ul>
  </div>
);

export default Dashboard;
