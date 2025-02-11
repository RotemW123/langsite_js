const express = require('express');
const Text = require('../models/Text');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Upload new text with language
router.post("/:languageId/upload", authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  const { languageId } = req.params;
  const userId = req.user.id;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  try {
    const { chunks, totalChunks } = Text.chunkContent(content);
    
    const newText = new Text({
      userId,
      languageId,
      title,
      chunks,
      totalChunks
    });
    
    const savedText = await newText.save();
    
    res.status(201).json({ 
      message: 'Text saved successfully',
      textId: savedText._id,
      totalChunks
    });
  } catch (error) {
    console.error('Error saving text:', error);
    res.status(500).json({ message: 'Error saving text' });
  }
});

// Get user's texts for specific language
router.get('/:languageId/mytexts', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { languageId } = req.params;

  try {
    const texts = await Text.find(
      { userId, languageId },
      {
        title: 1,
        'chunks.content': { $slice: 1 }, // Only get first chunk for preview
        createdAt: 1
      }
    );
    res.json(texts);
  } catch (error) {
    console.error('Error retrieving texts:', error);
    res.status(500).json({ message: 'Error retrieving texts' });
  }
});

// Get single text (with language verification)
router.get('/:languageId/:textId', authMiddleware, async (req, res) => {
  try {
    const { languageId, textId } = req.params;
    const text = await Text.findOne({
      _id: textId,
      languageId,
      userId: req.user.id
    });
      
    if (!text) {
      return res.status(404).json({ message: 'Text not found' });
    }

    res.json(text);
  } catch (error) {
    console.error('Error fetching text:', error);
    res.status(500).json({ message: 'Failed to fetch text' });
  }
});

// Get text chunks with language
router.get('/:languageId/:textId/chunks', authMiddleware, async (req, res) => {
  try {
    const { languageId, textId } = req.params;
    const { page = 0 } = req.query;
    const pageNum = parseInt(page);

    const text = await Text.findOne({
      _id: textId,
      languageId,
      userId: req.user.id
    });

    if (!text) {
      return res.status(404).json({ message: 'Text not found' });
    }

    // Get just one chunk
    const chunk = text.chunks[pageNum];
    if (!chunk) {
      return res.status(404).json({ message: 'Chunk not found' });
    }

    const response = {
      textId: text._id,
      languageId,
      title: text.title,
      chunks: [chunk],
      totalChunks: text.totalChunks,
      currentPage: pageNum,
      hasMore: pageNum + 1 < text.totalChunks
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching text chunks:', error);
    res.status(500).json({ message: 'Failed to fetch text chunks' });
  }
});

// Update text with language
router.put('/:languageId/:textId', authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  const { languageId, textId } = req.params;
  const userId = req.user.id;

  try {
    const text = await Text.findOne({ 
      _id: textId, 
      languageId, 
      userId 
    });
    
    if (!text) {
      return res.status(404).json({ message: 'Text not found' });
    }

    const { chunks, totalChunks } = Text.chunkContent(content);
    
    const updatedText = await Text.findByIdAndUpdate(
      textId,
      { 
        title,
        chunks,
        totalChunks
      },
      { new: true }
    );

    res.json({
      textId: updatedText._id,
      totalChunks: updatedText.totalChunks
    });
  } catch (error) {
    console.error('Error updating text:', error);
    res.status(500).json({ message: 'Error updating text' });
  }
});

// Delete text with language verification
router.delete('/:languageId/:textId', authMiddleware, async (req, res) => {
  const { languageId, textId } = req.params;
  const userId = req.user.id;

  try {
    const text = await Text.findOne({ 
      _id: textId, 
      languageId, 
      userId 
    });
    
    if (!text) {
      return res.status(404).json({ message: 'Text not found' });
    }

    await Text.findByIdAndDelete(textId);
    res.json({ message: 'Text deleted successfully' });
  } catch (error) {
    console.error('Error deleting text:', error);
    res.status(500).json({ message: 'Error deleting text' });
  }
});

module.exports = router;