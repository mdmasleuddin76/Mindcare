// routes/chat.js
import express from 'express';
// Import getChatHistory along with handleChat
import { handleChat, getChatHistory ,getChatHistoryAdmin,getUsersWithScores} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';



const router = express.Router();

// @route   POST api/chat
// @desc    Send message to chat AI and save messages
// @access  Private (Requires JWT)
router.post('/', protect, handleChat);

// @route   GET api/chat/history
// @desc    Get chat history for the logged-in user
// @access  Private (Requires JWT)
router.get('/history', protect, getChatHistory); // Add this new route
router.get('/history/:id', protect, getChatHistoryAdmin); // Add this new route
router.get('/users/scores', protect, getUsersWithScores); // Add this new route

export default router;