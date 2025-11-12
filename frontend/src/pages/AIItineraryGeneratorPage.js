import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiDownload, FiMessageSquare } from 'react-icons/fi';

const AIItineraryGeneratorPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    requirements: '',
  });
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState('');
  const [error, setError] = useState('');
  // Removed unused itineraryRef

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setItinerary(''); // Reset itinerary before making a new request
    
    try {
      const response = await axios.post('/api/ai/itinerary', {
        destination: formData.destination,
        dates: {
          startDate: formData.startDate,
          endDate: formData.endDate
        },
        preferences: formData.requirements
      });
      
      console.log('API Response:', response.data); // Debug log
      
      // Handle the response based on its structure
      let itineraryText = '';
      
      if (typeof response.data === 'string') {
        // If the response is a string, use it directly
        itineraryText = response.data;
      } else if (response.data && response.data.itinerary) {
        // If the response has an itinerary field
        itineraryText = response.data.itinerary;
      } else if (response.data && response.data.message) {
        // If the response has a message field
        itineraryText = response.data.message;
      } else if (response.data) {
        // If the response is an object, try to stringify it
        itineraryText = JSON.stringify(response.data, null, 2);
      }
      
      // Clean up the itinerary text
      if (itineraryText) {
        // Remove any markdown code blocks if present
        itineraryText = itineraryText.replace(/```(?:markdown)?\n?([\s\S]*?)\n?```/g, '$1');
        // Trim any extra whitespace
        itineraryText = itineraryText.trim();
      }
      
      setItinerary(itineraryText);
      
    } catch (err) {
      console.error('Error generating itinerary:', err);
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error || 
                         'Failed to generate itinerary. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadItinerary = () => {
    // Create a new window with the itinerary content
    const printWindow = window.open('', '', 'width=900,height=900');
    const title = `Travel Itinerary - ${formData.destination} (${formData.startDate} to ${formData.endDate})`;
    
    // Get the HTML content of the itinerary
    const content = document.getElementById('itinerary-content').innerHTML;
    
    // Calculate trip duration in days
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const tripDuration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Format the date for display
    const formattedDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Create a clean HTML document for printing with improved styling
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          @page {
            size: A4;
            margin: 1.5cm;
            @top-right {
              content: "BookMySight";
              font-size: 10px;
              color: #6b7280;
              font-style: italic;
            }
          }
          
          body { 
            font-family: 'Inter', Arial, sans-serif;
            line-height: 1.6; 
            color: #1f2937;
            padding: 0;
            margin: 0;
            background: #ffffff;
            font-size: 14px;
          }
          
          .page {
            padding: 2.5cm;
            max-width: 21cm;
            margin: 0 auto;
            position: relative;
          }
          
          .header {
            text-align: center;
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 2px solid #e5e7eb;
          }
          
          h1 {
            color: #111827;
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 0.5rem;
            line-height: 1.2;
          }
          
          .subtitle {
            color: #4b5563;
            font-size: 16px;
            margin: 0 0 1.5rem;
          }
          
          .trip-info {
            display: flex;
            justify-content: space-between;
            background: #f9fafb;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            gap: 1rem;
          }
          
          .info-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #4b5563;
          }
          
          .info-item svg {
            width: 18px;
            height: 18px;
            color: #6b7280;
          }
          
          .day-section {
            margin-bottom: 2.5rem;
            page-break-inside: avoid;
          }
          
          .day-header {
            background: #3b82f6;
            color: white;
            padding: 0.75rem 1.25rem;
            border-radius: 6px;
            margin-bottom: 1.25rem;
            font-weight: 600;
            font-size: 16px;
          }
          
          .time-slot {
            margin-bottom: 1.5rem;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }
          
          .time-header {
            background: #f3f4f6;
            padding: 0.75rem 1.25rem;
            font-weight: 600;
            color: #1f2937;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          
          .time-header svg {
            width: 16px;
            height: 16px;
          }
          
          .time-content {
            padding: 1.25rem;
          }
          
          .activity {
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px dashed #e5e7eb;
          }
          
          .activity:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
          }
          
          .activity-title {
            font-weight: 600;
            color: #111827;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .activity-details {
            color: #4b5563;
            margin-left: 1.5rem;
          }
          
          .activity-details p {
            margin: 0.5rem 0;
          }
          
          ul {
            margin: 0.5rem 0 0.5rem 1.5rem;
            padding: 0;
          }
          
          li {
            margin-bottom: 0.25rem;
            position: relative;
            padding-left: 1.5rem;
          }
          
          li:before {
            content: "•";
            color: #3b82f6;
            font-weight: bold;
            position: absolute;
            left: 0;
          }
          
          .tips-section {
            background: #f0f9ff;
            border-left: 4px solid #0ea5e9;
            padding: 1.25rem;
            border-radius: 0 6px 6px 0;
            margin-top: 2rem;
          }
          
          .tips-title,
          .sub-heading {
            font-weight: 600;
            color: #0369a1;
            margin: 1.5rem 0 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 16px;
            padding-bottom: 0.25rem;
            border-bottom: 2px solid #e5e7eb;
          }
          
          /* Special styling for specific sub-headings */
          .sub-heading:before {
            content: '';
            display: inline-block;
            width: 6px;
            height: 18px;
            background-color: #3b82f6;
            margin-right: 12px;
            border-radius: 3px;
          }
          
          .sub-heading {
            font-weight: 700 !important;
            font-size: 18px;
            color: #1e40af;
            margin: 1.5rem 0 1rem;
            padding: 0.5rem 0;
            display: block;
            width: 100%;
            border-bottom: 2px solid #e5e7eb;
          }
          
          .footer {
            margin-top: 3rem;
            padding-top: 1.5rem;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 13px;
          }
          
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            transform-origin: center center;
            font-size: 60px;
            font-weight: 800;
            color: rgba(0, 0, 0, 0.03);
            pointer-events: none;
            white-space: nowrap;
            z-index: 9999;
            font-family: 'Inter', sans-serif;
            opacity: 0.7;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .page {
              padding: 1.5cm;
            }
            
            .watermark {
              display: block !important;
            }
            
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="watermark">BookMySight.com</div>
        
        <div class="page">
          <div class="header">
            <h1>${title}</h1>
            <p class="subtitle">${formData.name ? `Personalized Travel Itinerary for ${formData.name}` : 'Your Personalized Travel Itinerary'}</p>
            
            <div class="trip-info">
              <div class="info-item">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                ${formData.startDate} - ${formData.endDate}
              </div>
              <div class="info-item">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                ${formData.destination}
              </div>
              <div class="info-item">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ${tripDuration} Days
              </div>
            </div>
          </div>
          
          <div class="itinerary-content">
            ${content
              // First, remove any existing bullet points or list items
              .replace(/<li>\s*<h3>\s*\*?\s*Traveler Tips for the Day\s*\*?\s*<\/h3>\s*<\/li>/gi, '')
              .replace(/<li>\s*<h3>\s*\*?\s*Estimated Time for Activities\s*\*?\s*<\/h3>\s*<\/li>/gi, '')
              .replace(/<li>\s*<h3>\s*\*?\s*Additional Notes\s*\*?\s*<\/h3>\s*<\/li>/gi, '')
              // Then add the styled headings
              .replace(/(<h3>|<li>|<ul>|<\/ul>|<\/li>|\*)*\s*Traveler Tips for the Day\s*(<\/h3>|<\/li>|\*)*/gi, '<h3 class="sub-heading" style="font-weight: 700; color: #1e40af; font-size: 18px; margin: 1.5rem 0 1rem; padding: 0.5rem 0; border-bottom: 2px solid #e5e7eb; width: 100%; display: block;">Traveler Tips for the Day</h3>')
              .replace(/(<h3>|<li>|<ul>|<\/ul>|<\/li>|\*)*\s*Estimated Time for Activities\s*(<\/h3>|<\/li>|\*)*/gi, '<h3 class="sub-heading" style="font-weight: 700; color: #1e40af; font-size: 18px; margin: 1.5rem 0 1rem; padding: 0.5rem 0; border-bottom: 2px solid #e5e7eb; width: 100%; display: block;">Estimated Time for Activities</h3>')
              .replace(/(<h3>|<li>|<ul>|<\/ul>|<\/li>|\*)*\s*Additional Notes\s*(<\/h3>|<\/li>|\*)*/gi, '<h3 class="sub-heading" style="font-weight: 700; color: #1e40af; font-size: 18px; margin: 1.5rem 0 1rem; padding: 0.5rem 0; border-bottom: 2px solid #e5e7eb; width: 100%; display: block;">Additional Notes</h3>')
              // Also handle any remaining asterisks in the content
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
            }
          </div>
          
          <div class="footer">
            <p>Generated on ${formattedDate} by <a href="https://bookmysight.com" target="_blank" style="color: #3b82f6; text-decoration: none;">BookMySight</a></p>
            <p class="no-print" style="font-size: 11px; margin-top: 0.5rem; color: #9ca3af;">
              To print, use the print dialog in your browser (Ctrl+P or Cmd+P)
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Write the content and trigger print
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load before printing
    printWindow.onload = function() {
      printWindow.print();
      // printWindow.close(); // Uncomment to close after printing
    };
  };
  
  const handleShareOnWhatsApp = () => {
    if (!itinerary) return;
    
    try {
      // Format the message with proper line breaks and formatting
      let text = `*Your Travel Itinerary for ${formData.destination}*\n\n`;
      text += `*Dates:* ${formData.startDate} to ${formData.endDate}\n\n`;
      
      // Add itinerary days if we can parse them
      const days = parseItinerary(itinerary);
      if (days && days.length > 0) {
        days.forEach(day => {
          if (day && day.day && day.title) {
            text += `*${day.day}: ${day.title}*\n`;
            if (day.content) {
              // Convert HTML to plain text for WhatsApp
              const plainText = String(day.content)
                .replace(/<[^>]*>?/gm, '') // Remove HTML tags
                .replace(/&nbsp;/g, ' ')   // Replace HTML spaces
                .replace(/\s+/g, ' ')      // Collapse multiple spaces
                .trim();
              
              text += `${plainText}\n\n`;
            }
          }
        });
      } else {
        // If we couldn't parse days, just use the raw itinerary
        text += String(itinerary)
          .replace(/<[^>]*>?/gm, '') // Remove HTML tags
          .replace(/&nbsp;/g, ' ')   // Replace HTML spaces
          .replace(/\s+/g, ' ')      // Collapse multiple spaces
          .trim();
      }
      
      // Encode the text for URL
      const encodedText = encodeURIComponent(text);
      
      // Open WhatsApp with the text
      window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    } catch (e) {
      console.error('Error sharing on WhatsApp:', e);
      alert('Failed to share on WhatsApp. Please try again.');
    }
  };

  const parseItinerary = (itineraryText) => {
    if (!itineraryText) return [];
    
    // Convert to string in case it's not
    const text = String(itineraryText);
    
    // Look for the main itinerary pattern (starts with Day 1 or ## Day 1)
    const mainItineraryMatch = text.match(/(##?\s*Day\s+1[\s\S]*?)(?=##?\s*Travel Tips|$)/i);
    const mainItineraryText = mainItineraryMatch ? mainItineraryMatch[0] : text;
    
    // Split by day sections (## Day X)
    const daySections = [];
    const dayPattern = /(##?\s*Day\s+\d+[\s\S]*?)(?=##?\s*Day\s+\d+|##?\s*Travel Tips|$)/gi;
    
    let dayMatch;
    while ((dayMatch = dayPattern.exec(mainItineraryText)) !== null) {
      const section = dayMatch[1].trim();
      // Only add if it's a valid day section (contains time-based activities)
      if (section.match(/(morning|afternoon|evening)/i)) {
        daySections.push(section);
      }
    }
    
    // If no day sections found, try to find any date patterns
    if (daySections.length === 0) {
      const datePattern = /(\w+,\s+\d{4}-\d{2}-\d{2}[\s\S]*?)(?=\w+,\s+\d{4}-\d{2}-\d{2}|##?\s*Travel Tips|$)/gi;
      let dateMatch;
      while ((dateMatch = datePattern.exec(text)) !== null) {
        daySections.push(dateMatch[1].trim());
      }
    }
    
    // If still no sections found, try to split by double newlines
    if (daySections.length === 0) {
      const sections = text.split(/\n\s*\n+/).filter(section => {
        const trimmed = section.trim();
        return (
          trimmed.length > 0 && 
          !trimmed.startsWith('---') &&
          !trimmed.match(/^#+\s*Itinerary for/i) &&
          !trimmed.match(/^Travel Dates?:/i) &&
          !trimmed.match(/^Preferences?:/i) &&
          trimmed !== 'Day 1' &&
          !trimmed.match(/^Day \d+$/) // Skip standalone "Day X" lines
        );
      });
      
      // Group sections into days (assuming 3 sections per day: morning, afternoon, evening)
      if (sections.length > 0) {
        for (let i = 0; i < sections.length; i += 3) {
          const daySectionsGroup = sections.slice(i, i + 3).join('\n\n');
          daySections.push(`## Day ${Math.floor(i / 3) + 1}\n\n${daySectionsGroup}`);
        }
      }
    }
    
    // If no sections at all, return the whole text as one section
    if (daySections.length === 0) {
      return [{
        day: 'Itinerary',
        title: 'Your Travel Plan',
        content: `<div class="prose max-w-none">${itineraryText
          .replace(/\n\s*\n/g, '</p><p>')
          .replace(/\n/g, ' ')}
          </div>`
      }];
    }

    // Process each day section
    const processedDays = [];
    let dayNumber = 1;
    
    for (const section of daySections) {
      let title = `Day ${dayNumber}`;
      let content = section;
      
      // Extract day number and date from section
      const dayMatch = section.match(/^##?\s*Day\s+(\d+)(?:\s*\(([^)]+)\))?/i);
      if (dayMatch) {
        dayNumber = parseInt(dayMatch[1]) || dayNumber;
        title = dayMatch[2] ? `Day ${dayNumber} (${dayMatch[2]})` : `Day ${dayNumber}`;
        // Remove the day header from content
        content = content.replace(/^##?\s*Day\s+\d+\s*(?:\([^)]+\))?\s*\n?/i, '').trim();
      }
      
      // Format the content with proper HTML structure
      let formattedContent = content
        // Handle time-based sections (e.g., "### Morning" or "Morning:")
        .replace(/^###?\s*(Morning|Afternoon|Evening)\s*:?/gim, 
          (match, timeOfDay) => {
            return `</p><h3 class="text-md font-semibold mt-4 mb-2 text-blue-700">${timeOfDay}</h3><p>`;
          })
        // Handle bullet points
        .replace(/^[-•*]\s+(.+)$/gm, '<li>$1</li>')
        // Handle numbered lists
        .replace(/^(\d+)\.\s+(.+)$/gm, '<li>$2</li>')
        // Handle bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Handle italic text
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Convert remaining newlines to line breaks
        .replace(/\n/g, '<br>');
      
      // Split into paragraphs based on double line breaks
      const paragraphs = [];
      const lines = formattedContent.split('<br>');
      let currentParagraph = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '') {
          if (currentParagraph.length > 0) {
            paragraphs.push(currentParagraph.join(' '));
            currentParagraph = [];
          }
        } else if (trimmed.startsWith('<li>') || trimmed.startsWith('<h3>')) {
          if (currentParagraph.length > 0) {
            paragraphs.push(currentParagraph.join(' '));
            currentParagraph = [];
          }
          paragraphs.push(trimmed);
        } else {
          currentParagraph.push(trimmed);
        }
      }
      
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(' '));
      }
      
      // Final formatting of paragraphs
      const finalContent = paragraphs.map(para => {
        if (para.startsWith('<li>') || para.startsWith('<h3>')) {
          return para;
        }
        return `<p class="mb-3">${para}</p>`;
      }).join('');
      
      // Add to processed days
      processedDays.push({
        day: `Day ${dayNumber}`,
        title: title,
        content: finalContent
      });
      
      dayNumber++;
    }
    
    // Add travel tips if found
    const tipsMatch = text.match(/##?\s*Travel Tips[\s\S]*/i);
    if (tipsMatch) {
      const tipsContent = tipsMatch[0]
        .replace(/##?\s*Travel Tips\s*/i, '')
        .trim()
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(tip => `<li>${tip.trim().replace(/^[-•*]\s*/, '')}</li>`)
        .join('');
      
      if (tipsContent) {
        processedDays.push({
          day: 'Tips',
          title: 'Travel Tips',
          content: `<div class="mt-6">
            <h3 class="text-lg font-semibold mb-3 text-blue-800">Travel Tips</h3>
            <ul class="list-disc pl-5 space-y-2">${tipsContent}</ul>
          </div>`
        });
      }
    }
    
    return processedDays;
  };

  const itineraryDays = parseItinerary(itinerary);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </button>
        </div>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-3">
            AI Itinerary Generator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create your perfect travel plan with AI
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden mb-10 transition-all duration-300 hover:shadow-2xl">
          <div className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Plan Your Perfect Trip</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Your Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your full name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                    Destination
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="destination"
                      id="destination"
                      value={formData.destination}
                      onChange={handleChange}
                      className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Tokyo, Japan"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="date"
                        name="startDate"
                        id="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                      End Date
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="date"
                        name="endDate"
                        id="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                        className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
                    Your Requirements
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <textarea
                      id="requirements"
                      name="requirements"
                      rows={3}
                      value={formData.requirements}
                      onChange={handleChange}
                      className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="E.g., Must-visit places, dietary restrictions, accessibility needs, etc."
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      Generate Itinerary
                    </>
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {itinerary && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">Your Custom Travel Itinerary</h2>
              <p className="mt-2 text-lg text-gray-600">
                {formData.destination} • {new Date(formData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(formData.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              
              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={downloadItinerary}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <FiDownload className="mr-2 h-4 w-4" />
                  Download PDF
                </button>
                <button
                  onClick={handleShareOnWhatsApp}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#25D366] hover:bg-[#128C7E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366]"
                >
                  <FiMessageSquare className="mr-2 h-4 w-4" />
                  Share on WhatsApp
                </button>
              </div>
            </div>

            <div className="space-y-8" id="itinerary-content">
              {itineraryDays.length > 0 ? (
                itineraryDays.map((day, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-white bg-opacity-20 rounded-full p-2">
                          <span className="text-white font-bold text-lg">{day.day}</span>
                        </div>
                        <h3 className="ml-4 text-xl font-semibold text-white">{day.title}</h3>
                      </div>
                    </div>
                    <div className="p-6">
                      <div 
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: day.content }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div 
                  className="prose max-w-none bg-white rounded-xl shadow-lg p-6"
                  dangerouslySetInnerHTML={{ __html: itinerary.replace(/\n/g, '<br />') }}
                />
              )}
            </div>

            <div className="bg-blue-50 rounded-xl p-6 text-center">
              <h3 className="text-lg font-medium text-blue-800">Need to make changes?</h3>
              <p className="mt-2 text-blue-700">Adjust your preferences above and generate a new itinerary.</p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Modify My Search
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIItineraryGeneratorPage;
