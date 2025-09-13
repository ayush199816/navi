import React from 'react';
import { FiMail, FiPhone, FiMapPin, FiClock, FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const ContactUs = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back to Home Button */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
            <FiArrowLeft className="mr-2" />
            Back to Home
          </Link>
        </div>
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Contact Us
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            We'd love to hear from you. Get in touch with our team.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Contact Information</h2>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <FiPhone className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Call Us</h3>
                  <div className="mt-1 text-lg text-gray-600">
                    <a href="tel:+919628912345" className="hover:text-blue-600 transition-colors">
                      +91 (962) 891 2345
                    </a>
                    <a href="tel:+919219755463" className="hover:text-blue-600 transition-colors">
                      +91 (921) 97 55463
                    </a>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Monday to Friday, 9am to 9pm</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <FiMail className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Email Us</h3>
                  <div className="mt-1 text-lg text-gray-600">
                    <a href="mailto:info@navigatio.com" className="hover:text-blue-600 transition-colors">
                      info@navigatio.com
                    </a>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">We'll respond within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <FiMapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Visit Us</h3>
                  <div className="mt-1 text-lg text-gray-600">
                  Reg. Address:<br /><br />

                  4th Floor, Halwasiya Court,<br />
                  Hazratganj, Lucknow,<br />
                  Uttar Pradesh 226001
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Open in Google Maps</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">Business Hours</h3>
              <div className="space-y-2 max-w-sm mx-auto">
                {[
                  { day: 'Monday - Friday', hours: '9:00 AM - 9:00 PM' },
                  { day: 'Saturday', hours: '10:00 AM - 8:00 PM' },
                  { day: 'Sunday', hours: 'Closed' },
                ].map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600">{item.day}</span>
                    <span className="text-gray-900 font-medium">{item.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="mt-16 bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto">
          <div className="h-96 bg-gray-200 flex items-center justify-center">
            <div className="text-center">
              <FiMapPin className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Our Location</h3>
              <p className="mt-1 text-gray-500">Reg. Address:<br />
                  
              4th Floor, Halwasiya Court,<br />
              Hazratganj, Lucknow,<br />
              Uttar Pradesh 226001</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
