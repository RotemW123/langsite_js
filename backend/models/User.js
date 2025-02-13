// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  languages: [{
    languageId: String,
    lastAccessed: { type: Date, default: Date.now },
    defaultDeckId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deck' }
  }]
});

// Language display names mapping
const languageNames = {
  russian: 'Russian',
  spanish: 'Spanish',
  french: 'French',
  hebrew: 'Hebrew',
  german: 'German'
};

// Update schema methods to handle languages and create default decks
userSchema.methods.addLanguage = async function(languageId) {
  const Deck = mongoose.model('Deck');
  
  // Check if language already exists
  const existingLang = this.languages.find(lang => lang.languageId === languageId);
  if (existingLang) {
    return this;
  }

  // Get proper language name
  const languageName = languageNames[languageId] || languageId;

  // Create default deck for the language with specific name
  const defaultDeck = new Deck({
    userId: this._id,
    languageId,
    title: `Default ${languageName} Deck`,
    isDefault: true
  });
  await defaultDeck.save();

  // Add language with default deck reference
  this.languages.push({
    languageId,
    defaultDeckId: defaultDeck._id,
    lastAccessed: new Date()
  });

  return await this.save();
};

userSchema.methods.removeLanguage = function(languageId) {
  this.languages = this.languages.filter(lang => lang.languageId !== languageId);
  return this.save();
};

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;