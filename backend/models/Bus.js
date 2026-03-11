import mongoose from 'mongoose';

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: [true, 'Bus number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  type: {
    type: String,
    required: [true, 'Bus type is required'],
    enum: ['AC Sleeper', 'Non-AC Sleeper', 'AC Seater', 'Non-AC Seater', 'Luxury Coach', 'Mini Bus', 'Tempo Traveller']
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [60, 'Capacity cannot exceed 60']
  },
  isAC: {
    type: Boolean,
    default: false
  },
  amenities: [{
    type: String,
    enum: ['WiFi', 'TV', 'Charging Points', 'Water Bottle', 'Blanket', 'Pillow', 'First Aid', 'GPS Tracking', 'CCTV', 'Pushback Seats', 'Reading Light']
  }],
  imagePath: {
    type: String,
    default: null
  },
  permitValidity: {
    type: Date,
    required: [true, 'Permit validity date is required']
  },
  status: {
    type: String,
    enum: ['available', 'in-use', 'maintenance'],
    default: 'available'
  },
  pricePerDay: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Virtual for checking if permit is valid
busSchema.virtual('isPermitValid').get(function() {
  return this.permitValidity > new Date();
});

// Index for efficient queries
busSchema.index({ type: 1, status: 1 });

const Bus = mongoose.model('Bus', busSchema);

export default Bus;
