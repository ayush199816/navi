const Quote = require('../models/Quote');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Booking = require('../models/Booking');
const Package = require('../models/Package');
const { sendNotification, notifyOperationsTeam } = require('../services/notificationService');
const { generateQuoteId } = require('../utils/idGenerator');

// @desc    Get all quotes
// @route   GET /api/quotes
// @access  Private/Admin/Operations
exports.getQuotes = async (req, res) => {
  try {
    const { status, agentId, destination, startDate, endDate, search, hasLead } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by agent
    if (agentId) {
      query.agent = agentId;
    }
    
    // Filter by whether quote has a lead or not
    if (hasLead !== undefined) {
      const hasLeadBool = hasLead === 'true';
      const leads = await Lead.find({}).select('quote');
      const quoteIdsWithLeads = leads.map(lead => lead.quote?.toString()).filter(Boolean);
      
      if (hasLeadBool) {
        // Find quotes that have a lead
        if (quoteIdsWithLeads.length > 0) {
          query._id = { $in: quoteIdsWithLeads };
        } else {
          // If no leads exist, return empty result for hasLead=true
          query._id = { $in: [] };
        }
      } else {
        // Find quotes that don't have a lead
        if (quoteIdsWithLeads.length > 0) {
          query._id = { $nin: quoteIdsWithLeads };
        }
        // If no leads exist, all quotes don't have leads, so no additional filtering needed
      }
    }
    
    // Filter by destination
    if (destination) {
      query.destination = { $regex: destination, $options: 'i' };
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.travelDates = {};
      if (startDate) {
        query.travelDates.startDate = { $gte: new Date(startDate) };
      }
      if (endDate) {
        query.travelDates.endDate = { $lte: new Date(endDate) };
      }
    }
    
    // Search by customer name, email, phone or quote ID
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { quoteId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Execute query
    const quotes = await Quote.find(query)
      .populate('agent', 'name email companyName')
      .populate('handledBy', 'name role')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Quote.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: quotes.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: quotes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get quotes by agent (for agents to see their own quotes)
// @route   GET /api/quotes/my-quotes
// @access  Private/Agent
exports.getMyQuotes = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.error('No agent user found in request');
      return res.status(400).json({ success: false, message: 'Agent not authenticated' });
    }
    const { status, destination, startDate, endDate, search } = req.query;
    
    // Build query
    const query = {
      agent: req.user.id
    };
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by destination
    if (destination) {
      query.destination = { $regex: destination, $options: 'i' };
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.travelDates = {};
      if (startDate) {
        query.travelDates.startDate = { $gte: new Date(startDate) };
      }
      if (endDate) {
        query.travelDates.endDate = { $lte: new Date(endDate) };
      }
    }
    
    // Search by customer name, email, phone or quote ID
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { quoteId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Execute query
    const quotes = await Quote.find(query)
      .populate('handledBy', 'name role')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Quote.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: quotes.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: quotes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get single quote
// @route   GET /api/quotes/:id
// @access  Private
exports.getQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('agent', 'name email companyName')
      .populate('handledBy', 'name role');
    
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }
    
    // Check if user is authorized to view this quote
    if (req.user.role === 'agent') {
      // For agents, we need to check if the quote belongs to them
      // The agent field might be populated as an object or just an ID
      const agentId = quote.agent._id ? quote.agent._id.toString() : quote.agent.toString();
      
      if (agentId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this quote',
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: quote,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Create new quote
// @route   POST /api/quotes
// @access  Private/Agent
exports.createQuote = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    
    if (!req.user || !req.user.id) {
      console.error('No agent user found in request');
      return res.status(400).json({ success: false, message: 'Agent not authenticated' });
    }
    
    // Ensure req.body exists and initialize it if it doesn't
    if (!req.body) {
      console.error('Request body is undefined, initializing empty object');
      req.body = {};
    }
    
    // Process multipart/form-data
    let quoteData = {};
    
    // Set agent ID
    quoteData.agent = req.user.id;
    
    // Parse customer data if it's a string (from FormData)
    if (req.body.customer && typeof req.body.customer === 'string') {
      try {
        const customerData = JSON.parse(req.body.customer);
        quoteData.customerName = customerData.name;
        quoteData.customerEmail = customerData.email;
        quoteData.customerPhone = customerData.phone;
      } catch (err) {
        console.error('Error parsing customer data:', err);
        return res.status(400).json({ success: false, message: 'Invalid customer data format' });
      }
    }
    
    // Set destination
    if (req.body.destination) {
      quoteData.destination = req.body.destination;
    }
    
    // Parse travel dates if it's a string (from FormData)
    if (req.body.travelDates && typeof req.body.travelDates === 'string') {
      try {
        quoteData.travelDates = JSON.parse(req.body.travelDates);
      } catch (err) {
        console.error('Error parsing travel dates:', err);
        return res.status(400).json({ success: false, message: 'Invalid travel dates format' });
      }
    }
    
    // Parse number of travelers if it's a string (from FormData)
    if (req.body.numberOfTravelers && typeof req.body.numberOfTravelers === 'string') {
      try {
        quoteData.numberOfTravelers = JSON.parse(req.body.numberOfTravelers);
      } catch (err) {
        console.error('Error parsing number of travelers:', err);
        return res.status(400).json({ success: false, message: 'Invalid number of travelers format' });
      }
    }
    
    // Set hotel required flag
    if (req.body.hotelRequired !== undefined) {
      quoteData.hotelRequired = req.body.hotelRequired === 'true' || req.body.hotelRequired === true;
    }
    
    // Set flight booked flag
    if (req.body.flightBooked !== undefined) {
      quoteData.flightBooked = req.body.flightBooked === 'true' || req.body.flightBooked === true;
    }
    
    // Set requirements if provided
    if (req.body.requirements) {
      quoteData.requirements = req.body.requirements;
    }
    
    // Set leadId if provided
    if (req.body.leadId) {
      quoteData.leadId = req.body.leadId;
    }
    
    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      quoteData.images = req.files.map(file => file.path);
    }
    
    // Set default values for numberOfTravelers if not provided
    if (!quoteData.numberOfTravelers) {
      quoteData.numberOfTravelers = { adults: 1, children: 0 };
    }
    
    // Ensure numberOfTravelers has valid values
    if (!quoteData.numberOfTravelers.adults || quoteData.numberOfTravelers.adults < 1) {
      quoteData.numberOfTravelers.adults = 1;
    }
    
    if (!quoteData.numberOfTravelers.children || quoteData.numberOfTravelers.children < 0) {
      quoteData.numberOfTravelers.children = 0;
    }
    
    // Set default budget (required field in the model)
    quoteData.budget = 1000; // Default budget value
    
    // Generate a unique quote ID
    quoteData.quoteId = 'Q' + Date.now().toString().slice(-6);
    
    // Set status to 'pending'
    quoteData.status = 'pending';
    
    // Validate required fields
    const requiredFields = [
      'customerName',
      'customerEmail',
      'customerPhone',
      'destination',
      'numberOfTravelers'
    ];
    
    for (const field of requiredFields) {
      if (!quoteData[field]) {
        console.error(`Missing required field: ${field}`);
        return res.status(400).json({ success: false, message: `Missing required field: ${field}` });
      }
    }
    
    // Validate travelDates subfields if travelDates exists
    if (quoteData.travelDates) {
      if (!quoteData.travelDates.startDate || !quoteData.travelDates.endDate) {
        console.error('Missing required travelDates.startDate or travelDates.endDate');
        return res.status(400).json({ success: false, message: 'Missing required travelDates.startDate or travelDates.endDate' });
      }
    } else {
      // If travelDates doesn't exist, create a default one
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() + 30); // Default to 30 days from now
      
      const defaultEndDate = new Date(defaultStartDate);
      defaultEndDate.setDate(defaultEndDate.getDate() + 7); // Default to 7 days after start date
      
      quoteData.travelDates = {
        startDate: defaultStartDate,
        endDate: defaultEndDate
      };
    }

    // Set expiry date (default 7 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    quoteData.expiryDate = expiryDate;
    
    // Log the processed quote data for debugging
    console.log('Processed quote data:', JSON.stringify(quoteData, null, 2));

    // Create quote
    const quote = await Quote.create(quoteData);

    // If lead ID is provided, update the lead with quote information
    if (quoteData.leadId) {
      await Lead.findByIdAndUpdate(quoteData.leadId, {
        quoteSent: true,
        quoteId: quote._id,
        status: 'proposal',
      });
    }

    res.status(201).json({
      success: true,
      data: quote,
    });
  } catch (err) {
    console.error('Error in createQuote:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error',
    });
  }
};

// @desc    Update quote status and details (for operations team)
// @route   PUT /api/quotes/:id
// @access  Private/Operations
exports.updateQuote = async (req, res) => {
  try {
    const { status, quotedPrice, quotedDetails, expiryDate, discussion } = req.body;
    
    const quote = await Quote.findById(req.params.id);
    
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }
    
    // Update quote
    const updateData = {
      status: status || quote.status,
      handledBy: req.user.id,
    };
    
    if (quotedPrice) {
      updateData.quotedPrice = quotedPrice;
    }
    
    if (quotedDetails) {
      updateData.quotedDetails = quotedDetails;
    }
    
    if (expiryDate) {
      updateData.expiryDate = new Date(expiryDate);
    }
    
    // Handle response from admin/operations
    if (req.body.response) {
      updateData.response = req.body.response;
      console.log('Adding response:', req.body.response);
      
      // Add response to discussion history
      if (!updateData.discussion) {
        updateData.discussion = quote.discussion || [];
      }
      updateData.discussion.push({
        message: req.body.response,
        timestamp: new Date(),
        user: `${req.user.name} (${req.user.role})`,
        type: 'response'
      });
    }
    
    // Handle itinerary attachment
    if (req.body.itinerary) {
      updateData.itinerary = req.body.itinerary;
      console.log('Adding itinerary');
    }
    
    // Handle discussion history updates
    if (discussion) {
      // Ensure discussion is an array
      if (Array.isArray(discussion)) {
        updateData.discussion = discussion;
      } else {
        console.error('Invalid discussion format, expected array but got:', typeof discussion);
        return res.status(400).json({
          success: false,
          message: 'Invalid discussion format, expected array',
        });
      }
    }
    
    // Add respondedBy field to track who responded (just the user ID)
    updateData.respondedBy = req.user.id;
    
    // Also track when the quote was responded to
    updateData.respondedAt = Date.now();
    
    console.log('Update data:', updateData);
    
    const updatedQuote = await Quote.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('agent', 'name email companyName').populate('handledBy', 'name role');
    
    console.log('Updated quote:', JSON.stringify(updatedQuote, null, 2));
    
    // If status changed to 'quoted', update the related lead if exists
    if (status === 'quoted') {
      const lead = await Lead.findOne({ quoteId: quote._id });
      if (lead) {
        lead.status = 'negotiation';
        lead.lastContactDate = Date.now();
        await lead.save();
      }
    }
    
    // If status changed to 'accepted', create a booking
    if (status === 'accepted') {
      // First, ensure the quote is saved with the updated status
      await updatedQuote.save();
      console.log('Updated quote status to accepted');
      
      try {
        console.log('=== START: Creating booking from accepted quote (via update) ===');
        console.log(`Quote ID: ${quote._id}, Agent: ${quote.agent}, Status: ${updatedQuote.status}`);
        
        // Check if a booking already exists for this quote
        console.log('Checking for existing booking...');
        const existingBooking = await Booking.findOne({ 
          $or: [
            { quote: quote._id },
            { quoteId: quote.quoteId }
          ]
        });
        console.log('Existing booking check complete');
        
        if (existingBooking) {
          console.log('Booking already exists for this quote:', existingBooking._id);
          
          // Update the existing booking status if needed
          if (existingBooking.bookingStatus !== 'confirmed') {
            existingBooking.bookingStatus = 'confirmed';
            existingBooking.updatedBy = req.user.id;
            await existingBooking.save();
            console.log('Updated existing booking status to confirmed');
          }
          
          // Ensure the quote has the booking reference
          if (!updatedQuote.booking || !updatedQuote.booking.equals(existingBooking._id)) {
            updatedQuote.booking = existingBooking._id;
            await updatedQuote.save();
            console.log('Updated quote with existing booking reference');
          }
        } else {
          // Prepare base booking data with all required fields
          const now = new Date();
          const totalAmount = Number(quote.quotedPrice || quote.budget || 0);
          
          // Generate a unique booking ID
          const bookingId = `B${Date.now().toString().slice(-8)}`;
          
          const bookingData = {
            bookingId,
            agent: quote.agent,
            quote: quote._id,
            quoteId: quote.quoteId, // Store the quoteId for easier lookup
            customerDetails: {
              name: quote.customerName || 'Customer',
              email: quote.customerEmail || 'no-email@example.com',
              phone: quote.customerPhone || '0000000000',
              address: quote.customerAddress || ''
            },
            travelDates: {
              startDate: quote.travelDates?.startDate || now,
              endDate: quote.travelDates?.endDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
            },
            specialRequirements: quote.requirements || quote.specialRequirements || '',
            paymentStatus: 'unpaid',
            bookingStatus: 'confirmed',
            destination: quote.destination || 'Not specified',
            bookingType: quote.package ? 'package' : 'custom',
            isCustom: !quote.package,
            totalAmount: totalAmount,
            pricing: {
              packagePrice: Number(quote.packagePrice || 0),
              agentPrice: Number(quote.agentPrice || 0),
              totalAmount: totalAmount,
              currency: quote.currency || 'INR',
              paymentTerms: quote.paymentTerms || '100% before travel',
              cancellationPolicy: quote.cancellationPolicy || 'Standard cancellation policy applies'
            },
            finalItinerary: quote.finalItinerary || quote.itinerary || '',
            customItinerary: quote.customItinerary,
            activities: quote.activities || [],
            travelers: quote.travelers || {
              adults: 1,
              children: 0,
              infants: 0,
              details: []
            },
            // Add any additional fields from the quote that should be copied to the booking
            ...(quote.hotels && { hotels: quote.hotels }),
            ...(quote.transfers && { transfers: quote.transfers }),
            ...(quote.sightseeing && { sightseeing: quote.sightseeing }),
            ...(quote.visas && { visas: quote.visas }),
            ...(quote.flights && { flights: quote.flights }),
            createdBy: req.user.id,
            updatedBy: req.user.id,
            notes: 'Booking created from quote acceptance by operations/admin'
          };
          
          // Create the booking
          console.log('Creating new booking with data:', JSON.stringify(bookingData, null, 2));
          const booking = new Booking(bookingData);
          await booking.save();
          console.log('Successfully created new booking:', booking._id);
          
          // Update the quote with the booking reference
          console.log('Updating quote with booking reference...');
          const updatedQuoteWithBooking = await Quote.findByIdAndUpdate(
            quote._id,
            { 
              $set: { 
                booking: booking._id,
                updatedBy: req.user.id 
              } 
            },
            { new: true }
          );
          updatedQuote.booking = booking._id; // Update the local reference
          console.log('Successfully updated quote with booking reference:', updatedQuoteWithBooking.booking);
        }
        
        // Update related lead if exists
        const lead = await Lead.findOne({ quoteId: quote._id });
        if (lead) {
          lead.status = 'won';
          lead.lastContactDate = Date.now();
          await lead.save();
          console.log('Updated lead status to won');
        }
        
      } catch (err) {
        console.error('=== ERROR creating booking from quote ===');
        console.error('Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack,
          code: err.code,
          keyPattern: err.keyPattern,
          keyValue: err.keyValue
        });
        console.error('Full error object:', JSON.stringify(err, null, 2));
        // Don't fail the request if booking creation fails
        // The quote status is still updated, but we should log the error
      } finally {
        console.log('=== END: Booking creation attempt ===');
      }
    }
    
    res.status(200).json({
      success: true,
      data: updatedQuote,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Respond to quote (accept/reject)
// @route   PUT /api/quotes/:id/response
// @access  Private/Agent
exports.respondToQuote = async (req, res) => {
  try {
    console.log('Responding to quote:', req.params.id);
    console.log('Request user:', req.user);
    console.log('Request body:', req.body);
    
    // Find quote and populate agent
    const quote = await Quote.findById(req.params.id).populate('agent', '_id name email');
    
    if (!quote) {
      console.error('Quote not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }
    
    console.log('Quote agent ID:', quote.agent?._id?.toString());
    console.log('Request user ID:', req.user.id);
    
    // Check if user is authorized to respond to this quote
    if (req.user.role === 'agent' && quote.agent?._id?.toString() !== req.user.id) {
      console.error('Authorization failed:', {
        quoteAgentId: quote.agent?._id?.toString(),
        userId: req.user.id,
        role: req.user.role
      });
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this quote. You can only respond to your own quotes.',
      });
    }
    
    // Add response to discussion history if it doesn't exist
    if (!quote.discussion) {
      quote.discussion = [];
    }
    
    if (req.body.response) {
      quote.discussion.push({
        message: req.body.response,
        timestamp: new Date(),
        user: `${req.user.name} (${req.user.role})`,
        type: req.user.role
      });
    }
    
    // Update fields based on request body
    if (req.body.status) {
      quote.status = req.body.status;
    }
    
    // Determine the status based on response or status field
    let newStatus = null;
    
    if (req.body.status) {
      newStatus = req.body.status;
    } else if (req.body.response) {
      if (req.body.response.toLowerCase() === 'accepted') {
        newStatus = 'accepted';
      } else if (req.body.response.toLowerCase() === 'rejected') {
        newStatus = 'rejected';
      } else if (req.body.response.trim() !== '') {
        // If it's an agent responding, set status to 'pending' to allow operations to see it
        if (req.user.role === 'agent') {
          newStatus = 'pending';
        } else {
          // For non-agents, set to 'responded'
          newStatus = 'responded';
        }
      }
    }

    // If we have a new status, update the quote
    if (newStatus) {
      quote.status = newStatus;
      
      // Send notifications based on who is responding
      if (req.user.role === 'agent') {
        // Notify operations team when agent responds
        await notifyOperationsTeam(
          'New Quote Response',
          `Agent ${req.user.name} has responded to quote #${quote.quoteId || quote._id.toString().slice(-6)}`,
          quote._id
        );
      } else if (['operations', 'admin'].includes(req.user.role) && quote.agent) {
        // Notify agent when operations responds
        await sendNotification(
          quote.agent._id,
          'Quote Update',
          `The operations team has responded to your quote #${quote.quoteId || quote._id.toString().slice(-6)}`,
          'quote_response',
          quote._id
        );
      }
    }

    // If the quote is accepted or rejected, handle special cases
    if (newStatus === 'accepted' || newStatus === 'rejected') {
      // Set status based on response type
      if (newStatus === 'accepted') {
        quote.status = 'accepted';
        
        // Update related lead if exists
        try {
          const lead = await Lead.findOne({ quoteId: quote._id });
          if (lead) {
            lead.status = 'won';
            lead.lastContactDate = Date.now();
            await lead.save();
          }
        } catch (err) {
          console.error('Error updating lead:', err);
        }
        
        // Create booking from accepted quote
        try {
          console.log('Creating booking from accepted quote...');
          
          // Check if a booking already exists for this quote
          const existingBooking = await Booking.findOne({ quote: quote._id });
          
          if (existingBooking) {
            console.log('Booking already exists for this quote:', existingBooking._id);
            
            // Update the existing booking status if needed
            if (existingBooking.bookingStatus !== 'pending') {
              existingBooking.bookingStatus = 'pending';
              await existingBooking.save();
              console.log('Updated existing booking status to pending');
            }
          } else {
            // Prepare base booking data with all required fields
            const now = new Date();
            const totalAmount = Number(quote.quotedPrice || quote.budget || 0);
            const bookingData = {
              agent: quote.agent._id,
              quote: quote._id,
              customerDetails: {
                name: quote.customerName || 'Customer',
                email: quote.customerEmail || 'no-email@example.com',
                phone: quote.customerPhone || '0000000000',
                address: quote.customerAddress || ''
              },
              travelDates: {
                startDate: quote.travelDates?.startDate || now,
                endDate: quote.travelDates?.endDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
              },
              specialRequirements: quote.requirements || quote.specialRequirements || '',
              paymentStatus: 'unpaid',
              bookingStatus: 'pending',
              destination: quote.destination || 'Not specified',
              bookingType: quote.package ? 'package' : 'custom',
              isCustom: !quote.package,
              // Keep totalAmount at root level for backward compatibility
              totalAmount: totalAmount,
              pricing: {
                packagePrice: Number(quote.packagePrice || 0),
                agentPrice: Number(quote.agentPrice || 0),
                totalAmount: totalAmount,
                currency: quote.currency || 'INR',
                paymentTerms: quote.paymentTerms,
                cancellationPolicy: quote.cancellationPolicy
              },
              // Copy itinerary and other relevant data
              finalItinerary: quote.finalItinerary || quote.itinerary || '',
              customItinerary: quote.customItinerary,
              activities: quote.activities || [],
              // Handle travelers data
              travelers: quote.travelers || {
                adults: 1,
                children: 0,
                infants: 0,
                details: [{
                  name: quote.customerName || 'Guest',
                  gender: 'other'
                }]
              },
              // Copy any additional fields from quote
              notes: quote.notes || '',
              internalNotes: quote.internalNotes || '',
              tags: quote.tags || [],
              attachments: quote.attachments || []
            };
            
            // If there's a package, include package details
            if (quote.package) {
              bookingData.package = quote.package;
            }

            // Ensure all required fields have values and are properly formatted
            bookingData.customerDetails = bookingData.customerDetails || {};
            bookingData.travelDates = bookingData.travelDates || {};
            bookingData.pricing = bookingData.pricing || {};
            bookingData.travelers = bookingData.travelers || {};

            // Set default values for customer details
            bookingData.customerDetails = {
              name: bookingData.customerDetails.name || 'Customer',
              email: bookingData.customerDetails.email || 'no-email@example.com',
              phone: bookingData.customerDetails.phone || '0000000000',
              address: bookingData.customerDetails.address || '',
              // Copy any additional customer details from quote
              ...(quote.customerDetails || {})
            };
            
            // Ensure travel dates are valid
            bookingData.travelDates = {
              startDate: bookingData.travelDates.startDate || now,
              endDate: bookingData.travelDates.endDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
              flexible: bookingData.travelDates.flexible || false
            };
            
            // Ensure pricing is properly formatted
            bookingData.pricing = {
              packagePrice: Math.max(0, Number(bookingData.pricing.packagePrice || 0)),
              agentPrice: Math.max(0, Number(bookingData.pricing.agentPrice || 0)),
              totalAmount: Math.max(0, Number(bookingData.pricing.totalAmount || 0)),
              currency: (bookingData.pricing.currency || 'INR').toUpperCase(),
              paymentTerms: bookingData.pricing.paymentTerms || 'Full payment required at time of booking',
              cancellationPolicy: bookingData.pricing.cancellationPolicy || 'Standard cancellation policy applies',
              // Copy any additional pricing details from quote
              ...(quote.pricing || {})
            };

            // Ensure travelers data is properly formatted
            bookingData.travelers = {
              adults: Math.max(1, Number(bookingData.travelers.adults || 1)),
              children: Math.max(0, Number(bookingData.travelers.children || 0)),
              infants: Math.max(0, Number(bookingData.travelers.infants || 0)),
              details: Array.isArray(bookingData.travelers.details) && bookingData.travelers.details.length > 0
                ? bookingData.travelers.details.map(t => ({
                    name: t.name || 'Guest',
                    gender: ['male', 'female', 'other'].includes(t.gender?.toLowerCase()) 
                      ? t.gender.toLowerCase() 
                      : 'other',
                    age: t.age ? Math.max(0, Number(t.age)) : undefined,
                    idType: t.idType,
                    idNumber: t.idNumber,
                    // Copy any additional traveler details
                    ...t
                  }))
                : [{
                    name: bookingData.customerDetails.name || 'Guest',
                    gender: 'other'
                  }]
            };
            
            // Copy itinerary and activities if they exist in the quote
            if (quote.itinerary) {
              bookingData.finalItinerary = quote.finalItinerary || quote.itinerary;
            }
            
            if (quote.activities && Array.isArray(quote.activities)) {
              bookingData.activities = quote.activities.map(activity => ({
                ...activity,
                // Ensure required activity fields have defaults
                name: activity.name || 'Activity',
                date: activity.date || now,
                // Copy any additional activity details
                ...activity
              }));
            }
            
            // Ensure booking has a title/description
            if (!bookingData.description) {
              bookingData.description = `Booking for ${bookingData.customerDetails.name} - ${bookingData.destination || 'various destinations'}`;
            }
            
            // Create booking
            const booking = await Booking.create(bookingData);
            console.log('Successfully created booking from accepted quote:', booking._id);
            
            // Add a note to the quote discussion about booking creation
            quote.discussion.push({
              message: `Booking created successfully with ID: ${booking.bookingId}`,
              timestamp: new Date(),
              user: 'System',
              type: 'system'
            });
          }
        } catch (err) {
          console.error('Error creating booking from quote:', err);
          
          // Add error information to the quote discussion
          quote.discussion.push({
            message: `Failed to create booking: ${err.message}`,
            timestamp: new Date(),
            user: 'System',
            type: 'system'
          });
          
          // Throw the error so it's not silently ignored
          throw err;
        }
      } else if (newStatus === 'rejected') {
        // Update related lead if exists
        try {
          const lead = await Lead.findOne({ quoteId: quote._id });
          if (lead) {
            lead.status = 'lost';
            lead.lastContactDate = Date.now();
            await lead.save();
          }
        } catch (leadErr) {
          console.error('Error updating lead:', leadErr);
        }
      }
    }
    
    // Update itinerary if provided
    if (req.body.itinerary) {
      quote.itinerary = req.body.itinerary;
    }
    
    // Update respondedBy and respondedAt
    quote.respondedBy = req.user.id;
    quote.respondedAt = Date.now();
    
    // Save the updated quote
    await quote.save();
    
    res.status(200).json({
      success: true,
      data: quote,
    });
  } catch (err) {
    console.error('Error responding to quote:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error',
    });
  }
};

// @desc    Delete quote
// @route   DELETE /api/quotes/:id
// @access  Private (Admin only)
exports.deleteQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }

    await quote.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create quote from package
// @route   POST /api/quotes/from-package
// @access  Private/Agent
exports.createQuoteFromPackage = async (req, res) => {
  try {
    const {
      packageId,
      customerName,
      customerEmail,
      customerPhone,
      travelDate,
      numberOfTravelers,
      adults: legacyAdults,
      children: legacyChildren,
      specialRequests,
      additionalServices
    } = req.body;

    // Support both legacy and new payloads
    let adults = legacyAdults;
    let children = legacyChildren;
    if (numberOfTravelers && typeof numberOfTravelers === 'object') {
      adults = numberOfTravelers.adults;
      children = numberOfTravelers.children;
    }
    adults = adults === undefined ? 1 : adults;
    children = children === undefined ? 0 : children;

    // Validate required fields
    if (!packageId || !customerName || !customerEmail || !customerPhone || !travelDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Find the package
    const packageData = await Package.findById(packageId);
    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    // Generate a unique quote ID
    const quoteId = await generateQuoteId();

    // Calculate total travelers
    const totalTravelers = (adults || 1) + (children || 0);

    // Calculate base price (use offer price if available)
    const basePrice = packageData.offerPrice || packageData.price;
    const totalPrice = basePrice * totalTravelers;

    // Create quote data
    const quoteData = {
      quoteId,
      agent: req.user.id,
      customerName,
      customerEmail,
      customerPhone,
      destination: packageData.destination,
      travelDates: {
        startDate: new Date(travelDate),
        endDate: new Date(new Date(travelDate).setDate(new Date(travelDate).getDate() + packageData.duration - 1))
      },
      travelers: {
        adults: adults || 1,
        children: children || 0,
        infants: 0
      },
      numberOfTravelers: {
        adults: adults || 1,
        children: children || 0
      },
      requirements: specialRequests || '',
      budget: totalPrice,
      quotedPrice: totalPrice,
      status: 'pending',
      source: 'package',
      packageDetails: {
        packageId: packageData._id,
        name: packageData.name,
        description: packageData.description,
        duration: packageData.duration,
        basePrice: basePrice,
        offerPrice: packageData.offerPrice,
        endDate: packageData.endDate
      },
      discussion: [
        {
          message: `Quote created from package: ${packageData.name}`,
          timestamp: new Date(),
          user: 'System',
          type: 'system'
        }
      ],
      additionalServices: additionalServices || []
    };

    // Create the quote
    const quote = await Quote.create(quoteData);

    // Create a lead for this quote
    const leadData = {
      agent: req.user.id,
      customerName,
      customerEmail,
      customerPhone,
      destination: packageData.destination,
      travelDates: {
        startDate: new Date(travelDate),
        endDate: new Date(new Date(travelDate).setDate(new Date(travelDate).getDate() + packageData.duration - 1))
      },
      numberOfTravelers: {
        adults: adults || 1,
        children: children || 0
      },
      budget: totalPrice,
      requirements: specialRequests || '',
      status: 'new',
      source: 'other',
      quoteId: quote._id
    };

    await Lead.create(leadData);

    res.status(201).json({
      success: true,
      data: quote
    });
  } catch (err) {
    console.error('Error creating quote from package:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
};
