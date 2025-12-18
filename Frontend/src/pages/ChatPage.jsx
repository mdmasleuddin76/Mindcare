// src/pages/ChatPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown'; // <<< Import ReactMarkdown
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import { useCallback } from 'react'; // Import useCallback for memoizing functions
const HISTORY_MESSAGE_LIMIT = 20; // <<< Number of messages (user + model) to include as history (e.g., 5 pairs)


// Receive user prop if needed, though authentication is handled by cookie/middleware
function ChatPage({ user }) {
  const [consentGiven, setConsentGiven] = useState(false);
  // Update message state structure to match backend/DB model
  const [messages, setMessages] = useState([]); // Array of { role: 'user' | 'model', content: string, _id?: string, timestamp?: Date }
  const [userMessage, setUserMessage] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingReply, setIsLoadingReply] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // const navigate = useNavigate();
const API_BASE_URL = 'https://major-backend-r7lx.onrender.com'; // Or import from a config file

  const navigate = useNavigate(); // Initialize navigate

  // Function to check authentication status
  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Essential for sending/receiving cookies
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          navigate('/auth'); 
        }
      } else {
        setIsAuthenticated(false);
        navigate('/auth'); 

      }
    } catch (error) {
      console.error('Error verifying auth status:', error);
      setIsAuthenticated(false);
      navigate('/auth'); 
    } 
  }, []);

  const scrollToBottom = () => {
    // Add a small delay to ensure DOM is updated before scrolling
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Fetch chat history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE_URL}/api/chat/history`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // <<< IMPORTANT
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(data.history || []);
          if(data.history && data.history.length > 0) {
            setConsentGiven(true); // Set last message as userMessage
          }
        } else {
          setError('Failed to load chat history.');
          console.error('Failed to fetch history:', await response.text());
        }
      } catch (err) {
        setError('Error loading chat history.');
        console.error('Fetch history error:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

      fetchHistory();
  }, []); // Fetch when consent is given

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Trigger scroll on messages update

  const handleCheckboxChange = () => {
    setIsChecked((prev) => !prev);
  };

  const handleConsent = () => {
    setConsentGiven(true);
  };

  const handleSendMessage = async () => {
    if (userMessage.trim() === '' || isLoadingReply || !consentGiven) return;

    const currentUserQuery = userMessage; // Store the original user query for UI
    const newUserMessage = { role: 'user', content: currentUserQuery }; // Use original query for UI

    // Optimistically update UI
    setMessages((prev) => [...prev, newUserMessage]);
    setUserMessage(''); // Clear input field
    setIsLoadingReply(true);
    setError('');

    // --- Prepare History for API ---
    // 1. Slice the most recent messages (up to the limit)
    //    `slice(-N)` gets the last N elements. Handles arrays smaller than N gracefully.
    const recentHistory = messages.slice(-HISTORY_MESSAGE_LIMIT);

    // 2. Format the history into the structure the API expects (e.g., Gemini format)
    //    Only include history if there are actual messages in `recentHistory`.
    const formattedHistoryForAPI = recentHistory.length > 0
        ? recentHistory.map(msg => ({
            role: msg.role,
            // Ensure content is always a string before accessing it for parts
            parts: [{ text: typeof msg.content === 'string' ? msg.content : String(msg.content) }]
          }))
        : []; // Send empty array if no history

    // --- Prepare Message with Instruction ---
    // Append the word count instruction to the user's *current* message.
    // Using a clear separator might help the AI distinguish the query from the instruction.
    const messageWithInstruction = `${currentUserQuery}`;

    console.log("Sending to API:", { message: messageWithInstruction, history: formattedHistoryForAPI }); // Debug log

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // --- Send current message (with instruction) and formatted history ---
        body: JSON.stringify({
          message: messageWithInstruction, // Send the message with the instruction appended
          history: formattedHistoryForAPI  // Send the formatted recent history
        }),
        credentials: 'include', // Important for cookies/session
      });

      if (response.ok) {
        const data = await response.json();
        const aiReply = { role: 'model', content: data.reply || "No reply content received." }; // Ensure content exists
        // Update state by adding the AI reply
        // We find the optimistic message and replace the list up to that point + AI reply?
        // Simpler: Assuming order is maintained, just add the AI reply to the end.
         // Filter out the *exact* optimistic message added earlier before adding the final AI reply
        setMessages((prev) => [
          ...prev.filter(msg => !(msg.role === 'user' && msg.content === currentUserQuery && !msg._id)), // Remove optimistic message
          newUserMessage, // Add the confirmed user message back (optional, if backend doesn't save it immediately)
          aiReply         // Add the AI reply
         ]);
        // If backend *does* save user message, simplify to:
        // setMessages((prev) => [...prev, aiReply]);


      } else {
        // Revert optimistic update on error
        setMessages((prev) => prev.filter(msg => !(msg.role === 'user' && msg.content === currentUserQuery && !msg._id)));
        const errorData = await response.json().catch(() => ({ message: 'Failed to get reply and parse error response.' })); // Catch JSON parse errors
        setError(errorData.message || `Request failed with status: ${response.status}`);
        console.error('AI reply error:', response.status, errorData);
      }
    } catch (err) {
      // Revert optimistic update on network or other errors
      setMessages((prev) => prev.filter(msg => !(msg.role === 'user' && msg.content === currentUserQuery && !msg._id)));
      setError('An error occurred while sending your message.');
      console.error('Send message error:', err);
    } finally {
      setIsLoadingReply(false);
      scrollToBottom(); // Scroll after potential state updates
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 via-pink-500 to-purple-700 flex items-center justify-center px-4">
      {!consentGiven ? (
        <div className="fixed bottom-0 w-full bg-white text-center p-6 shadow-lg rounded-t-lg">
          {/* Consent UI remains the same */}
          <p className="text-gray-800 mb-4 text-justify w-[50%] m-auto">
          By proceeding with this chat, you agree to share your chat data with us to help improve your experience and ensure better service quality. Rest assured, your data will be securely processed and handled with the utmost confidentiality, following industry-standard privacy practices. We are committed to safeguarding your information and will only use it to enhance the support provided through this platform.
          </p>
          <div className="flex items-center justify-center mb-4">
            <input
              type="checkbox"
              id="agreeCheckbox"
              checked={isChecked}
              onChange={handleCheckboxChange}
              className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
            />
            <label htmlFor="agreeCheckbox" className="ml-2 text-gray-700">
              I agree
            </label>
          </div>
          <button
            onClick={handleConsent}
            disabled={!isChecked}
            className={`${
              isChecked
                ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer'
                : 'bg-gray-400 cursor-not-allowed'
            } text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105`}
          >
            Agree and Start Chatting
          </button>
        </div>
      ) : (
        /* Chat Section */
        <div className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-2xl flex flex-col h-[90vh]">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-purple-700 to-purple-800 py-4 px-6 border-b border-gray-700 rounded-t-2xl">
            <h2 className="text-lg font-bold text-white">MindCare Chat</h2>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {isLoadingHistory && <p className="text-center text-gray-400">Loading history...</p>}
            {error && <p className="text-center text-red-400">{error}</p>}
            {!isLoadingHistory && messages.map((msg, index) => (
              <div
                key={msg._id || index}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  // Add 'whitespace-pre-wrap' to handle basic line breaks even for user messages
                  className={`p-3 rounded-lg shadow-md max-w-[70%] break-words whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {/* <<< Conditionally render based on role >>> */}
                  {msg.role === 'user' ? (
                    msg.content // Render user messages as plain text (with line breaks preserved by CSS)
                  ) : (
                    // Render AI ('model') messages using ReactMarkdown
                    // Apply prose classes for Tailwind typography styling
                    <div className="prose prose-sm prose-invert max-w-none prose-p:my-1">
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>
                 </div>
                  )}
                </div>
              </div>
            ))}
            {isLoadingReply && (
              <div className="flex justify-start">
                <div className="p-3 rounded-lg shadow-md max-w-[70%] break-words bg-gray-700 text-gray-400 italic">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef}></div>
          </div>

          {/* Input Section */}
          <div className="bg-gray-900 p-4 border-t border-gray-700 flex items-center rounded-b-2xl">
             {/* Input section remains the same */}
             <textarea
              className="flex-1 bg-gray-700 text-white placeholder-gray-400 border-none rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none max-h-32 overflow-y-auto custom-scrollbar"
              placeholder="Type your message..."
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoadingReply || isLoadingHistory} // Disable input while loading
            />
            <button
              onClick={handleSendMessage}
              className="ml-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoadingReply || isLoadingHistory || userMessage.trim() === ''} // Disable button
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;