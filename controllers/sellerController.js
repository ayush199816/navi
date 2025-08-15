const Seller = require('../models/Seller');
const { generateSellerId } = require('../utils/idGenerator');

/**
 * Get all sellers
 * @route GET /api/sellers
 * @access Private - Admin, Operations
 */
exports.getAllSellers = async (req, res) => {
  try {
    const sellers = await Seller.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: sellers.length,
      data: sellers
    });
  } catch (error) {
    console.error('Error fetching sellers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sellers'
    });
  }
};

/**
 * Get a single seller by ID
 * @route GET /api/sellers/:id
 * @access Private - Admin, Operations
 */
exports.getSellerById = async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: seller
    });
  } catch (error) {
    console.error('Error fetching seller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching seller'
    });
  }
};

/**
 * Create a new seller
 * @route POST /api/sellers
 * @access Private - Admin, Operations
 */
exports.createSeller = async (req, res) => {
  try {
    const {
      name,
      pocName,
      email,
      phone,
      address,
      city,
      state,
      country,
      zipCode,
      destination,
      services,
      commissionRate
    } = req.body;
    
    // Check if seller with this email already exists
    const existingSeller = await Seller.findOne({ email });
    if (existingSeller) {
      return res.status(400).json({
        success: false,
        message: 'A seller with this email already exists'
      });
    }
    
    // Generate unique seller ID
    const sellerId = await generateSellerId();
    
    // Create new seller
    const seller = await Seller.create({
      sellerId,
      name,
      pocName,
      email,
      phone,
      address,
      city,
      state,
      country,
      zipCode,
      destination,
      services: {
        hotel: services?.hotel || false,
        sightseeing: services?.sightseeing || false,
        transfers: services?.transfers || false
      },
      commissionRate: commissionRate || 0,
      createdBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: seller
    });
  } catch (error) {
    console.error('Error creating seller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating seller'
    });
  }
};

/**
 * Update a seller
 * @route PUT /api/sellers/:id
 * @access Private - Admin, Operations
 */
exports.updateSeller = async (req, res) => {
  try {
    const {
      name,
      pocName,
      phone,
      address,
      city,
      state,
      country,
      zipCode,
      destination,
      services,
      status,
      commissionRate
    } = req.body;
    
    // Find seller by ID
    let seller = await Seller.findById(req.params.id);
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }
    
    // Update seller
    seller = await Seller.findByIdAndUpdate(
      req.params.id,
      {
        name,
        pocName,
        phone,
        address,
        city,
        state,
        country,
        zipCode,
        destination,
        services: {
          hotel: services?.hotel || false,
          sightseeing: services?.sightseeing || false,
          transfers: services?.transfers || false
        },
        status,
        commissionRate,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: seller
    });
  } catch (error) {
    console.error('Error updating seller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating seller'
    });
  }
};

/**
 * Delete a seller
 * @route DELETE /api/sellers/:id
 * @access Private - Admin
 */
exports.deleteSeller = async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }
    
    await seller.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Seller deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting seller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting seller'
    });
  }
};
