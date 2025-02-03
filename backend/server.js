const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require("./routes/auth");  // Correct import for auth routes
const textRoutes = require('./routes/textRoutes'); // Add text routes


dotenv.config();  // Load environment variables from .env file

const app = express(); // Initialize app here
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);  // Register auth routes
app.use('/api/text', textRoutes); // Register the text routes

// Sample API route
app.get('/', (req, res) => {
  res.send('Backend is running successfully!');
});

// Mongoose connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/signedUsers', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.log('Mongoose connection error:', err);
});

// Monitor MongoDB connection status
mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.log('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
