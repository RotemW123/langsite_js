const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require("./routes/auth");
const textRoutes = require('./routes/textRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));

// Routes
app.use("/api/auth", authRoutes);
app.use('/api/text', textRoutes); // The textRoutes now handle language-specific endpoints

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