const Package = require('../models/Package');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// @desc    Get all packages
// @route   GET /api/packages
// @access  Private
exports.getPackages = async (req, res) => {
  try {
    const { destination, minDuration, maxDuration, minPrice, maxPrice, search, isActive } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by destination
    if (destination) {
      query.destination = { $regex: destination, $options: 'i' };
    }
    
    // Filter by duration
    if (minDuration || maxDuration) {
      query.duration = {};
      if (minDuration) query.duration.$gte = parseInt(minDuration);
      if (maxDuration) query.duration.$lte = parseInt(maxDuration);
    }
    
    // Filter by price
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Execute query
    const packages = await Package.find(query)
      .populate('createdBy', 'name role')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Package.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: packages.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: packages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get single package
// @route   GET /api/packages/:id
// @access  Private
exports.getPackage = async (req, res) => {
  try {
    const package = await Package.findById(req.params.id).populate('createdBy', 'name role');
    
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: package,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Create new package
// @route   POST /api/packages
// @access  Private/Operations
exports.createPackage = async (req, res) => {
  // Debug logging for itinerary
  console.log('Raw itinerary type:', typeof req.body.itinerary);
  console.log('Raw itinerary value:', req.body.itinerary);

  // Fix: Parse itinerary if it's a string
  if (typeof req.body.itinerary === 'string') {
    try {
      let parsed = req.body.itinerary;
      // Keep parsing as long as it's a string that looks like an array
      while (typeof parsed === 'string' && parsed.trim().startsWith('[')) {
        parsed = JSON.parse(parsed);
      }
      req.body.itinerary = parsed;
      console.log('Parsed itinerary type:', typeof req.body.itinerary, Array.isArray(req.body.itinerary) ? '(array)' : '');
      console.log('Parsed itinerary value:', req.body.itinerary);
    } catch (e) {
      console.error('Itinerary JSON parse error:', e);
      return res.status(400).json({ message: 'Invalid itinerary format. Must be array or valid JSON string.' });
    }
  }
  try {
    // Add user to req.body
    req.body.createdBy = req.user.id;
    
    // Create package
    const package = await Package.create(req.body);
    
    // Handle image uploads if any
    if (req.files && req.files.length > 0) {
      const imagePaths = req.files.map(file => file.path);
      package.images = imagePaths;
      await package.save();
    }
    
    res.status(201).json({
      success: true,
      data: package,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update package
// @route   PUT /api/packages/:id
// @access  Private/Operations
exports.updatePackage = async (req, res) => {
  try {
    let package = await Package.findById(req.params.id);
    
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found',
      });
    }
    
    // Update package
    package = await Package.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    
    // Handle image uploads if any
    if (req.files && req.files.length > 0) {
      const imagePaths = req.files.map(file => file.path);
      package.images = [...package.images, ...imagePaths];
      await package.save();
    }
    
    res.status(200).json({
      success: true,
      data: package,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Delete package
// @route   DELETE /api/packages/:id
// @access  Private/Operations
exports.deletePackage = async (req, res) => {
  try {
    const package = await Package.findById(req.params.id);
    
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found',
      });
    }
    
    // Delete images from filesystem
    if (package.images && package.images.length > 0) {
      package.images.forEach(image => {
        try {
          fs.unlinkSync(image);
        } catch (err) {
          console.error(`Error deleting image ${image}:`, err);
        }
      });
    }
    
    await package.remove();
    
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

// @desc    Upload package images
// @route   PUT /api/packages/:id/images
// @access  Private/Operations
exports.uploadPackageImages = async (req, res) => {
  try {
    const package = await Package.findById(req.params.id);
    
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found',
      });
    }
    
    // Handle image uploads
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image',
      });
    }
    
    const imagePaths = req.files.map(file => file.path);
    package.images = [...package.images, ...imagePaths];
    await package.save();
    
    res.status(200).json({
      success: true,
      data: package,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Remove package image
// @route   DELETE /api/packages/:id/images/:imageIndex
// @access  Private/Operations
exports.removePackageImage = async (req, res) => {
  try {
    const package = await Package.findById(req.params.id);
    
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found',
      });
    }
    
    const imageIndex = parseInt(req.params.imageIndex);
    
    if (isNaN(imageIndex) || imageIndex < 0 || imageIndex >= package.images.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image index',
      });
    }
    
    // Delete image from filesystem
    try {
      fs.unlinkSync(package.images[imageIndex]);
    } catch (err) {
      console.error(`Error deleting image ${package.images[imageIndex]}:`, err);
    }
    
    // Remove image from package
    package.images.splice(imageIndex, 1);
    await package.save();
    
    res.status(200).json({
      success: true,
      data: package,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Toggle package active status
// @route   PUT /api/packages/:id/toggle-status
// @access  Private/Operations
exports.togglePackageStatus = async (req, res) => {
  try {
    const package = await Package.findById(req.params.id);
    
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found',
      });
    }
    
    package.isActive = !package.isActive;
    await package.save();
    
    res.status(200).json({
      success: true,
      data: package,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get package stats for dashboard
// @route   GET /api/packages/stats
// @access  Private
exports.getPackageStats = async (req, res) => {
  try {
    // Get total count of packages
    const total = await Package.countDocuments();
    
    // Get count of active packages
    const active = await Package.countDocuments({ isActive: true });
    
    // Get count of packages with offer price
    const withOffers = await Package.countDocuments({ offerPrice: { $exists: true, $ne: null } });
    
    // Get count of packages by destination (top 5)
    const destinationStats = await Package.aggregate([
      { $group: { _id: '$destination', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    res.status(200).json({
      success: true,
      total,
      active,
      withOffers,
      destinations: destinationStats.map(item => ({
        destination: item._id,
        count: item.count
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
