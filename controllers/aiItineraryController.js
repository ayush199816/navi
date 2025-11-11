const { GoogleGenerativeAI } = require('@google/generative-ai');
const { RateLimiter } = require('limiter');

// Initialize Google Generative AI with API version
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY, {
  apiVersion: 'v1',
  // Add retry configuration
  retryConfig: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    retryableStatusCodes: [429, 500, 502, 503, 504]
  }
});

// Rate limiter: 10 requests per minute
const limiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: 'minute',
  fireImmediately: true
});

// Simple in-memory cache (consider using Redis in production)
const itineraryCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Generate a cache key based on the request parameters
 */
function generateCacheKey(params) {
  return JSON.stringify({
    destination: params.destination?.toLowerCase(),
    startDate: params.startDate,
    endDate: params.endDate,
    requirements: params.requirements?.toLowerCase()
  });
}

/**
 * Generate content with retry logic
 */
async function generateWithRetry(model, prompt, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${i + 1} failed:`, error.message);
      
      // If it's a rate limit error, wait before retrying
      if (error.status === 429 || error.status === 503) {
        const waitTime = delay * Math.pow(2, i); // Exponential backoff
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        // For other errors, don't retry
        break;
      }
    }
  }
  
  throw lastError || new Error('Failed to generate content after multiple attempts');
}

// @desc    Generate AI Itinerary
// @route   POST /api/v1/ai-itinerary/generate
// @access  Public
exports.generateItinerary = async (req, res) => {
  try {
    const { destination, startDate, endDate, requirements } = req.body;

    // Validate input
    if (!destination || !startDate || !endDate || !requirements) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: destination, startDate, endDate, and requirements'
      });
    }

    // Check rate limit
    const remainingRequests = await new Promise(resolve => 
      limiter.removeTokens(1, (err, remaining) => 
        resolve(err ? 0 : remaining)
      )
    );

    if (remainingRequests < 0) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    // Generate cache key
    const cacheKey = generateCacheKey({ destination, startDate, endDate, requirements });
    const cached = itineraryCache.get(cacheKey);
    
    // Return cached result if available and not expired
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return res.status(200).json({
        ...cached.data,
        cached: true
      });
    }

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Create a prompt for the AI
    const prompt = `Create a detailed ${diffDays}-day travel itinerary for ${destination} based on the following requirements:\n\n` +
      `Travel Dates: ${startDate} to ${endDate} (${diffDays} days)\n` +
      `Traveler's Requirements: ${requirements}\n\n` +
      `The itinerary should include:\n` +
      `1. A day-by-day breakdown of activities\n` +
      `2. Recommended times for each activity\n` +
      `3. Brief descriptions of each activity\n` +
      `4. Any important travel tips or notes\n\n` +
      `Format the response with clear headings for each day and use markdown for better readability.`;

    try {
      // Generate content using Google's Gemini 2.5 Flash model with retry
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const text = await generateWithRetry(model, prompt);

      // Prepare response
      const responseData = {
        success: true,
        itinerary: text,
        destination,
        startDate,
        endDate,
        days: diffDays,
        cached: false
      };

      // Cache the result
      itineraryCache.set(cacheKey, {
        timestamp: Date.now(),
        data: responseData
      });

      // Clean up old cache entries (optional)
      if (Math.random() < 0.1) { // Clean up 10% of the time to avoid doing it on every request
        const now = Date.now();
        for (const [key, value] of itineraryCache.entries()) {
          if (now - value.timestamp > CACHE_TTL) {
            itineraryCache.delete(key);
          }
        }
      }

      return res.status(200).json(responseData);
      
    } catch (error) {
      console.error('Error generating itinerary with AI:', error);
      
      // Provide a helpful fallback response when AI service is unavailable
      if (error.status === 503 || error.message.includes('overloaded') || error.message.includes('unavailable')) {
        return res.status(503).json({
          success: false,
          message: 'Our AI service is currently experiencing high demand. Please try again in a few minutes.',
          error: 'Service temporarily unavailable',
          retryAfter: 300 // 5 minutes in seconds
        });
      }
      
      throw error; // Re-throw for the outer catch block
    }

  } catch (error) {
    console.error('Error in generateItinerary:', error);
    
    const statusCode = error.status || 500;
    const errorMessage = statusCode === 503 
      ? 'AI service is currently unavailable. Please try again later.'
      : 'Failed to generate itinerary. Please try again.';
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      ...(error.retryAfter && { retryAfter: error.retryAfter })
    });
  }
};
