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
      user: req.user ? req.user.name : 'guest',
      role: req.user ? req.user.role : 'guest',
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

${preferences ? `**Traveler Preferences:** ${preferences}\n\n` : ''}Please structure the itinerary with the following sections for EACH DAY:

# [Day X] [Date if available] - [Brief highlight of the day]

## Morning
- [Activity 1] - [Brief description or interesting fact]
- [Activity 2] - [Brief description or interesting fact]
- [Breakfast/Lunch Suggestion] - [Restaurant name] (Cuisine type)

## Afternoon
- [Activity 1] - [Brief description or interesting fact]
- [Activity 2] - [Brief description or interesting fact]
- [Lunch Suggestion] - [Restaurant name] (Cuisine type)

## Evening
- [Activity 1] - [Brief description or interesting fact]
- [Dinner Suggestion] - [Restaurant name] (Cuisine type)
- [Evening Activity] - [Brief description]

---

**Traveler Tips for the Day:**
- [Tip 1]
- [Tip 2]

**Estimated Time for Activities:**
- [Activity]: [Duration]
- [Travel Time]: [Duration] (if applicable)

**Additional Notes:**
- [Any important information about the day]

IMPORTANT RULES:
1. DO NOT include any prices, costs, or budget information
2. Keep descriptions concise but informative (1-2 sentences max per bullet point)
3. Include opening hours for major attractions if possible
4. Suggest local transportation options between locations
5. Highlight any dress codes or cultural considerations
6. Include a mix of popular attractions and hidden gems
7. Note any time needed for rest or travel between locations
8. Include a variety of experiences (cultural, historical, culinary, etc.)

Format the entire response in clean Markdown with proper headings (##, ###) and bullet points.`;

    // We'll try multiple models in sequence

    let itinerary;
    
    // Define models to try in order of preference
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.5-flash-lite',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro-vision'
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

    // Post-process the itinerary for consistent formatting
    let formattedItinerary = itinerary
      // Clean up excessive line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Ensure consistent heading levels
      .replace(/^#\s+(Day \d+)/gm, '## $1')
      .replace(/^##\s+(Morning|Afternoon|Evening)/gm, '### $1')
      // Add spacing before headings
      .replace(/([^\n])\n\s*##/g, '$1\n\n##')
      // Ensure consistent bullet points
      .replace(/^\s*[-•*]\s*/gm, '- ')
      // Remove any remaining price information
      .replace(/\$\d+(\.\d{2})?/g, '')
      .replace(/\d+\s*(?:USD|INR|EUR|GBP)/gi, '');

    // Return the formatted itinerary
    res.status(200).json({
      success: true,
      itinerary: `# ${tripDuration}-Day Itinerary for ${destination}\n\n` +
        `**Destination:** ${destination}\n` +
        `**Travel Dates:** ${startDate} to ${endDate}\n` +
        (preferences ? `**Traveler Preferences:** ${preferences}\n\n` : '\n') +
        '---\n\n' +
        formattedItinerary
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
  const activities = [
    `Enjoy a sunset at a local viewpoint in ${destination}`,
    `Take a night walking tour of ${destination}'s old town`,
    `Experience ${destination}'s nightlife in the city center`,
    `Attend a cultural show or performance in ${destination}`,
    `Go stargazing in ${destination}'s countryside`,
    `Take a night cruise in ${destination}`,
    `Visit a night market in ${destination}`,
    `Enjoy a rooftop bar with views of ${destination}`,
    `Take a ghost tour of ${destination}`,
    `Relax at a traditional spa in ${destination}`
  ];
  
  return activities[Math.floor(Math.random() * activities.length)];
}
