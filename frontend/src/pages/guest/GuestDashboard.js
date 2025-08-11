import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiShoppingCart, FiUsers, FiCalendar, FiUser } from 'react-icons/fi';

const GuestDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useSelector(state => state.auth);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Handle authentication and redirects
  useEffect(() => {
    console.log('GuestDashboard - Auth state:', { 
      isAuthenticated, 
      loading, 
      user: user ? { 
        id: user._id, 
        role: user.role, 
        user_type: user.user_type 
      } : null 
    });

    // If still loading initial auth state, do nothing
    if (loading) {
      console.log('GuestDashboard - Still loading auth state');
      return;
    }
    
    // If not authenticated, redirect to login
    if (!isAuthenticated || !user) {
      console.log('GuestDashboard - Not authenticated, redirecting to login');
      navigate('/login', { 
        state: { 
          from: '/guest-dashboard',
          reason: 'not_authenticated'
        },
        replace: true 
      });
      return;
    }
    
    // If authenticated but not a guest user, redirect to appropriate dashboard
    if (user.role !== 'user' || user.user_type !== 'guest') {
      console.log('GuestDashboard - User is not a guest, redirecting based on role:', user.role);
      if (user.role === 'agent') {
        navigate(user.isApproved ? '/agent' : '/onboarding', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      return;
    }
    
    // If we get here, user is authenticated as a guest
    console.log('GuestDashboard - User is authenticated as guest, rendering dashboard');
    setIsCheckingAuth(false);
    
  }, [user, isAuthenticated, loading, navigate]);
  
  // Show loading state while checking auth
  if (loading || isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
