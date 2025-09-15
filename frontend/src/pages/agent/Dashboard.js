import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  CurrencyRupeeIcon,
  DocumentTextIcon,
  ShoppingBagIcon,
  PhoneIcon,
  MapIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  GiftIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useSelector(state => state.auth);
  const [stats, setStats] = useState({
    wallet: { balance: 0, creditLimit: 0 },
    quotes: { total: 0, pending: 0 },
    bookings: { total: 0, active: 0 },
    leads: { total: 0, new: 0 },
    itineraries: { total: 0 },
    packages: { total: 0, withOffers: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch wallet info
        let walletData = { balance: 0, creditLimit: 0 };
        try {
          const walletRes = await axios.get('/api/wallets/my-wallet');
          if (walletRes.data && walletRes.data.data) {
            walletData = {
              balance: walletRes.data.data.balance || 0,
              creditLimit: walletRes.data.data.creditLimit || 0
            };
          }
          console.log('Wallet data:', walletData);
        } catch (err) {
          console.error('Error fetching wallet:', err);
        }
        
        // Fetch quote stats
        let quotesData = { total: 0, pending: 0, active: 0 };
        try {
          const quotesRes = await axios.get('/api/quotes');
          if (quotesRes.data && quotesRes.data.success) {
            quotesData = {
              total: quotesRes.data.total || 0,
              pending: quotesRes.data.pending || 0,
              active: quotesRes.data.active || 0
            };
          }
          console.log('Quotes data:', quotesData);
        } catch (err) {
          console.error('Error fetching quotes:', err);
        }
        
        // Fetch booking stats
        let bookingsData = { total: 0, active: 0 };
        try {
          const bookingsRes = await axios.get('/api/bookings');
          if (bookingsRes.data && bookingsRes.data.success) {
            bookingsData = {
              total: bookingsRes.data.total || 0,
              active: bookingsRes.data.active || 0
            };
          }
          console.log('Bookings data:', bookingsData);
        } catch (err) {
          console.error('Error fetching bookings:', err);
        }
        
        // Fetch lead stats
        let leadsData = { total: 0, new: 0 };
        try {
          const leadsRes = await axios.get('/api/leads');
          if (leadsRes.data && leadsRes.data.success) {
            leadsData = {
              total: leadsRes.data.total || 0,
              new: leadsRes.data.new || 0
            };
          }
          console.log('Leads data:', leadsData);
        } catch (err) {
          console.error('Error fetching leads:', err);
        }
        
        // Fetch itinerary stats
        let itinerariesData = { total: 0 };
        try {
          const itinerariesRes = await axios.get('/api/itineraries');
          if (itinerariesRes.data && itinerariesRes.data.success) {
            itinerariesData = {
              total: itinerariesRes.data.total || 0
            };
          }
          console.log('Itineraries data:', itinerariesData);
        } catch (err) {
          console.error('Error fetching itineraries:', err);
        }
        
        // Fetch package stats
        let packagesData = { total: 0, withOffers: 0 };
        try {
          const packagesRes = await axios.get('/api/packages/stats');
          if (packagesRes.data && packagesRes.data.success) {
            packagesData = {
              total: packagesRes.data.total || 0,
              withOffers: packagesRes.data.withOffers || 0,
              active: packagesRes.data.active || 0
            };
          }
          console.log('Packages data:', packagesData);
        } catch (err) {
          console.error('Error fetching packages:', err);
        }
        
        // Fetch recent activity
        let recentActivityData = [];
        try {
          const recentActivityRes = await axios.get('/api/activity/recent');
          if (recentActivityRes.data && recentActivityRes.data.data) {
            recentActivityData = recentActivityRes.data.data;
          }
        } catch (err) {
          console.error('Error fetching activity:', err);
        }
        
        setStats({
          wallet: walletData,
          quotes: quotesData,
          bookings: bookingsData,
          leads: leadsData,
          packages: packagesData,
          itineraries: itinerariesData
        });
        
        setRecentActivity(recentActivityData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Stat card component
  const StatCard = ({ title, value, icon: Icon, change, changeType, link }) => (
    <Link to={link} className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
            <Icon className="h-6 w-6 text-primary-600" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <div className="font-medium text-primary-700 hover:text-primary-900 flex items-center">
            View all
            {change && (
              <span className={`ml-2 flex items-center text-sm ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                {changeType === 'increase' ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                )}
                {change}%
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );

  // Activity item component
  const ActivityItem = ({ activity }) => {
    const getActivityIcon = (type) => {
      switch (type) {
        case 'quote':
          return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
        case 'booking':
          return <ShoppingBagIcon className="h-5 w-5 text-green-500" />;
        case 'lead':
          return <PhoneIcon className="h-5 w-5 text-yellow-500" />;
        case 'wallet':
          return <CurrencyRupeeIcon className="h-5 w-5 text-purple-500" />;
        default:
          return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
      }
    };

    return (
      <li>
        <div className="relative pb-8">
          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
          <div className="relative flex space-x-3">
            <div>
              <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                {getActivityIcon(activity.type)}
              </span>
            </div>
            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
              <div>
                <p className="text-sm text-gray-500">
                  {activity.message}{' '}
                  <span className="font-medium text-gray-900">{activity.reference}</span>
                </p>
              </div>
              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                <time dateTime={activity.createdAt}>{new Date(activity.createdAt).toLocaleDateString()}</time>
              </div>
            </div>
          </div>
        </div>
      </li>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Handle account status
  if (user && user.role === 'agent' && user.isApproved === false) {
    return (
      <div className="max-w-xl mx-auto mt-20 bg-yellow-50 border-l-4 border-yellow-400 p-8 rounded shadow text-center">
        <h2 className="text-xl font-bold text-yellow-800 mb-2">Account Pending Approval</h2>
        <p className="text-yellow-700 mb-4">
          Your registration is under review by our Accounts team. You will be notified once your account is approved.
        </p>
        {user.rejectionReason && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mt-4">
            <h3 className="font-semibold">Account Rejected</h3>
            <p>{user.rejectionReason}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome back, {user?.name}!</h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's what's happening with your travel business today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Wallet Balance"
          value={`₹${stats.wallet.balance.toLocaleString()}`}
          icon={CurrencyRupeeIcon}
          link="/my-wallet"
        />
        <StatCard
          title="Credit Limit"
          value={`₹${stats.wallet.creditLimit.toLocaleString()}`}
          icon={CurrencyRupeeIcon}
          link="/my-wallet"
        />
        <StatCard
          title="Active Quotes"
          value={stats.quotes.pending}
          icon={DocumentTextIcon}
          change="12"
          changeType="increase"
          link="/my-quotes"
        />
        <StatCard
          title="Active Bookings"
          value={stats.bookings.active}
          icon={ShoppingBagIcon}
          change="5"
          changeType="increase"
          link="/my-bookings"
        />
        <StatCard
          title="New Leads"
          value={stats.leads.new}
          icon={PhoneIcon}
          change="3"
          changeType="decrease"
          link="/my-leads"
        />
        <StatCard
          title="Itineraries"
          value={stats.itineraries.total}
          icon={MapIcon}
          link="/my-itineraries"
        />
        <StatCard
          title="Available Packages"
          value={stats.packages.active || 0}
          icon={GiftIcon}
          link="/packages"
        />
        <StatCard
          title="Special Offers"
          value={stats.packages.withOffers || 0}
          icon={TagIcon}
          change={stats.packages.withOffers}
          changeType="increase"
          link="/packages?hasOffers=true"
        />
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/create-itinerary" className="bg-white overflow-hidden shadow rounded-lg hover:bg-gray-50">
            <div className="p-5 flex items-center">
              <MapIcon className="h-6 w-6 text-primary-600 mr-3" />
              <span className="text-gray-900 font-medium">Create Itinerary</span>
            </div>
          </Link>
          <Link to="/my-leads/new" className="bg-white overflow-hidden shadow rounded-lg hover:bg-gray-50">
            <div className="p-5 flex items-center">
              <PhoneIcon className="h-6 w-6 text-primary-600 mr-3" />
              <span className="text-gray-900 font-medium">Add New Lead</span>
            </div>
          </Link>
          <Link to="/packages" className="bg-white overflow-hidden shadow rounded-lg hover:bg-gray-50">
            <div className="p-5 flex items-center">
              <ShoppingBagIcon className="h-6 w-6 text-primary-600 mr-3" />
              <span className="text-gray-900 font-medium">Browse Packages</span>
            </div>
          </Link>
          <Link to="/my-quotes/new" className="bg-white overflow-hidden shadow rounded-lg hover:bg-gray-50">
            <div className="p-5 flex items-center">
              <DocumentTextIcon className="h-6 w-6 text-primary-600 mr-3" />
              <span className="text-gray-900 font-medium">Create Quote</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 p-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <ActivityItem key={index} activity={activity} />
              ))
            ) : (
              <li className="py-4 text-center text-gray-500">No recent activity</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
