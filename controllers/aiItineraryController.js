const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google Generative AI with API version
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY, {
  apiVersion: 'v1'  // Explicitly set API version to v1
});

// @desc    Generate AI Itinerary
// @route   POST /api/v1/itinerary-creator/generate
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

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates

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

    // Generate content using Google's Gemini 2.5 Flash model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Return the generated itinerary
    res.status(200).json({
      success: true,
      itinerary: text,
      destination,
      startDate,
      endDate,
      days: diffDays
    });

  } catch (error) {
    console.error('Error generating itinerary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate itinerary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
