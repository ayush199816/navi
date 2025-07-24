import React from 'react';
import { 
  CurrencyRupeeIcon, 
  ArrowTrendingUpIcon,
  ClockIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

const WalletSummary = ({ wallet, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="bg-white overflow-hidden shadow rounded-lg p-5">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-200 h-12 w-12"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Wallet Balance',
      value: `₹${wallet.balance.toLocaleString()}`,
      icon: CurrencyRupeeIcon,
      bgColor: 'bg-primary-100',
      iconColor: 'text-primary-600',
      description: 'Available for bookings'
    },
    {
      title: 'Credit Limit',
      value: `₹${wallet.creditLimit.toLocaleString()}`,
      icon: CreditCardIcon,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      description: 'Total credit available'
    },
    {
      title: 'Available Credit',
      value: `₹${wallet.availableCredit.toLocaleString()}`,
      icon: ArrowTrendingUpIcon,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      description: 'Remaining credit'
    },
    {
      title: 'Pending Amount',
      value: `₹${wallet.pendingAmount.toLocaleString()}`,
      icon: ClockIcon,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      description: 'Transactions in process'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${card.bgColor} rounded-md p-3`}>
                <card.icon className={`h-6 w-6 ${card.iconColor}`} aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{card.title}</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{card.value}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <div className="font-medium text-gray-500">
                {card.description}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WalletSummary;
