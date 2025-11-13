const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google's Generative AI with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// Simple in-memory conversation state
const conversationState = new Map();

// @desc    Chat with AI
// @route   POST /api/ai/chat
// @access  Private
exports.chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    try {
      const sessionId = req.headers['session-id'] || 'default-session';
      const currentState = conversationState.get(sessionId) || { step: 0, preferences: {} };
      
      // Define models to try in order of preference
      const modelsToTry = [
        'gemini-2.5-flash-lite',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-pro-vision'
      ];
      
      // Extract location if mentioned
      const locationMatch = message.match(/near\s+([^,.!?]+)/i);
      const location = locationMatch ? locationMatch[1].trim() : '';
      
      // Extract category
      let category = 'general';
      const categories = [
        { pattern: /(restaurant|food|eat|dinner|lunch|breakfast|dining)/i, value: 'restaurant' },
        { pattern: /(shopping|mall|market|shop|buy|store)/i, value: 'shopping' },
        { pattern: /(sightseeing|attraction|tourist|place to visit|landmark)/i, value: 'sightseeing' },
        { pattern: /(hotel|accommodation|stay|hostel|resort)/i, value: 'accommodation' }
      ];
      
      for (const { pattern, value } of categories) {
        if (message.match(pattern)) {
          category = value;
          break;
        }
      }
      
      // Extract cuisine type if mentioned (for restaurants)
      const cuisineMatch = category === 'restaurant' ? 
        message.match(/(indian|chinese|thai|italian|japanese|korean|mexican|vietnamese|french|mediterranean|american|burger|pizza|sushi|steak|seafood|vegetarian|vegan)/i) : null;
      const cuisine = cuisineMatch ? cuisineMatch[1].toLowerCase() : '';
      
      // Build the conversation context
      let context = [
        {
          role: 'user',
          parts: [{
            text: `You are a helpful travel assistant. Keep responses short and direct.
                  ${category === 'restaurant' ? `Provide 3-5 specific restaurant recommendations based on the location and cuisine.` : 
                   category === 'shopping' ? `Recommend 3-5 shopping places or malls. Include what they're known for.` :
                   category === 'sightseeing' ? `List 3-5 must-visit attractions or sightseeing spots.` :
                   `Provide 3-5 relevant recommendations.`}
                  
                  Include distance from location if possible and a brief highlight (max 10 words).
                  Don't ask about budget, atmosphere, or ambience unless specifically asked.
                  
                  Location: ${location || 'not specified'}
                  ${category === 'restaurant' ? `Cuisine: ${cuisine || 'any'}` : ''}
                  
                  Format each recommendation with:
                  - Name (distance if available)
                  - ⭐Rating/5 if available
                  - Brief highlight (max 10 words)
                  
                  User's message: ${message}`
          }]
        }
      ];
      
      let result;
      let lastError;
      
      // Try each model in sequence until one works
      for (const modelName of modelsToTry) {
        try {
          console.log('Trying model:', modelName);
          const model = genAI.getGenerativeModel({ model: modelName });
          
          // Add a small delay between retries to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const chat = model.startChat({
            history: context,
            generationConfig: {
              maxOutputTokens: 500,
              temperature: 0.7,
            },
          });
          
          result = await chat.sendMessage(message);
          console.log(`Successfully got response from model: ${modelName}`);
          break; // Exit loop if successful
        } catch (error) {
          console.error(`Error with model ${modelName}:`, error.message);
          lastError = error;
          continue; // Try next model
        }
      }
      
      // If all models failed, throw the last error
      if (!result) {
        throw lastError || new Error('All model attempts failed');
      }
      
      const response = await result.response;
      const text = response.text();
      
      // Update conversation state based on user input
      if (currentState.step === 0) {
        currentState.preferences.cuisine = message;
        currentState.step = 1;
      } else if (currentState.step === 1) {
        currentState.preferences.budget = message;
        currentState.step = 2;
      } else if (currentState.step === 2) {
        currentState.preferences.atmosphere = message;
        currentState.step = 3;
      }
      
      // Save updated state
      conversationState.set(sessionId, currentState);

      // Return the AI's response
      return res.status(200).json({
        success: true,
        response: text,
        sessionId: sessionId,
        currentStep: currentState.step
      });
      
    } catch (modelError) {
      console.error('Model error:', modelError);
      throw modelError;
    }

  } catch (error) {
    console.error('Error in chatWithAI:', error);
    return res.status(500).json({
      success: false,
      error: 'Error processing your request',
      details: error.message
    });
  }
};
