const express = require('express');
const Text = require('../models/Text');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Upload new text
router.post("/upload", authMiddleware, async (req, res) => {
  console.log("🟢 Received text upload request");

  const { title, content } = req.body;
  const userId = req.user.id;  // Changed from req.userId to req.user.id

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  try {
    const newText = new Text({ userId, title, content });
    console.log("🟢 Saving new text for userId:", userId);
    await newText.save();
    res.status(201).json({ message: 'Text saved successfully', newText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error saving text' });
  }
});

// Get user's texts
router.get('/mytexts', authMiddleware, async (req, res) => {
  const userId = req.user.id;  // Changed from req.userId to req.user.id

  try {
    const texts = await Text.find({ userId });
    res.json(texts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving texts' });
  }
});

// Get single text
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const text = await Text.findById(req.params.id);
      
    if (!text) {
      return res.status(404).json({ message: 'Text not found' });
    }

    if (text.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this text' });
    }

    res.json(text);
  } catch (error) {
    console.error('Error fetching text:', error);
    res.status(500).json({ message: 'Failed to fetch text' });
  }
});

module.exports = router;