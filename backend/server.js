import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/bookings.js';
import busRoutes from './routes/buses.js';
import cityRoutes from './routes/cities.js';
import companyRoutes from './routes/companies.js';
import spotRoutes from './routes/spots.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import driverRoutes from './routes/drivers.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// CORS
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/spots', spotRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/drivers', driverRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date() });
});

// Avoid noisy 404 logs from browser default favicon requests.
app.get('/favicon.ico', (_req, res) => {
  res.status(204).end();
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Sri Murugan Tours API', 
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      testEmail: '/api/auth/test-email',
      bookings: '/api/bookings',
      buses: '/api/buses',
      cities: '/api/cities',
      companies: '/api/companies',
      spots: '/api/spots',
      payments: '/api/payments',
      admin: '/api/admin',
      drivers: '/api/drivers'
    }
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

export default app;
