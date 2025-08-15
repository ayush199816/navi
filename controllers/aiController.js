/**
 * AI Controller for Navigatio platform
 * Handles AI-powered features like itinerary generation
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Google Generative AI with API key from environment variables
// Using default API version (no explicit version specified)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// @desc    Generate AI itinerary based on destination, dates, and preferences
// @route   POST /api/ai/itinerary
// @access  Private (Admin, Operations, Agent)
exports.generateAIItinerary = async (req, res) => {
  try {
    const { destination, dates, preferences } = req.body;

    // Validate required fields
    if (!destination) {
      return res.status(400).json({
        success: false,
        message: 'Destination is required'
      });
    }

    // Log the request
    console.log('Generating AI itinerary for:', {
      user: req.user.name,
      role: req.user.role,
      destination,
      dates,
      preferences
    });

    // Format dates for the prompt
    const startDate = dates.startDate ? new Date(dates.startDate).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    }) : 'not specified';
    
    const endDate = dates.endDate ? new Date(dates.endDate).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    }) : 'not specified';

    // Calculate trip duration if dates are provided
    let tripDuration = 'unknown';
    if (dates.startDate && dates.endDate) {
      const start = new Date(dates.startDate);
      const end = new Date(dates.endDate);
      tripDuration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }

    // Create a prompt for Gemini AI
    const prompt = `Create a detailed travel itinerary for a ${tripDuration}-day trip to ${destination} from ${startDate} to ${endDate}.

${preferences ? `Traveler preferences: ${preferences}\n\n` : ''}Please include ONLY the following:
1. Daily activities broken down by morning, afternoon, and evening
2. Recommended attractions to visit
3. Restaurant suggestions for meals
4. Travel tips specific to the destination

IMPORTANT: DO NOT include any budget information, cost estimates, or prices in the itinerary. The client has specifically requested NO financial information in the itinerary.

Format the itinerary in Markdown with clear headings and bullet points.`;

    // We'll try multiple models in sequence

    let itinerary;
    
    // Define models to try in order of preference
    const modelsToTry = [
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-pro',
      'gemini-1.0-pro',
      'gemini-1.0-pro-latest'
    ];
    
    // Try each model until one works
    let success = false;
    for (const modelName of modelsToTry) {
      if (success) break;
      
      try {
        console.log(`Attempting to generate itinerary with ${modelName}...`);
        const modelInstance = genAI.getGenerativeModel({ model: modelName });
        
        const result = await modelInstance.generateContent(prompt);
        const response = await result.response;
        itinerary = response.text();
        
        console.log(`Successfully generated itinerary with ${modelName}`);
        success = true;
      } catch (modelError) {
        console.error(`Error with ${modelName}:`, modelError.message);
      }
    }
    
    // If all models failed, use our fallback generator
    if (!success) {
      console.log('All Gemini models failed, using fallback itinerary generator');
      itinerary = generateFallbackItinerary(destination, dates, preferences, tripDuration);
    }
    
    // Post-process the itinerary to remove any budget information
    itinerary = removeBudgetInformation(itinerary);

    // Return the generated itinerary
    res.status(200).json({
      success: true,
      itinerary
    });
  } catch (err) {
    console.error('Error generating AI itinerary:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error while generating itinerary'
    });
  }
};

/**
 * Generate a fallback itinerary when the AI service is unavailable
 * @param {string} destination - Travel destination
 * @param {object} dates - Travel dates with startDate and endDate
 * @param {string} preferences - Traveler preferences
 * @param {number|string} tripDuration - Duration of the trip in days
 * @returns {string} Formatted itinerary in Markdown
 */
function generateFallbackItinerary(destination, dates, preferences, tripDuration) {
  const startDate = dates.startDate ? new Date(dates.startDate).toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  }) : 'not specified';
  
  const endDate = dates.endDate ? new Date(dates.endDate).toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  }) : 'not specified';
  
  // Create a fallback itinerary
  let itinerary = `# ${tripDuration}-Day Itinerary for ${destination}\n\n`;
  itinerary += `**Travel Dates:** ${startDate} to ${endDate}\n\n`;
  
  if (preferences) {
    itinerary += `**Preferences:** ${preferences}\n\n`;
  }
  
  // Generate daily activities
  const numDays = typeof tripDuration === 'number' ? tripDuration : 3; // Default to 3 days if duration is unknown
  
  for (let day = 1; day <= numDays; day++) {
    let currentDate = '';
    if (dates.startDate) {
      const date = new Date(dates.startDate);
      date.setDate(date.getDate() + day - 1);
      currentDate = ` (${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})`;
    }
    
    itinerary += `## Day ${day}${currentDate}\n\n`;
    
    // Morning activities
    itinerary += `### Morning\n`;
    itinerary += `- Breakfast at a local café\n`;
    itinerary += `- Visit ${getRandomAttraction(destination)}\n\n`;
    
    // Afternoon activities
    itinerary += `### Afternoon\n`;
    itinerary += `- Lunch at ${getRandomRestaurant(destination)}\n`;
    itinerary += `- Explore ${getRandomAttraction(destination)}\n\n`;
    
    // Evening activities
    itinerary += `### Evening\n`;
    itinerary += `- Dinner at ${getRandomRestaurant(destination)}\n`;
    itinerary += `- ${getRandomEveningActivity(destination)}\n\n`;
  }
  
  // Add travel tips
  itinerary += `## Travel Tips\n\n`;
  itinerary += `- Always carry a map or use a navigation app\n`;
  itinerary += `- Keep important documents secure\n`;
  itinerary += `- Try local cuisine and specialties\n`;
  itinerary += `- Learn a few basic phrases in the local language\n\n`;
  
  // No budget section as per client request
  
  return itinerary;
}

/**
 * Remove any budget information from the generated itinerary
 * @param {string} itinerary - The original itinerary text
 * @returns {string} - The itinerary with budget information removed
 */
function removeBudgetInformation(itinerary) {
  if (!itinerary) return itinerary;
  
  // Remove entire budget sections
  itinerary = itinerary.replace(/#+\s*(?:Estimated\s*)?Budget(?:\s*Breakdown)?[\s\S]*?(?=#+|$)/gi, '');
  itinerary = itinerary.replace(/#+\s*Cost(?:\s*Estimates?)?[\s\S]*?(?=#+|$)/gi, '');
  itinerary = itinerary.replace(/#+\s*Expenses[\s\S]*?(?=#+|$)/gi, '');
  
  // Remove price mentions with currency symbols (₹, $, €, £, etc.)
  itinerary = itinerary.replace(/[₹$€£¥]\s*\d+[\d,.]*(?:\s*-\s*[₹$€£¥]?\s*\d+[\d,.]*)?/g, '[price removed]');
  
  // Remove mentions of costs, prices, rates, etc.
  itinerary = itinerary.replace(/(?:costs?|price|rates?|fees?)\s*(?:is|are|:)\s*[₹$€£¥]?\s*\d+[\d,.]*(?:\s*-\s*[₹$€£¥]?\s*\d+[\d,.]*)?/gi, 'price information removed');
  
  // Remove bullet points about costs
  itinerary = itinerary.replace(/^\s*[-*]\s*(?:Accommodation|Food|Activities|Transportation|Miscellaneous|Total)\s*(?:costs?|expenses?|budget)?\s*:?\s*[₹$€£¥]?\s*\d+[\d,.]*.*$/gim, '');
  
  // Clean up any double line breaks created by our removals
  itinerary = itinerary.replace(/\n{3,}/g, '\n\n');
  
  return itinerary;
}

/**
 * Get a random attraction for the destination
 */
function getRandomAttraction(destination) {
  const attractions = {
    'Goa': ['Calangute Beach', 'Anjuna Beach', 'Fort Aguada', 'Basilica of Bom Jesus', 'Dudhsagar Falls'],
    'Mumbai': ['Gateway of India', 'Marine Drive', 'Elephanta Caves', 'Sanjay Gandhi National Park', 'Juhu Beach'],
    'Delhi': ['Red Fort', 'Qutub Minar', 'India Gate', 'Humayun\'s Tomb', 'Lotus Temple'],
    'Jaipur': ['Amber Fort', 'Hawa Mahal', 'City Palace', 'Jantar Mantar', 'Jal Mahal'],
    'Agra': ['Taj Mahal', 'Agra Fort', 'Fatehpur Sikri', 'Mehtab Bagh', 'Itimad-ud-Daulah'],
    'default': ['Local Museum', 'Historical Monument', 'Popular Tourist Spot', 'Cultural Center', 'Nature Park']
  };
  
  const locationAttractions = attractions[destination] || attractions['default'];
  return locationAttractions[Math.floor(Math.random() * locationAttractions.length)];
}

/**
 * Get a random restaurant for the destination
 */
function getRandomRestaurant(destination) {
  const restaurants = {
    'Goa': ['Thalassa', 'Gunpowder', 'Fisherman\'s Wharf', 'Britto\'s', 'Souza Lobo'],
    'Mumbai': ['Leopold Cafe', 'Trishna', 'Britannia & Co.', 'Cafe Mondegar', 'Mahesh Lunch Home'],
    'Delhi': ['Bukhara', 'Indian Accent', 'Karim\'s', 'Saravana Bhavan', 'Moti Mahal'],
    'Jaipur': ['Suvarna Mahal', 'Cinnamon', 'Niros', 'Handi', 'Peacock Rooftop Restaurant'],
    'Agra': ['Peshawri', 'Pinch of Spice', 'Dasaprakash', 'Esphahan', 'Pind Balluchi'],
    'default': ['Local Eatery', 'Traditional Restaurant', 'Popular Cafe', 'Fine Dining Restaurant', 'Street Food Market']
  };
  
  const locationRestaurants = restaurants[destination] || restaurants['default'];
  return locationRestaurants[Math.floor(Math.random() * locationRestaurants.length)];
}

/**
 * Get a random evening activity for the destination
 */
function getRandomEveningActivity(destination) {
  const activities = {
    'Goa': ['Visit a beach shack', 'Enjoy a sunset cruise', 'Experience the nightlife at Tito\'s Lane', 'Attend a beach party', 'Visit a casino'],
    'Mumbai': ['Watch sunset at Marine Drive', 'Visit a rooftop bar', 'Watch a Bollywood movie', 'Shop at Colaba Causeway', 'Attend a cultural performance'],
    'Delhi': ['Visit Connaught Place', 'Shop at Janpath Market', 'Attend a cultural show at Dilli Haat', 'Experience the nightlife at Hauz Khas Village', 'Visit India Gate at night'],
    'Jaipur': ['Watch a cultural show at Chokhi Dhani', 'Shop at Johari Bazaar', 'Visit Nahargarh Fort for night views', 'Attend a puppet show', 'Explore the night markets'],
    'Agra': ['Attend the Taj Mahal light show', 'Visit Sadar Bazaar', 'Enjoy a cultural performance', 'Dine at a rooftop restaurant with Taj views', 'Shop for marble crafts'],
    'default': ['Enjoy local entertainment', 'Visit a popular nightspot', 'Attend a cultural event', 'Explore night markets', 'Relax at a cafe or bar']
  };
  
  const locationActivities = activities[destination] || activities['default'];
  return locationActivities[Math.floor(Math.random() * locationActivities.length)];
}
