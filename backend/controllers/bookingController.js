import Booking from '../models/Booking.js';
import Bus from '../models/Bus.js';
import User from '../models/User.js';
import { sendSuccess, sendError, sendCreated, sendNotFound } from '../utils/responseHelper.js';
import { generateInvoice } from '../utils/pdfGenerator.js';
import { sendBookingConfirmationEmail, sendBookingStatusEmail } from '../utils/emailSender.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (Client)
export const createBooking = async (req, res) => {
  try {
    const {
      city,
      bus,
      travelDates,
      institution,
      coordinator,
      participants,
      companies,
      visitingSpots,
      meals,
      specialRequirements,
      totalAmount
    } = req.body;

    // Verify bus is still available
    const busDoc = await Bus.findById(bus);
    if (!busDoc || busDoc.status !== 'available') {
      return sendError(res, 'Selected bus is no longer available');
    }

    // Calculate duration
    const startDate = new Date(travelDates.start);
    const endDate = new Date(travelDates.end);
    const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Transform frontend data to match backend schema
    const bookingData = {
      user: req.user._id,
      groupDetails: {
        boys: participants?.boys || 0,
        girls: participants?.girls || 0,
        staff: participants?.staff || 0,
        total: participants?.total || 0
      },
      tripDetails: {
        departureCity: institution?.address || city?.name || '',
        destination: city?.name || '',
        duration,
        startDate,
        endDate
      },
      transport: {
        busType: busDoc.type,
        bus: bus
      },
      accommodation: {
        type: 'No Accommodation',
        guideRequired: false
      },
      companyVisit: {
        domain: institution?.type || '',
        selectedCompany: companies && companies.length > 0 ? {
          id: companies[0]._id,
          name: companies[0].name || '',
          address: companies[0].address || '',
          source: 'database'
        } : undefined
      },
      visitingSpots: (visitingSpots || []).map(spot => ({
        id: spot._id,
        name: spot.name || '',
        coordinates: spot.coordinates || { lat: 0, lng: 0 }
      })),
      foodArrangement: {
        required: meals && meals.length > 0,
        selectedRestaurants: (meals || []).map(meal => ({
          name: meal.restaurant || '',
          address: meal.notes || '',
          rating: 0,
          cuisine: meal.cuisine || ''
        }))
      },
      payment: {
        amount: totalAmount || 0,
        status: 'completed' // Mark as paid immediately since no payment gateway
      },
      status: 'pending_review'
    };

    // Create booking
    const booking = await Booking.create(bookingData);

    // Don't update bus status yet - wait for admin approval
    // Bus will be marked as in-use when admin accepts the booking

    // Populate bus details for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('transport.bus', 'busNumber type capacity')
      .populate('user', 'name email phone');

    // Send response immediately
    sendCreated(res, 'Booking created successfully', populatedBooking);

    // Generate invoice and send email in the background (non-blocking)
    try {
      const user = await User.findById(req.user._id);
      const invoiceResult = await generateInvoice(booking, user);
      
      if (invoiceResult.success) {
        booking.invoicePath = invoiceResult.filePath;
        await booking.save();
      }

      // Send confirmation email (non-blocking)
      sendBookingConfirmationEmail(user.email, user.name, booking).catch(err => {
        console.error('Failed to send booking confirmation email:', err.message);
      });
    } catch (bgError) {
      console.error('Background task error (invoice/email):', bgError.message);
    }
  } catch (error) {
    console.error('Create booking error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Get current user's bookings
// @route   GET /api/bookings/my-bookings
// @access  Private (Client)
export const getMyBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { user: req.user._id };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('transport.bus', 'busNumber type capacity imagePath')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    sendSuccess(res, 'Bookings fetched', {
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('transport.bus', 'busNumber type capacity amenities imagePath')
      .populate('user', 'name email phone organization');

    if (!booking) {
      return sendNotFound(res, 'Booking not found');
    }

    // Check if user owns this booking or is admin
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to view this booking', 403);
    }

    sendSuccess(res, 'Booking fetched', booking);
  } catch (error) {
    console.error('Get booking error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings
// @access  Private (Admin)
export const getAllBookings = async (req, res) => {
  try {
    const { 
      status, 
      destination, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 10,
      sort = '-createdAt'
    } = req.query;

    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (destination) {
      query['tripDetails.destination'] = new RegExp(destination, 'i');
    }
    
    if (startDate || endDate) {
      query['tripDetails.startDate'] = {};
      if (startDate) query['tripDetails.startDate'].$gte = new Date(startDate);
      if (endDate) query['tripDetails.startDate'].$lte = new Date(endDate);
    }

    const bookings = await Booking.find(query)
      .populate('transport.bus', 'busNumber type')
      .populate('user', 'name email phone organization')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    sendSuccess(res, 'Bookings fetched', {
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Update booking status (Admin)
// @route   PUT /api/bookings/:id/status
// @access  Private (Admin)
export const updateBookingStatus = async (req, res) => {
  try {
    const { status, driverDetails, declineReason, adminNotes } = req.body;
    
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email');

    if (!booking) {
      return sendNotFound(res, 'Booking not found');
    }

    // Validate status transition
    const validTransitions = {
      'pending_review': ['accepted', 'declined'],
      'accepted': ['completed', 'cancelled'],
      'declined': [],
      'completed': [],
      'cancelled': []
    };

    if (!validTransitions[booking.status].includes(status)) {
      return sendError(res, `Cannot change status from ${booking.status} to ${status}`);
    }

    // Update booking
    booking.status = status;
    
    if (status === 'accepted') {
      if (!driverDetails || !driverDetails.name || !driverDetails.phone || !driverDetails.licenseNumber) {
        return sendError(res, 'Driver details are required when accepting a booking');
      }
      booking.driverDetails = driverDetails;
      booking.acceptedAt = new Date();
      // Update payment status to completed
      booking.payment.status = 'completed';
      // Mark bus as in-use
      await Bus.findByIdAndUpdate(booking.transport.bus, { status: 'in-use' });
    }

    if (status === 'declined') {
      booking.declineReason = declineReason;
      // Release the bus (keep it available)
      await Bus.findByIdAndUpdate(booking.transport.bus, { status: 'available' });
    }

    if (status === 'completed') {
      booking.completedAt = new Date();
      // Release the bus
      await Bus.findByIdAndUpdate(booking.transport.bus, { status: 'available' });
    }
    
    if (status === 'cancelled') {
      // Release the bus
      await Bus.findByIdAndUpdate(booking.transport.bus, { status: 'available' });
    }

    if (adminNotes) {
      booking.adminNotes = adminNotes;
    }

    await booking.save();

    // Regenerate invoice if booking is accepted (to show PAID status and driver details)
    if (status === 'accepted') {
      const user = await User.findById(booking.user._id || booking.user);
      const invoiceResult = await generateInvoice(booking, user);
      if (invoiceResult.success) {
        booking.invoicePath = invoiceResult.filePath;
        await booking.save();
      }
    }

    sendSuccess(res, `Booking ${status} successfully`, booking);

    // Send email in the background so SMTP delays do not block API response.
    sendBookingStatusEmail(
      booking.user.email,
      booking.user.name,
      booking,
      status,
      status === 'accepted' ? driverDetails : null
    )
      .then(result => {
        if (!result?.success) {
          console.error('Booking status email failed:', result?.error || 'Unknown email error');
        }
      })
      .catch(err => {
        console.error('Booking status email exception:', err.message);
      });
  } catch (error) {
    console.error('Update booking status error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Upload driver permit (Admin)
// @route   PUT /api/bookings/:id/permit
// @access  Private (Admin)
export const uploadDriverPermit = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return sendNotFound(res, 'Booking not found');
    }

    if (!req.file) {
      return sendError(res, 'Please upload a permit file');
    }

    booking.driverDetails.permitFilePath = `/uploads/permits/${req.file.filename}`;
    await booking.save();

    sendSuccess(res, 'Permit uploaded successfully', {
      permitFilePath: booking.driverDetails.permitFilePath
    });
  } catch (error) {
    console.error('Upload permit error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Get booking statistics (Admin)
// @route   GET /api/bookings/stats
// @access  Private (Admin)
export const getBookingStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending_review' });
    const acceptedBookings = await Booking.countDocuments({ status: 'accepted' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const declinedBookings = await Booking.countDocuments({ status: 'declined' });

    // Revenue
    const revenueResult = await Booking.aggregate([
      { $match: { 'payment.status': 'completed' } },
      { $group: { _id: null, total: { $sum: '$payment.amount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Bookings over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const bookingsOverTime = await Booking.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Popular destinations
    const popularDestinations = await Booking.aggregate([
      { $group: { _id: '$tripDetails.destination', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    sendSuccess(res, 'Stats fetched', {
      totalBookings,
      pendingBookings,
      acceptedBookings,
      completedBookings,
      declinedBookings,
      totalRevenue,
      bookingsOverTime,
      popularDestinations
    });
  } catch (error) {
    console.error('Get booking stats error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Download invoice
// @route   GET /api/bookings/:id/invoice
// @access  Private
export const downloadInvoice = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return sendNotFound(res, 'Booking not found');
    }

    // Check authorization
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized', 403);
    }

    if (!booking.invoicePath) {
      // Generate invoice if not exists
      const user = await User.findById(booking.user);
      const invoiceResult = await generateInvoice(booking, user);
      
      if (invoiceResult.success) {
        booking.invoicePath = invoiceResult.filePath;
        await booking.save();
      } else {
        return sendError(res, 'Failed to generate invoice', 500);
      }
    }

    // Construct absolute file path
    const filePath = path.join(__dirname, '..', booking.invoicePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return sendError(res, 'Invoice file not found', 404);
    }

    // Send the PDF file
    res.download(filePath, `invoice-${booking.bookingId}.pdf`, (err) => {
      if (err) {
        console.error('Error sending invoice:', err);
        if (!res.headersSent) {
          sendError(res, 'Error downloading invoice', 500);
        }
      }
    });
  } catch (error) {
    console.error('Download invoice error:', error);
    sendError(res, error.message, 500);
  }
};
