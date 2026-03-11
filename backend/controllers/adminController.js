import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Bus from '../models/Bus.js';
import { sendSuccess, sendError, sendNotFound } from '../utils/responseHelper.js';
import { searchRestaurantsWithAI } from '../utils/geminiHelper.js';

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
export const getDashboardStats = async (req, res) => {
  try {
    // Basic counts
    const totalUsers = await User.countDocuments({ role: 'client' });
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending_review' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const activeTrips = await Booking.countDocuments({ status: 'accepted' });
    const completedTrips = await Booking.countDocuments({ status: 'completed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
    
    // Bus stats
    const totalBuses = await Bus.countDocuments();
    const availableBuses = await Bus.countDocuments({ status: 'available' });

    // Revenue calculation
    const revenueResult = await Booking.aggregate([
      { $match: { 'payment.status': 'completed' } },
      { $group: { _id: null, total: { $sum: '$payment.amount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Bookings over last 6 months for chart
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyBookingsData = await Booking.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { 
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$payment.amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format monthly data for chart
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyBookings = monthlyBookingsData.map(item => ({
      month: monthNames[item._id.month - 1],
      bookings: item.count,
      revenue: item.revenue
    }));

    // Bookings over last 30 days for detailed chart
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const bookingsOverTime = await Booking.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$payment.amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Bus utilization
    const busUtilization = await Bus.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent bookings
    const recentBookings = await Booking.find()
      .populate('user', 'name email organization')
      .sort({ createdAt: -1 })
      .limit(10);

    // Popular destinations
    const popularDestinations = await Booking.aggregate([
      { $group: { _id: '$tripDetails.destination', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    sendSuccess(res, 'Dashboard stats', {
      stats: {
        totalUsers,
        totalBookings,
        pendingBookings,
        confirmedBookings,
        activeTrips,
        completedTrips,
        cancelledBookings,
        totalBuses,
        availableBuses,
        totalRevenue,
        bookingsByStatus: {
          pending: pendingBookings,
          confirmed: confirmedBookings,
          completed: completedTrips,
          cancelled: cancelledBookings
        },
        monthlyBookings
      },
      charts: {
        bookingsOverTime,
        busUtilization,
        popularDestinations
      },
      recentBookings
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { organization: new RegExp(search, 'i') }
      ];
    }

    const users = await User.find(query)
      .select('-refreshToken')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    sendSuccess(res, 'Users fetched', {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Update user status (Admin)
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
export const updateUserStatus = async (req, res) => {
  try {
    const { isActive, role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    if (isActive !== undefined) user.isActive = isActive;
    if (role) user.role = role;

    await user.save();

    sendSuccess(res, 'User updated', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Update user error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Search restaurants (using Gemini AI)
// @route   POST /api/admin/restaurants/search
// @access  Private
export const searchRestaurants = async (req, res) => {
  try {
    const { location, city } = req.body;

    if (!location || !city) {
      return sendError(res, 'Location and city are required');
    }

    const result = await searchRestaurantsWithAI(location, city);

    if (result.success) {
      sendSuccess(res, 'Restaurants found', result.restaurants);
    } else {
      sendError(res, result.error || 'Failed to search restaurants');
    }
  } catch (error) {
    console.error('Search restaurants error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Create admin user (Super Admin only - first time setup)
// @route   POST /api/admin/create-admin
// @access  Public (but should be disabled in production)
export const createAdminUser = async (req, res) => {
  try {
    // Check if any admin exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return sendError(res, 'Admin user already exists', 403);
    }

    const { name, email, password, phone } = req.body;

    const admin = await User.create({
      name,
      email,
      password,
      phone,
      role: 'admin'
    });

    sendSuccess(res, 'Admin user created', {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    });
  } catch (error) {
    console.error('Create admin error:', error);
    sendError(res, error.message, 500);
  }
};
