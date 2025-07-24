// Status badge styles
export const statusBadges = {
  new: {
    label: 'New',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  contacted: {
    label: 'Contacted',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
  },
  qualified: {
    label: 'Qualified',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  proposal_sent: {
    label: 'Proposal Sent',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
  },
  negotiation: {
    label: 'In Negotiation',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
  },
  won: {
    label: 'Won',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  lost: {
    label: 'Lost',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  },
};

// Priority badge styles
export const priorityBadges = {
  low: {
    label: 'Low',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
  },
  medium: {
    label: 'Medium',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  high: {
    label: 'High',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  },
};

// Get next status in the sales pipeline
export const getNextStatus = (currentStatus) => {
  const statusFlow = [
    'new',
    'contacted',
    'qualified',
    'proposal_sent',
    'negotiation',
    'won',
  ];
  
  const currentIndex = statusFlow.indexOf(currentStatus);
  return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;
};

// Format date for display
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};
