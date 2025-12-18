const Invoice = require('../models/Invoice');
const Quote = require('../models/Quote');
const User = require('../models/User');

// @desc    Create a new invoice (with or without a quote)
// @route   POST /api/invoices
// @access  Private (Admin/Operations)
exports.createInvoice = async (req, res) => {
  try {
    const { quoteId, items, tax, taxRate, notes, terms, dueDate, customerName, customerEmail, customerPhone, customerAddress, customerGstin } = req.body;

    let quote = null;
    let agent = req.user._id; // Default to current user as agent

    // If quoteId is provided, validate it exists and get quote data
    if (quoteId) {
      quote = await Quote.findById(quoteId).populate('agent');
      if (!quote) {
        return res.status(404).json({ message: 'Quote not found' });
      }

      // Check if invoice already exists for this quote
      const existingInvoice = await Invoice.findOne({ quote: quoteId });
      if (existingInvoice) {
        return res.status(400).json({ message: 'Invoice already exists for this quote' });
      }
      
      // Use quote's agent if available
      if (quote.agent) {
        agent = quote.agent._id;
      }
    }

    // Create invoice items
    let invoiceItems = items || [];
    
    // If no items provided and we have a quote, create default items from quote
    if ((!invoiceItems || invoiceItems.length === 0) && quote) {
      invoiceItems = [
        {
          description: `Travel Package - ${quote.destination}`,
          quantity: (quote.numberOfTravelers?.adults || 1) + (quote.numberOfTravelers?.children || 0),
          unitPrice: quote.quotedPrice / ((quote.numberOfTravelers?.adults || 1) + (quote.numberOfTravelers?.children || 0)),
          total: quote.quotedPrice
        }
      ];
    }

    // Calculate totals
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = tax || (subtotal * (taxRate || 0) / 100);
    const totalAmount = subtotal + taxAmount;

    // Set due date (default 30 days from now)
    const invoiceDueDate = dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Prepare base invoice data
    const invoiceData = {
      // Only include quote if it exists
      ...(quoteId && { quote: quoteId }),
      agent: agent, // This is set earlier to either quote.agent._id or req.user._id
      customerName: customerName || (quote ? quote.customerName : ''),
      customerEmail: customerEmail || (quote ? quote.customerEmail : ''),
      customerPhone: customerPhone || (quote ? quote.customerPhone : ''),
      customerAddress: customerAddress || (quote ? quote.customerAddress : ''),
      customerGstin: customerGstin || (quote ? quote.customerGstin : ''),
      
      // Include quote-related fields if we have a quote
      ...(quote ? {
        destination: quote.destination,
        travelDates: quote.travelDates,
        numberOfTravelers: quote.numberOfTravelers
      } : {
        // Set default values for required fields when no quote
        destination: req.body.destination || 'N/A',
        travelDates: {
          startDate: req.body.travelStartDate || new Date(),
          endDate: req.body.travelEndDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to 7 days from now
        },
        numberOfTravelers: {
          adults: req.body.adults || 1,
          children: req.body.children || 0
        }
      }),
      
      // Invoice items and calculations
      items: invoiceItems,
      subtotal: subtotal,
      tax: taxAmount,
      taxRate: taxRate || 0,
      total: totalAmount,
      totalAmount: totalAmount, // Set both total and totalAmount for compatibility
      
      // Dates and terms
      dueDate: invoiceDueDate,
      issueDate: new Date(),
      notes: notes || '',
      terms: terms || 'Payment due within 15 days',
      status: 'draft', // Changed from 'pending' to match enum
      createdBy: req.user.id,
      
      // Include additional fields from the request
      ...(req.body.invoiceNumber && { invoiceNumber: req.body.invoiceNumber }),
      ...(req.body.paymentReceived !== undefined && { 
        paymentReceived: req.body.paymentReceived 
      }),
      ...(req.body.paymentDate && { 
        paymentDate: req.body.paymentDate,
        ...(req.body.paymentReceived && { status: 'paid' })
      }),
      ...(req.body.installments && { installments: req.body.installments }),
      
      // Company information
      ...(req.body.companyName && { companyName: req.body.companyName }),
      ...(req.body.companyAddress && { companyAddress: req.body.companyAddress }),
      ...(req.body.companyGstin && { companyGstin: req.body.companyGstin }),
      ...(req.body.companyLogo && { companyLogo: req.body.companyLogo })
    };

    const invoice = await Invoice.create(invoiceData);

    // Populate the invoice with related data
    await invoice.populate([
      { path: 'quote', select: 'quoteId destination' },
      { path: 'agent', select: 'name email' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error while creating invoice' 
    });
  }
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private (Admin/Operations)
exports.getInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';

    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { invoiceId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    const invoices = await Invoice.find(query)
      .populate('quote', 'quoteId')
      .populate('agent', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Invoice.countDocuments(query);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error while fetching invoices' 
    });
  }
};

// @desc    Get single invoice by ID
// @route   GET /api/invoices/:id
// @access  Private (Admin/Operations)
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('quote')
      .populate('agent', 'name email phone')
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error while fetching invoice' 
    });
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private (Admin/Operations)
exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Don't allow updates to paid invoices
    if (invoice.status === 'paid') {
      return res.status(400).json({ message: 'Cannot update paid invoices' });
    }

    const { items, tax, taxRate, notes, terms, dueDate, status } = req.body;

    // Update fields
    if (items) {
      invoice.items = items;
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      invoice.subtotal = subtotal;
      invoice.tax = tax || (subtotal * (taxRate || 0) / 100);
      invoice.totalAmount = subtotal + invoice.tax;
    }

    if (tax !== undefined) invoice.tax = tax;
    if (taxRate !== undefined) invoice.taxRate = taxRate;
    if (notes !== undefined) invoice.notes = notes;
    if (terms !== undefined) invoice.terms = terms;
    if (dueDate !== undefined) invoice.dueDate = dueDate;
    if (status !== undefined) invoice.status = status;

    // Update paid date if status is changed to paid
    if (status === 'paid' && invoice.status !== 'paid') {
      invoice.paidDate = new Date();
    }

    await invoice.save();

    // Populate updated invoice
    await invoice.populate([
      { path: 'quote', select: 'quoteId destination' },
      { path: 'agent', select: 'name email' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error while updating invoice' 
    });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private (Admin/Operations)
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Don't allow deletion of paid invoices
    if (invoice.status === 'paid') {
      return res.status(400).json({ message: 'Cannot delete paid invoices' });
    }

    await invoice.deleteOne();

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error while deleting invoice' 
    });
  }
};

// @desc    Mark invoice as paid
// @route   PUT /api/invoices/:id/mark-paid
// @access  Private (Admin/Operations)
exports.markAsPaid = async (req, res) => {
  try {
    const { paymentMethod, paymentDetails } = req.body;

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ message: 'Invoice is already marked as paid' });
    }

    invoice.status = 'paid';
    invoice.paidDate = new Date();
    if (paymentMethod) invoice.paymentMethod = paymentMethod;
    if (paymentDetails) {
      invoice.paymentDetails = {
        ...invoice.paymentDetails,
        ...paymentDetails
      };
    }

    await invoice.save();

    // Populate updated invoice
    await invoice.populate([
      { path: 'quote', select: 'quoteId destination' },
      { path: 'agent', select: 'name email' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error while marking invoice as paid' 
    });
  }
};
