const Sightseeing = require('../models/Sightseeing');

// @desc    Get all sightseeing options
// @route   GET /api/sightseeing
// @access  Private/Admin,Operations
exports.getSightseeing = async (req, res) => {
  try {
    const sightseeing = await Sightseeing.find();
    res.status(200).json({ success: true, data: sightseeing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create a sightseeing option
// @route   POST /api/sightseeing
// @access  Private/Admin,Operations
exports.createSightseeing = async (req, res) => {
  try {
    // Explicitly assign all expected fields to avoid missing values
    // Debug: log incoming request data
    console.log('=== REQUEST DATA ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Files:', req.file);
    console.log('===================');
    // Fallback: try to parse raw body if only 'name' is present
    let fallbackParsed = {};
    if (Object.keys(req.body).length === 1 && req.body.name && req.rawBody) {
      try {
        fallbackParsed = JSON.parse(req.rawBody.toString());
        console.log('Fallback rawBody parsed:', fallbackParsed);
      } catch (e) {}
    }
    function getField(field, fallback = '') {
      // First check req.body
      if (req.body[field] !== undefined && req.body[field] !== '') {
        console.log(`Found ${field} in req.body:`, req.body[field]);
        return req.body[field];
      }
      
      // Then check fallbackParsed
      if (fallbackParsed && typeof fallbackParsed === 'object' && fallbackParsed[field] !== undefined) {
        console.log(`Found ${field} in fallbackParsed:`, fallbackParsed[field]);
        return fallbackParsed[field];
      }
      
      // Special handling for FormData fields
      if (req.body[field] === '' && (field === 'currency' || field === 'transferType')) {
        console.log(`Field ${field} is empty, using default value`);
        return field === 'currency' ? 'INR' : 'SIC';
      }
      
      console.log(`Field ${field} not found, using fallback:`, fallback);
      return fallback;
    }

    // Default currency mapping based on country
    const COUNTRY_CURRENCY_MAP = {
      'India': 'INR',
      'Singapore': 'SGD',
      'United Arab Emirates': 'AED',
      'Dubai': 'AED',
      'Indonesia': 'IDR',
      'Thailand': 'THB',
      'Vietnam': 'VND',
      'Malaysia': 'MYR',
      'France': 'EUR',
      'Germany': 'EUR',
      'Italy': 'EUR',
      'Spain': 'EUR',
      'United States': 'USD',
      'United Kingdom': 'GBP',
      'Australia': 'AUD',
      'Canada': 'CAD',
      'Japan': 'JPY',
      'China': 'CNY',
      'South Korea': 'KRW',
      'Russia': 'RUB',
      'Brazil': 'BRL'
    };

    const getDefaultCurrency = (country) => {
      return COUNTRY_CURRENCY_MAP[country] || 'USD';
    };

    // Get country and currency from request
    const country = getField('country');
    let currency = getField('currency');
    
    // If currency is not provided, determine it from the country
    if (!currency && country) {
      currency = getDefaultCurrency(country);
      console.log(`Currency not provided, using default for ${country}: ${currency}`);
    } else if (!currency) {
      currency = 'USD'; // Fallback default
      console.log('No currency or country provided, using default currency: USD');
    }

    // Only add fields present in req.body
    let createdBy = undefined;
    if (req.user && req.user.id) {
      createdBy = req.user.id;
    } else {
      // fallback for debugging only, replace with a real ObjectId from your User collection if needed
      createdBy = '000000000000000000000000';
      console.error('req.user or req.user.id missing! Using fallback ObjectId.');
    }
    const data = {
      name: getField('name'),
      type: getField('type') || 'activity', // Add type field with default 'activity'
      country: country,
      transferType: getField('transferType') || 'SIC',
      details: getField('details'),
      description: getField('details') || getField('description'),
      sellingPrice: getField('sellingPrice') !== null ? Number(getField('sellingPrice')) : 0,
      costPrice: getField('costPrice') !== null ? Number(getField('costPrice')) : 0,
      location: getField('location'),
      duration: getField('duration') ? Number(getField('duration')) : undefined,
      currency: currency, // Always include the currency field
      createdBy
    };
    
    // Handle file upload if present
    if (req.file) {
      data.picture = `/uploads/${req.file.filename}`;
    }
    
    // Log the final data being saved
    console.log('Creating sightseeing with data:', JSON.stringify(data, null, 2));
    
    // Create the sightseeing entry
    const sightseeing = await Sightseeing.create(data);
    res.status(201).json({ success: true, data: sightseeing });
  } catch (err) {
    console.error('Error creating sightseeing:', err);
    res.status(400).json({ 
      success: false, 
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { error: err.stack })
    });
  }
};

// @desc    Update a sightseeing option
// @route   PUT /api/sightseeing/:id
// @access  Private/Admin,Operations
exports.updateSightseeing = async (req, res) => {
  try {
    console.log('Update request received. Body:', req.body);
    console.log('Files:', req.file);
    
    // Get the existing sightseeing record
    const existingSightseeing = await Sightseeing.findById(req.params.id);
    if (!existingSightseeing) {
      return res.status(404).json({ success: false, message: 'Sightseeing not found' });
    }
    
    // Helper function to get field from form data or body
    const getField = (field) => {
      if (req.body[field] !== undefined) {
        return req.body[field];
      }
      return existingSightseeing[field];
    };
    
    // Helper function to process array fields
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
    
    // Default currency mapping based on country
    const COUNTRY_CURRENCY_MAP = {
      'India': 'INR',
      'Singapore': 'SGD',
      'United Arab Emirates': 'AED',
      'Dubai': 'AED',
      'Indonesia': 'IDR',
      'Thailand': 'THB',
      'Vietnam': 'VND',
      'Malaysia': 'MYR',
      'France': 'EUR',
      'Germany': 'EUR',
      'Italy': 'EUR',
      'Spain': 'EUR',
      'United States': 'USD',
      'United Kingdom': 'GBP',
      'Australia': 'AUD',
      'Canada': 'CAD',
      'Japan': 'JPY',
      'China': 'CNY',
      'South Korea': 'KRW',
      'Russia': 'RUB',
      'Brazil': 'BRL'
    };
    
    const getDefaultCurrency = (country) => {
      return COUNTRY_CURRENCY_MAP[country] || 'USD';
    };
    
    // existingSightseeing is already declared at the beginning of the function
    
    // Determine the currency - use the one from form, or existing, or default based on country
    const country = getField('country') || existingSightseeing.country;
    const currency = getField('currency') || existingSightseeing.currency || getDefaultCurrency(country) || 'INR';
    
    // Process array fields
    const arrayFields = ['inclusions', 'highlights', 'keywords', 'whatToBring'];
    const processedFields = {};
    
    arrayFields.forEach(field => {
      if (req.body[field] !== undefined) {
        processedFields[field] = processArrayField(req.body[field]);
      }
    });
    
    // Create update object with all fields
    const updateFields = {
      name: getField('name') || existingSightseeing.name,
      type: getField('type') || existingSightseeing.type || 'activity',
      country: country,
      transferType: getField('transferType') || existingSightseeing.transferType || 'SIC',
      details: getField('details') || existingSightseeing.details || '',
      sellingPrice: getField('sellingPrice') !== null ? Number(getField('sellingPrice')) : existingSightseeing.sellingPrice,
      costPrice: getField('costPrice') !== null ? Number(getField('costPrice')) : existingSightseeing.costPrice,
      currency: currency,
      location: getField('location') || existingSightseeing.location || '',
      duration: getField('duration') ? Number(getField('duration')) : existingSightseeing.duration,
      // Add processed array fields
      ...processedFields
    };
    
    // Handle file upload if present
    if (req.file) {
      updateFields.picture = `/uploads/${req.file.filename}`;
    }
    
    // Log the final update data
    console.log('Updating sightseeing with data:', JSON.stringify(updateFields, null, 2));
    
    const sightseeing = await Sightseeing.findByIdAndUpdate(
      req.params.id, 
      { $set: updateFields }, // Use $set to only update the fields that are provided
      { new: true, runValidators: true, context: 'query' }
    );
    
    if (!sightseeing) {
      return res.status(404).json({ success: false, message: 'Sightseeing not found' });
    }
    
    res.status(200).json({ success: true, data: sightseeing });
  } catch (err) {
    console.error('Error updating sightseeing:', err);
    res.status(400).json({ 
      success: false, 
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { error: err.stack })
    });
  }
};

// @desc    Delete a sightseeing option
// @route   DELETE /api/sightseeing/:id
// @access  Private/Admin,Operations
exports.deleteSightseeing = async (req, res) => {
  try {
    const sightseeing = await Sightseeing.findByIdAndDelete(req.params.id);
    if (!sightseeing) {
      return res.status(404).json({ success: false, message: 'Sightseeing not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
