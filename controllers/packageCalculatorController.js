const PackageCalculator = require('../models/PackageCalculator');
const CalculatorSightseeing = require('../models/CalculatorSightseeing');
const CalculatorTransfer = require('../models/CalculatorTransfer');

// @desc    Get all package calculators
// @route   GET /api/package-calculator
// @access  Private/Admin,Operations
exports.getPackageCalculators = async (req, res) => {
  try {
    const calculators = await PackageCalculator.find()
      .populate('adultSightseeings.sightseeingId', 'name description location currency')
      .populate('childSightseeings.sightseeingId', 'name description location currency')
      .populate('transfers.transferId', 'name description fromLocation toLocation currency transferType')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: calculators });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single package calculator
// @route   GET /api/package-calculator/:id
// @access  Private/Admin,Operations
exports.getPackageCalculator = async (req, res) => {
  try {
    const calculator = await PackageCalculator.findById(req.params.id)
      .populate('adultSightseeings.sightseeingId', 'name description location currency')
      .populate('childSightseeings.sightseeingId', 'name description location currency')
      .populate('transfers.transferId', 'name description fromLocation toLocation currency transferType')
      .populate('createdBy', 'name email');

    if (!calculator) {
      return res.status(404).json({ success: false, message: 'Package calculator not found' });
    }

    res.status(200).json({ success: true, data: calculator });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create package calculator
// @route   POST /api/package-calculator
// @access  Private/Admin,Operations
exports.createPackageCalculator = async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    console.log('Hotel prices in request:', req.body.hotelPrices);
    
    const calculatorData = {
      ...req.body,
      createdBy: req.user.id
    };

    console.log('Calculator data before save:', calculatorData);
    const calculator = await PackageCalculator.create(calculatorData);
    console.log('Saved calculator:', calculator);
    
    const populatedCalculator = await PackageCalculator.findById(calculator._id)
      .populate('adultSightseeings.sightseeingId', 'name description location currency')
      .populate('childSightseeings.sightseeingId', 'name description location currency')
      .populate('transfers.transferId', 'name description fromLocation toLocation currency transferType')
      .populate('createdBy', 'name email');

    res.status(201).json({ success: true, data: populatedCalculator });
  } catch (err) {
    console.error('Error creating package calculator:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update package calculator
// @route   PUT /api/package-calculator/:id
// @access  Private/Admin,Operations
exports.updatePackageCalculator = async (req, res) => {
  try {
    const calculator = await PackageCalculator.findById(req.params.id);

    if (!calculator) {
      return res.status(404).json({ success: false, message: 'Package calculator not found' });
    }

    const updatedCalculator = await PackageCalculator.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('adultSightseeings.sightseeingId', 'name description location currency')
      .populate('childSightseeings.sightseeingId', 'name description location currency')
      .populate('transfers.transferId', 'name description fromLocation toLocation currency transferType')
      .populate('createdBy', 'name email');

    res.status(200).json({ success: true, data: updatedCalculator });
  } catch (err) {
    console.error('Error updating package calculator:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete package calculator
// @route   DELETE /api/package-calculator/:id
// @access  Private/Admin
exports.deletePackageCalculator = async (req, res) => {
  try {
    const calculator = await PackageCalculator.findById(req.params.id);

    if (!calculator) {
      return res.status(404).json({ success: false, message: 'Package calculator not found' });
    }

    await calculator.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get available sightseeings for calculator
// @route   GET /api/package-calculator/sightseeings
// @access  Private/Admin,Operations
exports.getAvailableSightseeings = async (req, res) => {
  try {
    const sightseeings = await CalculatorSightseeing.find({ isActive: true })
      .select('name description location duration adultPrice childPrice currency category')
      .sort({ name: 1 });

    res.status(200).json({ success: true, data: sightseeings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get available transfers for calculator
// @route   GET /api/package-calculator/transfers
// @access  Private/Admin,Operations
exports.getAvailableTransfers = async (req, res) => {
  try {
    const transfers = await CalculatorTransfer.find({ isActive: true })
      .select('name description fromLocation toLocation transferType vehicleType price currency maxPassengers')
      .sort({ name: 1 });

    res.status(200).json({ success: true, data: transfers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Calculate package cost dynamically
// @route   POST /api/package-calculator/calculate
// @access  Private/Admin,Operations
exports.calculatePackageCost = async (req, res) => {
  try {
    const { adultSightseeings, childSightseeings, transfers } = req.body;

    let totalAdultCost = 0;
    let totalChildCost = 0;
    let totalTransferCost = 0;
    let totalHotelCost = 0;

    // Calculate adult sightseeing costs
    if (adultSightseeings && adultSightseeings.length > 0) {
      totalAdultCost = adultSightseeings.reduce((total, item) => {
        return total + (item.adultPrice * item.quantity);
      }, 0);
    }

    // Calculate child sightseeing costs
    if (childSightseeings && childSightseeings.length > 0) {
      totalChildCost = childSightseeings.reduce((total, item) => {
        return total + (item.childPrice * item.quantity);
      }, 0);
    }

    // Calculate transfer costs
    if (transfers && transfers.length > 0) {
      totalTransferCost = transfers.reduce((total, item) => {
        return total + (item.transferPrice * item.quantity);
      }, 0);
    }

    // Calculate hotel costs
    if (hotelPrices && hotelPrices.length > 0) {
      totalHotelCost = hotelPrices.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    }

    const grandTotal = totalAdultCost + totalChildCost + totalTransferCost + totalHotelCost;

    res.status(200).json({
      success: true,
      data: {
        totalAdultCost,
        totalChildCost,
        totalTransferCost,
        totalHotelCost,
        grandTotal
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
