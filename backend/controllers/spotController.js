import VisitingSpot from '../models/VisitingSpot.js';
import { sendSuccess, sendError, sendCreated, sendNotFound } from '../utils/responseHelper.js';
import { searchSpotsWithAI } from '../utils/geminiHelper.js';

// @desc    Get all visiting spots
// @route   GET /api/spots
// @access  Public
export const getSpots = async (req, res) => {
  try {
    const { city, type, page = 1, limit = 20 } = req.query;

    const query = { isActive: true };
    
    if (city) query.city = new RegExp(city, 'i');
    if (type) query.type = type;

    const spots = await VisitingSpot.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await VisitingSpot.countDocuments(query);

    sendSuccess(res, 'Spots fetched', {
      spots,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get spots error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Search spots for a city (with AI fallback)
// @route   POST /api/spots/search
// @access  Public
export const searchSpots = async (req, res) => {
  try {
    const { city } = req.body;

    if (!city) {
      return sendError(res, 'City is required');
    }

    // First, get spots from database
    const dbSpots = await VisitingSpot.find({
      city: new RegExp(city, 'i'),
      isActive: true
    }).limit(15);

    // If we have enough spots from DB, return them
    if (dbSpots.length >= 5) {
      return sendSuccess(res, 'Spots found', {
        spots: dbSpots.map(s => ({
          id: s._id,
          name: s.name,
          type: s.type,
          description: s.description,
          coordinates: s.coordinates,
          entryFee: s.entryFee,
          timings: s.timings,
          source: 'database'
        })),
        sources: { database: dbSpots.length, ai: 0 }
      });
    }

    // Otherwise, try AI suggestions
    let aiSpots = [];
    try {
      const aiResult = await searchSpotsWithAI(city);
      if (aiResult.success) {
        aiSpots = aiResult.spots;
      }
    } catch (aiError) {
      console.error('AI search failed:', aiError);
    }

    // Combine results
    const allSpots = [
      ...dbSpots.map(s => ({
        id: s._id,
        name: s.name,
        type: s.type,
        description: s.description,
        coordinates: s.coordinates,
        entryFee: s.entryFee,
        timings: s.timings,
        source: 'database'
      })),
      ...aiSpots
    ];

    sendSuccess(res, 'Spots search results', {
      spots: allSpots,
      sources: {
        database: dbSpots.length,
        ai: aiSpots.length
      }
    });
  } catch (error) {
    console.error('Search spots error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Get spot by ID
// @route   GET /api/spots/:id
// @access  Public
export const getSpotById = async (req, res) => {
  try {
    const spot = await VisitingSpot.findById(req.params.id);

    if (!spot) {
      return sendNotFound(res, 'Spot not found');
    }

    sendSuccess(res, 'Spot fetched', spot);
  } catch (error) {
    console.error('Get spot error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Create visiting spot (Admin)
// @route   POST /api/spots
// @access  Private (Admin)
export const createSpot = async (req, res) => {
  try {
    const { name, city, coordinates, type, description, entryFee, timings } = req.body;

    const spot = await VisitingSpot.create({
      name,
      city,
      coordinates,
      type,
      description,
      entryFee,
      timings,
      source: 'manual'
    });

    sendCreated(res, 'Spot created successfully', spot);
  } catch (error) {
    console.error('Create spot error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Update visiting spot (Admin)
// @route   PUT /api/spots/:id
// @access  Private (Admin)
export const updateSpot = async (req, res) => {
  try {
    const { name, city, coordinates, type, description, entryFee, timings, isActive } = req.body;

    let spot = await VisitingSpot.findById(req.params.id);
    if (!spot) {
      return sendNotFound(res, 'Spot not found');
    }

    spot = await VisitingSpot.findByIdAndUpdate(
      req.params.id,
      { name, city, coordinates, type, description, entryFee, timings, isActive },
      { new: true, runValidators: true }
    );

    sendSuccess(res, 'Spot updated successfully', spot);
  } catch (error) {
    console.error('Update spot error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Delete visiting spot (Admin)
// @route   DELETE /api/spots/:id
// @access  Private (Admin)
export const deleteSpot = async (req, res) => {
  try {
    const spot = await VisitingSpot.findById(req.params.id);

    if (!spot) {
      return sendNotFound(res, 'Spot not found');
    }

    await VisitingSpot.findByIdAndDelete(req.params.id);

    sendSuccess(res, 'Spot deleted successfully');
  } catch (error) {
    console.error('Delete spot error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Get spot types
// @route   GET /api/spots/types
// @access  Public
export const getSpotTypes = async (req, res) => {
  try {
    const types = ['tourist', 'educational', 'historical', 'religious', 'nature', 'other'];
    sendSuccess(res, 'Spot types fetched', types);
  } catch (error) {
    console.error('Get spot types error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Get AI suggestions for spots
// @route   POST /api/spots/ai-suggest
// @access  Private
export const getAISuggestions = async (req, res) => {
  try {
    const { city, type, participantCount } = req.body;

    if (!city) {
      return sendError(res, 'City is required');
    }

    const result = await searchSpotsWithAI(city, type, participantCount);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to get AI suggestions', 500);
    }

    sendSuccess(res, 'AI suggestions generated', { suggestion: result.suggestion });
  } catch (error) {
    console.error('AI suggestions error:', error);
    sendError(res, error.message, 500);
  }
};
