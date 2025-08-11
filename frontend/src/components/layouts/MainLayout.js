import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { fetchUnreadCount } from '../../redux/slices/notificationSlice';
import NotificationDropdown from '../notifications/NotificationDropdown';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UserIcon,
  DocumentTextIcon,
  CreditCardIcon,
  UserGroupIcon,
  AcademicCapIcon,
  MapIcon,
  PhoneIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  GiftIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Fetch unread notification count on component mount
  useEffect(() => {
    if (user) {
      dispatch(fetchUnreadCount());
    }
  }, [dispatch, user]);

  // Navigation items based on user role
  const navigation = [
    // Dashboard links based on role
    { name: 'Dashboard', href: '/', icon: HomeIcon, roles: ['admin', 'operations', 'accounts', 'sales'] },
    { name: 'Dashboard', href: '/agent', icon: HomeIcon, roles: ['agent'] },
    { name: 'Dashboard', href: '/guest-dashboard', icon: HomeIcon, roles: ['user'], user_type: 'guest' },
    { name: 'Profile', href: '/profile', icon: UserIcon, roles: ['admin', 'agent', 'operations', 'accounts', 'sales'] },
    
    // Agent specific
    { name: 'Packages', href: '/agent/packages', icon: GiftIcon, roles: ['agent'] },
    { name: 'My Quotes', href: '/agent/quotes', icon: DocumentTextIcon, roles: ['agent'] },
    { name: 'My Bookings', href: '/agent/bookings', icon: CreditCardIcon, roles: ['agent'] },
    { name: 'My Leads', href: '/agent/leads', icon: PhoneIcon, roles: ['agent'] },
    { name: 'My Wallet', href: '/agent/wallet', icon: CreditCardIcon, roles: ['agent'] },
    { name: 'My Claims', href: '/agent/my-claims', icon: CurrencyDollarIcon, roles: ['agent'] },
    { name: 'Itinerary Builder', href: '/agent/itinerary-builder', icon: MapIcon, roles: ['agent'] },
    { name: 'My Itineraries', href: '/agent/itineraries', icon: MapIcon, roles: ['agent'] },
    { name: 'Create Itinerary', href: '/agent/itineraries/create', icon: MapIcon, roles: ['agent'] },
    
    // Admin specific
    { name: 'User Management', href: '/admin/users', icon: UserGroupIcon, roles: ['admin'] },
    { name: 'Agent Approvals', href: '/admin/approvals', icon: UserGroupIcon, roles: ['admin', 'accounts'] },
    { name: 'Guest Sightseeings', href: '/admin/guest-sightseeings', icon: MapIcon, roles: ['admin'] },
    
    // Operations specific
    { name: 'All Bookings', href: '/admin/bookings', icon: CreditCardIcon, roles: ['admin'] },
    { name: 'All Bookings', href: '/operations/bookings', icon: CreditCardIcon, roles: ['operations'] },
    { name: 'All Quotes', href: '/admin/quotes', icon: DocumentTextIcon, roles: ['admin'] },
    { name: 'All Quotes', href: '/operations/quotes', icon: DocumentTextIcon, roles: ['operations'] },
    { name: 'Payment Claims', href: '/admin/claims', icon: CurrencyDollarIcon, roles: ['admin', 'operations'] },
    { name: 'Wallet Transactions', href: '/admin/wallet-transactions', icon: CurrencyDollarIcon, roles: ['admin'] },
    { name: 'Wallet Transactions', href: '/operations/wallet-transactions', icon: CurrencyDollarIcon, roles: ['operations'] },
    { name: 'Package Management', href: '/operations/packages', icon: GiftIcon, roles: ['operations', 'admin'] },
    { name: 'Add Seller', href: '/operations/add-seller', icon: UserPlusIcon, roles: ['operations', 'admin'] },

    // Sightseeing Management
    { name: 'Manage Sightseeing', href: '/operations/sightseeing', icon: MapIcon, roles: ['operations'] },
    
    // Sales
    { name: 'Sales Leads', href: '/sales/leads', icon: PhoneIcon, roles: ['admin', 'sales'] },
    
    // LMS
    { name: 'Learning Portal', href: '/learning', icon: AcademicCapIcon, roles: ['admin', 'agent', 'operations', 'accounts', 'sales'] },
  ];

  // Filter navigation items based on user role and type
  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role) && 
    (!item.user_type || item.user_type === user?.user_type)
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
        
        <div className="fixed inset-y-0 left-0 flex max-w-xs w-full bg-white">
          <div className="h-full flex flex-col overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
              <div className="flex-shrink-0 flex items-center">
                <img className="h-8 w-auto" src={process.env.PUBLIC_URL + '/logo.png'} alt="Navigatio" />
                <span className="ml-2 text-xl font-bold text-primary-600">Navigatio</span>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            
            <nav className="mt-5 px-2 space-y-1">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    location.pathname === item.href
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                >
                  <item.icon
                    className={`${
                      location.pathname === item.href ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-4 flex-shrink-0 h-6 w-6`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
            
            <div className="mt-auto p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md"
              >
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200">
            <img className="h-8 w-auto" src={process.env.PUBLIC_URL + '/logo.png'} alt="Navigatio" />
            <span className="ml-2 text-xl font-bold text-primary-600">Navigatio</span>
          </div>
          
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    location.pathname === item.href
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <item.icon
                    className={`${
                      location.pathname === item.href ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 flex-shrink-0 h-6 w-6`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="mt-auto p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
        
        <div className="fixed inset-y-0 left-0 flex max-w-xs w-full bg-white">
          <div className="h-full flex flex-col overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
              <div className="flex-shrink-0 flex items-center">
                <img className="h-8 w-auto" src={process.env.PUBLIC_URL + '/logo.png'} alt="Navigatio" />
                <span className="ml-2 text-xl font-bold text-primary-600">Navigatio</span>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            
            <nav className="mt-5 px-2 space-y-1">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    location.pathname === item.href
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                >
                  <item.icon
                    className={`${
                      location.pathname === item.href ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-4 flex-shrink-0 h-6 w-6`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
            
            <div className="mt-auto p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <h1 className="text-xl font-semibold text-gray-900 my-auto">
                {filteredNavigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h1>
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Notification dropdown */}
              <NotificationDropdown />
              
              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    id="user-menu"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-medium">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 pb-8">
          <div className="mt-8 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
