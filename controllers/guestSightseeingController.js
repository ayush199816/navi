const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const GuestSightseeing = require('../models/GuestSightseeing');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Upload images for guest sightseeing
// @route   POST /api/guest-sightseeing/upload
// @access  Private/Admin
const uploadGuestSightseeingImages = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new ErrorResponse('Please upload at least one image', 400));
  }

  // Process uploaded files
  const fileUrls = req.files.map(file => {
    // Always use HTTPS and the production domain for image URLs
    return `http://navi-1.onrender.com/uploads/guestsightseeing/${file.filename}`;
  });

  res.status(200).json({
    success: true,
    count: fileUrls.length,
    data: fileUrls
  });
});

// @desc    Get all guest sightseeing
// @route   GET /api/guest-sightseeing
// @access  Public
const getGuestSightseeings = asyncHandler(async (req, res, next) => {
  console.log('🔍 [GET] /api/guest-sightseeing');
  console.log('📝 Request query:', JSON.stringify(req.query, null, 2));
  
  // Parse query parameters
  const { sort, select, page = 1, limit = 10, search = '', country = '', excludeId, random } = req.query;
  
  // Build filter object
  const filter = {};
  
  // Add search filter if provided
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Add country filter if provided
  if (country) {
    filter.country = { $regex: country, $options: 'i' };
  }
  
  // Add flexible name matching if provided
  if (req.query.name) {
    const nameParts = req.query.name.split(/\s+/); // Split by any whitespace
    
    // Create an array of regex patterns for each word in the name
    const nameRegexes = nameParts.map(part => ({
      name: { $regex: part, $options: 'i' }
    }));
    
    // Use $or to match any part of the name
    filter.$or = [
      ...(filter.$or || []), // Preserve existing $or conditions
      { name: { $regex: req.query.name, $options: 'i' } }, // Exact match
      ...(nameParts.length > 1 ? [{ $and: nameRegexes }] : []) // Match all parts
    ];
    
    // Remove duplicates if name is in both $or and root filter
    if (filter.name) {
      delete filter.name;
    }
  }
  
  // Exclude specific ID if provided
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  
  // Only show active sightseeings
  filter.isActive = true;
  
  console.log('🔧 Filters:', JSON.stringify(filter, null, 2));
  
  // Parse pagination parameters
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const startIndex = (pageNum - 1) * limitNum;
  
  // Create base query
  console.log('🔨 Building base query with filters');
  let query = GuestSightseeing.find(filter);
  
  // Log the raw query
  console.log('🔍 Raw query:', JSON.stringify(query.getFilter(), null, 2));
  
  // Select Fields
  const defaultFields = 'name description price offerPrice duration inclusions images country isActive createdAt';
  if (select) {
    const fields = select.split(',').join(' ');
    console.log('Selecting fields:', fields);
    query = query.select(fields);
  } else {
    // Always include these fields by default
    query = query.select(defaultFields);
  }
  
  // Sort
  if (sort) {
    const sortBy = sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }
  
  // Apply pagination
  query = query.skip(startIndex).limit(limitNum);
  
  // Log the complete query being executed
  console.log('🔍 Executing query:', JSON.stringify({
    collection: GuestSightseeing.collection.name,
    filter,
    sort: query._mongooseOptions?.sort,
    skip: query._mongooseOptions?.skip,
    limit: query._mongooseOptions?.limit,
    selectedFields: query._fields
  }, null, 2));

  // Execute query
  console.log(' Executing query with pagination...');
  try {
    // Get total count first
    console.log(' Counting total matching documents...');
    const total = await GuestSightseeing.countDocuments(filter);
    console.log(` Found ${total} matching documents in total`);
    
    // Handle random sampling if requested
    if (random) {
      const sampleSize = parseInt(random, 10) || 6;
      console.log(` Fetching ${sampleSize} random sightseeings`);
      
      // Get random sample of documents with all fields
      const randomSample = await GuestSightseeing.aggregate([
        { $match: filter },
        { $sample: { size: sampleSize } }
      ]);
      
      return res.status(200).json({
        success: true,
        count: randomSample.length,
        data: randomSample,
        pagination: {
          total: randomSample.length,
          page: 1,
          pages: 1,
          limit: randomSample.length
        }
      });
    }
    
    if (total === 0) {
      console.log(' No documents found matching the filters');
      // Log available collections for debugging
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(' Available collections:', collections.map(c => c.name));
      
      // Check if collection exists
      const collectionExists = collections.some(c => c.name === 'guestsightseeings');
      console.log(`ℹ️ Collection 'guestsightseeings' exists: ${collectionExists}`);
      
      // If collection exists but no documents, check if it's empty
      if (collectionExists) {
        const totalInCollection = await GuestSightseeing.countDocuments({});
        console.log(`ℹ️ Total documents in collection: ${totalInCollection}`);
        
        // Try to find any document in the collection
        const anyDoc = await GuestSightseeing.findOne({}).lean();
        console.log('Sample document from collection:', anyDoc);
        
        // Try a direct query to see if we get any results
        const directQueryResults = await GuestSightseeing.find({ isActive: true }).limit(5).lean();
        console.log('Direct query results (first 5 active docs):', directQueryResults);
      }
    }
    
    // Now execute the query, including all fields
    results = await query.lean().exec();
    console.log(`✅ Retrieved ${results.length} results`);
    
    // Log the first few results if any
    if (results.length > 0) {
      console.log('📄 Sample result (first 2 items):', JSON.stringify(results.slice(0, 2), null, 2));
    } else {
      console.log('ℹ️ Query returned 0 results');
    }
    
    // Prepare response
    const response = {
      success: true,
      data: results,
      count: results.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    };
    
    console.log('📤 Sending response with', results.length, 'items');
    console.log('Response object:', JSON.stringify(response, null, 2));
    
    // Send response
    res.status(200).json(response);
    
  } catch (error) {
    console.error(' Query execution error:', error);
    return next(new ErrorResponse('Error executing query: ' + error.message, 500));
  }
  
});

// @desc    Get single guest sightseeing
// @route   GET /api/guest-sightseeing/:id
// @access  Public
const getGuestSightseeing = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if ID is provided and is a valid MongoDB ObjectId
    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      return next(
        new ErrorResponse(`Invalid sightseeing ID: ${id}`, 400)
      );
    }

    const sightseeing = await GuestSightseeing.findById(id).lean();

    if (!sightseeing) {
      return next(
        new ErrorResponse(`Sightseeing not found with id of ${id}`, 404)
      );
    }
    
    // Ensure default values are set
    if (!sightseeing.duration) {
      sightseeing.duration = 'Not specified';
    }
    
    if (!sightseeing.inclusions || sightseeing.inclusions.length === 0) {
      sightseeing.inclusions = ['No inclusions specified'];
    }

    // Return the sightseeing data in a consistent format
    res.status(200).json({
      success: true,
      data: sightseeing
    });
  } catch (error) {
    console.error('Error in getGuestSightseeing:', error);
    
    // Handle specific error types
    if (error.name === 'CastError') {
      return next(new ErrorResponse('Invalid sightseeing ID format', 400));
    }
    
    next(new ErrorResponse('Server error', 500));
  }
});

// @desc    Create new guest sightseeing
// @route   POST /api/guest-sightseeing
// @access  Private/Admin
const createGuestSightseeing = asyncHandler(async (req, res, next) => {
  console.log('Creating new guest sightseeing with data:', JSON.stringify(req.body, null, 2));
  
  // Add user to req.body
  req.body.user = req.user.id;

  // Ensure inclusions is an array
  if (req.body.inclusions && !Array.isArray(req.body.inclusions)) {
    req.body.inclusions = [req.body.inclusions];
  }

  const sightseeing = await GuestSightseeing.create(req.body);
  console.log('Created sightseeing:', sightseeing);

  res.status(201).json({
    success: true,
    data: sightseeing
  });
});

// @desc    Update guest sightseeing
// @route   PUT /api/guest-sightseeing/:id
// @access  Private/Admin
const updateGuestSightseeing = asyncHandler(async (req, res, next) => {
  try {
    console.log('Update request body:', req.body);
    
    let sightseeing = await GuestSightseeing.findById(req.params.id);

    if (!sightseeing) {
      return next(
        new ErrorResponse(`Sightseeing not found with id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is admin
    if (req.user.role !== 'admin') {
      return next(
        new ErrorResponse(`User ${req.user.id} is not authorized to update this sightseeing`, 401)
      );
    }

    // Prepare updates object
    const updates = { ...req.body };
    
    // Convert price to number if it exists
    if (updates.price !== undefined) {
      updates.price = Number(updates.price);
      if (isNaN(updates.price)) {
        return next(new ErrorResponse('Price must be a valid number', 400));
      }
    }
    
    // Convert offerPrice to number if it exists and is not empty string
    if (updates.offerPrice !== undefined && updates.offerPrice !== '') {
      updates.offerPrice = Number(updates.offerPrice);
      if (isNaN(updates.offerPrice)) {
        return next(new ErrorResponse('Offer price must be a valid number', 400));
      }
    } else if (updates.offerPrice === '') {
      // If offerPrice is an empty string, set it to null/undefined to remove it
      updates.offerPrice = undefined;
    }
    
    // Ensure inclusions is an array
    if (updates.inclusions !== undefined) {
      if (!Array.isArray(updates.inclusions)) {
        updates.inclusions = [updates.inclusions];
      }
      // Remove empty strings from inclusions
      updates.inclusions = updates.inclusions.filter(incl => incl && incl.trim() !== '');
      
      // If no valid inclusions, set default
      if (updates.inclusions.length === 0) {
        updates.inclusions = ['No inclusions specified'];
      }
    }
    
    // Ensure duration has a value
    if (updates.duration === '') {
      updates.duration = 'Not specified';
    }
    
    console.log('Updating sightseeing with data:', JSON.stringify(updates, null, 2));

    // Update the document
    sightseeing = await GuestSightseeing.findByIdAndUpdate(
      req.params.id, 
      updates,
      {
        new: true,
        runValidators: true,
        context: 'query'
      }
    );

    if (!sightseeing) {
      throw new Error('Failed to update sightseeing');
    }

    res.status(200).json({ 
      success: true, 
      data: sightseeing 
    });
    
  } catch (error) {
    console.error('Update error:', error);
    next(new ErrorResponse(error.message || 'Failed to update guest sightseeing', 500));
  }
});

// @desc    Delete guest sightseeing
// @route   DELETE /api/guest-sightseeing/:id
// @access  Private/Admin
const deleteGuestSightseeing = asyncHandler(async (req, res, next) => {
  const sightseeing = await GuestSightseeing.findById(req.params.id);

  if (!sightseeing) {
    return next(
      new ErrorResponse(`Sightseeing not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is admin
  if (req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to delete this sightseeing`, 401)
    );
  }

  // Use deleteOne() instead of remove() as it's the modern approach
  await GuestSightseeing.deleteOne({ _id: req.params.id });

  res.status(200).json({ 
    success: true, 
    data: {},
    message: 'Sightseeing deleted successfully'
  });
});

module.exports = {
  getGuestSightseeings,
  getGuestSightseeing,
  createGuestSightseeing,
  updateGuestSightseeing,
  deleteGuestSightseeing,
  uploadGuestSightseeingImages
};
