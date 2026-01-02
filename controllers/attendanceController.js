const Attendance = require('../models/Attendance');

// @desc    Mark attendance (present/absent/late)
// @route   POST /api/attendance
// @access  Private (operations)
const markAttendance = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const userId = req.user.id;
    
    // Get today's date in UTC (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if attendance already marked for today
    const existingAttendance = await Attendance.findOne({
      user: userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        error: 'Attendance already marked for today'
      });
    }
    
    // Check if user is marking as present after 10:30 AM IST
    let finalStatus = status || 'present';
    const now = new Date();
    
    // Convert current time to IST (UTC + 5:30)
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const istHours = istTime.getUTCHours();
    const istMinutes = istTime.getUTCMinutes();
    
    // If marking as present after 10:30 AM IST, automatically mark as late
    if (finalStatus === 'present' && (istHours > 10 || (istHours === 10 && istMinutes > 30))) {
      finalStatus = 'late';
      // Add automatic note if no notes provided
      const autoNotes = notes || `Automatically marked as late (checked in after 10:30 AM IST)`;
      
      // Create new attendance record
      const attendance = await Attendance.create({
        user: userId,
        date: today,
        status: finalStatus,
        checkInTime: new Date(),
        notes: autoNotes
      });
      
      await attendance.populate('user', 'name email');
      
      return res.status(201).json({
        success: true,
        data: attendance,
        message: 'Automatically marked as late (after 10:30 AM IST)'
      });
    }
    
    // Create new attendance record
    const attendance = await Attendance.create({
      user: userId,
      date: today,
      status: finalStatus,
      checkInTime: new Date(),
      notes
    });
    
    await attendance.populate('user', 'name email');
    
    res.status(201).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get my attendance history
// @route   GET /api/attendance/me
// @access  Private (operations)
const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 30, startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }
    
    const query = {
      user: userId,
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
    };
    
    const attendance = await Attendance.find(query)
      .populate('user', 'name email')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Attendance.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: attendance.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: attendance
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all attendance (admin/operations view)
// @route   GET /api/attendance
// @access  Private (admin, operations)
const getAllAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 30, startDate, endDate, status, userId } = req.query;
    
    // Build filter
    const filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (status) filter.status = status;
    if (userId) filter.user = userId;
    
    const attendance = await Attendance.find(filter)
      .populate('user', 'name email role')
      .sort({ date: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Attendance.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: attendance.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: attendance
    });
  } catch (error) {
    console.error('Error fetching all attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Check today's attendance status
// @route   GET /api/attendance/today
// @access  Private (operations)
const getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get today's date in UTC (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      user: userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('user', 'name email');
    
    res.status(200).json({
      success: true,
      data: attendance || null
    });
  } catch (error) {
    console.error('Error checking today attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  markAttendance,
  getMyAttendance,
  getAllAttendance,
  getTodayAttendance
};
