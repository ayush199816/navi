import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMapPin, FiInfo, FiImage, FiStar, FiArrowLeft, FiShoppingCart, FiUser } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';

const SightseeingNav = ({ sightseeing, children }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const sightseeingId = path.split('/')[2];
  const { items: cartItems } = useSelector((state) => state.cart);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { id: 'overview', label: 'Over', icon: <FiInfo className="mr-2" />, isInternal: true },
    { id: 'gallery', label: 'Gallery', icon: <FiImage className="mr-2" />, isExternal: true },
    { id: 'location', label: 'Location', icon: <FiMapPin className="mr-2" />, isExternal: true },
    { id: 'reviews', label: 'Reviews', icon: <FiStar className="mr-2" />, isExternal: true },
  ];

  return (
    <div className="bg-gradient-to-r from-blue-900 to-orange-600 shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <FiArrowLeft className="h-6 w-6 text-white/90 mr-2" />
              <span className="text-xl font-semibold text-white">Back to Home</span>
            </Link>
          </div>
          
          {children && (
            <div className="flex items-center space-x-4">
              {children}
            </div>
          )}
          
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-4">
              {navItems.map((item) => (
                item.isExternal ? (
                  <a
                    key={item.id}
                    href="https://www.google.com/search?sca_esv=61a9446aba78e5ee&sxsrf=AE3TifN2k5vg-m3PCoAiHNSVDyGya_T8qw:1765359762819&si=AMgyJEtREmoPL4P1I5IDCfuA8gybfVI2d5Uj7QMwYCZHKDZ-E-8MLiu9knu7KkiSzfgpZjoKrlaApOlm0kTxIBDiw6pWzF-dwn79R59QzJYtPMQmM9PMWYjgBHDLLb5cmiXQlhx1k3EX&q=Navigatio+ASIA+Reviews&sa=X&ved=2ahUKEwiF68DM3bKRAxUTwTgGHSCmAz8Q0bkNegQIMxAE&biw=1707&bih=772&dpr=1.13"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-md text-sm font-medium flex items-center text-white/80 hover:text-white hover:border-b-2 hover:border-white/60"
                  >
                    {item.icon}
                    {item.label}
                  </a>
                ) : (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                      path.endsWith(`#${item.id}`) || 
                      (path.endsWith(sightseeingId) && item.id === 'overview')
                        ? 'text-white border-b-2 border-orange-300'
                        : 'text-white/80 hover:text-white hover:border-b-2 hover:border-white/60'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </a>
                )
              ))}
            </div>
            
            <div className="flex items-center space-x-4 border-l border-white/20 pl-6 ml-2">
              <button 
                onClick={() => navigate('/cart')}
                className="relative p-2 text-white/90 hover:text-white focus:outline-none"
              >
                <FiShoppingCart className="h-5 w-5" />
                {cartItems?.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </button>
              
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={toggleDropdown}
                    className="flex items-center space-x-2 focus:outline-none"
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="true"
                  >
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-white">
                      {user?.name || 'User'}
                    </span>
                  </button>
                  <div 
                    className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ${isDropdownOpen ? 'block' : 'hidden'}`}
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/my-bookings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      My Bookings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => navigate('/login')}
                  className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none flex items-center"
                >
                  <FiUser className="h-5 w-5 mr-1" />
                  <span className="text-sm font-medium">Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SightseeingNav;
