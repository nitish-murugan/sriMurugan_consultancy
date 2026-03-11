import City from '../models/City.js';
import { sendSuccess, sendError, sendCreated, sendNotFound } from '../utils/responseHelper.js';

// @desc    Get all cities
// @route   GET /api/cities
// @access  Public
export const getCities = async (req, res) => {
  try {
    const { state, isPopular, search } = req.query;

    const query = { isActive: true };
    
    if (state) query.state = state;
    if (isPopular !== undefined) query.isPopular = isPopular === 'true';
    if (search) {
      query.name = new RegExp(search, 'i');
    }

    const cities = await City.find(query).sort({ isPopular: -1, name: 1 });

    sendSuccess(res, 'Cities fetched', cities);
  } catch (error) {
    console.error('Get cities error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Get city by ID
// @route   GET /api/cities/:id
// @access  Public
export const getCityById = async (req, res) => {
  try {
    const city = await City.findById(req.params.id);

    if (!city) {
      return sendNotFound(res, 'City not found');
    }

    sendSuccess(res, 'City fetched', city);
  } catch (error) {
    console.error('Get city error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Create city (Admin)
// @route   POST /api/cities
// @access  Private (Admin)
export const createCity = async (req, res) => {
  try {
    const { name, state, isPopular } = req.body;

    const existingCity = await City.findOne({ name, state });
    if (existingCity) {
      return sendError(res, 'City already exists in this state');
    }

    const city = await City.create({ name, state, isPopular });

    sendCreated(res, 'City created successfully', city);
  } catch (error) {
    console.error('Create city error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Update city (Admin)
// @route   PUT /api/cities/:id
// @access  Private (Admin)
export const updateCity = async (req, res) => {
  try {
    const { name, state, isPopular, isActive } = req.body;

    let city = await City.findById(req.params.id);
    if (!city) {
      return sendNotFound(res, 'City not found');
    }

    city = await City.findByIdAndUpdate(
      req.params.id,
      { name, state, isPopular, isActive },
      { new: true, runValidators: true }
    );

    sendSuccess(res, 'City updated successfully', city);
  } catch (error) {
    console.error('Update city error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Delete city (Admin)
// @route   DELETE /api/cities/:id
// @access  Private (Admin)
export const deleteCity = async (req, res) => {
  try {
    const city = await City.findById(req.params.id);

    if (!city) {
      return sendNotFound(res, 'City not found');
    }

    await City.findByIdAndDelete(req.params.id);

    sendSuccess(res, 'City deleted successfully');
  } catch (error) {
    console.error('Delete city error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Get unique states
// @route   GET /api/cities/states
// @access  Public
export const getStates = async (req, res) => {
  try {
    const states = await City.distinct('state', { isActive: true });
    sendSuccess(res, 'States fetched', states.sort());
  } catch (error) {
    console.error('Get states error:', error);
    sendError(res, error.message, 500);
  }
};
