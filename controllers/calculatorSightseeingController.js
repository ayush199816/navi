const CalculatorSightseeing = require('../models/CalculatorSightseeing');

// @desc    Get all calculator sightseeings
// @route   GET /api/calculator-sightseeing
// @access  Private/Admin,Operations
exports.getCalculatorSightseeings = async (req, res) => {
  try {
    const sightseeings = await CalculatorSightseeing.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: sightseeings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single calculator sightseeing
// @route   GET /api/calculator-sightseeing/:id
// @access  Private/Admin,Operations
exports.getCalculatorSightseeing = async (req, res) => {
  try {
    const sightseeing = await CalculatorSightseeing.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!sightseeing) {
      return res.status(404).json({ success: false, message: 'Calculator sightseeing not found' });
    }

    res.status(200).json({ success: true, data: sightseeing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create calculator sightseeing
// @route   POST /api/calculator-sightseeing
// @access  Private/Admin,Operations
exports.createCalculatorSightseeing = async (req, res) => {
  try {
    const sightseeingData = {
      ...req.body,
      createdBy: req.user.id
    };

    const sightseeing = await CalculatorSightseeing.create(sightseeingData);
    
    const populatedSightseeing = await CalculatorSightseeing.findById(sightseeing._id)
      .populate('createdBy', 'name email');

    res.status(201).json({ success: true, data: populatedSightseeing });
  } catch (err) {
    console.error('Error creating calculator sightseeing:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update calculator sightseeing
// @route   PUT /api/calculator-sightseeing/:id
// @access  Private/Admin,Operations
exports.updateCalculatorSightseeing = async (req, res) => {
  try {
    const sightseeing = await CalculatorSightseeing.findById(req.params.id);

    if (!sightseeing) {
      return res.status(404).json({ success: false, message: 'Calculator sightseeing not found' });
    }

    const updatedSightseeing = await CalculatorSightseeing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email');

    res.status(200).json({ success: true, data: updatedSightseeing });
  } catch (err) {
    console.error('Error updating calculator sightseeing:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete calculator sightseeing
// @route   DELETE /api/calculator-sightseeing/:id
// @access  Private/Admin
exports.deleteCalculatorSightseeing = async (req, res) => {
  try {
    const sightseeing = await CalculatorSightseeing.findById(req.params.id);

    if (!sightseeing) {
      return res.status(404).json({ success: false, message: 'Calculator sightseeing not found' });
    }

    await sightseeing.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Toggle calculator sightseeing active status
// @route   PATCH /api/calculator-sightseeing/:id/toggle
// @access  Private/Admin,Operations
exports.toggleCalculatorSightseeing = async (req, res) => {
  try {
    const sightseeing = await CalculatorSightseeing.findById(req.params.id);

    if (!sightseeing) {
      return res.status(404).json({ success: false, message: 'Calculator sightseeing not found' });
    }

    sightseeing.isActive = !sightseeing.isActive;
    await sightseeing.save();

    res.status(200).json({ success: true, data: sightseeing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
