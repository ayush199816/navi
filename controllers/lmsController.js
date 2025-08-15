const LmsContent = require('../models/LmsContent');
const LmsProgress = require('../models/LmsProgress');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// @desc    Get all LMS content
// @route   GET /api/lms/content
// @access  Private
exports.getAllContent = async (req, res) => {
  try {
    const { category, contentType, targetAudience, search, isActive } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Filter by content type
    if (contentType) {
      query.contentType = contentType;
    }
    
    // Filter by target audience
    if (targetAudience) {
      query.targetAudience = targetAudience;
    } else {
      // If no target audience specified, filter by user role
      if (req.user.role === 'agent') {
        query.$or = [
          { targetAudience: 'agent' },
          { targetAudience: 'all' }
        ];
      } else if (req.user.role === 'sales') {
        query.$or = [
          { targetAudience: 'sales' },
          { targetAudience: 'all' }
        ];
      }
    }
    
    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Execute query
    const content = await LmsContent.find(query)
      .populate('createdBy', 'name role')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Get user progress for each content item
    const contentWithProgress = await Promise.all(content.map(async (item) => {
      const progress = await LmsProgress.findOne({
        user: req.user.id,
        content: item._id
      });
      
      return {
        ...item._doc,
        userProgress: progress ? {
          status: progress.status,
          progress: progress.progress,
          completedAt: progress.completedAt,
          quizScore: progress.quizScore
        } : {
          status: 'not_started',
          progress: 0
        }
      };
    }));
    
    const total = await LmsContent.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: content.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: contentWithProgress,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get single LMS content
// @route   GET /api/lms/content/:id
// @access  Private
exports.getContent = async (req, res) => {
  try {
    const content = await LmsContent.findById(req.params.id)
      .populate('createdBy', 'name role');
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }
    
    // Check if user has access to this content
    if (
      (req.user.role === 'agent' && content.targetAudience === 'sales') ||
      (req.user.role === 'sales' && content.targetAudience === 'agent')
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this content',
      });
    }
    
    // Get user progress
    const progress = await LmsProgress.findOne({
      user: req.user.id,
      content: content._id
    });
    
    // Update last accessed time
    if (progress) {
      progress.lastAccessedAt = Date.now();
      await progress.save();
    } else {
      // Create new progress record
      await LmsProgress.create({
        user: req.user.id,
        content: content._id,
        status: 'in_progress',
        progress: 0,
        lastAccessedAt: Date.now()
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        ...content._doc,
        userProgress: progress ? {
          status: progress.status,
          progress: progress.progress,
          completedAt: progress.completedAt,
          quizScore: progress.quizScore,
          notes: progress.notes
        } : {
          status: 'in_progress',
          progress: 0
        }
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

// @desc    Create LMS content
// @route   POST /api/lms/content
// @access  Private/Admin
exports.createContent = async (req, res) => {
  try {
    // Add user to req.body
    req.body.createdBy = req.user.id;
    
    // Create content
    const content = await LmsContent.create(req.body);
    
    // Handle file uploads if any
    if (req.files) {
      if (req.files.contentFile) {
        content.contentFile = req.files.contentFile[0].path;
      }
      
      if (req.files.thumbnail) {
        content.thumbnail = req.files.thumbnail[0].path;
      }
      
      await content.save();
    }
    
    res.status(201).json({
      success: true,
      data: content,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update LMS content
// @route   PUT /api/lms/content/:id
// @access  Private/Admin
exports.updateContent = async (req, res) => {
  try {
    let content = await LmsContent.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }
    
    // Update content
    content = await LmsContent.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    
    // Handle file uploads if any
    if (req.files) {
      if (req.files.contentFile) {
        // Delete old file if exists
        if (content.contentFile) {
          try {
            fs.unlinkSync(content.contentFile);
          } catch (err) {
            console.error(`Error deleting file ${content.contentFile}:`, err);
          }
        }
        
        content.contentFile = req.files.contentFile[0].path;
      }
      
      if (req.files.thumbnail) {
        // Delete old thumbnail if exists
        if (content.thumbnail) {
          try {
            fs.unlinkSync(content.thumbnail);
          } catch (err) {
            console.error(`Error deleting thumbnail ${content.thumbnail}:`, err);
          }
        }
        
        content.thumbnail = req.files.thumbnail[0].path;
      }
      
      await content.save();
    }
    
    res.status(200).json({
      success: true,
      data: content,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Delete LMS content
// @route   DELETE /api/lms/content/:id
// @access  Private/Admin
exports.deleteContent = async (req, res) => {
  try {
    const content = await LmsContent.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }
    
    // Delete files if they exist
    if (content.contentFile) {
      try {
        fs.unlinkSync(content.contentFile);
      } catch (err) {
        console.error(`Error deleting file ${content.contentFile}:`, err);
      }
    }
    
    if (content.thumbnail) {
      try {
        fs.unlinkSync(content.thumbnail);
      } catch (err) {
        console.error(`Error deleting thumbnail ${content.thumbnail}:`, err);
      }
    }
    
    // Delete all progress records associated with this content
    await LmsProgress.deleteMany({ content: content._id });
    
    // Delete content
    await content.remove();
    
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

// @desc    Update user progress
// @route   PUT /api/lms/progress/:contentId
// @access  Private
exports.updateProgress = async (req, res) => {
  try {
    const { progress, status, quizScore, notes } = req.body;
    
    // Check if content exists
    const content = await LmsContent.findById(req.params.contentId);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }
    
    // Check if user has access to this content
    if (
      (req.user.role === 'agent' && content.targetAudience === 'sales') ||
      (req.user.role === 'sales' && content.targetAudience === 'agent')
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this content',
      });
    }
    
    // Find or create progress record
    let progressRecord = await LmsProgress.findOne({
      user: req.user.id,
      content: req.params.contentId
    });
    
    if (!progressRecord) {
      progressRecord = await LmsProgress.create({
        user: req.user.id,
        content: req.params.contentId,
        status: 'in_progress',
        progress: 0,
        lastAccessedAt: Date.now()
      });
    }
    
    // Update progress
    if (progress !== undefined) {
      progressRecord.progress = progress;
    }
    
    if (status) {
      progressRecord.status = status;
      
      // If status is completed, set completedAt
      if (status === 'completed') {
        progressRecord.completedAt = Date.now();
      }
    }
    
    if (quizScore !== undefined) {
      progressRecord.quizScore = quizScore;
      progressRecord.quizAttempts += 1;
    }
    
    if (notes) {
      progressRecord.notes = notes;
    }
    
    progressRecord.lastAccessedAt = Date.now();
    await progressRecord.save();
    
    res.status(200).json({
      success: true,
      data: progressRecord,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get user progress summary
// @route   GET /api/lms/progress
// @access  Private
exports.getProgressSummary = async (req, res) => {
  try {
    // Get all user progress records
    const progress = await LmsProgress.find({ user: req.user.id })
      .populate('content', 'title category contentType targetAudience');
    
    // Calculate summary statistics
    const totalContent = await LmsContent.countDocuments({
      $or: [
        { targetAudience: req.user.role },
        { targetAudience: 'all' }
      ],
      isActive: true
    });
    
    const completed = progress.filter(p => p.status === 'completed').length;
    const inProgress = progress.filter(p => p.status === 'in_progress').length;
    const notStarted = totalContent - completed - inProgress;
    
    // Calculate average quiz score
    const quizScores = progress.filter(p => p.quizScore !== undefined).map(p => p.quizScore);
    const averageQuizScore = quizScores.length > 0
      ? quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length
      : 0;
    
    // Get recently accessed content
    const recentlyAccessed = await LmsProgress.find({ user: req.user.id })
      .sort({ lastAccessedAt: -1 })
      .limit(5)
      .populate('content', 'title category contentType thumbnail');
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalContent,
          completed,
          inProgress,
          notStarted,
          completionRate: totalContent > 0 ? (completed / totalContent) * 100 : 0,
          averageQuizScore
        },
        recentlyAccessed
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
