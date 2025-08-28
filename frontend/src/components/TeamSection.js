import React from 'react';
import { FiTwitter, FiLinkedin, FiInstagram, FiMail } from 'react-icons/fi';
import { motion } from 'framer-motion';

const teamMembers = [
  {
    name: 'Anitya',
    role: 'CEO & Founder',
    image: 'https://res.cloudinary.com/dqlcup2s7/image/upload/v1756216485/Tarun_wxdza0.jpg',
    bio: 'Travel enthusiast with over 15 years of experience in the tourism industry. Anitya founded Navigatio with a vision to make travel planning seamless and enjoyable for everyone.',
    email: 'anitya.india@gmail.com',
  },
  {
    name: 'Parul',
    role: 'Destination Expert',
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
    bio: 'With a passion for discovering hidden gems, Sarah curates unique travel experiences that go beyond the typical tourist paths.',
    email: 'navigatio.asia@gmail.com',
  },
  {
    name: 'Ayush',
    role: 'COO',
    image: 'https://res.cloudinary.com/dqlcup2s7/image/upload/v1756216485/ayush_q9foqq.jpg',
    bio: 'Ayush ensures every aspect of your journey runs smoothly, from booking to return, with meticulous attention to detail.',
    email: 'info@navigatioasia.com',
    social: {
      linkedin: 'https://www.linkedin.com/in/ayush-gupta-3419791a3',
      instagram: 'https://www.instagram.com/life.lineage'
    }
  },
];

const TeamSection = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section className="relative py-20 bg-gradient-to-b from-blue-50 to-white overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxIiBmaWxsPSIjMDA3OGQ3IiBvcGFjaXR5PSIwLjIiLz4KPC9zdmc+')]" />
      </div>
      
      <div className="container mx-auto px-4 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-blue-600 bg-blue-100 px-4 py-1 rounded-full text-sm font-medium mb-4">Our Team</span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Meet the Navigatio Team</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 mx-auto mb-6 rounded-full"></div>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            The passionate individuals behind Navigatio who work tirelessly to make your travel dreams a reality.
          </p>
        </motion.div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {teamMembers.map((member, index) => (
            <motion.div 
              key={index}
              variants={item}
              className="group bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-3 border border-gray-100"
            >
              <div className="relative overflow-hidden h-80">
                <img 
                  src={member.image} 
                  alt={member.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-sm text-gray-200 mb-4">{member.bio}</p>
                    <div className="flex justify-center space-x-4 mt-4">
                      <a 
                        href={member.social.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-blue-500 text-white transition-colors duration-300"
                        aria-label={`${member.name}'s Twitter`}
                      >
                        <FiTwitter className="w-5 h-5" />
                      </a>
                      <a 
                        href={member.social.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-blue-600 text-white transition-colors duration-300"
                        aria-label={`${member.name}'s LinkedIn`}
                      >
                        <FiLinkedin className="w-5 h-5" />
                      </a>
                      <a 
                        href={`mailto:${member.email}`}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-gray-600 text-white transition-colors duration-300"
                        aria-label={`Email ${member.name}`}
                      >
                        <FiMail className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {member.name}
                </h3>
                <p className="text-blue-600 font-medium">{member.role}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TeamSection;
