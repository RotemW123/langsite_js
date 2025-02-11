// routes/flashcardRoutes.js
const express = require('express');
const router = express.Router();
const Flashcard = require('../models/Flashcard');
const authMiddleware = require('../middleware/authMiddleware');

// Create a new flashcard
router.post('/:languageId', authMiddleware, async (req, res) => {
  try {
    const { word, translation, context } = req.body;
    const { languageId } = req.params;
    const userId = req.user.id;

    // Check if card already exists for this user and language
    const existingCard = await Flashcard.findOne({
      userId,
      languageId,
      word: word.toLowerCase()
    });

    if (existingCard) {
      return res.status(400).json({
        message: 'This word is already in your flashcards'
      });
    }

    const newCard = new Flashcard({
      userId,
      languageId,
      word: word.toLowerCase(),
      translation,
      context
    });

    await newCard.save();
    res.status(201).json(newCard);
  } catch (error) {
    console.error('Error creating flashcard:', error);
    res.status(500).json({ message: 'Error creating flashcard' });
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
router.put('/:cardId/review', authMiddleware, async (req, res) => {
  try {
    const { cardId } = req.params;
    const { confidenceLevel } = req.body;
    const userId = req.user.id;

    const card = await Flashcard.findOne({ _id: cardId, userId });
    if (!card) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    // Update review metadata
    card.lastReviewed = Date.now();
    card.reviewCount += 1;
    card.confidenceLevel = confidenceLevel;

    // Simple spaced repetition algorithm
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