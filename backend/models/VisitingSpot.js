import mongoose from 'mongoose';

const visitingSpotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Spot name is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  coordinates: {
    lat: {
      type: Number,
      required: [true, 'Latitude is required']
    },
    lng: {
      type: Number,
      required: [true, 'Longitude is required']
    }
  },
  type: {
    type: String,
    enum: ['tourist', 'educational', 'historical', 'religious', 'nature', 'other'],
    default: 'tourist'
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  entryFee: {
    type: Number,
    default: 0
  },
  timings: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    enum: ['manual', 'api'],
    default: 'manual'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for geo queries and city search
visitingSpotSchema.index({ city: 1 });
visitingSpotSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

const VisitingSpot = mongoose.model('VisitingSpot', visitingSpotSchema);

export default VisitingSpot;
