import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiShoppingCart, FiUsers, FiCalendar, FiUser } from 'react-icons/fi';

const GuestDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);

  // Redirect if not authenticated as guest
  useEffect(() => {
    if (!user || user.role !== 'user' || user.user_type !== 'guest') {
      navigate('/login');
    }
  }, [user, navigate]);

  const dashboardItems = [
    {
      icon: <FiShoppingCart className="w-6 h-6" />,
      title: 'Cart',
      count: 0, // This will be updated with actual cart count
      path: '/cart'
    },
    {
      icon: <FiUsers className="w-6 h-6" />,
      title: 'Referrals',
      count: 0, // This will be updated with actual referrals count
      path: '/guest/referrals'
    },
    {
      icon: <FiCalendar className="w-6 h-6" />,
      title: 'Bookings',
      count: 0, // This will be updated with actual bookings count
      path: '/guest/bookings'
    },
    {
      icon: <FiUser className="w-6 h-6" />,
      title: 'Profile',
      count: '',
      path: '/guest/profile'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-4 py-6 sm:px-6">
            <h1 className="text-2xl font-semibold text-gray-900">Welcome, {user?.name}</h1>
            <p className="mt-2 text-sm text-gray-500">Manage your bookings and profile</p>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardItems.map((item, index) => (
            <div 
              key={index}
              className="bg-white overflow-hidden shadow rounded-lg"
              onClick={() => navigate(item.path)}
              style={{ cursor: 'pointer' }}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-50">
                      {item.icon}
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {item.title}
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {item.count}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GuestDashboard;
