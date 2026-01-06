import React from 'react';
import { Helmet } from 'react-helmet';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Terms and Conditions - Book My Sight</title>
        <link rel="canonical" href="https://www.bookmysight.com/terms" />
      </Helmet>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms and Conditions</h1>
        <div className="bg-white shadow-lg rounded-lg p-6">
          <p className="text-gray-700">
            This is the terms and conditions page for Book My Sight. Please read these terms carefully before using our services.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
