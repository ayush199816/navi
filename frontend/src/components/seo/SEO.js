import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SEO = ({ 
  title = 'BookMySight - Book Tours & Activities Worldwide',
  description = 'Discover and book the best tours, activities, and sightseeing experiences worldwide. Instant confirmation, best price guarantee, and 24/7 customer support.',
  image = '/og-image.jpg',
  type = 'website',
  keywords = 'tours, activities, sightseeing, travel experiences, vacation packages, guided tours, adventure tours, city tours, travel booking',
  structuredData = null
}) => {
  const { pathname } = useLocation();
  const siteUrl = 'https://bookmysight.com';
  const canonicalUrl = `${siteUrl}${pathname}`;
  
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "name": "BookMySight",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "description": "Book the best tours, activities, and sightseeing experiences worldwide.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Mumbai",
      "addressRegion": "Maharashtra",
      "addressCountry": "IN"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "support@bookmysight.com",
      "availableLanguage": ["English", "Hindi"]
    },
    "sameAs": [
      "https://www.facebook.com/BookMySight",
      "https://www.instagram.com/BookMySight",
      "https://twitter.com/BookMySight"
    ]
  };

  const schemaData = structuredData || defaultStructuredData;

  return (
    <Helmet>
      {/* Standard metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${image}`} />
      <meta property="og:site_name" content="BookMySight" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${image}`} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
};

export default SEO;
