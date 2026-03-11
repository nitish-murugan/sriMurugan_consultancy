import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import City from '../models/City.js';
import Bus from '../models/Bus.js';
import Company from '../models/Company.js';
import VisitingSpot from '../models/VisitingSpot.js';
import User from '../models/User.js';

// Connect to DB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/srimurugan_tours');
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error('DB Connection Error:', error);
    process.exit(1);
  }
};

// Cities data
const cities = [
  { name: 'Chennai', state: 'Tamil Nadu', isPopular: true },
  { name: 'Bangalore', state: 'Karnataka', isPopular: true },
  { name: 'Hyderabad', state: 'Telangana', isPopular: true },
  { name: 'Mumbai', state: 'Maharashtra', isPopular: true },
  { name: 'Pune', state: 'Maharashtra', isPopular: true },
  { name: 'Delhi', state: 'Delhi', isPopular: true },
  { name: 'Coimbatore', state: 'Tamil Nadu', isPopular: true },
  { name: 'Madurai', state: 'Tamil Nadu', isPopular: false },
  { name: 'Trichy', state: 'Tamil Nadu', isPopular: false },
  { name: 'Salem', state: 'Tamil Nadu', isPopular: false },
  { name: 'Mysore', state: 'Karnataka', isPopular: true },
  { name: 'Kochi', state: 'Kerala', isPopular: true },
  { name: 'Thiruvananthapuram', state: 'Kerala', isPopular: false },
  { name: 'Ahmedabad', state: 'Gujarat', isPopular: true },
  { name: 'Surat', state: 'Gujarat', isPopular: false },
  { name: 'Kolkata', state: 'West Bengal', isPopular: true },
  { name: 'Jaipur', state: 'Rajasthan', isPopular: true },
  { name: 'Lucknow', state: 'Uttar Pradesh', isPopular: false },
  { name: 'Chandigarh', state: 'Punjab', isPopular: false },
  { name: 'Indore', state: 'Madhya Pradesh', isPopular: false },
  { name: 'Bhopal', state: 'Madhya Pradesh', isPopular: false },
  { name: 'Nagpur', state: 'Maharashtra', isPopular: false },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', isPopular: false },
  { name: 'Tirupati', state: 'Andhra Pradesh', isPopular: true },
  { name: 'Ooty', state: 'Tamil Nadu', isPopular: true },
  { name: 'Kodaikanal', state: 'Tamil Nadu', isPopular: true },
  { name: 'Pondicherry', state: 'Puducherry', isPopular: true },
  { name: 'Goa', state: 'Goa', isPopular: true },
  { name: 'Mahabalipuram', state: 'Tamil Nadu', isPopular: true },
  { name: 'Thanjavur', state: 'Tamil Nadu', isPopular: false }
];

// Buses data
const buses = [
  {
    busNumber: 'TN01AB1234',
    type: 'AC Sleeper',
    capacity: 36,
    isAC: true,
    amenities: ['WiFi', 'TV', 'Charging Points', 'Blanket', 'Pillow', 'Water Bottle'],
    permitValidity: new Date('2027-12-31'),
    pricePerDay: 15000,
    status: 'available',
    description: 'Premium AC Sleeper bus with full amenities for comfortable overnight journeys.'
  },
  {
    busNumber: 'TN02CD5678',
    type: 'Non-AC Sleeper',
    capacity: 40,
    isAC: false,
    amenities: ['Charging Points', 'Water Bottle', 'First Aid'],
    permitValidity: new Date('2027-06-30'),
    pricePerDay: 10000,
    status: 'available',
    description: 'Spacious Non-AC Sleeper bus, ideal for budget-friendly group travel.'
  },
  {
    busNumber: 'TN03EF9012',
    type: 'AC Seater',
    capacity: 45,
    isAC: true,
    amenities: ['WiFi', 'Charging Points', 'Water Bottle', 'Pushback Seats'],
    permitValidity: new Date('2027-09-30'),
    pricePerDay: 12000,
    status: 'available',
    description: 'Comfortable AC Seater with pushback seats for day trips.'
  },
  {
    busNumber: 'TN04GH3456',
    type: 'Luxury Coach',
    capacity: 30,
    isAC: true,
    amenities: ['WiFi', 'TV', 'Charging Points', 'Water Bottle', 'Blanket', 'GPS Tracking', 'CCTV', 'Reading Light'],
    permitValidity: new Date('2028-03-31'),
    pricePerDay: 25000,
    status: 'available',
    description: 'Premium luxury coach with executive seating, entertainment system, and top-tier amenities.'
  },
  {
    busNumber: 'TN05IJ7890',
    type: 'Mini Bus',
    capacity: 20,
    isAC: true,
    amenities: ['Charging Points', 'Water Bottle', 'First Aid', 'GPS Tracking'],
    permitValidity: new Date('2027-08-31'),
    pricePerDay: 8000,
    status: 'available',
    description: 'Compact AC mini bus perfect for small groups and short trips.'
  },
  {
    busNumber: 'TN06KL1234',
    type: 'Tempo Traveller',
    capacity: 12,
    isAC: true,
    amenities: ['Charging Points', 'Water Bottle', 'Pushback Seats'],
    permitValidity: new Date('2027-11-30'),
    pricePerDay: 5000,
    status: 'available',
    description: 'Compact tempo traveller for small group outings and city tours.'
  },
  {
    busNumber: 'TN07MN5678',
    type: 'Non-AC Seater',
    capacity: 52,
    isAC: false,
    amenities: ['Water Bottle', 'First Aid'],
    permitValidity: new Date('2027-04-30'),
    pricePerDay: 8000,
    status: 'available',
    description: 'Large capacity Non-AC seater bus for budget group travel.'
  },
  {
    busNumber: 'TN08OP9012',
    type: 'AC Sleeper',
    capacity: 32,
    isAC: true,
    amenities: ['WiFi', 'TV', 'Charging Points', 'Blanket', 'Pillow', 'CCTV'],
    permitValidity: new Date('2027-10-31'),
    pricePerDay: 14000,
    status: 'in-use',
    description: 'Well-maintained AC Sleeper with entertainment and security features.'
  }
];

// Sample companies
const companies = [
  {
    name: 'Tata Consultancy Services',
    domain: 'it',
    city: 'Chennai',
    address: 'ELCOT SEZ, Sholinganallur, Chennai - 600119',
    description: 'Global IT services and consulting company',
    source: 'manual'
  },
  {
    name: 'Hyundai Motor India',
    domain: 'automobile',
    city: 'Chennai',
    address: 'Sriperumbudur, Chennai - 602117',
    description: 'Automobile manufacturing plant',
    source: 'manual'
  },
  {
    name: 'Infosys',
    domain: 'it',
    city: 'Bangalore',
    address: 'Electronics City, Bangalore - 560100',
    description: 'Multinational IT company',
    source: 'manual'
  },
  {
    name: 'Biocon Limited',
    domain: 'pharma',
    city: 'Bangalore',
    address: 'Electronic City, Bangalore - 560100',
    description: 'Biotechnology and pharmaceutical company',
    source: 'manual'
  },
  {
    name: 'Ashok Leyland',
    domain: 'automobile',
    city: 'Chennai',
    address: 'Ennore, Chennai - 600057',
    description: 'Commercial vehicle manufacturing',
    source: 'manual'
  },
  {
    name: 'Wipro Technologies',
    domain: 'it',
    city: 'Hyderabad',
    address: 'HITEC City, Hyderabad - 500081',
    description: 'Global IT services company',
    source: 'manual'
  },
  {
    name: 'Sun Pharmaceutical',
    domain: 'pharma',
    city: 'Mumbai',
    address: 'Goregaon, Mumbai - 400063',
    description: 'Pharmaceutical manufacturing and research',
    source: 'manual'
  },
  {
    name: 'Mahindra & Mahindra',
    domain: 'automobile',
    city: 'Pune',
    address: 'Akurdi, Pune - 411035',
    description: 'Automobile and farm equipment manufacturing',
    source: 'manual'
  }
];

// Sample visiting spots
const visitingSpots = [
  {
    name: 'Marina Beach',
    city: 'Chennai',
    coordinates: { lat: 13.0500, lng: 80.2824 },
    type: 'tourist',
    description: 'One of the longest urban beaches in the world',
    entryFee: 0,
    timings: '24 hours',
    source: 'manual'
  },
  {
    name: 'Fort St. George',
    city: 'Chennai',
    coordinates: { lat: 13.0797, lng: 80.2875 },
    type: 'historical',
    description: 'First English fortress in India, now houses Tamil Nadu Legislative Assembly',
    entryFee: 25,
    timings: '9:00 AM - 5:00 PM',
    source: 'manual'
  },
  {
    name: 'Vidhana Soudha',
    city: 'Bangalore',
    coordinates: { lat: 12.9791, lng: 77.5913 },
    type: 'historical',
    description: 'The seat of Karnataka state legislature',
    entryFee: 0,
    timings: 'External view only',
    source: 'manual'
  },
  {
    name: 'Lalbagh Botanical Garden',
    city: 'Bangalore',
    coordinates: { lat: 12.9507, lng: 77.5848 },
    type: 'nature',
    description: 'Historic 240-acre botanical garden',
    entryFee: 20,
    timings: '6:00 AM - 7:00 PM',
    source: 'manual'
  },
  {
    name: 'Charminar',
    city: 'Hyderabad',
    coordinates: { lat: 17.3616, lng: 78.4747 },
    type: 'historical',
    description: 'Iconic monument and mosque built in 1591',
    entryFee: 25,
    timings: '9:00 AM - 5:30 PM',
    source: 'manual'
  },
  {
    name: 'Gateway of India',
    city: 'Mumbai',
    coordinates: { lat: 18.9220, lng: 72.8347 },
    type: 'historical',
    description: 'Iconic arch monument overlooking the Arabian Sea',
    entryFee: 0,
    timings: '24 hours',
    source: 'manual'
  },
  {
    name: 'Meenakshi Temple',
    city: 'Madurai',
    coordinates: { lat: 9.9195, lng: 78.1193 },
    type: 'religious',
    description: 'Historic Hindu temple dedicated to Goddess Meenakshi',
    entryFee: 0,
    timings: '5:00 AM - 12:30 PM, 4:00 PM - 10:00 PM',
    source: 'manual'
  },
  {
    name: 'Mysore Palace',
    city: 'Mysore',
    coordinates: { lat: 12.3052, lng: 76.6552 },
    type: 'historical',
    description: 'Official residence of the Wadiyar dynasty',
    entryFee: 70,
    timings: '10:00 AM - 5:30 PM',
    source: 'manual'
  }
];

// Admin user
const adminUser = {
  name: 'Admin User',
  email: 'admin@srimurugantours.com',
  password: 'Admin@123',
  phone: '9876543210',
  role: 'admin'
};

// Seed functions
const seedCities = async () => {
  await City.deleteMany({});
  await City.insertMany(cities);
  console.log('Cities seeded successfully');
};

const seedBuses = async () => {
  await Bus.deleteMany({});
  await Bus.insertMany(buses);
  console.log('Buses seeded successfully');
};

const seedCompanies = async () => {
  await Company.deleteMany({});
  await Company.insertMany(companies);
  console.log('Companies seeded successfully');
};

const seedSpots = async () => {
  await VisitingSpot.deleteMany({});
  await VisitingSpot.insertMany(visitingSpots);
  console.log('Visiting spots seeded successfully');
};

const seedAdmin = async () => {
  const existingAdmin = await User.findOne({ email: adminUser.email });
  if (!existingAdmin) {
    await User.create(adminUser);
    console.log('Admin user created successfully');
    console.log('Admin credentials:');
    console.log('  Email:', adminUser.email);
    console.log('  Password:', adminUser.password);
  } else {
    console.log('Admin user already exists');
  }
};

// Main seed function
const seedAll = async () => {
  try {
    await connectDB();
    
    console.log('\n🌱 Starting database seeding...\n');
    
    await seedCities();
    await seedBuses();
    await seedCompanies();
    await seedSpots();
    await seedAdmin();
    
    console.log('\n✅ Database seeding completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedAll();
