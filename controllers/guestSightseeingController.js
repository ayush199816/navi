const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const GuestSightseeing = require('../models/GuestSightseeing');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { cloudinary, uploadToCloudinary } = require('../config/cloudinary');
const stream = require('stream');

// @desc    Upload images for guest sightseeing
// @route   POST /api/guest-sightseeing/upload
// @access  Private/Admin
const uploadGuestSightseeingImages = asyncHandler(async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new ErrorResponse('Please upload at least one image', 400));
    }

    // Process uploaded files
    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { 
            folder: 'navi/guestsightseeing',
            transformation: [
              { width: 800, height: 600, crop: 'limit', quality: 'auto' },
              { fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(new Error('Failed to upload image to Cloudinary'));
            } else {
              resolve({
                url: result.secure_url,
                public_id: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format
              });
            }
          }
        );

        // Create a buffer stream for Cloudinary
        const bufferStream = require('stream').PassThrough();
        bufferStream.end(file.buffer);
        bufferStream.pipe(stream);
      });
    });

    // Wait for all uploads to complete
    const uploadedFiles = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      count: uploadedFiles.length,
      data: uploadedFiles
    });
  } catch (error) {
    console.error('Error in uploadGuestSightseeingImages:', error);
    return next(new ErrorResponse('Error uploading images', 500));
  }
});

// Middleware to handle file uploads using multer
const handleFileUploads = (req, res, next) => {
  upload.array('images')(req, res, (error) => {
    if (error) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(new ErrorResponse('File size too large. Max 5MB per file.', 400));
      } else if (error.message === 'Only image files are allowed!') {
        return next(new ErrorResponse('Only image files are allowed!', 400));
      }
      return next(new ErrorResponse('Error uploading files', 500));
    }
    next();
  });
};

// @desc    Get all guest sightseeing
// @route   GET /api/guest-sightseeing
// @access  Public
const getGuestSightseeings = asyncHandler(async (req, res, next) => {
  console.log(' [GET] /api/guest-sightseeing');
  console.log(' Request query:', JSON.stringify(req.query, null, 2));
  
  // Parse query parameters
  const { 
    sort, 
    select, 
    page = 1, 
    limit = 10, 
    search = '', 
    country = '', 
    excludeId, 
    random,
    // tourType removed
  } = req.query;
  
  // Build filter object
  let filter = {};
  
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
  
  // Tour type filter has been removed
  
  // If there's an $or condition, we need to ensure other filters are applied to each condition
  if (filter.$or) {
    // Create a copy of the filter without $or
    const { $or, ...otherFilters } = filter;
    
    // If there are other filters, combine them with $and
    if (Object.keys(otherFilters).length > 0) {
      // Create a new $and array with the $or and other filters
      filter.$and = [
        { $or },
        ...Object.entries(otherFilters).map(([key, value]) => ({ [key]: value }))
      ];
      // Remove the original $or and other filters since they're now in $and
      delete filter.$or;
      Object.keys(otherFilters).forEach(key => delete filter[key]);
    }
  }
  
  console.log('Initial Filters:', JSON.stringify(filter, null, 2));
  
  // Parse pagination parameters
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const startIndex = (pageNum - 1) * limitNum;
  
  // Create base query
  let query = GuestSightseeing.find(filter);

  // Select fields
  const defaultFields = 'name description price offerPrice duration inclusions images country isActive createdAt city';
  if (select) {
    const fields = select.split(',').join(' ');
    console.log('Selecting fields:', fields);
    query = query.select(fields);
  } else {
    query = query.select(defaultFields);
  }

  // Get search terms if they exist
  const searchTerm = (req.query.search || '').toLowerCase().trim();
  const cityTerm = (req.query.city || '').toLowerCase().trim();
  
  // If we have search terms, we'll do custom sorting
  if (searchTerm || cityTerm) {
    console.log('Performing custom sort with searchTerm:', searchTerm, 'cityTerm:', cityTerm);
    
    // Convert search terms to lowercase for case-insensitive comparison
    const searchTermLower = searchTerm ? searchTerm.toLowerCase() : '';
    const cityTermLower = cityTerm ? cityTerm.toLowerCase() : '';
    
    // Get all matching documents first
    const results = await query.lean().exec();
    
    // Sort results with priority:
    // 1. Exact match for both city and search term in name (highest priority)
    // 2. Exact match for city and partial match for search term in name
    // 3. Partial match for city and exact match for search term in name
    // 4. Partial match for both
    // 5. Sort by name for equal priority
    const sortedResults = results.sort((a, b) => {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      const aCity = (a.city || '').toLowerCase();
      const bCity = (b.city || '').toLowerCase();
      
      // Get original names for case-sensitive display (but keep using lowercase for comparison)
      const aOriginalName = a.name || '';
      const bOriginalName = b.name || '';

      // Calculate match scores
      let aScore = 0;
      let bScore = 0;

      // Special handling when both city and search term are provided
      if (cityTermLower && searchTermLower) {
        // Check for both terms in the name (in any order)
        const aHasBoth = aName.includes(cityTermLower) && aName.includes(searchTermLower);
        const bHasBoth = bName.includes(cityTermLower) && bName.includes(searchTermLower);
        
        // Higher score if both terms appear close to each other
        const aProximity = aName.includes(`${cityTermLower} ${searchTermLower}`) || 
                          aName.includes(`${searchTermLower} ${cityTermLower}`) ||
                          aName.includes(`${cityTermLower}-${searchTermLower}`) ||
                          aName.includes(`${searchTermLower}-${cityTermLower}`);
                          
        const bProximity = bName.includes(`${cityTermLower} ${searchTermLower}`) || 
                          bName.includes(`${searchTermLower} ${cityTermLower}`) ||
                          bName.includes(`${cityTermLower}-${searchTermLower}`) ||
                          bName.includes(`${searchTermLower}-${cityTermLower}`);
        
        if (aHasBoth) aScore += 50;
        if (bHasBoth) bScore += 50;
        
        if (aProximity) aScore += 30; // Extra points for terms appearing close together
        if (bProximity) bScore += 30;
      }

      // Check for combined match of city and search term in name
      if (searchTermLower && cityTermLower) {
        // Check if both terms appear in the name (in any order)
        const aHasBothTerms = aName.includes(cityTermLower) && aName.includes(searchTermLower);
        const bHasBothTerms = bName.includes(cityTermLower) && bName.includes(searchTermLower);
        
        // Check for number + search term (e.g., "4 island", "3 day", etc.)
        const numberPattern = new RegExp(`\\d+\\s*${searchTermLower}`, 'i');
        const aHasNumberedTerm = numberPattern.test(aOriginalName);
        const bHasNumberedTerm = numberPattern.test(bOriginalName);
        
        // Score based on match quality
        if (aHasBothTerms) aScore += 80; // Increased from 60 to 80 for having both terms
        if (bHasBothTerms) bScore += 80;
        
        if (aHasNumberedTerm) aScore += 40; // Extra points for numbered terms
        if (bHasNumberedTerm) bScore += 40;
        
        // Check for exact phrase match (with space or hyphen)
        const phrasePatterns = [
          `${cityTermLower} ${searchTermLower}`,
          `${searchTermLower} ${cityTermLower}`,
          `${cityTermLower}-${searchTermLower}`,
          `${searchTermLower}-${cityTermLower}`
        ];
        
        // Check for exact case match in original name for better precision
        const exactCasePatterns = [
          `${cityTerm} ${searchTerm}`,
          `${searchTerm} ${cityTerm}`,
          `${cityTerm}-${searchTerm}`,
          `${searchTerm}-${cityTerm}`
        ];
        
        // Check for matches in both case-insensitive and case-sensitive patterns
        if (phrasePatterns.some(pattern => aName.includes(pattern)) ||
            exactCasePatterns.some(pattern => aOriginalName.includes(pattern))) {
          aScore += 40; // Increased from 30 to 40 for exact phrase matches
        }
        if (phrasePatterns.some(pattern => bName.includes(pattern)) ||
            exactCasePatterns.some(pattern => bOriginalName.includes(pattern))) {
          bScore += 40;
        }
      }

      // Check for city matches in name and city field
      if (cityTermLower) {
        // Exact case match in name (highest priority)
        if (aOriginalName.startsWith(cityTerm)) aScore += 70;  // Very high score for exact case match at start
        if (bOriginalName.startsWith(cityTerm)) bScore += 70;
        
        // Case-insensitive match at start
        if (aName.startsWith(cityTermLower) && aScore < 70) aScore += 60;
        if (bName.startsWith(cityTermLower) && bScore < 70) bScore += 60;
        
        // Exact case match anywhere in name
        if (aOriginalName.includes(cityTerm) && !aOriginalName.startsWith(cityTerm)) aScore += 40;
        if (bOriginalName.includes(cityTerm) && !bOriginalName.startsWith(cityTerm)) bScore += 40;
        
        // Case-insensitive match anywhere in name
        if (aName.includes(cityTermLower) && aScore < 40) aScore += 30;
        if (bName.includes(cityTermLower) && bScore < 40) bScore += 30;
        
        // Exact city match in city field (case sensitive)
        if (a.city === cityTerm) aScore += 25;
        if (b.city === cityTerm) bScore += 25;
        
        // Case-insensitive city match in city field
        if (aCity === cityTermLower && aScore < 25) aScore += 20;
        if (bCity === cityTermLower && bScore < 25) bScore += 20;
      }

      // Check for search term matches in name
      if (searchTermLower) {
        // Exact case match at start of name
        if (aOriginalName.startsWith(searchTerm)) aScore += 30;
        if (bOriginalName.startsWith(searchTerm)) bScore += 30;
        
        // Case-insensitive match at start
        if (aName.startsWith(searchTermLower) && aScore < 30) aScore += 25;
        if (bName.startsWith(searchTermLower) && bScore < 30) bScore += 25;
        
        // Exact case match anywhere in name
        if (aOriginalName.includes(searchTerm) && !aOriginalName.startsWith(searchTerm)) aScore += 20;
        if (bOriginalName.includes(searchTerm) && !bOriginalName.startsWith(searchTerm)) bScore += 20;
        
        // Case-insensitive match anywhere in name (lowest priority)
        if (aName.includes(searchTermLower) && aScore < 20) aScore += 15;
        if (bName.includes(searchTermLower) && bScore < 20) bScore += 15;
      }

      // If same score, use secondary sorting criteria
      if (aScore === bScore) {
        // First, check if one has the city in the name and the other doesn't
        const aHasCity = cityTermLower && aName.includes(cityTermLower);
        const bHasCity = cityTermLower && bName.includes(cityTermLower);
        
        if (aHasCity && !bHasCity) return -1;
        if (!aHasCity && bHasCity) return 1;
        
        // If both have city in name, check which one has it earlier
        if (aHasCity && bHasCity) {
          const aCityPos = aName.indexOf(cityTermLower);
          const bCityPos = bName.indexOf(cityTermLower);
          if (aCityPos !== bCityPos) return aCityPos - bCityPos;
        }
        
        // If still tied, check search term position
        if (searchTermLower) {
          const aTermPos = aName.indexOf(searchTermLower);
          const bTermPos = bName.indexOf(searchTermLower);
          if (aTermPos !== -1 && bTermPos !== -1 && aTermPos !== bTermPos) {
            return aTermPos - bTermPos;
          }
        }
        
        // If all else is equal, sort alphabetically by name
        return aName.localeCompare(bName);
      }

      // Higher score comes first
      return bScore - aScore;
    });

    // Apply pagination
    const paginatedResults = sortedResults.slice(startIndex, startIndex + limitNum);
    
    console.log(`Returning ${paginatedResults.length} of ${sortedResults.length} results`);
    
    return res.status(200).json({
      success: true,
      data: paginatedResults,
      count: paginatedResults.length,
      total: sortedResults.length,
      page: pageNum,
      pages: Math.ceil(sortedResults.length / limitNum)
    });
  } else {
    // Default sorting by creation date if no search terms
    query = query.sort('-createdAt');
  }
 
  // Apply pagination
  query = query.skip(startIndex).limit(limitNum);
 
  // Log the complete query being executed
  console.log(' Executing query:', JSON.stringify({
    collection: GuestSightseeing.collection.name,
    filter,
    sort: query._mongooseOptions?.sort,
    skip: query._mongooseOptions?.skip,
    limit: query._mongooseOptions?.limit,
    selectedFields: query._fields
  }, null, 2));
  console.log(' Executing query:', JSON.stringify({
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
      console.log(` Collection 'guestsightseeings' exists: ${collectionExists}`);
      
      // If collection exists but no documents, check if it's empty
      if (collectionExists) {
        const totalInCollection = await GuestSightseeing.countDocuments({});
        console.log(` Total documents in collection: ${totalInCollection}`);
        
        // Try to find any document in the collection
        const anyDoc = await GuestSightseeing.findOne({}).lean();
        console.log('Sample document from collection:', anyDoc);
        
        // Try a direct query to see if we get any results
        const directQueryResults = await GuestSightseeing.find({ isActive: true }).limit(5).lean();
        console.log('Direct query results (first 5 active docs):', directQueryResults);
      }
    }
    
    // Now execute the query, including all fields
    const results = await query.lean().exec();
    console.log(` Retrieved ${results.length} results`);
    
    // Log the first few results if any
    if (results.length > 0) {
      console.log(' Sample result (first 2 items):', JSON.stringify(results.slice(0, 2), null, 2));
    } else {
      console.log(' Query returned 0 results');
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
    
    console.log(' Sending response with', results.length, 'items');
    console.log('Response object:', JSON.stringify(response, null, 2));
    
    // Send response
    res.status(200).json(response);
    
  } catch (error) {
    console.error(' Query execution error:', error);
    return next(new ErrorResponse('Error executing query: ' + error.message, 500));
  }
  
});

// @desc    Get single guest sightseeing
// @route   GET /api/guest-sightseeing/:id
// @access  Public
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
  try {
    console.log('Raw request body:', JSON.stringify(req.body, null, 2));
    
    // Parse the form data
    let sightseeingData = {};
    
    // Debug: Log the raw request body and headers
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Content-Type:', req.get('Content-Type'));
    
    // If data is sent as JSON string in form-data
    if (req.body.data) {
      try {
        sightseeingData = JSON.parse(req.body.data);
      } catch (error) {
        return next(new ErrorResponse('Invalid JSON data in form-data', 400));
      }
    } else {
      // If sent as regular form fields
      sightseeingData = { ...req.body };
      
      // Convert string arrays if needed
      if (sightseeingData.images && typeof sightseeingData.images === 'string') {
        try {
          sightseeingData.images = JSON.parse(sightseeingData.images);
        } catch (e) {
          // If it's not a JSON string, treat it as a single URL
          sightseeingData.images = [sightseeingData.images];
        }
      }
    }
    
    // Handle file uploads if any
    if (req.files && req.files.length > 0) {
      try {
        // Upload each file to Cloudinary
        const uploadPromises = req.files.map(file => {
          if (!file.buffer) {
            throw new Error('No file buffer found');
          }
          return uploadToCloudinary(file.buffer);
        });
        
        // Wait for all uploads to complete and get the secure URLs
        const results = await Promise.all(uploadPromises);
        const uploadedImageUrls = results.map(result => result.secure_url);
        
        // Combine with any existing image URLs
        const existingImages = Array.isArray(sightseeingData.images) ? sightseeingData.images : [];
        sightseeingData.images = [...existingImages, ...uploadedImageUrls];
        
        console.log('Successfully uploaded images:', uploadedImageUrls);
        
      } catch (uploadError) {
        console.error('Error uploading images:', uploadError);
        return next(new ErrorResponse('Error uploading images: ' + uploadError.message, 500));
      }
    }
    
    // Ensure images is an array
    if (!sightseeingData.images || !Array.isArray(sightseeingData.images)) {
      sightseeingData.images = [];
    }
    
    // Convert string arrays if needed
    if (typeof sightseeingData.inclusions === 'string') {
      sightseeingData.inclusions = sightseeingData.inclusions
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    }
    
    if (typeof sightseeingData.keywords === 'string') {
      sightseeingData.keywords = sightseeingData.keywords
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    }
    
    // Add user ID if not present
    if (!sightseeingData.user && req.user) {
      sightseeingData.user = req.user.id;
    }
    
    // Ensure duration has a default value
    if (!sightseeingData.duration) {
      sightseeingData.duration = 'Not specified';
    }
    
    // Ensure tourType is set and valid
    if (!sightseeingData.tourType || !['shared', 'private', 'both'].includes(sightseeingData.tourType)) {
      console.log('Invalid or missing tourType, defaulting to shared');
      sightseeingData.tourType = 'shared';
    }
    
    // Convert prices to numbers
    if (sightseeingData.price) sightseeingData.price = Number(sightseeingData.price) || 0;
    if (sightseeingData.offerPrice) sightseeingData.offerPrice = Number(sightseeingData.offerPrice) || 0;
    
    // Ensure inclusions is an array
    if (sightseeingData.inclusions) {
      if (typeof sightseeingData.inclusions === 'string') {
        sightseeingData.inclusions = [sightseeingData.inclusions];
      } else if (!Array.isArray(sightseeingData.inclusions)) {
        sightseeingData.inclusions = [];
      }
    } else {
      sightseeingData.inclusions = [];
    }
    
    // Log the data being saved with more details
    console.log('Creating sightseeing with data:', {
      ...sightseeingData,
      images: sightseeingData.images ? `${sightseeingData.images.length} images` : 'none',
      tourType: sightseeingData.tourType || 'not set',
      // Add type information for debugging
      _tourTypeType: typeof sightseeingData.tourType,
      _hasTourType: 'tourType' in sightseeingData
    });
    
    // Force include tourType in the saved document
    if (!sightseeingData.tourType) {
      console.log('WARNING: tourType is missing, setting default');
      sightseeingData.tourType = 'shared';
    }
     
     // Log the data being saved
    console.log('Creating sightseeing with data:', JSON.stringify(sightseeingData, null, 2));
    
    // Create the sightseeing entry
    const sightseeing = await GuestSightseeing.create(sightseeingData);
    
    console.log('Created sightseeing:', JSON.stringify(sightseeing, null, 2));

     res.status(201).json({
       success: true,
       data: sightseeing
     });
     
  } catch (error) {
    console.error('Error creating sightseeing:', error);
    next(new ErrorResponse('Failed to create sightseeing: ' + error.message, 500));
  }
}); // <--- The missing closing brace was here

// @desc    Update guest sightseeing
// @route   PUT /api/guest-sightseeing/:id
// @access  Private/Admin
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
    
     // Ensure inclusions is an array and handle nested arrays
    if (updates.inclusions !== undefined) {
      if (!Array.isArray(updates.inclusions)) {
        updates.inclusions = [updates.inclusions];
      }
      
      // Flatten the array and process each item
      const processInclusion = (item) => {
        if (Array.isArray(item)) {
          // If it's an array, process each element
          return item.flatMap(processInclusion);
        } else if (typeof item === 'string') {
          // If it's a string, trim it and return if not empty
          const trimmed = item.trim();
          return trimmed !== '' ? [trimmed] : [];
        }
        // For any other type, convert to string and process
        return processInclusion(String(item));
      };
      
      // Process all inclusions and flatten the result
      updates.inclusions = updates.inclusions.flatMap(processInclusion);
      
      // If no valid inclusions, set default
      if (updates.inclusions.length === 0) {
        updates.inclusions = ['No inclusions specified'];
      }
    }

    // Ensure duration has a value
    if (updates.duration === '') {
      updates.duration = 'Not specified';
    }

    // Helper function to process array fields and flatten nested arrays
    const processArrayField = (value) => {
      if (value === undefined || value === null) return [];
      
      // If it's a string, try to parse it as JSON
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // If parsing fails, treat it as a single item array
          return [value.trim()].filter(Boolean);
        }
      }
      
      // Ensure it's an array
      if (!Array.isArray(value)) {
        return [String(value).trim()].filter(Boolean);
      }
      
      // Flatten nested arrays and process each item
      const processItem = (item) => {
        if (Array.isArray(item)) {
          return item.flatMap(processItem);
        } else if (item && typeof item === 'string') {
          const trimmed = item.trim();
          return trimmed ? [trimmed] : [];
        } else if (item != null) {
          return [String(item).trim()].filter(Boolean);
        }
        return [];
      };
      
      return value.flatMap(processItem);
    };

    try {
      // Process keywords field
      if (updates.keywords !== undefined) {
        updates.keywords = processArrayField(updates.keywords);
        
        // Remove duplicates and ensure we have at least one keyword
        updates.keywords = [...new Set(updates.keywords)];
        if (updates.keywords.length === 0) {
          updates.keywords = ['general'];
        }
      }
      
      // Process highlights field
      if (updates.highlights !== undefined) {
        updates.highlights = processArrayField(updates.highlights);
        
        // Ensure we have at least one highlight
        if (updates.highlights.length === 0) {
          updates.highlights = ['No highlights specified'];
        }
      }
      
      // Process inclusions field
      if (updates.inclusions !== undefined) {
        updates.inclusions = processArrayField(updates.inclusions);
        
        // Ensure we have at least one inclusion
        if (updates.inclusions.length === 0) {
          updates.inclusions = ['No inclusions specified'];
        }
      }
      
      // Process whatToBring field
      if (updates.whatToBring !== undefined) {
        updates.whatToBring = processArrayField(updates.whatToBring);
        
        // Ensure we have at least one item
        if (updates.whatToBring.length === 0) {
          updates.whatToBring = ['No items specified'];
        }
      }
    } catch (error) {
      console.error('Update error:', error);
      return next(new ErrorResponse(error.message || 'Failed to update guest sightseeing', 500));
    }

    // Update sightseeing document
    sightseeing = await GuestSightseeing.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: sightseeing
    });
  } catch (error) {
    console.error('Update error:', error);
    next(new ErrorResponse(error.message || 'Failed to update guest sightseeing', 500));
  }
});

// @desc    Delete guest sightseeing
// @route   DELETE /api/guest-sightseeing/:id
// @access  Private/Admin
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
  uploadGuestSightseeingImages,
  handleFileUploads
};