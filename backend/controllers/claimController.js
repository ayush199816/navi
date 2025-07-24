const Claim = require('../models/Claim');
const Booking = require('../models/Booking');
const Wallet = require('../models/Wallet');
const User = require('../models/User');

// @desc    Create a new claim
// @route   POST /api/claims
// @access  Private/Agent
exports.createClaim = async (req, res) => {
  try {
    const {
      bookingId,
      amount,
      rateOfExchange,
      currency,
      leadPaxName,
      travelDate,
      notes
    } = req.body;

    // Validate required fields
    if (!bookingId || !amount || !rateOfExchange || !leadPaxName || !travelDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify that the booking belongs to the agent making the claim
    if (booking.agent.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to claim for this booking'
      });
    }

    // Check if claim already exists for this booking
    const existingClaim = await Claim.findOne({ booking: bookingId });
    if (existingClaim) {
      return res.status(400).json({
        success: false,
        message: 'A claim already exists for this booking'
      });
    }

    // Calculate claimed amount
    const claimedAmount = amount * rateOfExchange;

    // Create new claim
    const claim = new Claim({
      booking: bookingId,
      agent: req.user.id,
      amount,
      rateOfExchange,
      currency,
      claimedAmount,
      leadPaxName,
      travelDate: new Date(travelDate),
      notes
    });

    // Save the claim
    await claim.save();

    res.status(201).json({
      success: true,
      data: claim
    });
  } catch (err) {
    console.error('Error creating claim:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
};

// @desc    Get all claims
// @route   GET /api/claims
// @access  Private/Admin/Operations
exports.getAllClaims = async (req, res) => {
  try {
    const { status, agent, startDate, endDate, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (agent) {
      query.agent = agent;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.claimDate = {};
      if (startDate) {
        query.claimDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.claimDate.$lte = new Date(endDate);
      }
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    
    // Get claims with pagination
    const claims = await Claim.find(query)
      .populate('booking', 'bookingReference bookingStatus')
      .populate('agent', 'name email companyName')
      .populate('approvedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await Claim.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: claims.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      },
      data: claims
    });
  } catch (err) {
    console.error('Error getting claims:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
};

// @desc    Get agent's claims
// @route   GET /api/claims/my-claims
// @access  Private/Agent
exports.getMyClaims = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = { agent: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.claimDate = {};
      if (startDate) {
        query.claimDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.claimDate.$lte = new Date(endDate);
      }
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    
    // Get claims with pagination
    const claims = await Claim.find(query)
      .populate('booking', 'bookingReference bookingStatus')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await Claim.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: claims.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      },
      data: claims
    });
  } catch (err) {
    console.error('Error getting agent claims:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
};

// @desc    Get claim by ID
// @route   GET /api/claims/:id
// @access  Private
exports.getClaimById = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('booking', 'bookingReference bookingStatus customerDetails travelDates')
      .populate('agent', 'name email companyName')
      .populate('approvedBy', 'name role');
    
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }
    
    // Check if user is authorized to view this claim
    if (req.user.role === 'agent' && claim.agent._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this claim'
      });
    }
    
    res.status(200).json({
      success: true,
      data: claim
    });
  } catch (err) {
    console.error('Error getting claim:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
};

// @desc    Update claim status (approve/reject)
// @route   PUT /api/claims/:id/status
// @access  Private/Admin/Operations
exports.updateClaimStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    // Validate status
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status (approved or rejected)'
      });
    }
    
    // Find claim
    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }
    
    // Check if claim is already processed
    if (claim.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Claim has already been ${claim.status}`
      });
    }
    
    // Update claim status
    claim.status = status;
    claim.approvedBy = req.user.id;
    if (notes) {
      claim.notes = notes;
    }
    
    // If approved, add transaction to agent's wallet
    if (status === 'approved') {
      const wallet = await Wallet.findOne({ user: claim.agent });
      
      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Agent wallet not found'
        });
      }
      
      // Add transaction to wallet
      wallet.transactions.push({
        type: 'credit',
        amount: claim.claimedAmount,
        description: `Claim approved for booking ${claim.booking}`,
        reference: claim.transactionId,
        date: Date.now()
      });
      
      // Update wallet balance
      wallet.balance += claim.claimedAmount;
      
      // Save wallet
      await wallet.save();
    }
    
    // Save claim
    await claim.save();
    
    res.status(200).json({
      success: true,
      data: claim
    });
  } catch (err) {
    console.error('Error updating claim status:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
};

// @desc    Get claim statistics
// @route   GET /api/claims/stats
// @access  Private/Admin/Operations
exports.getClaimStats = async (req, res) => {
  try {
    const totalClaims = await Claim.countDocuments();
    const pendingClaims = await Claim.countDocuments({ status: 'pending' });
    const approvedClaims = await Claim.countDocuments({ status: 'approved' });
    const rejectedClaims = await Claim.countDocuments({ status: 'rejected' });
    
    // Calculate total claimed amount
    const totalClaimedAmount = await Claim.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$claimedAmount' } } }
    ]);
    
    const totalAmount = totalClaimedAmount.length > 0 ? totalClaimedAmount[0].total : 0;
    
    res.status(200).json({
      success: true,
      data: {
        totalClaims,
        pendingClaims,
        approvedClaims,
        rejectedClaims,
        totalAmount
      }
    });
  } catch (err) {
    console.error('Error getting claim stats:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
};
