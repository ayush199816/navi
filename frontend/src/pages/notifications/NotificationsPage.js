import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchNotifications, 
  markNotificationAsRead, 
  markAllAsRead,
  fetchUnreadCount 
} from '../../redux/slices/notificationSlice';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  BellAlertIcon 
} from '@heroicons/react/24/outline';

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount, loading } = useSelector((state) => ({
    notifications: state.notifications.notifications || [],
    unreadCount: state.notifications.unreadCount || 0,
    loading: state.notifications.loading
  }));

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkAsRead = async (notificationId) => {
    await dispatch(markNotificationAsRead(notificationId));
    dispatch(fetchUnreadCount());
  };

  const handleMarkAllAsRead = async () => {
    await dispatch(markAllAsRead());
    dispatch(fetchUnreadCount());
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'quote_response':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'quote_update':
        return <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <BellAlertIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getNotificationLink = (notification) => {
    switch (notification.type) {
      case 'quote_response':
      case 'quote_update':
        return `/quotes/${notification.relatedEntity?._id || ''}`;
      default:
        return '#';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-medium text-gray-900">Notifications</h1>
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <BellAlertIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
            <p className="mt-1 text-sm text-gray-500">You don't have any notifications yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <li key={notification._id} className={`${!notification.read ? 'bg-blue-50' : 'bg-white'} hover:bg-gray-50`}>
                <Link
                  to={getNotificationLink(notification)}
                  onClick={() => !notification.read && handleMarkAsRead(notification._id)}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {notification.message}
                        </p>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <time dateTime={notification.createdAt}>
                            {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                          </time>
                          {!notification.read && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
