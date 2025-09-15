const SalesLead = require('../models/SalesLead');
const Quote = require('../models/Quote');

// @desc    Get all sales leads
// @route   GET /api/sales-leads
// @access  Private
const getSalesLeads = async (req, res) => {
  console.log('getSalesLeads called with query:', req.query);
  try {
    const { status, assignedTo, priority, source } = req.query;
    const query = {};

    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (priority) query.priority = priority;
    if (source) query.source = source;

    // If user is not admin, only show their assigned leads
    if (req.user.role !== 'admin' && req.user.role !== 'operations') {
      query.assignedTo = req.user.id;
    }

    const leads = await SalesLead.find(query)
      .populate({
        path: 'quote',
        select: 'quoteId totalAmount status createdAt',
        populate: {
          path: 'itinerary',
          select: 'destinations startDate endDate',
          populate: {
            path: 'destinations',
            select: 'name'
          }
        }
      })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leads.length,
      data: leads
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get single sales lead
// @route   GET /api/sales-leads/:id
// @access  Private
const getSalesLead = async (req, res) => {
  try {
    const lead = await SalesLead.findById(req.params.id)
      .populate({
        path: 'quote',
        select: 'quoteId totalAmount status createdAt',
        populate: {
          path: 'itinerary',
          select: 'destinations startDate endDate',
          populate: {
            path: 'destinations',
            select: 'name'
          }
        }
      })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Sales lead not found'
      });
    }

    // Check if user has permission
    if (req.user.role !== 'admin' && lead.assignedTo.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this lead'
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create sales lead from quote
// @route   POST /api/sales-leads
// @access  Private
const createSalesLead = async (req, res) => {
  try {
    const { quoteId, assignedTo, priority, notes } = req.body;

    // Check if quote exists
    const quote = await Quote.findById(quoteId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found'
      });
    }

    // Check if lead already exists for this quote
    const existingLead = await SalesLead.findOne({ quote: quoteId });
    if (existingLead) {
      return res.status(400).json({
        success: false,
        error: 'A sales lead already exists for this quote'
      });
    }

    const leadData = {
      quote: quoteId,
      assignedTo: assignedTo || req.user.id,
      priority: priority || 'medium',
      createdBy: req.user.id,
      value: quote.totalAmount,
      source: 'agent'
    };

    if (notes) {
      leadData.notes = [{
        content: notes,
        createdBy: req.user.id
      }];
    }

    const lead = await SalesLead.create(leadData);

    // Update quote status
    quote.status = 'in_sales';
    await quote.save();

    res.status(201).json({
      success: true,
      data: lead
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update sales lead
// @route   PUT /api/sales-leads/:id
// @access  Private
const updateSalesLead = async (req, res) => {
  try {
    const { status, assignedTo, priority, notes, nextFollowUp } = req.body;
    const lead = await SalesLead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Sales lead not found'
      });
    }

    // Check if user has permission
    if (req.user.role !== 'admin' && lead.assignedTo.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this lead'
      });
    }

    const updates = {};

    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (assignedTo) updates.assignedTo = assignedTo;
    if (nextFollowUp) updates.nextFollowUp = nextFollowUp;

    // Add note if provided
    if (notes) {
      updates.$push = {
        notes: {
          content: notes,
          createdBy: req.user.id
        }
      };
    }

    // Update last contacted if status changed
    if (status) {
      updates.lastContacted = new Date();
    }

    lead = await SalesLead.findByIdAndUpdate(
      req.params.id,
      { 
        ...updates,
        updatedBy: req.user.id
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: lead
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Delete sales lead
// @route   DELETE /api/sales-leads/:id
// @access  Private/Admin
const deleteSalesLead = async (req, res) => {
  try {
    const lead = await SalesLead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Sales lead not found'
      });
    }

    // Only admin can delete
    if (req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this lead'
      });
    }

    await lead.remove();

    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

module.exports = {
  getSalesLeads,
  getSalesLead,
  createSalesLead,
  updateSalesLead,
  deleteSalesLead
};
