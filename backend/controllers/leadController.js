const Lead = require('../models/Lead');
const User = require('../models/User');

// @desc    Get all leads (for admin/sales)
// @route   GET /api/leads
// @access  Private/Admin/Sales
exports.getLeads = async (req, res) => {
  try {
    const { status, agentId, source, minBudget, maxBudget, search, startDate, endDate } = req.query;
    
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
    
    // Filter by source
    if (source) {
      query.source = source;
    }
    
    // Filter by budget range
    if (minBudget || maxBudget) {
      query.budget = {};
      if (minBudget) query.budget.$gte = parseFloat(minBudget);
      if (maxBudget) query.budget.$lte = parseFloat(maxBudget);
    }
    
    // Filter by travel date range
    if (startDate || endDate) {
      query.travelDates = {};
      if (startDate) {
        query['travelDates.startDate'] = { $gte: new Date(startDate) };
      }
      if (endDate) {
        query['travelDates.endDate'] = { $lte: new Date(endDate) };
      }
    }
    
    // Search by customer name, email, phone or destination
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Execute query
    const leads = await Lead.find(query)
      .populate('agent', 'name email companyName')
      .populate('assignedTo', 'name role')
      .populate('quoteId', 'quoteId status quotedPrice')
      .populate('bookingId', 'bookingId bookingStatus totalAmount')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Lead.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: leads.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: leads,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get leads by agent (for agents to see their own leads)
// @route   GET /api/leads/my-leads
// @access  Private/Agent
exports.getMyLeads = async (req, res) => {
  try {
    const { status, source, minBudget, maxBudget, search, startDate, endDate } = req.query;
    
    // Build query
    const query = {
      agent: req.user.id
    };
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by source
    if (source) {
      query.source = source;
    }
    
    // Filter by budget range
    if (minBudget || maxBudget) {
      query.budget = {};
      if (minBudget) query.budget.$gte = parseFloat(minBudget);
      if (maxBudget) query.budget.$lte = parseFloat(maxBudget);
    }
    
    // Filter by travel date range
    if (startDate || endDate) {
      query.travelDates = {};
      if (startDate) {
        query['travelDates.startDate'] = { $gte: new Date(startDate) };
      }
      if (endDate) {
        query['travelDates.endDate'] = { $lte: new Date(endDate) };
      }
    }
    
    // Search by customer name, email, phone or destination
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Execute query
    const leads = await Lead.find(query)
      .populate('quoteId', 'quoteId status quotedPrice')
      .populate('bookingId', 'bookingId bookingStatus totalAmount')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Lead.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: leads.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: leads,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('agent', 'name email companyName')
      .populate('assignedTo', 'name role')
      .populate('quoteId', 'quoteId status quotedPrice quotedDetails')
      .populate('bookingId', 'bookingId bookingStatus totalAmount');
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }
    
    // All authenticated users can view any lead
    // Authorization checks for modifications are handled in the respective routes/controllers
    
    res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Create new lead
// @route   POST /api/leads
// @access  Private/Agent
exports.createLead = async (req, res) => {
  try {
    // Add agent ID to req.body
    req.body.agent = req.user.id;
    
    // Create lead
    const lead = await Lead.create(req.body);
    
    res.status(201).json({
      success: true,
      data: lead,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
exports.updateLead = async (req, res) => {
  try {
    let lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }
    
    // Check if user is authorized to update this lead
    if (req.user.role === 'agent' && lead.agent.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this lead',
      });
    }
    
    // Remove fields that shouldn't be updated directly
    const updateData = { ...req.body };
    delete updateData.agent;
    delete updateData.quoteId;
    delete updateData.quoteSent;
    delete updateData.bookingId;
    delete updateData.bookingConverted;
    
    // Update lead
    lead = await Lead.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    
    res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Add note to lead
// @route   POST /api/leads/:id/notes
// @access  Private
exports.addLeadNote = async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide note content',
      });
    }
    
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }
    
    // Check if user is authorized to add notes to this lead
    if (req.user.role === 'agent' && lead.agent.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add notes to this lead',
      });
    }
    
    // Add note
    lead.notes.push({
      content,
      createdBy: req.user.id,
      createdAt: Date.now(),
    });
    
    // Update last contact date
    lead.lastContactDate = Date.now();
    
    await lead.save();
    
    res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Assign lead to sales staff
// @route   PUT /api/leads/:id/assign
// @access  Private/Admin/Sales
exports.assignLead = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    
    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user ID to assign lead to',
      });
    }
    
    // Check if user exists and is a sales staff
    const user = await User.findById(assignedTo);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    if (user.role !== 'sales') {
      return res.status(400).json({
        success: false,
        message: 'Lead can only be assigned to sales staff',
      });
    }
    
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }
    
    // Update lead
    lead.assignedTo = assignedTo;
    await lead.save();
    
    res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private/Admin
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }
    
    await lead.remove();
    
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
