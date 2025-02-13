// models/Deck.js
const mongoose = require('mongoose');

const deckSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  languageId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
deckSchema.index({ userId: 1, languageId: 1 });

const Deck = mongoose.model('Deck', deckSchema);
module.exports = Deck;


