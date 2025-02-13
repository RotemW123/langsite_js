// models/Flashcard.js
const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  languageId: {
    type: String,
    required: true
  },
  word: {
    type: String,
    required: true
  },
  translation: {
    type: String,
    required: true
  },
  context: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastReviewed: {
    type: Date,
    default: null
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  // Optional: Add spaced repetition metadata
  nextReviewDate: {
    type: Date,
    default: Date.now
  },
  confidenceLevel: {
    type: Number,
    default: 0,  // 0-5 scale
    min: 0,
    max: 5
  },
  deckId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deck',
    required: true
  }
});

// Compound index for efficient queries
flashcardSchema.index({ userId: 1, languageId: 1 });


const Flashcard = mongoose.model('Flashcard', flashcardSchema);
module.exports = Flashcard;