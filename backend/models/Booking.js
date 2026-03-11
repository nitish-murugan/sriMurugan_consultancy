import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Step 1: Group Details
  groupDetails: {
    boys: {
      type: Number,
      required: true,
      min: 0
    },
    girls: {
      type: Number,
      required: true,
      min: 0
    },
    staff: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 1
    }
  },

  // Step 2: Trip Details
  tripDetails: {
    departureCity: {
      type: String,
      required: true
    },
    destination: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },

  // Step 3: Transportation
  transport: {
    busType: {
      type: String,
      required: true
    },
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true
    }
  },

  // Step 4: Accommodation & Guide
  accommodation: {
    type: {
      type: String,
      enum: ['Hotel', 'Dormitory', 'Lodge', 'No Accommodation'],
      required: true
    },
    guideRequired: {
      type: Boolean,
      default: false
    }
  },

  // Step 5: Company/Industry Visit
  companyVisit: {
    domain: String,
    selectedCompany: {
      id: mongoose.Schema.Types.ObjectId,
      name: String,
      address: String,
      source: String
    }
  },

  // Step 6: Visiting Spots
  visitingSpots: [{
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  }],

  // Step 7: Food Arrangement
  foodArrangement: {
    required: {
      type: Boolean,
      default: false
    },
    selectedRestaurants: [{
      name: String,
      address: String,
      rating: Number,
      cuisine: String
    }]
  },

  // Step 8: Payment
  payment: {
    amount: {
      type: Number,
      required: true
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paidAt: Date
  },

  // Booking Status
  status: {
    type: String,
    enum: ['pending_review', 'accepted', 'declined', 'completed', 'cancelled'],
    default: 'pending_review'
  },

  // Admin Actions (filled when accepted)
  driverDetails: {
    name: String,
    phone: String,
    licenseNumber: String,
    permitFilePath: String
  },

  // Admin Notes
  adminNotes: String,
  declineReason: String,

  // Invoice
  invoicePath: String,

  // Timestamps for tracking
  acceptedAt: Date,
  completedAt: Date,
  cancelledAt: Date

}, {
  timestamps: true
});

// Generate unique booking ID before saving
bookingSchema.pre('save', async function(next) {
  if (!this.bookingId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.bookingId = `SMT${year}${month}${random}`;
  }
  next();
});

// Indexes
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
