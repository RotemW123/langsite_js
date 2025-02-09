const mongoose = require('mongoose');

const textChunkSchema = new mongoose.Schema({
  content: { type: String, required: true },
  order: { type: Number, required: true }
});

const textSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  languageId: { type: String, required: true }, // Add language field
  title: { type: String, required: true },
  chunks: [textChunkSchema],
  totalChunks: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Add compound index for efficient queries
textSchema.index({ userId: 1, languageId: 1, 'chunks.order': 1 });

const CHUNK_SIZE = 1000; // Characters per chunk

textSchema.statics.chunkContent = function(content) {
  const chunks = [];
  let order = 0;
  
  for (let i = 0; i < content.length; i += CHUNK_SIZE) {
    chunks.push({
      content: content.slice(i, i + CHUNK_SIZE),
      order: order++
    });
  }
  
  return {
    chunks,
    totalChunks: chunks.length
  };
};

const Text = mongoose.model('Text', textSchema);
module.exports = Text;