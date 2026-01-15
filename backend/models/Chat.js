const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  title: { type: String, default: 'New Conversation' },
  messages: [{
    role: { type: String, enum: ['user', 'ai'] },
    text: String,
    timestamp: { type: Date, default: Date.now }
  }],
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', ChatSchema);