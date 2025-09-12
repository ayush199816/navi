import React, { useState, useEffect } from 'react';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from './redux/slices/authSlice';
import { removeFromCart, updateQuantity } from './redux/slices/cartSlice';
import Modal from './components/modals/Modal';
import CartPage from './pages/CartPage';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Pages
import LandingPage from './pages/LandingPage';
import ToursPage from './pages/ToursPage';
import SightseeingDetailPage from './pages/SightseeingDetailPage';
import Dashboard from './pages/Dashboard';
import GuestDashboard from './pages/guest/GuestDashboard';
import Checkout from './pages/guest/Checkout';
import BookingConfirmation from './pages/guest/BookingConfirmation';
import GuestBookings from './pages/guest/GuestBookings';
import Login from './pages/auth/Login';
import GuestLogin from './pages/auth/GuestLogin';
import SimpleRegister from './pages/auth/SimpleRegister';
import GuestRegister from './pages/auth/GuestRegister';
import Onboarding from './pages/auth/Onboarding';
import PendingApproval from './pages/auth/PendingApproval';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import TermsAndConditions from './pages/TermsAndConditions';
import ContactUs from './pages/ContactUs';

// Agent Pages
import AgentDashboard from './pages/agent/Dashboard';
import Packages from './pages/agent/Packages';
import PackageDetail from './pages/agent/PackageDetail';
import MyQuotes from './pages/agent/MyQuotes';
import MyBookings from './pages/agent/MyBookings';
import MyLeads from './pages/agent/leads/MyLeads';
import MyWallet from './pages/agent/MyWallet';
import MyItineraries from './pages/agent/MyItineraries';
import MyClaims from './pages/agent/MyClaims';
import ItineraryBuilder from './pages/agent/ItineraryBuilder';
import ItineraryCreator from './pages/agent/ItineraryCreator';
import NotificationsPage from './pages/notifications/NotificationsPage';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import AgentApprovals from './pages/admin/AgentApprovals';
import QuotesAdmin from './pages/admin/QuotesAdmin';
import Claims from './pages/admin/Claims';
import GuestSightseeingBookings from './pages/admin/GuestSightseeingBookings';
import SightseeingListAdmin from './pages/admin/SightseeingList';
import GuestSightseeings from './pages/admin/GuestSightseeings';

// Operations Pages
import BookingsAdmin from './pages/operations/BookingsAdmin';
import WalletTransactions from './pages/operations/WalletTransactions';
import PackageList from './pages/operations/PackageList';
import AddSeller from './pages/operations/AddSeller';
import SightseeingListOps from './pages/operations/SightseeingList';

// Sales Pages
import SalesLeads from './pages/sales/leads/SalesLeads';
import SalesLeadDetail from './pages/sales/SalesLeadDetail';

// Protected Route Component with Approval Check
const ProtectedRoute = ({ children, roles, requireApproval = true }) => {
  const { isAuthenticated, user, loading } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    console.log('ProtectedRoute - Checking access:', {
      isAuthenticated,
      user: user ? { role: user.role, user_type: user.user_type } : null,
      currentPath: location.pathname,
      loading
    });
    
    // Don't run redirect logic if still loading
    if (loading) {
      console.log('ProtectedRoute - Still loading auth state');
      return;
    }
    
    // If not authenticated, redirect to login
    if (!isAuthenticated || !user) {
      console.log('ProtectedRoute - Not authenticated, redirecting to login');
      navigate('/login', { 
        state: { 
          from: location.pathname === '/guest-dashboard' ? '/guest-dashboard' : location.pathname 
        }, 
        replace: true 
      });
      return;
    }
    
    const currentPath = location.pathname;
    const isGuestUser = user.role === 'user' && user.user_type === 'guest';
    
    // Handle guest users
    if (isGuestUser) {
      console.log('ProtectedRoute - Handling guest user access');
      // Allow access to guest routes, cart, and sightseeing
      const allowedPaths = [
        '/guest-dashboard',
        '/cart',
        '/sightseeing',
        '/guest/checkout',
        '/guest/booking'
      ];
      
      const isAllowedPath = allowedPaths.some(path => currentPath.startsWith(path));
      
      if (isAllowedPath) {
        console.log('ProtectedRoute - Allowing access to guest path:', currentPath);
        return;
      }
      
      console.log('ProtectedRoute - Redirecting guest to dashboard from:', currentPath);
      navigate('/guest-dashboard', { replace: true });
      return;
    }

    // Handle agent users
    if (user.role === 'agent') {
      // Redirect to dashboard if user is already on the target page
      if (currentPath === '/onboarding' || currentPath === '/pending-approval') {
        if (user.isApproved) {
          navigate('/agent', { replace: true });
          return;
        }
      }
      
      // If user is an agent and requires approval
      if (requireApproval && !user.isApproved) {
        // If user hasn't completed onboarding, redirect to onboarding
        if (!user.onboardingCompleted && currentPath !== '/onboarding') {
          navigate('/onboarding', { state: { from: currentPath }, replace: true });
          return;
        } else if (currentPath !== '/pending-approval') {
          // Otherwise, redirect to pending approval
          navigate('/pending-approval', { state: { from: currentPath }, replace: true });
          return;
        }
      }
      
      // Redirect to dashboard if user is approved and trying to access onboarding or pending approval
      if (user.isApproved && (currentPath === '/onboarding' || currentPath === '/pending-approval')) {
        navigate('/agent', { replace: true });
        return;
      }
    }

    // Check if user has the required role
    if (roles && !roles.includes(user.role)) {
      navigate('/unauthorized', { replace: true });
      return;
    }
  }, [isAuthenticated, user, loading, requireApproval, navigate, location]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // This check is now handled in the useEffect
  if (!isAuthenticated || !user) {
    return null; // Will be redirected by the useEffect
  }

  // For guest users, allow access to guest-specific routes
  if (user.role === 'user' && user.user_type === 'guest') {
    if (roles && !roles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
    return children;
  }

  // For other users, check roles
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

// Onboarding and Pending Approval Wrapper
const AgentAuthWrapper = ({ children }) => {
  const { user } = useSelector(state => state.auth);
  
  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // If user is already approved, redirect to agent dashboard
  if (user.isApproved) {
    return <Navigate to="/agent" />;
  }
  
  return children;
};

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const cart = useSelector((state) => state.cart);
  const [showCart, setShowCart] = useState(false);
  
  useEffect(() => {
    console.log('ProtectedRoute - Checking access:', {
      isAuthenticated,
      user: user ? { role: user.role, user_type: user.user_type } : null,
      currentPath: location.pathname,
      loading
    });
    
    dispatch(loadUser());
  }, [dispatch]);
  
  return (
    <CurrencyProvider>
      <Modal />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/login" element={<GuestLogin />} />
        <Route path="/auth/register" element={<SimpleRegister />} />
        <Route path="/register" element={<GuestRegister />} />
        <Route path="/tours" element={<ToursPage />} />
        <Route path="/sightseeing/:id" element={<SightseeingDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="*" element={<NotFound />} />
        
        {/* Agent Onboarding Flow */}
        <Route path="/onboarding" element={
          <AgentAuthWrapper>
            <Onboarding />
          </AgentAuthWrapper>
        } />
        
        <Route path="/pending-approval" element={
          <AgentAuthWrapper>
            <PendingApproval />
          </AgentAuthWrapper>
        } />

        {/* Main Layout Routes - All routes here are protected and require authentication */}
        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          {/* Guest Dashboard */}
          <Route path="/guest-dashboard" element={
            <ProtectedRoute roles={['user']} requireApproval={false}>
              <GuestDashboard />
            </ProtectedRoute>
          } />
          <Route path="/my-bookings" element={
            <ProtectedRoute roles={['user']} requireApproval={false}>
              <GuestBookings />
            </ProtectedRoute>
          } />
          {/* Guest Booking Routes */}
          <Route path="/guest/checkout/:id" element={
            <ProtectedRoute roles={['user']}>
              <Checkout />
            </ProtectedRoute>
          } />
          <Route path="/guest/booking/:bookingId" element={
            <ProtectedRoute roles={['user']}>
              <BookingConfirmation />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          
          {/* Notifications */}
          <Route path="notifications" element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          } />

          {/* Agent Routes - Require approval */}
          <Route path="agent" element={
            <ProtectedRoute roles={['agent']} requireApproval={true}>
              <AgentDashboard />
            </ProtectedRoute>
          } />
          <Route path="agent/packages" element={
            <ProtectedRoute roles={['agent']}>
              <Packages />
            </ProtectedRoute>
          } />
          <Route path="agent/packages/:id" element={
            <ProtectedRoute roles={['agent']}>
              <PackageDetail />
            </ProtectedRoute>
          } />
          <Route path="agent/quotes" element={
            <ProtectedRoute roles={['agent']}>
              <MyQuotes />
            </ProtectedRoute>
          } />
          <Route path="agent/bookings" element={
            <ProtectedRoute roles={['agent']}>
              <MyBookings />
            </ProtectedRoute>
          } />
          <Route path="agent/leads" element={
            <ProtectedRoute roles={['agent']}>
              <MyLeads />
            </ProtectedRoute>
          } />
          <Route path="agent/wallet" element={
            <ProtectedRoute roles={['agent']}>
              <MyWallet />
            </ProtectedRoute>
          } />
          <Route path="agent/itineraries" element={
            <ProtectedRoute roles={['agent']}>
              <MyItineraries />
            </ProtectedRoute>
          } />
          <Route path="agent/itineraries/create" element={
            <ProtectedRoute roles={['agent']}>
              <ItineraryCreator />
            </ProtectedRoute>
          } />
          <Route path="agent/itinerary-builder" element={
            <ProtectedRoute roles={['agent']}>
              <ItineraryBuilder />
            </ProtectedRoute>
          } />
          <Route path="agent/my-claims" element={
            <ProtectedRoute roles={['agent']}>
              <MyClaims />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="admin" element={
            <Navigate to="/admin/dashboard" replace />
          } />
          <Route path="admin/dashboard" element={
            <ProtectedRoute roles={['admin', 'operations']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="admin/guest-bookings" element={
            <ProtectedRoute roles={['admin', 'operations']}>
              <GuestSightseeingBookings />
            </ProtectedRoute>
          } />
          <Route path="admin/users" element={
            <ProtectedRoute roles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="admin/approvals" element={
            <ProtectedRoute roles={['admin', 'accounts']}>
              <AgentApprovals />
            </ProtectedRoute>
          } />
          <Route path="admin/quotes" element={
            <ProtectedRoute roles={['admin', 'operations']}>
              <QuotesAdmin />
            </ProtectedRoute>
          } />
          <Route path="admin/claims" element={
            <ProtectedRoute roles={['admin', 'operations']}>
              <Claims />
            </ProtectedRoute>
          } />
          <Route path="admin/sightseeing" element={
            <ProtectedRoute roles={['admin']}>
              <SightseeingListAdmin />
            </ProtectedRoute>
          } />
          <Route path="admin/guest-sightseeings" element={
            <ProtectedRoute roles={['admin']}>
              <GuestSightseeings />
            </ProtectedRoute>
          } />
          <Route path="admin/guest-sightseeings/new" element={
            <ProtectedRoute roles={['admin']}>
              {React.createElement(require('./pages/admin/GuestSightseeingForm').default)}
            </ProtectedRoute>
          } />
          <Route path="admin/guest-sightseeings/:id/edit" element={
            <ProtectedRoute roles={['admin']}>
              {React.createElement(require('./pages/admin/GuestSightseeingForm').default)}
            </ProtectedRoute>
          } />

          {/* Operations Routes */}
          <Route path="operations/dashboard" element={
            <ProtectedRoute roles={['admin', 'operations']}>
              <BookingsAdmin />
            </ProtectedRoute>
          } />
          <Route path="operations/bookings" element={
            <ProtectedRoute roles={['admin', 'operations']}>
              <BookingsAdmin />
            </ProtectedRoute>
          } />
          <Route path="operations/wallet-transactions" element={
            <ProtectedRoute roles={['admin', 'operations']}>
              <WalletTransactions />
            </ProtectedRoute>
          } />
          <Route path="operations/packages" element={
            <ProtectedRoute roles={['admin', 'operations']}>
              <PackageList />
            </ProtectedRoute>
          } />
          <Route path="operations/sightseeing" element={
            <ProtectedRoute roles={['admin', 'operations']}>
              <SightseeingListOps />
            </ProtectedRoute>
          } />
          <Route path="operations/add-seller" element={
            <ProtectedRoute roles={['admin', 'operations']}>
              <AddSeller />
            </ProtectedRoute>
          } />
          <Route path="operations/quotes" element={
            <ProtectedRoute roles={['admin', 'operations']}>
              <QuotesAdmin />
            </ProtectedRoute>
          } />

          {/* Sales Routes */}
          <Route path="sales/leads" element={
            <ProtectedRoute roles={['sales', 'admin']}>
              <SalesLeads />
            </ProtectedRoute>
          } />
          <Route path="sales/leads/:id" element={
            <ProtectedRoute roles={['sales', 'admin']}>
              <SalesLeadDetail />
            </ProtectedRoute>
          } />

          <Route path="admin/wallet-transactions" element={
            <ProtectedRoute roles={['admin']}>
              <WalletTransactions />
            </ProtectedRoute>
          }/>
          <Route path="admin/bookings" element={
            <ProtectedRoute roles={['admin']}>
              <BookingsAdmin />
            </ProtectedRoute>
          }/>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </CurrencyProvider>
  );
}

export default App;
