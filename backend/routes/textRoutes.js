const express = require('express');
const Text = require('../models/Text');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Upload new text
router.post("/upload", authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  try {
    // Chunk the content
    const { chunks, totalChunks } = Text.chunkContent(content);
    console.log('Created chunks:', { totalChunks, firstChunk: chunks[0] }); // Add this
    
    const newText = new Text({
      userId,
      title,
      chunks,
      totalChunks
    });
    
    const savedText = await newText.save();
    console.log('Saved text:', savedText); // Add this
    
    res.status(201).json({ 
      message: 'Text saved successfully',
      textId: newText._id,
      totalChunks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error saving text' });
  }
});

// Get user's texts
router.get('/mytexts', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const texts = await Text.find(
      { userId },
      {
        title: 1,
        'chunks.content': { $slice: 1 }, // Only get first chunk for preview
        createdAt: 1
      }
    );
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


router.get('/:id/chunks', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 0, limit = 5 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const text = await Text.findOne(
      { _id: id, userId: req.user.id }
    );
    // console.log('Found text:', text); // Add this to see the full text object

    const paginatedText = await Text.findOne(
      { _id: id, userId: req.user.id },
      {
        title: 1,
        totalChunks: 1,
        chunks: {
          $slice: [pageNum * limitNum, limitNum]
        }
      }
    );

    if (!text) {
      return res.status(404).json({ message: 'Text not found' });
    }

    const response = {
      textId: text._id,
      title: text.title,
      chunks: text.chunks,
      totalChunks: text.totalChunks,
      currentPage: pageNum,
      hasMore: (pageNum + 1) * limitNum < text.totalChunks
    };
    console.log('Sending response:', response); // Add this

    res.json(response);
  } catch (error) {
    console.error('Error fetching text chunks:', error);
    res.status(500).json({ message: 'Failed to fetch text chunks' });
  }
});



router.put('/:id', authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  const textId = req.params.id;
  const userId = req.user.id;

  try {
    const text = await Text.findOne({ _id: textId, userId });
    
    if (!text) {
      return res.status(404).json({ message: 'Text not found' });
    }

    // Chunk the new content
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

// Delete text
router.delete('/:id', authMiddleware, async (req, res) => {
  const textId = req.params.id;
  const userId = req.user.id;

  try {
    // First find the text and check ownership
    const text = await Text.findById(textId);
    
    if (!text) {
      return res.status(404).json({ message: 'Text not found' });
    }

    if (text.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this text' });
    }

    // Delete the text
    await Text.findByIdAndDelete(textId);

    res.json({ message: 'Text deleted successfully' });
  } catch (error) {
    console.error('Error deleting text:', error);
    res.status(500).json({ message: 'Error deleting text' });
  }
});

module.exports = router;