import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiMapPin, 
  FiChevronLeft, 
  FiChevronRight,
  FiClock,
  FiStar,
  FiCheckCircle,
  FiGlobe,
  FiCompass,
  FiCalendar,
  FiSun,
  FiMoon,
  FiPlus,
  FiMinus,
  FiSearch,
  FiArrowRight,
  FiMail,
  FiSend,
  FiArrowUp,
  FiMenu,
  FiX,
  FiUser,
  FiHeart,
  FiShoppingCart,
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiLinkedin,
  FiYoutube,
  FiMapPin as FiPin,
  FiPhone,
  FiMail as FiMailIcon,
  FiClock as FiClockIcon,
  FiMessageSquare,
  FiTrendingUp,
  FiShield,
  FiSettings,
  FiUsers,
  FiBriefcase,
  FiHome,
  FiInfo,
  FiHelpCircle,
  FiCreditCard,
  FiArrowRight as FiArrowRightIcon,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiExternalLink,
  FiShare2,
  FiHeart as FiHeartIcon,
  FiBookmark,
  FiFilter,
  FiGrid,
  FiList,
  FiNavigation,
  FiDollarSign,
  FiCalendar as FiCalendarIcon,
  FiClock as FiClockOutline,
  FiUser as FiUserIcon,
  FiTag,
  FiAward,
  FiLayers,
  FiPieChart,
  FiTarget,
  FiZap,
  FiBox,
  FiGift,
  FiTruck,
  FiRefreshCw,
  FiThumbsUp,
  FiAward as FiAwardIcon,
  FiMap,
  FiEdit3,
  FiCreditCard as FiCard,
  FiMap as FiMapIcon
} from 'react-icons/fi';
import { FaStar, FaMapMarkerAlt, FaQuoteLeft, FaStar as StarIcon } from 'react-icons/fa';
import { FaGlobe } from 'react-icons/fa';
import api from '../utils/api';
import { motion } from 'framer-motion';
import WorldClock from '../components/WorldClock';
import CurrencyConverter from '../components/CurrencyConverter';
import TeamSection from '../components/TeamSection';
import Footer from '../components/Footer';

// Feature cards data - Three key features for Why Choose Us
const features = [
  {
    icon: <FiCompass className="w-12 h-12 text-blue-600 mb-6" />,
    title: 'Expertly Curated',
    description: 'Handpicked experiences by travel experts for authentic and memorable journeys.'
  },
  {
    icon: <FiGlobe className="w-12 h-12 text-blue-600 mb-6" />,
    title: 'Global Coverage',
    description: 'Explore breathtaking destinations worldwide with our extensive tour collection.'
  },
  {
    icon: <FiShield className="w-12 h-12 text-blue-600 mb-6" />,
    title: 'Secure & Safe',
    description: 'Your safety is our priority with secure payments and verified partners.'
  }
];

// Testimonials data
const testimonials = [
  {
    quote: 'The sightseeing tour was absolutely amazing! The guides were knowledgeable and the itinerary was perfect.',
    author: 'Sarah Johnson',
    rating: 5
  },
  {
    quote: 'Best travel experience ever! Everything was well-organized and exceeded our expectations.',
    author: 'Michael Chen',
    rating: 5
  },
  {
    quote: 'Highly recommend! The booking process was smooth and the tour was fantastic.',
    author: 'Emma Williams',
    rating: 4
  }
];

// How it works steps
const howItWorks = [
  {
    step: '1',
    title: 'Choose Your Sightseeing',
    description: 'Browse our wide selection of sightseeings and find your perfect tour.'
  },
  {
    step: '2',
    title: 'Book & Pay Securely',
    description: 'Complete your booking with our secure payment system.'
  },
  {
    step: '3',
    title: 'Prepare for Your Trip',
    description: 'Receive all necessary information and get ready for your adventure.'
  },
  {
    step: '4',
    title: 'Enjoy Your Experience',
    description: 'Embark on an unforgettable journey with our expert guides.'
  }
];

const LandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const carouselRef = useRef(null);
  
  // Fetch guest sightseeing data
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoading(true);
        // Fetch 6 random active sightseeings
        const response = await api.get('/guest-sightseeing?random=6&isActive=true');
        setDestinations(response.data.data);
      } catch (err) {
        console.error('Error fetching destinations:', err);
        setError('Failed to load destinations. Please try again later.');
        // Fallback to sample data if API fails
        setDestinations([
          {
            id: 'fallback-1',
            name: 'BALI',
            location: 'Indonesia',
            images: ['https://source.unsplash.com/1920x1080/?bali'],
            description: 'Experience the island of gods with its lush jungles, ancient temples, and pristine beaches that will take your breath away.',
            rating: 4.8,
            price: 1299,
            duration: '7 Days / 6 Nights'
          },
          {
            id: 'fallback-2',
            name: 'PHUKET',
            location: 'Thailand',
            images: ['https://source.unsplash.com/1920x1080/?phuket'],
            description: 'Discover the pearl of the Andaman with its crystal-clear waters, vibrant nightlife, and rich cultural heritage.',
            rating: 4.7,
            price: 1599,
            duration: '8 Days / 7 Nights'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDestinations();
  }, []);

  // Handle scroll for navbar
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate carousel when there are destinations
  useEffect(() => {
    if (destinations.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === destinations.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [destinations.length]);

  // Handle newsletter subscription
  const handleSubscribe = (e) => {
    e.preventDefault();
    // In a real app, you would send this to your backend
    console.log('Subscribing with email:', email);
    setIsSubscribed(true);
    setEmail('');
    // Reset subscription message after 5 seconds
    setTimeout(() => setIsSubscribed(false), 5000);
  };

  // Hero Section with Sightseeing Carousel
  const HeroSection = () => {
    // If still loading, show a simple hero
    if (loading) {
      return (
        <section className="relative h-screen flex items-center justify-center bg-gray-900">
          <div className="absolute inset-0 bg-gray-900 opacity-70"></div>
          <div className="container mx-auto px-4 z-10 text-center text-white">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-300">Loading amazing sightseeing experiences...</p>
          </div>
        </section>
      );
    }

    // Get current sightseeing experience
    const currentExperience = destinations[currentSlide];
    const experienceType = currentExperience?.type || 'Sightseeing';
    const experienceLocation = currentExperience?.location ? `in ${currentExperience.location}` : '';

    return (
      <section className="relative h-screen overflow-hidden">
        {/* Background Carousel */}
        <div className="absolute inset-0">
          {destinations.length > 0 ? (
            <div className="relative w-full h-full">
              {destinations.map((experience, index) => (
                <div 
                  key={experience.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    backgroundImage: `url(${experience.images[0] || 'https://source.unsplash.com/1920x1080/?sightseeing,landmark'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30"></div>
                </div>
              ))}
            </div>
          ) : (
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: 'url(https://source.unsplash.com/1920x1080/?sightseeing,landmark)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30"></div>
            </div>
          )}
        </div>
        
        {/* Hero content */}
        <div className="relative h-full flex items-center justify-center">
          <div className="container mx-auto px-4 z-10 text-center text-white">
            <motion.div 
              className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className="text-sm font-medium tracking-wider">{experienceType} Experience {experienceLocation}</span>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {currentExperience?.name || "Unforgettable Sightseeing Adventures"}
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {currentExperience?.description || "Discover the world's most iconic landmarks and hidden gems with our expert-guided sightseeing experiences."}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Link 
                to="/sightseeing" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors duration-300 transform hover:scale-105 inline-flex items-center justify-center"
              >
                <FiCompass className="mr-2" /> Explore Sightseeings
              </Link>
              
              {currentExperience && (
                <Link 
                  to={`/sightseeing/${currentExperience.id}`}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors duration-300 transform hover:scale-105 inline-flex items-center justify-center backdrop-blur-sm"
                >
                  <FiMapPin className="mr-2" /> View Experience
                </Link>
              )}
            </motion.div>
            
            {/* Experience Highlights */}
            {currentExperience && (
              <motion.div 
                className="mt-8 flex flex-wrap justify-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                {currentExperience.duration && (
                  <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full flex items-center">
                    <FiClock className="mr-2" /> {currentExperience.duration}
                  </div>
                )}
                {currentExperience.rating && (
                  <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full flex items-center">
                    <FaStar className="text-yellow-400 mr-1" /> {currentExperience.rating.toFixed(1)}
                  </div>
                )}
                {currentExperience.price && (
                  <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                    From ${currentExperience.offerPrice || currentExperience.price}
                  </div>
                )}
              </motion.div>
            )}
          </div>

         </div> 
        
        {/* Carousel indicators */}
        {destinations.length > 1 && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2">
            {destinations.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`View sightseeing experience ${index + 1}`}
              />
            ))}
          </div>
        )}
        
        {/* Navigation arrows */}
        {destinations.length > 1 && (
          <>
            <button
              onClick={() => setCurrentSlide(prev => (prev === 0 ? destinations.length - 1 : prev - 1))}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Previous sightseeing experience"
            >
              <FiChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setCurrentSlide(prev => (prev === destinations.length - 1 ? 0 : prev + 1))}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Next sightseeing experience"
            >
              <FiChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </section>
    );
  };

  // Features Section Component
  const FeaturesSection = () => (
    <section className="py-20 bg-gradient-to-b from-white to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20 max-w-4xl mx-auto">
          <span className="text-blue-600 font-semibold mb-4 inline-block">WHY CHOOSE NAVIGATIO</span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Your Journey, Our Expertise</h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto mb-8"></div>
          <p className="text-xl text-gray-600 mb-12">
            We combine local knowledge with global expertise to create unforgettable travel experiences tailored just for you.
            Discover the difference that sets us apart.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
          {features.slice(0, 3).map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white p-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 text-center border border-gray-100"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <div className="bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                {React.cloneElement(feature.icon, { className: 'w-10 h-10 text-blue-600' })}
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
              <div className="bg-blue-50 text-blue-600 text-sm font-medium px-4 py-2 rounded-full inline-block">
                Learn more →
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-20 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-lg inline-block max-w-4xl">
            <h3 className="text-2xl font-bold mb-4">Still Not Convinced?</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join thousands of satisfied travelers who have trusted us with their journeys. 
              Experience the Navigatio difference today with our best price guarantee.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
              Start Planning Your Trip
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  // Destinations Section Component
  const DestinationsSection = () => {
    if (loading) {
      return (
        <div className="py-16 bg-white">
          <div className="container mx-auto px-4 text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading amazing sightseeings...</p>
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="py-16 bg-white">
          <div className="container mx-auto px-4 text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-2xl mx-auto">
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Popular Sightseeings</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Discover our most sought-after sightseeing tours around the world</p>
            <div className="w-20 h-1 bg-blue-600 mx-auto mt-4"></div>
          </div>

          {destinations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {destinations.map((destination, index) => (
                <motion.div
                  key={destination.id}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={destination.images[0]}
                      alt={destination.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-white text-xl font-bold">{destination.name}</h3>
                          <div className="flex items-center text-white/80">
                            <FiMapPin className="mr-1" />
                            <span>{destination.location}</span>
                          </div>
                        </div>
                        <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                          <FaStar className="text-yellow-400 mr-1" />
                          <span className="text-white font-medium">{destination.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-gray-500 text-sm">From</span>
                        <p className="text-2xl font-bold text-gray-900">${destination.price}</p>
                      </div>
                      <span className="text-gray-500 text-sm">{destination.duration}</span>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2">{destination.description}</p>
                    <Link
                      to={`/tour/${destination.id}`}
                      className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `/tour/${destination.id}`;
                      }}
                    >
                      View Details
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No sightseeing available at the moment. Please check back later.</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/tours"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-colors duration-300"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/tours';
              }}
            >
              Explore Sightseeings
            </Link>
          </div>
        </div>
      </section>
    );
  };

  // How It Works Section Component
  const HowItWorksSection = () => {
    const steps = [
      {
        step: '1',
        title: 'Explore Destinations',
        description: 'Browse our curated collection of destinations and find your perfect getaway.',
        icon: <FiCompass className="w-8 h-8" />,
        details: 'Discover handpicked locations with detailed guides, photos, and traveler reviews to help you choose your next adventure.'
      },
      {
        step: '2',
        title: 'Customize Your Trip',
        description: 'Personalize your itinerary with activities and experiences that match your interests.',
        icon: <FiEdit3 className="w-8 h-8" />,
        details: 'Add tours, accommodations, and transportation options to create your dream vacation package.'
      },
      {
        step: '3',
        title: 'Book & Confirm',
        description: 'Secure your booking with our easy payment options and instant confirmation.',
        icon: <FiCreditCard className="w-8 h-8" />,
        details: 'Enjoy flexible payment plans and our best price guarantee when you book with us.'
      },
      {
        step: '4',
        title: 'Start Your Journey',
        description: 'Pack your bags and get ready for an unforgettable travel experience.',
        icon: <FiMap className="w-8 h-8" />,
        details: 'Receive all necessary travel documents and 24/7 support throughout your journey.'
      }
    ];

    return (
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto mb-20">
            <span className="text-blue-600 font-semibold mb-4 inline-block">OUR PROCESS</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Plan Your Perfect Getaway</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto mb-8"></div>
            <p className="text-xl text-gray-600">
              From dream to departure, we guide you through every step of planning your perfect trip. 
              Our streamlined process makes travel planning simple and stress-free.
            </p>
          </div>

          <div className="relative">
            {/* Timeline connector */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-100 to-blue-200 transform -translate-x-1/2"></div>
            
            {steps.map((step, index) => (
              <div key={index} className="relative z-10 mb-16 md:mb-24 last:mb-0">
                <motion.div
                  className={`flex flex-col md:flex-row items-center ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                >
                  {/* Step content */}
                  <div className={`w-full md:w-1/2 p-6 md:p-8 ${index % 2 === 0 ? 'md:pl-16' : 'md:pr-16'}`}>
                    <div className="bg-white rounded-xl shadow-xl p-8 h-full border border-gray-100">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl font-bold mr-4">
                          {step.step}
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                      </div>
                      <p className="text-gray-700 mb-4">{step.description}</p>
                      <p className="text-gray-500 text-sm">{step.details}</p>
                      {index === 1 && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-sm text-blue-700">
                            <span className="font-semibold">Pro Tip:</span> Save time by using our "Build Your Trip" tool to automatically create a personalized itinerary.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Step visual */}
                  <div className={`w-full md:w-1/2 p-6 md:p-8 ${index % 2 === 0 ? 'md:pr-16' : 'md:pl-16'}`}>
                    <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 h-full flex items-center justify-center border border-gray-100 shadow-lg">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-6">
                          {React.cloneElement(step.icon, { className: 'w-10 h-10' })}
                        </div>
                        <h4 className="text-xl font-semibold text-gray-800 mb-2">Step {step.step}</h4>
                        <p className="text-blue-600 font-medium">{step.title}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>

          {/* CTA Box */}
          <motion.div 
            className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 md:p-12 text-white text-center max-w-5xl mx-auto mt-16 shadow-xl"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to Start Your Journey?</h3>
              <p className="text-blue-100 text-lg mb-8">
                Join thousands of travelers who trust us to create their perfect vacation experiences. 
                Begin planning your dream trip today with our easy-to-use tools and expert guidance.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105">
                  Explore Destinations
                </button>
                <button className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-lg transition-all duration-300">
                  Contact Our Experts
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    );
  };

  // Testimonials Section Component
  const TestimonialsSection = () => {
    const testimonialData = [
      {
        quote: "Our trip to Bali was absolutely perfect! The attention to detail and personalized recommendations made it the best vacation we've ever had. The local guides were incredibly knowledgeable.",
        author: "Sarah Johnson",
        role: "Adventure Traveler",
        rating: 5,
        location: "New York, USA",
        image: 32,
        featured: true
      },
      {
        quote: "The cultural tour of Japan was beyond our expectations. Every detail was taken care of, and we experienced parts of the country we would have never found on our own. Highly recommended!",
        author: "Michael Chen",
        role: "Photography Enthusiast",
        rating: 5,
        location: "Vancouver, Canada",
        image: 15,
        featured: true
      },
      {
        quote: "As a solo female traveler, safety is my top priority. The team made me feel completely secure throughout my European tour. I'll definitely be booking with them again!",
        author: "Emma Rodriguez",
        role: "Solo Traveler",
        rating: 5,
        location: "London, UK",
        image: 43,
        featured: true
      },
      {
        quote: "The family vacation package to Costa Rica was perfect for our multi-generational family. Activities for all ages, comfortable accommodations, and seamless transportation.",
        author: "The Williams Family",
        role: "Family of Five",
        rating: 5,
        location: "Chicago, USA",
        image: 28,
        featured: false
      },
      {
        quote: "I've traveled to over 50 countries, and the safari experience arranged by Navigatio was hands down the most well-organized trip I've ever been on. The wildlife encounters were breathtaking!",
        author: "David Kim",
        role: "World Traveler",
        rating: 5,
        location: "Seoul, South Korea",
        image: 12,
        featured: false
      },
      {
        quote: "The culinary tour of Italy was a dream come true. From cooking classes with local chefs to exclusive vineyard visits, every meal was an experience to remember.",
        author: "Sophia Martinez",
        role: "Food Blogger",
        rating: 5,
        location: "Barcelona, Spain",
        image: 37,
        featured: false
      }
    ];

    return (
      <section className="py-24 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-blue-600 font-semibold mb-4 inline-block">TRAVELER STORIES</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Trusted by Travelers Worldwide</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto mb-8"></div>
            <p className="text-xl text-gray-600">
              Don't just take our word for it. Here's what our community of global travelers has to say about their experiences with us.
            </p>
          </div>

          {/* Featured Testimonials */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {testimonialData
              .filter(testimonial => testimonial.featured)
              .map((testimonial, index) => (
                <motion.div 
                  key={index}
                  className="bg-white p-8 rounded-2xl shadow-xl relative border border-gray-100"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                >
                  <div className="absolute top-8 left-8 text-blue-100 text-5xl -z-0">
                    <FaQuoteLeft />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className="text-yellow-400 w-5 h-5" />
                      ))}
                    </div>
                    <p className="text-gray-700 text-lg mb-8 leading-relaxed">"{testimonial.quote}"</p>
                    <div className="flex items-center">
                      <div className="w-14 h-14 rounded-full bg-gray-200 mr-4 overflow-hidden border-2 border-white shadow-md">
                        <img 
                          src={`https://i.pravatar.cc/300?img=${testimonial.image}`} 
                          alt={testimonial.author}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{testimonial.author}</h4>
                        <p className="text-blue-600 text-sm">{testimonial.role}</p>
                        <div className="flex items-center text-gray-500 text-sm mt-1">
                          <FiMapPin className="w-3.5 h-3.5 mr-1" />
                          <span>{testimonial.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>

          {/* Stats Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">50K+</div>
                <p className="text-gray-600">Happy Travelers</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">100+</div>
                <p className="text-gray-600">Destinations</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">4.9/5</div>
                <p className="text-gray-600">Average Rating</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">24/7</div>
                <p className="text-gray-600">Support</p>
              </motion.div>
            </div>
          </div>

          {/* Additional Testimonials */}
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">More Traveler Experiences</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">Hear from more of our community members about their unforgettable journeys</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonialData
              .filter(testimonial => !testimonial.featured)
              .map((testimonial, index) => (
                <motion.div 
                  key={index}
                  className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 mr-4 overflow-hidden">
                      <img 
                        src={`https://i.pravatar.cc/300?img=${testimonial.image}`} 
                        alt={testimonial.author}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{testimonial.author}</h4>
                      <div className="flex items-center">
                        <div className="flex mr-2">
                          {[...Array(5)].map((_, i) => (
                            <FaStar key={i} className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">{testimonial.rating}.0</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-4">"{testimonial.quote}"</p>
                  <div className="mt-4 flex items-center text-sm text-gray-500">
                    <FiMapPin className="w-3.5 h-3.5 mr-1" />
                    <span>{testimonial.location}</span>
                  </div>
                </motion.div>
              ))}
          </div>

          <div className="text-center mt-16">
            <button className="bg-white hover:bg-gray-50 text-blue-600 font-semibold px-8 py-3 rounded-lg border-2 border-blue-600 transition-all duration-300 hover:shadow-lg">
              Read More Stories
            </button>
          </div>
        </div>
      </section>
    );
  };

  // Call to Action Section Component
  const CTASection = () => (
    <section className="py-16 bg-blue-600 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready for Your Next Adventure?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">Join thousands of travelers who have experienced the world with us</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            to="/tours" 
            className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-full transition-colors duration-300 inline-block"
          >
            Explore Tours
          </Link>
          <Link 
            to="/contact" 
            className="border-2 border-white text-white hover:bg-white/10 font-bold py-3 px-8 rounded-full transition-colors duration-300 inline-block"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );

  // Newsletter Section Component
  const NewsletterSection = () => (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
          <div className="md:flex">
            <div className="md:flex-shrink-0 bg-blue-600 p-8 flex items-center justify-center">
              <FiMail className="w-16 h-16 text-white" />
            </div>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Stay Updated</h2>
              <p className="text-gray-600 mb-6">Subscribe to our newsletter for travel inspiration, exclusive deals, and more.</p>
              
              {isSubscribed ? (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  Thank you for subscribing! We'll keep you updated with our latest offers.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-grow px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
                  >
                    Subscribe <FiArrowRight />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // Main component return
  return (
    <div className="overflow-x-hidden">
      {/* 1. Hero Section */}
      <HeroSection />
      
      {/* 2. Popular Sightseeing Section */}
      <DestinationsSection />
      
      {/* 3. World Clock Section */}
      {/* World Clock Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <WorldClock />
          </div>
        </div>
      </section>
      
      {/* Currency Converter Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <CurrencyConverter />
          </div>
        </div>
      </section>
      
      {/* 4. Features Section */}
      <FeaturesSection />
      
      {/* 5. How It Works Section */}
      <HowItWorksSection />
      
      {/* 6. Testimonials Section */}
      <TestimonialsSection />
      
      {/* 7. Team Section */}
      <TeamSection />
      
      {/* 8. CTA Section */}
      <CTASection />
      
      {/* 8. Newsletter Section */}
      <NewsletterSection />
      
      {/* 9. Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
