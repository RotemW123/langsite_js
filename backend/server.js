const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Routes
const authRoutes = require("./routes/auth");
const textRoutes = require('./routes/textRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');
const deckRoutes = require('./routes/deckRoutes');

dotenv.config();
const app = express();

// Enhanced security middleware
app.use(helmet()); // Adds various HTTP headers for security
app.use(cookieParser()); // For handling httpOnly cookies

// Configure CORS with specific origin
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request size limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use('/api/text', textRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/decks', deckRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  res.status(status).json({ message });
});

// Mongoose connection with enhanced security options
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/signedUsers', {
  serverSelectionTimeoutMS: 5000
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Mongoose connection error:', err);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});