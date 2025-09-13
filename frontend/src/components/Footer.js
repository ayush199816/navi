import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-blue-700 to-blue-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* About Section */}
          <div className="mb-8 md:mb-0">
            <h3 className="text-2xl font-bold mb-6 text-white">BookMySight.com</h3>
            <p className="text-blue-100 mb-6 leading-relaxed">
              Your trusted travel companion for discovering the world's most amazing destinations and experiences.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/navigatio.asia" className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all duration-300">
                <FaInstagram className="w-5 h-5 text-white" />
              </a>
              <a href="https://r.search.yahoo.com/_ylt=Awr1QafZAbBoAwIAb.q7HAx.;_ylu=Y29sbwNzZzMEcG9zAzEEdnRpZAMEc2VjA3Ny/RV=2/RE=1757574873/RO=10/RU=https%3a%2f%2fin.linkedin.com%2fcompany%2fnavigatioasiadmc/RK=2/RS=APqsqLqqTplXP75ytLdILiaK028-" className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all duration-300">
                <FaLinkedin className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mb-8 md:mb-0">
            <h4 className="text-lg font-semibold mb-6 text-white border-b border-white/20 pb-2">Quick Links</h4>
            <ul className="space-y-3">
              <li><a href="#home" className="text-blue-100 hover:text-white transition-colors flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-300 rounded-full mr-2"></span> Home
              </a></li>
              <li><a href="#popular-sightseeings" className="text-blue-100 hover:text-white transition-colors flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-300 rounded-full mr-2"></span> Popular Sightseeings
              </a></li>
              <li><a href="#world-clock" className="text-blue-100 hover:text-white transition-colors flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-300 rounded-full mr-2"></span> World Clock
              </a></li>
              <li><a href="#currency-converter" className="text-blue-100 hover:text-white transition-colors flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-300 rounded-full mr-2"></span> Currency Converter
              </a></li>
              <li><a href="/terms" className="text-blue-100 hover:text-white transition-colors flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-300 rounded-full mr-2"></span> Terms & Conditions
              </a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="mb-8 md:mb-0">
            <h4 className="text-lg font-semibold mb-6 text-white border-b border-white/20 pb-2">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="bg-white/10 p-2 rounded-lg mr-3">
                  <FaMapMarkerAlt className="text-white" />
                </div>
                <div>
                  <p className="font-medium">Reg. Address:</p>
                  <a 
                    href="https://www.google.com/maps/place/Rustampur,+Gorakhpur,+Uttar+Pradesh+273001" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-100 hover:text-white transition-colors hover:underline"
                  >
                    Rustampur, Gorakhpur,<br />
                    Gorakhpur, Uttar Pradesh- 273001
                  </a>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-white/10 p-2 rounded-lg mr-3">
                  <FaMapMarkerAlt className="text-white" />
                </div>
                <div>
                  <p className="font-medium">Branch:</p>
                  <a 
                    href="https://www.google.com/maps/place/Halwasiya+Court,+Hazratganj,+Lucknow,+Uttar+Pradesh+226001" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-100 hover:text-white transition-colors hover:underline"
                  >
                    4th Floor, Halwasiya Court,<br />
                    Hazratganj, Lucknow,<br />
                    Uttar Pradesh 226001
                  </a>
                </div>
              </li>
              <li className="flex items-center">
                <div className="bg-white/10 p-2 rounded-lg mr-3">
                  <FaPhone className="text-white" />
                </div>
                <a href="tel:+1234567890" className="text-blue-100 hover:text-white transition-colors">+91 9628912345<br></ br>+91 929755463</a>
              </li>
              <li className="flex items-start">
                <div className="bg-white/10 p-2 rounded-lg mr-3 mt-1">
                  <FaEnvelope className="text-white" />
                </div>
                <div>
                  <p>Email:</p>
                  <div className="flex space-x-2 mt-1">
                    <a 
                      href="https://mail.google.com/mail/?view=cm&fs=1&to=info@navigatio.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-100 hover:text-white transition-colors hover:underline text-sm flex items-center"
                      title="Compose in Gmail"
                    >
                      <img src="https://www.google.com/gmail/about/static/images/logo-gmail.png" alt="Gmail" className="h-4 w-4 mr-1" />
                      Gmail
                    </a>
                    <span className="text-gray-400">|</span>
                    <a 
                      href="https://outlook.office.com/mail/deeplink/compose?to=info@navigatio.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-100 hover:text-white transition-colors hover:underline text-sm flex items-center"
                      title="Compose in Outlook"
                    >
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg/1200px-Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg.png" alt="Outlook" className="h-4 w-4 mr-1" />
                      Outlook
                    </a>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-white border-b border-white/20 pb-2">Newsletter</h4>
            <p className="text-blue-100 mb-4">Subscribe to our newsletter for the latest travel deals and updates.</p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="px-4 py-3 w-full rounded-l-lg focus:outline-none focus:ring-2 focus:ring-white text-gray-900"
              />
              <button className="bg-white text-blue-700 hover:bg-blue-50 font-medium px-6 py-3 rounded-r-lg transition-colors">
                Subscribe
              </button>
            </div>
            
            {/* Social Media Section */}
            <div className="mt-8">
              <h4 className="text-lg font-semibold mb-4 text-white border-b border-white/20 pb-2">Follow Us</h4>
              <div className="flex space-x-3">
                <a href="https://www.instagram.com/navigatio.asia" className="bg-white/10 hover:bg-white/20 p-3 rounded-lg transition-all duration-300 flex items-center">
                  <FaInstagram className="w-5 h-5 text-white" />
                </a>
                <a href="https://r.search.yahoo.com/_ylt=Awr1QafZAbBoAwIAb.q7HAx.;_ylu=Y29sbwNzZzMEcG9zAzEEdnRpZAMEc2VjA3Ny/RV=2/RE=1757574873/RO=10/RU=https%3a%2f%2fin.linkedin.com%2fcompany%2fnavigatioasiadmc/RK=2/RS=APqsqLqqTplXP75ytLdILiaK028-" className="bg-white/10 hover:bg-white/20 p-3 rounded-lg transition-all duration-300 flex items-center">
                  <FaLinkedin className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-blue-100 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} BookMySight.com. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
