import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Redirects user to the correct dashboard or onboarding form after login,
 * based on their role and user type.
 * Assumes user info is in state.auth.user
 */
const PostLoginRedirect = () => {
  const user = useSelector(state => state.auth.user);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (!user) return;

    // If user was redirected to login, send them back to where they were trying to go
    if (from !== '/') {
      navigate(from, { replace: true });
      return;
    }

    const { role, user_type: userType, onboardingCompleted } = user;
    
    // Handle guest users
    if (role === 'user' && userType === 'guest') {
      navigate('/guest-dashboard', { replace: true });
      return;
    }

    // Handle other user types
    switch (role) {
      case 'agent':
        navigate(onboardingCompleted ? '/agent/dashboard' : '/agent/onboarding', { replace: true });
        break;
      case 'admin':
        navigate('/admin/dashboard', { replace: true });
        break;
      case 'sales':
        navigate('/sales/dashboard', { replace: true });
        break;
      case 'operation':
        navigate('/operations/dashboard', { replace: true });
        break;
      default:
        // Default to home page if no specific role is matched
        navigate('/', { replace: true });
    }
  }, [user, navigate, from]);

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
};

export default PostLoginRedirect;
