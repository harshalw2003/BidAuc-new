const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:8001',
  'http://127.0.0.1:8001'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    console.warn('Blocked CORS origin:', origin);
    return callback(new Error('CORS policy: Origin not allowed'));
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'blue_collar_marketplace';

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const jobRoutes = require('./routes/jobs');
const bidRoutes = require('./routes/bids');
const paymentRoutes = require('./routes/payments');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api', (req, res) => {
  console.log('Health check endpoint hit');
  res.json({ message: 'Blue Collar Services Marketplace API' });
});

// MongoDB Connection
mongoose.connect(`${MONGO_URL}/${DB_NAME}`)
.then(() => {
  console.log('✅ MongoDB connected');
})
.catch(err => console.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 8001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});