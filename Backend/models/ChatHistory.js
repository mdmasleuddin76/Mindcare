// models/ChatHistory.js
import mongoose from 'mongoose';

const ChatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Link to the User model
    ref: 'User',
    required: true,
    index: true, // Add an index for faster querying by user
  },
  role: {
    type: String,
    enum: ['user', 'model'], // Who sent the message
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ChatHistory = mongoose.model('ChatHistory', ChatHistorySchema);

export default ChatHistory;