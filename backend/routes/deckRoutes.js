// routes/deckRoutes.js
const express = require('express');
const router = express.Router();
const Deck = require('../models/Deck');
const User = require('../models/User');
const Flashcard = require('../models/Flashcard');
const authMiddleware = require('../middleware/authMiddleware');

// Create a new deck
router.post('/:languageId', authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;
    const { languageId } = req.params;
    const userId = req.user.id;

    // Ensure user has this language and default deck
    const user = await User.findById(userId);
    const language = user.languages.find(lang => lang.languageId === languageId);
    if (!language) {
      await user.addLanguage(languageId);
    }

    const newDeck = new Deck({
      userId,
      languageId,
      title
    });

    await newDeck.save();
    res.status(201).json(newDeck);
  } catch (error) {
    console.error('Error creating deck:', error);
    res.status(500).json({ message: 'Error creating deck' });
  }
});

// Get all decks for a language
router.get('/:languageId', authMiddleware, async (req, res) => {
  try {
    const { languageId } = req.params;
    const userId = req.user.id;

    // Ensure user has this language and default deck
    const user = await User.findById(userId);
    const language = user.languages.find(lang => lang.languageId === languageId);
    if (!language) {
      await user.addLanguage(languageId);
    }

    const decks = await Deck.find({ userId, languageId })
      .sort({ isDefault: -1, createdAt: -1 });
    
    // Get card count for each deck
    const decksWithCount = await Promise.all(decks.map(async (deck) => {
      const count = await Flashcard.countDocuments({ deckId: deck._id });
      return {
        ...deck.toObject(),
        cardCount: count
      };
    }));
    
    res.json(decksWithCount);
  } catch (error) {
    console.error('Error fetching decks:', error);
    res.status(500).json({ message: 'Error fetching decks' });
  }
});

// Get specific deck with its cards
router.get('/:languageId/:deckId', authMiddleware, async (req, res) => {
  try {
    const { languageId, deckId } = req.params;
    const userId = req.user.id;

    const deck = await Deck.findOne({ _id: deckId, userId, languageId });
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    const cards = await Flashcard.find({ deckId });
    
    res.json({
      deck,
      cards
    });
  } catch (error) {
    console.error('Error fetching deck:', error);
    res.status(500).json({ message: 'Error fetching deck' });
  }
});

// Delete deck and its cards (prevent deleting default deck)
router.delete('/:deckId', authMiddleware, async (req, res) => {
  try {
    const { deckId } = req.params;
    const userId = req.user.id;

    const deck = await Deck.findOne({ _id: deckId, userId });
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    if (deck.isDefault) {
      return res.status(400).json({ message: 'Cannot delete default deck' });
    }

    // Delete all cards in the deck
    await Flashcard.deleteMany({ deckId });
    // Delete the deck
    await Deck.findByIdAndDelete(deckId);

    res.json({ message: 'Deck and cards deleted successfully' });
  } catch (error) {
    console.error('Error deleting deck:', error);
    res.status(500).json({ message: 'Error deleting deck' });
  }
});

module.exports = router;