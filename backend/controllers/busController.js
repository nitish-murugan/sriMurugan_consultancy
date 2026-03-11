import Bus from '../models/Bus.js';
import { sendSuccess, sendError, sendCreated, sendNotFound } from '../utils/responseHelper.js';
import { deleteFile } from '../middleware/uploadMiddleware.js';

// @desc    Get all buses with optional filters
// @route   GET /api/buses
// @access  Public
export const getBuses = async (req, res) => {
  try {
    const { type, status, isAC, page = 1, limit = 10 } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (isAC !== undefined) query.isAC = isAC === 'true';

    const buses = await Bus.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Bus.countDocuments(query);

    sendSuccess(res, 'Buses fetched', {
      buses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get buses error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Get available buses by type
// @route   GET /api/buses/available
// @access  Public
export const getAvailableBuses = async (req, res) => {
  try {
    const { type } = req.query;

    const query = { 
      status: 'available',
      permitValidity: { $gt: new Date() } // Only valid permits
    };
    
    if (type) {
      query.type = type;
    }

    const buses = await Bus.find(query).sort({ capacity: -1 });

    sendSuccess(res, 'Available buses fetched', buses);
  } catch (error) {
    console.error('Get available buses error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Get bus by ID
// @route   GET /api/buses/:id
// @access  Public
export const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return sendNotFound(res, 'Bus not found');
    }

    sendSuccess(res, 'Bus fetched', bus);
  } catch (error) {
    console.error('Get bus error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Create new bus (Admin)
// @route   POST /api/buses
// @access  Private (Admin)
export const createBus = async (req, res) => {
  try {
    const { busNumber, type, capacity, isAC, amenities, permitValidity, pricePerDay, description } = req.body;

    // Check if bus number already exists
    const existingBus = await Bus.findOne({ busNumber: busNumber.toUpperCase() });
    if (existingBus) {
      return sendError(res, 'Bus with this number already exists');
    }

    const busData = {
      busNumber,
      type,
      capacity,
      isAC,
      amenities: amenities ? (typeof amenities === 'string' ? JSON.parse(amenities) : amenities) : [],
      permitValidity,
      pricePerDay,
      description
    };

    if (req.file) {
      busData.imagePath = `/uploads/buses/${req.file.filename}`;
    }

    const bus = await Bus.create(busData);

    sendCreated(res, 'Bus created successfully', bus);
  } catch (error) {
    console.error('Create bus error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Update bus (Admin)
// @route   PUT /api/buses/:id
// @access  Private (Admin)
export const updateBus = async (req, res) => {
  try {
    let bus = await Bus.findById(req.params.id);

    if (!bus) {
      return sendNotFound(res, 'Bus not found');
    }

    const { busNumber, type, capacity, isAC, amenities, permitValidity, status, pricePerDay, description } = req.body;

    // Check if new bus number already exists (excluding current bus)
    if (busNumber && busNumber.toUpperCase() !== bus.busNumber) {
      const existingBus = await Bus.findOne({ busNumber: busNumber.toUpperCase() });
      if (existingBus) {
        return sendError(res, 'Bus with this number already exists');
      }
    }

    const updateData = {};
    if (busNumber) updateData.busNumber = busNumber;
    if (type) updateData.type = type;
    if (capacity) updateData.capacity = capacity;
    if (isAC !== undefined) updateData.isAC = isAC;
    if (amenities) updateData.amenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
    if (permitValidity) updateData.permitValidity = permitValidity;
    if (status) updateData.status = status;
    if (pricePerDay !== undefined) updateData.pricePerDay = pricePerDay;
    if (description !== undefined) updateData.description = description;

    if (req.file) {
      // Delete old image if exists
      if (bus.imagePath) {
        deleteFile(bus.imagePath);
      }
      updateData.imagePath = `/uploads/buses/${req.file.filename}`;
    }

    bus = await Bus.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    sendSuccess(res, 'Bus updated successfully', bus);
  } catch (error) {
    console.error('Update bus error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Delete bus (Admin)
// @route   DELETE /api/buses/:id
// @access  Private (Admin)
export const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return sendNotFound(res, 'Bus not found');
    }

    // Delete image if exists
    if (bus.imagePath) {
      deleteFile(bus.imagePath);
    }

    await Bus.findByIdAndDelete(req.params.id);

    sendSuccess(res, 'Bus deleted successfully');
  } catch (error) {
    console.error('Delete bus error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Get bus types
// @route   GET /api/buses/types
// @access  Public
export const getBusTypes = async (req, res) => {
  try {
    const types = ['AC Sleeper', 'Non-AC Sleeper', 'AC Seater', 'Non-AC Seater', 'Luxury Coach', 'Mini Bus', 'Tempo Traveller'];
    sendSuccess(res, 'Bus types fetched', types);
  } catch (error) {
    console.error('Get bus types error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Get bus amenities list
// @route   GET /api/buses/amenities
// @access  Public
export const getBusAmenities = async (req, res) => {
  try {
    const amenities = ['WiFi', 'TV', 'Charging Points', 'Water Bottle', 'Blanket', 'Pillow', 'First Aid', 'GPS Tracking', 'CCTV', 'Pushback Seats', 'Reading Light'];
    sendSuccess(res, 'Bus amenities fetched', amenities);
  } catch (error) {
    console.error('Get bus amenities error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Get bus statistics (Admin)
// @route   GET /api/buses/stats
// @access  Private (Admin)
export const getBusStats = async (req, res) => {
  try {
    const totalBuses = await Bus.countDocuments();
    const availableBuses = await Bus.countDocuments({ status: 'available' });
    const inUseBuses = await Bus.countDocuments({ status: 'in-use' });
    const maintenanceBuses = await Bus.countDocuments({ status: 'maintenance' });

    // Buses by type
    const busesByType = await Bus.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Expiring permits (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringPermits = await Bus.countDocuments({
      permitValidity: { $lte: thirtyDaysFromNow, $gt: new Date() }
    });

    sendSuccess(res, 'Bus stats fetched', {
      totalBuses,
      availableBuses,
      inUseBuses,
      maintenanceBuses,
      busesByType,
      expiringPermits
    });
  } catch (error) {
    console.error('Get bus stats error:', error);
    sendError(res, error.message, 500);
  }
};
