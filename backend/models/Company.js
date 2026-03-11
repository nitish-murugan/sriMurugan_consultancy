import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  domain: {
    type: String,
    required: [true, 'Domain/Industry is required'],
    trim: true,
    lowercase: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
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
  website: {
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

// Indexes for searching
companySchema.index({ domain: 1, city: 1 });
companySchema.index({ name: 'text', domain: 'text' });

const Company = mongoose.model('Company', companySchema);

export default Company;
