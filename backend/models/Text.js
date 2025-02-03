const mongoose = require('mongoose');

const textSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Text = mongoose.model('Text', textSchema);
module.exports = Text;
