const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  languages: [{
    languageId: String,
    lastAccessed: { type: Date, default: Date.now }
  }]
});

// Update schema methods to handle languages
userSchema.methods.addLanguage = function(languageId) {
  if (!this.languages.some(lang => lang.languageId === languageId)) {
    this.languages.push({ languageId });
  }
  return this.save();
};

userSchema.methods.removeLanguage = function(languageId) {
  this.languages = this.languages.filter(lang => lang.languageId !== languageId);
  return this.save();
};

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;