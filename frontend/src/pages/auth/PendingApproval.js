import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from '../../redux/slices/authSlice';

const PendingApproval = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  // Check if user is approved
  useEffect(() => {
    if (user?.isApproved) {
      navigate('/agent');
    }
  }, [user, navigate]);

  // Refresh user data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(loadUser());
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const handleLogout = () => {
    // Implement logout logic
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Account Under Review
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Thank you for submitting your information. Your account is currently under review by our team.
          </p>
          <p className="mt-2 text-center text-sm text-gray-600">
            We'll notify you via email once your account has been approved. This usually takes 1-2 business days.
          </p>
          <div className="mt-8">
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Logout
            </button>
          </div>
          <div className="mt-6">
            <p className="text-center text-sm text-gray-500">
              Need help?{' '}
              <a
                href="mailto:support@navigatio.com"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
