const User = require('../models/User');
const Wallet = require('../models/Wallet');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const { role, isApproved, search } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by role if provided
    if (role) {
      query.role = role;
    }
    
    // Filter by approval status if provided
    if (isApproved !== undefined) {
      query.isApproved = isApproved === 'true';
    }
    
    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const users = await User.find(query)
      .select('-password')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: users,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role, 
      isApproved, 
      companyName, 
      phone, 
      address, 
      city, 
      state, 
      country, 
      pincode 
    } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }
    
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      isApproved: isApproved !== undefined ? isApproved : true,
      companyName,
      phone,
      address,
      city,
      state,
      country,
      pincode,
    });
    
    // Create wallet for agent
    if (role === 'agent') {
      await Wallet.create({
        user: user._id,
        balance: 0,
        creditLimit: 0,
      });
    }
    
    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      role, 
      isApproved, 
      companyName, 
      phone, 
      address, 
      city, 
      state, 
      country, 
      pincode,
      rejectionReason 
    } = req.body;
    
    // Build update object
    const updateData = {
      name,
      email,
      role,
      isApproved,
      companyName,
      phone,
      address,
      city,
      state,
      country,
      pincode,
    };
    
    // Add rejection reason if provided
    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
    
    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Delete user's wallet if they are an agent
    if (user.role === 'agent') {
      await Wallet.findOneAndDelete({ user: user._id });
    }
    
    await user.remove();
    
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

// @desc    Approve or reject agent
// @route   PUT /api/users/:id/approval
// @access  Private/Accounts
exports.updateAgentApproval = async (req, res) => {
  try {
    const { isApproved, rejectionReason } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Check if user is an agent
    if (user.role !== 'agent') {
      return res.status(400).json({
        success: false,
        message: 'Only agent accounts can be approved or rejected',
      });
    }
    
    // Update approval status
    user.isApproved = isApproved;
    
    // Add rejection reason if rejected
    if (!isApproved && rejectionReason) {
      user.rejectionReason = rejectionReason;
    } else if (isApproved) {
      user.rejectionReason = undefined;
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get pending agent approvals
// @route   GET /api/users/pending-approvals
// @access  Private/Accounts
exports.getPendingApprovals = async (req, res) => {
  console.log('=== START getPendingApprovals ===');
  console.log('Request headers:', req.headers);
  console.log('Authenticated user:', req.user);
  
  try {
    console.log('1. Fetching pending agent approvals...');
    
    // Check if User model exists and has required methods
    console.log('2. Checking User model...');
    if (!User) {
      const error = new Error('User model is not defined');
      console.error('User model is not defined');
      throw error;
    }
    
    if (typeof User.find !== 'function') {
      const error = new Error('User.find is not a function');
      console.error('User.find is not a function');
      throw error;
    }
    
    // Log the query being executed
    const query = {
      role: 'agent',
      isApproved: false
    };
    console.log('3. Executing query:', JSON.stringify(query, null, 2));
    
    // Execute the query with error handling
    let pendingAgents;
    try {
      pendingAgents = await User.find(query).select('-password').lean();
      console.log(`4. Query successful. Found ${pendingAgents.length} pending agents`);
    } catch (dbError) {
      console.error('Database query error:', {
        message: dbError.message,
        name: dbError.name,
        code: dbError.code,
        keyPattern: dbError.keyPattern,
        keyValue: dbError.keyValue
      });
      throw dbError;
    }
    
    res.status(200).json({
      success: true,
      count: pendingAgents.length,
      data: pendingAgents,
    });
  } catch (err) {
    console.error('=== ERROR in getPendingApprovals ===');
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
      keyPattern: err.keyPattern,
      keyValue: err.keyValue,
      errors: err.errors,
      errmsg: err.errmsg
    });
    
    // More detailed error response in development
    const errorResponse = {
      success: false,
      message: `Server error: ${err.message}`,
      error: {
        name: err.name,
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && {
          stack: err.stack,
          code: err.code,
          details: {
            keyPattern: err.keyPattern,
            keyValue: err.keyValue,
            errors: err.errors,
            errmsg: err.errmsg
          }
        })
      }
    };
    
    console.log('Sending error response:', JSON.stringify(errorResponse, null, 2));
    res.status(500).json(errorResponse);
  }
};
