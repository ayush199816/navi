const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Package = require('../models/Package');
const Quote = require('../models/Quote');
const Wallet = require('../models/Wallet');
const Lead = require('../models/Lead');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get bookings for guest users
// @route   GET /api/bookings/guest/my-bookings
// @access  Private/Guest
exports.getGuestBookings = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    // Build query - only return bookings for the logged-in guest user
    const query = {
      'customerDetails.email': req.user.email
    };
    
    // Filter by status
    if (status) {
      query.bookingStatus = status;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.travelDates = {};
      if (startDate) {
        query['travelDates.startDate'] = { $gte: new Date(startDate) };
      }
      if (endDate) {
        query['travelDates.endDate'] = { $lte: new Date(endDate) };
      }
    }
    
    // Execute query
    const bookings = await Booking.find(query)
      .populate('package', 'name destination duration image')
      .populate('agent', 'name email companyName')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching guest bookings',
    });
  }
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private/Admin/Operations
exports.getBookings = async (req, res) => {
  try {
    const { status, agentId, packageId, startDate, endDate, search } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by status
    if (status) {
      query.bookingStatus = status;
    }
    
    // Filter by agent
    if (agentId) {
      query.agent = agentId;
    }
    
    // Filter by package
    if (packageId) {
      query.package = packageId;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.travelDates = {};
      if (startDate) {
        query['travelDates.startDate'] = { $gte: new Date(startDate) };
      }
      if (endDate) {
        query['travelDates.endDate'] = { $lte: new Date(endDate) };
      }
    }
    
    // Search by customer name, email, phone or booking ID
    if (search) {
      query.$or = [
        { 'customerDetails.name': { $regex: search, $options: 'i' } },
        { 'customerDetails.email': { $regex: search, $options: 'i' } },
        { 'customerDetails.phone': { $regex: search, $options: 'i' } },
        { bookingId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Execute query
    const bookings = await Booking.find(query)
      .populate('agent', 'name email companyName')
      .populate('package', 'name destination duration')
      .populate('handledBy', 'name role')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Booking.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: bookings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get bookings by agent (for agents to see their own bookings)
// @route   GET /api/bookings/my-bookings
// @access  Private/Agent
exports.getMyBookings = async (req, res) => {
  try {
    const { status, packageId, startDate, endDate, search } = req.query;
    
    // Build query - only return bookings for the logged-in agent
    const query = {
      agent: req.user.id
    };
    
    // Filter by status
    if (status) {
      query.bookingStatus = status;
    }
    
    // Filter by package
    if (packageId) {
      query.package = packageId;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.travelDates = {};
      if (startDate) {
        query['travelDates.startDate'] = { $gte: new Date(startDate) };
      }
      if (endDate) {
        query['travelDates.endDate'] = { $lte: new Date(endDate) };
      }
    }
    
    // Search by customer name, email, phone or booking ID
    if (search) {
      query.$or = [
        { 'customerDetails.name': { $regex: search, $options: 'i' } },
        { 'customerDetails.email': { $regex: search, $options: 'i' } },
        { 'customerDetails.phone': { $regex: search, $options: 'i' } },
        { bookingId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Execute query
    const bookings = await Booking.find(query)
      .populate('package', 'name destination duration')
      .populate('handledBy', 'name role')
      .populate('seller', 'name pocName destination services') // Legacy seller population
      .populate({ // New multiple sellers population
        path: 'sellers.seller',
        select: 'name pocName destination services'
      })
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Booking.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: bookings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('agent', 'name email companyName')
      .populate('package', 'name destination duration price inclusions exclusions itinerary')
      .populate('quote', 'quoteId quotedPrice quotedDetails')
      .populate('handledBy', 'name role')
      .populate('seller', 'name pocName destination services') // Legacy seller population
      .populate({ // New multiple sellers population
        path: 'sellers.seller',
        select: 'name pocName destination services'
      });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }
    
    // Check if user is authorized to view this booking
    if (req.user.role === 'agent' && booking.agent.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking',
      });
    }
    
    // Log seller information for debugging
    console.log('Booking retrieved with seller:', booking.seller);
    
    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private/Agent
exports.createBooking = async (req, res) => {
  try {
    const { packageId, quoteId, customerDetails, travelDates, travelers, specialRequirements } = req.body;
    
    // Check if package exists
    const package = await Package.findById(packageId);
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found',
      });
    }
    
    // Check if package is active
    if (!package.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This package is not available for booking',
      });
    }
    
    // Get agent wallet
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Agent wallet not found',
      });
    }
    
    // Calculate total amount and agent commission
    const totalAmount = package.price;
    const agentCommission = package.price - package.agentPrice;
    
    // Check if agent has sufficient balance or credit
    if (package.agentPrice > (wallet.balance + wallet.creditLimit)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient funds. Please add funds to your wallet or request a credit limit increase.',
      });
    }
    
    // Create booking object
    const bookingData = {
      agent: req.user.id,
      package: packageId,
      customerDetails,
      travelDates,
      travelers,
      totalAmount,
      agentCommission,
      specialRequirements,
      paymentStatus: 'pending',
      bookingStatus: 'pending',
    };
    
    // If quote ID is provided, link it to the booking and copy the itinerary
    if (quoteId) {
      const quote = await Quote.findById(quoteId);
      if (quote) {
        bookingData.quote = quoteId;
        
        // Copy the approved itinerary from the quote to the booking's finalItinerary
        if (quote.itinerary) {
          bookingData.finalItinerary = quote.itinerary;
        }
      }
    }
    
    // Create booking
    const booking = await Booking.create(bookingData);
    
    // Deduct amount from agent wallet
    wallet.balance -= package.agentPrice;
    wallet.transactions.push({
      type: 'debit',
      amount: package.agentPrice,
      description: `Booking payment for ${package.name} (${booking.bookingId})`,
      reference: booking.bookingId,
      date: Date.now(),
    });
    await wallet.save();
    
    // Update booking with payment details
    booking.paymentDetails.push({
      amount: package.agentPrice,
      method: 'wallet',
      transactionId: wallet.transactions[wallet.transactions.length - 1]._id,
      date: Date.now(),
      status: 'completed',
    });
    booking.paymentStatus = 'completed';
    await booking.save();
    
    // If booking was created from a quote, update the quote status
    if (quoteId) {
      await Quote.findByIdAndUpdate(quoteId, { status: 'accepted' });
    }
    
    // If booking was created from a lead, update the lead
    if (req.body.leadId) {
      await Lead.findByIdAndUpdate(req.body.leadId, {
        bookingConverted: true,
        bookingId: booking._id,
        status: 'won',
      });
    }
    
    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private/Operations
exports.updateBookingStatus = async (req, res) => {
  try {
    console.log('BOOKING STATUS UPDATE REQUEST');
    console.log('Booking ID:', req.params.id);
    console.log('Request body:', req.body);
    
    // First, get the current booking to check its status
    const currentBooking = await Booking.findById(req.params.id);
    
    if (!currentBooking) {
      console.log('Booking not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }
    
    // If booking is already marked as 'booked', prevent status changes
    if (currentBooking.bookingStatus === 'booked' && req.body.status !== 'booked') {
      return res.status(403).json({
        success: false,
        message: 'Cannot change status after booking has been marked as booked'
      });
    }
    
    // Accept any case of status
    let status = req.body.status;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    // Convert to lowercase for validation
    status = status.toLowerCase();
    
    // List of valid statuses
    const validStatuses = ['confirmed', 'pending', 'cancelled', 'completed', 'processing', 'booked'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid values are: ${validStatuses.join(', ')}`
      });
    }
    
    // Prepare update data
    const updateData = {
      bookingStatus: status,
      lastUpdated: Date.now()
    };
    
    if (req.user && req.user.id) {
      updateData.handledBy = req.user.id;
    }
    
    // If status is cancelled, add cancellation reason
    if (status === 'cancelled' && req.body.cancellationReason) {
      updateData.cancellationReason = req.body.cancellationReason;
    }
    
    // If status is 'booked', require at least one seller
    if (status === 'booked') {
      // Check if we have sellers data in the new format
      if (req.body.sellers && Array.isArray(req.body.sellers) && req.body.sellers.length > 0) {
        console.log('Multiple sellers provided:', req.body.sellers);
        
        // Validate each seller object has a seller ID
        const validSellers = req.body.sellers.every(item => item.seller);
        if (!validSellers) {
          return res.status(400).json({
            success: false,
            message: 'Each seller must have a valid seller ID'
          });
        }
        
        // Add multiple sellers to the booking
        updateData.sellers = req.body.sellers.map(item => ({
          seller: item.seller,
          services: item.services || '',
          notes: item.notes || '',
          assignedAt: Date.now()
        }));
        
        // For backward compatibility, also set the first seller as the primary seller
        updateData.seller = req.body.sellers[0].seller;
        updateData.sellerAssignedAt = Date.now();
        
        console.log('Added multiple sellers to booking');
      } 
      // Fallback to legacy single seller format
      else if (req.body.sellerId) {
        console.log('Single seller provided:', req.body.sellerId);
        
        // Add seller information to the update data
        updateData.seller = req.body.sellerId;
        updateData.sellerAssignedAt = Date.now();
        
        // Also add to the sellers array for consistency
        updateData.sellers = [{
          seller: req.body.sellerId,
          assignedAt: Date.now(),
          services: '',
          notes: ''
        }];
      } 
      // No seller provided
      else {
        return res.status(400).json({
          success: false,
          message: 'At least one supplier is required when marking a booking as booked'
        });
      }
    }
    
    // Use findByIdAndUpdate with runValidators: false to avoid validation issues
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: false }
    )
    .populate('seller', 'name pocName destination services')
    .populate({
      path: 'sellers.seller',
      select: 'name pocName destination services'
    });
    
    if (!booking) {
      console.log('Booking not found after update attempt:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }
    
    console.log(`Successfully updated booking status to ${status}`);
    console.log('Booking status updated successfully:', booking.bookingStatus);
    
    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    console.error('Error updating booking status:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error',
    });
  }
};

// @desc    Generate invoice
// @route   PUT /api/bookings/:id/invoice
// @access  Private/Agent/Operations
exports.generateInvoice = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }
    
    // Check if user is authorized to generate invoice
    if (req.user.role === 'agent' && booking.agent.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to generate invoice for this booking',
      });
    }
    
    // Generate invoice number
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const invoiceNumber = `INV${year}${month}-${random}`;
    
    // Update booking
    booking.invoiceGenerated = true;
    booking.invoiceNumber = invoiceNumber;
    await booking.save();
    
    res.status(200).json({
      success: true,
      data: {
        invoiceNumber,
        booking,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update booking details
// @route   PUT /api/bookings/:id
// @access  Private/Agent/Admin/Operations
exports.updateBooking = async (req, res) => {
  try {
    console.log('Update booking request received:', req.params.id);
    console.log('Request body:', req.body);
    
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      console.log('Booking not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }
    
    console.log('Original booking status:', booking.bookingStatus);

    // Build updateData from request body
    let updateData = { ...req.body };

    // Only allow certain fields to be updated
    const allowedFields = [
      'customerDetails',
      'travelDates',
      'travelers',
      'specialRequirements',
      'finalItinerary',
      'hotelDetails',
      'flightDetails',
      'activities',
      'bookingStatus',
      'paymentStatus',
      'suppliers' // now an array
    ];

    Object.keys(updateData).forEach(key => {
      if (!allowedFields.includes(key)) {
        delete updateData[key];
      }
    });

    // Convert suppliers to array of ObjectIds if present
    if (Array.isArray(updateData.suppliers)) {
      const mongoose = require('mongoose');
      updateData.suppliers = updateData.suppliers.map(id => mongoose.Types.ObjectId(id));
    } else if (updateData.suppliers) {
      // If only one supplier is sent as string
      const mongoose = require('mongoose');
      updateData.suppliers = [mongoose.Types.ObjectId(updateData.suppliers)];
    }

    // If trying to set status to booked/completed, require at least one supplier
    if (["booked", "completed"].includes(updateData.bookingStatus)) {
      if (!updateData.suppliers || updateData.suppliers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one supplier must be added before setting status to booked or completed.'
        });
      }
    }
    
    console.log('Final update data:', updateData);

    // Update booking
    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('agent');
    
    console.log('Updated booking status:', booking.bookingStatus);

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    console.error('Error updating booking:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error',
    });
  }
};

// @desc    Claim payment for a booking (Admin/Operations)
// @route   POST /api/bookings/:id/claim-payment
// @access  Private/Admin/Operations
exports.claimPayment = async (req, res, next) => {
  try {
    console.log('Claim payment request received:', {
      params: req.params,
      body: req.body,
      user: req.user
    });

    const { paymentAmount, paymentMethod, transactionId, notes } = req.body;
    const bookingId = req.params.id;
    const userId = req.user.id;

    // Convert paymentAmount to number and validate
    const paymentAmountNum = parseFloat(paymentAmount);
    if (isNaN(paymentAmountNum) || paymentAmountNum <= 0) {
      console.error('Invalid payment amount:', paymentAmount);
      return next(new ErrorResponse('Please provide a valid payment amount', 400));
    }

    if (!paymentMethod) {
      console.error('Missing payment method');
      return next(new ErrorResponse('Please provide a payment method', 400));
    }

    // Find the booking
    const booking = await Booking.findById(bookingId)
      .populate('agent', 'name email')
      .populate('customerDetails', 'name email');

    if (!booking) {
      return next(new ErrorResponse('Booking not found', 404));
    }

    // Check if booking is already fully paid
    if (booking.paymentStatus === 'paid') {
      return next(new ErrorResponse('This booking is already fully paid', 400));
    }

    // Calculate claimed amount and remaining amount
    const claimedAmount = booking.claimedAmount || 0;
    const newClaimedAmount = claimedAmount + paymentAmountNum;
    const totalAmount = booking.totalAmount || booking.pricing?.totalAmount || 0;
    
    console.log('Payment details:', {
      claimedAmount,
      newClaimedAmount,
      totalAmount,
      paymentAmount: paymentAmountNum
    });
    
    // Check if claiming more than the remaining amount
    if (newClaimedAmount > totalAmount) {
      const remaining = totalAmount - claimedAmount;
      console.error(`Cannot claim ${paymentAmountNum} when remaining is ${remaining}`);
      return next(new ErrorResponse(
        `Cannot claim more than the remaining amount of ₹${remaining.toLocaleString()}`,
        400
      ));
    }

    // Find the agent's wallet
    const wallet = await Wallet.findOne({ user: booking.agent._id });
    if (!wallet) {
      return next(new ErrorResponse('Agent wallet not found', 404));
    }

    // Check if agent has sufficient balance
    if (wallet.balance < paymentAmountNum) {
      console.error('Insufficient balance:', {
        walletBalance: wallet.balance,
        paymentAmount: paymentAmountNum
      });
      return next(new ErrorResponse(
        `Insufficient wallet balance. Available: ₹${wallet.balance.toLocaleString()}, Required: ₹${paymentAmountNum.toLocaleString()}`,
        400
      ));
    }

    try {
      // First, update the wallet
      const walletUpdate = {
        $inc: { balance: -paymentAmountNum },
        $push: {
          transactions: {
            type: 'debit',
            amount: paymentAmountNum,
            description: `Payment claimed for booking ${booking.bookingId}`,
            reference: transactionId || `CLAIM-${Date.now()}`,
            date: new Date()
          }
        }
      };
      
      console.log('Updating wallet with:', walletUpdate);
      
      // Update wallet directly without transactions
      const updatedWallet = await Wallet.findOneAndUpdate(
        { 
          user: booking.agent._id, 
          balance: { $gte: paymentAmountNum } 
        },
        walletUpdate,
        { new: true }
      );
      
      console.log('Wallet update result:', updatedWallet ? 'Success' : 'Failed');

      if (!updatedWallet) {
        return next(new ErrorResponse('Insufficient wallet balance or wallet not found', 400));
      }

      // Then update the booking
      const isFullyPaid = Math.abs(newClaimedAmount - totalAmount) < 0.01;
      
      const paymentStatus = isFullyPaid ? 'paid' : 'partial';
      console.log('Setting payment status to:', paymentStatus);
      
      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
          $set: {
            claimedAmount: newClaimedAmount,
            paymentStatus: paymentStatus,
            paymentClaimed: isFullyPaid,
            paymentClaimedBy: userId,
            paymentClaimedAt: new Date()
          },
          $push: {
            paymentDetails: {
              amount: paymentAmountNum,
              method: paymentMethod,
              transactionId: transactionId || `CLAIM-${Date.now()}`,
              date: new Date(),
              status: 'completed',
              processedBy: userId,
              notes: notes || 'Payment claimed by admin',
              reference: transactionId || `CLAIM-${Date.now()}`
            }
          }
        },
        { new: true, runValidators: true }
      )
      .populate('agent', 'name email')
      .populate('customerDetails', 'name email')
      .populate('paymentClaimedBy', 'name');

      if (!updatedBooking) {
        // If booking update fails, we should reverse the wallet update
        // In a production environment, you might want to implement a more robust compensation mechanism
        console.error('Failed to update booking after wallet was updated');
        return next(new ErrorResponse('Failed to process payment', 500));
      }

      // Calculate remaining amount
      const remainingAmount = Math.max(0, totalAmount - newClaimedAmount);
      
      res.status(200).json({
        success: true,
        data: {
          ...updatedBooking.toObject(),
          paymentDetails: {
            amountClaimed: paymentAmountNum,
            totalAmount: totalAmount,
            claimedAmount: newClaimedAmount,
            remainingAmount: remainingAmount,
            isFullyPaid: isFullyPaid,
            paymentStatus: paymentStatus
          }
        },
        message: isFullyPaid 
          ? `Successfully claimed full payment of ₹${paymentAmountNum.toLocaleString()}`
          : `Successfully claimed ₹${paymentAmountNum.toLocaleString()} (₹${remainingAmount.toLocaleString()} remaining)`
      });

    } catch (error) {
      console.error('Error in claim payment:', error);
      next(new ErrorResponse('Failed to process payment: ' + error.message, 500));
    }

  } catch (err) {
    console.error('Error claiming payment:', err);
    next(new ErrorResponse(err.message || 'Failed to claim payment', 500));
  }
};

// @desc    Cancel booking (for agents)
// @route   PUT /api/bookings/:id/cancel
// @access  Private/Agent
exports.cancelBooking = async (req, res) => {
  try {
    const { cancellationReason } = req.body;

    if (!cancellationReason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a cancellation reason',
      });
    }
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }
    
    // Check if user is the agent who made the booking
    if (booking.agent.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking',
      });
    }
    
    // Check if booking can be cancelled
    if (['cancelled', 'completed'].includes(booking.bookingStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a booking with status '${booking.bookingStatus}'`,
      });
    }
    
    // Update booking
    booking.bookingStatus = 'cancelled';
    booking.cancellationReason = cancellationReason;
    await booking.save();
    
    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
