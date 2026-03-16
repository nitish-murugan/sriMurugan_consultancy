import mongoose from 'mongoose';

const companySuggestionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  domain: {
    type: String,
    required: [true, 'Domain/Industry is required'],
    trim: true,
    lowercase: true
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  contactPhone: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  suggestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const CompanySuggestion = mongoose.model('CompanySuggestion', companySuggestionSchema);

export default CompanySuggestion;
