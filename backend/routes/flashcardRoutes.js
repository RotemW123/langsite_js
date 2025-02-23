const express = require('express');
const router = express.Router();
const Flashcard = require('../models/Flashcard');
const { authMiddleware } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Deck = require('../models/Deck');
const { body, validationResult } = require('express-validator');

// Validation middleware
const flashcardValidation = [
  body('word').trim().notEmpty().withMessage('Word is required'),
  body('translation').trim().notEmpty().withMessage('Translation is required')
];

// Create flashcard
router.post('/:languageId', 
  authMiddleware,
  flashcardValidation,
  async (req, res) => {
    try {
      // Check validation results
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { word, translation, deckId } = req.body;
      const { languageId } = req.params;
      const userId = req.user.id;

      // If no deckId provided, get the default deck
      let targetDeckId = deckId;
      if (!targetDeckId) {
        const user = await User.findById(userId);
        const language = user.languages.find(lang => lang.languageId === languageId);
        if (!language || !language.defaultDeckId) {
          const newUser = await User.findById(userId);
          await newUser.addLanguage(languageId);
          const updatedLanguage = newUser.languages.find(lang => lang.languageId === languageId);
          targetDeckId = updatedLanguage.defaultDeckId;
        } else {
          targetDeckId = language.defaultDeckId;
        }
      }

      // Verify deck exists and belongs to user
      const deck = await Deck.findOne({ _id: targetDeckId, userId });
      if (!deck) {
        return res.status(404).json({ message: 'Deck not found' });
      }

      // Check if card already exists in this deck
      const existingCard = await Flashcard.findOne({
        userId,
        deckId: targetDeckId,
        word: word.toLowerCase()
      });

      if (existingCard) {
        return res.status(400).json({
          message: 'This word is already in your deck'
        });
      }

      const newCard = new Flashcard({
        userId,
        languageId,
        deckId: targetDeckId,
        word: word.toLowerCase(),
        translation
      });

      await newCard.save();
      res.status(201).json(newCard);
    } catch (error) {
      console.error('Error creating flashcard:', error);
      res.status(500).json({ message: 'Error creating flashcard', error: error.message });
    }
});

// Get all flashcards for a language
router.get('/:languageId', authMiddleware, async (req, res) => {
  try {
    const { languageId } = req.params;
    const userId = req.user.id;

    const cards = await Flashcard.find({ userId, languageId })
      .sort({ nextReviewDate: 1 });
    
    res.json(cards);
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    res.status(500).json({ message: 'Error fetching flashcards' });
  }
});

// Update flashcard review status
router.put('/:cardId/review', 
  authMiddleware,
  body('confidenceLevel').isInt({ min: 0, max: 5 }).withMessage('Confidence level must be between 0 and 5'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { cardId } = req.params;
      const { confidenceLevel } = req.body;
      const userId = req.user.id;

      const card = await Flashcard.findOne({ _id: cardId, userId });
      if (!card) {
        return res.status(404).json({ message: 'Flashcard not found' });
      }

      card.lastReviewed = Date.now();
      card.reviewCount += 1;
      card.confidenceLevel = confidenceLevel;

      const daysToAdd = Math.pow(2, confidenceLevel);
      card.nextReviewDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);

      await card.save();
      res.json(card);
    } catch (error) {
      console.error('Error updating flashcard:', error);
      res.status(500).json({ message: 'Error updating flashcard' });
    }
});

// Delete a flashcard
router.delete('/:cardId', authMiddleware, async (req, res) => {
  try {
    const { cardId } = req.params;
    const userId = req.user.id;

    const result = await Flashcard.findOneAndDelete({ _id: cardId, userId });
    if (!result) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    res.json({ message: 'Flashcard deleted successfully' });
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    res.status(500).json({ message: 'Error deleting flashcard' });
  }
});

module.exports = router;