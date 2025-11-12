import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Redirects user to the correct dashboard or onboarding form after login,
 * based on their role and user type.
 */
const PostLoginRedirect = () => {
  const { user, isAuthenticated, loading } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    // Don't do anything if still loading or not authenticated
    if (loading || !isAuthenticated || !user) {
      return;
    }

    // If user was redirected from a specific page, send them back there
    if (from && from !== '/' && from !== '/dashboard') {
      navigate(from, { replace: true });
      return;
    }

    const { role, user_type: userType, isApproved, onboardingCompleted } = user;
    
    // Handle guest users
    if (role === 'user' && userType === 'guest') {
      navigate('/guest-dashboard', { replace: true });
      return;
    }

    // Handle agent-specific flow
    if (role === 'agent') {
      if (!isApproved) {
        // If agent is not approved, redirect to pending approval
        navigate('/pending-approval', { replace: true });
      } else if (!onboardingCompleted) {
        // If agent is approved but hasn't completed onboarding
        navigate('/onboarding', { replace: true });
      } else {
        // Agent is approved and has completed onboarding
        navigate('/agent', { replace: true });
      }
      return;
    }

    // Handle other user types
    switch (role) {
      case 'admin':
        navigate('/admin/dashboard', { replace: true });
        break;
      case 'sales':
        navigate('/sales/leads', { replace: true });
        break;
      case 'operations':
        navigate('/operations/bookings', { replace: true });
        break;
      default:
        // Default to home page if no specific role is matched
        navigate('/', { replace: true });
    }
  }, [user, isAuthenticated, loading, navigate, from]);

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
};

export default PostLoginRedirect;
