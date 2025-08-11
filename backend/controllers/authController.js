const User = require('../models/User');
const Wallet = require('../models/Wallet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, companyName, phone, address, city, state, country, pincode } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Validate role
    const validRoles = ['agent', 'admin', 'accounts', 'operations', 'sales', 'user'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    // For guest users (role: 'user' with user_type: 'guest')
    let isApproved, user_type, userRole = role;
    if (userRole === 'user' && req.body.user_type === 'guest') {
      // Automatically approve guest users
      isApproved = true;
      // Set role to 'user' and user_type to 'guest'
      userRole = 'user';
      user_type = 'guest';
    } else {
      // For other roles, use existing logic
      // Only admin users are auto-approved
      isApproved = userRole === 'admin';
      user_type = 'regular';
    }

    // For agent role, company name is required
    if (role === 'agent' && !companyName) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required for agent registration',
      });
    }

    // Create user - agents are not auto-approved
    const user = await User.create({
      name,
      email,
      password,
      role: userRole || 'agent',
      companyName,
      phone,
      address,
      city,
      state,
      country,
      pincode,
      // Only admin users are auto-approved
      isApproved: role === 'admin',
    });
    
    // For agents, send email notification to admin for approval
    if (!role || role === 'agent') {
      // TODO: Implement email notification to admin
      console.log(`New agent registration awaiting approval: ${email}`);
    }

    // If documents were uploaded, save their paths
    if (req.files) {
      const updateData = { documents: {} };
      
      if (req.files.gstCertificate) {
        updateData.documents.gstCertificate = req.files.gstCertificate[0].path;
        updateData.gstNumber = req.body.gstNumber;
      }
      
      if (req.files.udyamCertificate) {
        updateData.documents.udyamCertificate = req.files.udyamCertificate[0].path;
        updateData.udyamNumber = req.body.udyamNumber;
      }
      
      await User.findByIdAndUpdate(user._id, updateData);
    }

    // Create wallet for agent
    if (role === 'agent') {
      await Wallet.create({
        user: user._id,
        balance: 0,
        creditLimit: 0,
      });
    }

    // Generate JWT token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // For guest users, they should always be approved
    if (user.role === 'user' && user.user_type === 'guest') {
      user.isApproved = true;
      await user.save();
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        user_type: user.user_type,
        isApproved: user.isApproved,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

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

// @desc    Update user profile
// @route   PUT /api/auth/updateprofile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address, city, state, country, pincode, companyName } = req.body;

    const updateData = {
      name,
      phone,
      address,
      city,
      state,
      country,
      pincode,
    };

    // Only allow agents to update company name
    if (req.user.role === 'agent' && companyName) {
      updateData.companyName = companyName;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    });

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
// @route   GET /api/auth/pending-agents
// @access  Private/Admin
exports.getPendingAgents = async (req, res, next) => {
  try {
    const users = await User.find({ 
      role: 'agent',
      isApproved: false,
      // Only include users who have completed onboarding (have phone and address)
      $and: [
        { phone: { $exists: true, $ne: '' } },
        { address: { $exists: true, $ne: '' } }
      ]
    }).select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Approve an agent
// @route   PUT /api/auth/users/:id/approve
// @access  Private/Admin
exports.approveAgent = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    // Only allow approving agents
    if (user.role !== 'agent') {
      return next(new ErrorResponse(`User with id ${req.params.id} is not an agent`, 400));
    }

    // Update user
    user.isApproved = true;
    user.approvedAt = Date.now();
    user.approvedBy = req.user.id;
    
    await user.save({ validateBeforeSave: false });

    // TODO: Send approval email to agent

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reject an agent
// @route   PUT /api/auth/users/:id/reject
// @access  Private/Admin
exports.rejectAgent = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    // Only allow rejecting agents
    if (user.role !== 'agent') {
      return next(new ErrorResponse(`User with id ${req.params.id} is not an agent`, 400));
    }

    // Store rejection reason before deleting
    const rejectionData = {
      email: user.email,
      name: user.name,
      reason: reason || 'No reason provided'
    };

    // TODO: Send rejection email to agent
    console.log('Agent rejected:', rejectionData);

    // Delete the user
    await user.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Check current password
    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
