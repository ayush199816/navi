const CalculatorTransfer = require('../models/CalculatorTransfer');

// @desc    Get all calculator transfers
// @route   GET /api/calculator-transfer
// @access  Private/Admin,Operations
exports.getCalculatorTransfers = async (req, res) => {
  try {
    const transfers = await CalculatorTransfer.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: transfers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single calculator transfer
// @route   GET /api/calculator-transfer/:id
// @access  Private/Admin,Operations
exports.getCalculatorTransfer = async (req, res) => {
  try {
    const transfer = await CalculatorTransfer.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Calculator transfer not found' });
    }

    res.status(200).json({ success: true, data: transfer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create calculator transfer
// @route   POST /api/calculator-transfer
// @access  Private/Admin,Operations
exports.createCalculatorTransfer = async (req, res) => {
  try {
    const transferData = {
      ...req.body,
      createdBy: req.user.id
    };

    const transfer = await CalculatorTransfer.create(transferData);
    
    const populatedTransfer = await CalculatorTransfer.findById(transfer._id)
      .populate('createdBy', 'name email');

    res.status(201).json({ success: true, data: populatedTransfer });
  } catch (err) {
    console.error('Error creating calculator transfer:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update calculator transfer
// @route   PUT /api/calculator-transfer/:id
// @access  Private/Admin,Operations
exports.updateCalculatorTransfer = async (req, res) => {
  try {
    const transfer = await CalculatorTransfer.findById(req.params.id);

    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Calculator transfer not found' });
    }

    const updatedTransfer = await CalculatorTransfer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email');

    res.status(200).json({ success: true, data: updatedTransfer });
  } catch (err) {
    console.error('Error updating calculator transfer:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete calculator transfer
// @route   DELETE /api/calculator-transfer/:id
// @access  Private/Admin
exports.deleteCalculatorTransfer = async (req, res) => {
  try {
    const transfer = await CalculatorTransfer.findById(req.params.id);

    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Calculator transfer not found' });
    }

    await transfer.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Toggle calculator transfer active status
// @route   PATCH /api/calculator-transfer/:id/toggle
// @access  Private/Admin,Operations
exports.toggleCalculatorTransfer = async (req, res) => {
  try {
    const transfer = await CalculatorTransfer.findById(req.params.id);

    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Calculator transfer not found' });
    }

    transfer.isActive = !transfer.isActive;
    await transfer.save();

    res.status(200).json({ success: true, data: transfer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
