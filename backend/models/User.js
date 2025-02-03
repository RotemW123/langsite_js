const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
});

// Explicitly set the collection name if needed
const User = mongoose.model('User', userSchema, 'users');  // Ensure it points to the 'users' collection

module.exports = User;
