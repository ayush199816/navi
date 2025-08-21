const GuestSightseeingBooking = require('../models/GuestSightseeingBooking');
const GuestSightseeing = require('../models/GuestSightseeing');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Create a new guest sightseeing booking
// @route   POST /api/guest-sightseeing-bookings
// @access  Private
exports.createGuestSightseeingBooking = asyncHandler(async (req, res, next) => {
  const {
    sightseeingId,
    dateOfTravel,
    numberOfPax,
    leadGuest,
    additionalGuests = [],
    notes
  } = req.body;

  // Validate number of guests matches number of pax
  if (numberOfPax !== additionalGuests.length + 1) {
    return next(new ErrorResponse('Number of guests does not match the pax count', 400));
  }

  // Get the sightseeing tour
  const sightseeing = await GuestSightseeing.findById(sightseeingId);
  if (!sightseeing) {
    return next(new ErrorResponse(`Sightseeing not found with id ${sightseeingId}`, 404));
  }

  // Calculate total amount (you can add pricing logic here)
  const hasOffer = sightseeing.offerPrice !== null && sightseeing.offerPrice !== undefined;
  const pricePerPax = hasOffer ? sightseeing.offerPrice : sightseeing.price;
  const totalAmount = pricePerPax * numberOfPax;

  // Create the booking
  const booking = await GuestSightseeingBooking.create({
    sightseeing: sightseeingId,
    sightseeingName: sightseeing.name,
    dateOfTravel,
    numberOfPax,
    leadGuest: {
      name: leadGuest.name,
      email: leadGuest.email,
      phone: leadGuest.phone,
      passportNumber: leadGuest.passportNumber,
      panNumber: leadGuest.panNumber
    },
    additionalGuests: additionalGuests.map(guest => ({
      name: guest.name,
      passportNumber: guest.passportNumber
    })),
    userId: req.user.id,
    totalAmount,
    notes,
    status: 'pending'
  });

  // Populate the sightseeing details
  await booking.populate('sightseeing', 'name price offerPrice images');

  res.status(201).json({
    success: true,
    data: booking
  });
});

// @desc    Get all bookings for the logged-in user
// @route   GET /api/guest-sightseeing-bookings/my-bookings
// @access  Private
exports.getMyBookings = asyncHandler(async (req, res, next) => {
  const bookings = await GuestSightseeingBooking.find({ userId: req.user.id })
    .sort('-createdAt')
    .populate('sightseeing', 'name images');

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

// @desc    Get booking by ID
// @route   GET /api/guest-sightseeing-bookings/:id
// @access  Private
exports.getBooking = asyncHandler(async (req, res, next) => {
  const booking = await GuestSightseeingBooking.findOne({
    _id: req.params.id,
    userId: req.user.id
  }).populate('sightseeing', 'name description images price offerPrice');

  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Update booking status
// @route   PUT /api/guest-sightseeing-bookings/:id/status
// @access  Private/Admin
exports.updateBookingStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
    return next(new ErrorResponse('Invalid status value', 400));
  }

  const booking = await GuestSightseeingBooking.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Delete a booking
// @route   DELETE /api/guest-sightseeing-bookings/:id
// @access  Private
exports.deleteBooking = asyncHandler(async (req, res, next) => {
  const booking = await GuestSightseeingBooking.findById(req.params.id);

  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id ${req.params.id}`, 404)
    );
  }

  // Make sure user is booking owner or admin
  if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this booking`,
        401
      )
    );
  }

  await booking.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get all bookings (admin/operations)
// @route   GET /api/guest-sightseeing-bookings
// @access  Private/Admin/Operation
exports.getBookings = asyncHandler(async (req, res, next) => {
  // If advancedResults middleware has already been applied
  if (res.advancedResults) {
    return res.status(200).json(res.advancedResults);
  }
  
  // Create base query
  let query = {};
  
  // For operations team, only show non-cancelled bookings by default
  if (req.user.role === 'operations' && !req.query.status) {
    query.status = { $ne: 'cancelled' };
  }
  
  // Apply status filter if provided
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  // For debugging
  console.log('Query:', JSON.stringify(query, null, 2));
  
  // Find bookings with populated references
  const bookings = await GuestSightseeingBooking.find(query)
    .populate('sightseeing', 'name')
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });
  
  // For debugging
  console.log(`Found ${bookings.length} bookings`);
  
  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

// @desc    Update booking status (admin/operations)
// @route   PUT /api/guest-sightseeing-bookings/:id/status
// @access  Private/Admin/Operations
exports.updateBookingStatusAdminOperations = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
    return next(new ErrorResponse('Invalid status value', 400));
  }
  
  const booking = await GuestSightseeingBooking.findById(req.params.id);
  
  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id ${req.params.id}`, 404)
    );
  }
  
  // Update status
  booking.status = status;
  await booking.save();
  
  // TODO: Add notification to user about status update
  
  res.status(200).json({
    success: true,
    data: booking
  });
});
