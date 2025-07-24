import api from './api';

/**
 * Fetches users with the specified role
 * @param {string} role - Role to filter users by (e.g., 'sales', 'admin')
 * @returns {Promise<Array>} - Array of user objects
 */
export const fetchUsersByRole = async (role) => {
  try {
    const response = await api.get('/users', { params: { role } });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

/**
 * Formats a user's full name
 * @param {Object} user - User object with firstName and lastName
 * @returns {string} - Formatted full name
 */
export const formatUserName = (user) => {
  if (!user) return 'Unknown User';
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
};

/**
 * Formats a user's role for display
 * @param {string} role - User role
 * @returns {string} - Formatted role name
 */
export const formatUserRole = (role) => {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};
