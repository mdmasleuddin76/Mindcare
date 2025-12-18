// src/pages/ChatPage.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';

// Constants for configuration
const API_BASE_URL = 'https://major-backend-r7lx.onrender.com';
const HISTORY_MESSAGE_LIMIT = 10; // <<< Number of messages (user + model) to include as history (e.g., 5 pairs)
const RESPONSE_WORD_COUNT_INSTRUCTION = "Please provide a comprehensive and detailed response of approximately 500-700 words."; // <<< Instruction for the AI

function ChatPage({ user }) {
  const [consentGiven, setConsentGiven] = useState(false);
  const [messages, setMessages] = useState([]); // Array of { role: 'user' | 'model', content: string, _id?: string, timestamp?: Date }
  const [userMessage, setUserMessage] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingReply, setIsLoadingReply] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // --- Authentication Check (no changes needed here) ---
  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
  }, [navigate]); // Added navigate to dependency array

  // --- Scroll to Bottom (no changes needed here) ---
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // --- Fetch Chat History (no changes needed here) ---
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE_URL}/api/chat/history`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(data.history || []);
          if (data.history && data.history.length > 0) {
            setConsentGiven(true); // Assume consent if history exists
          }
        } else {
          setError('Failed to load chat history.');
          console.error('Failed to fetch history:', await response.text());
          // If history fails, likely unauthenticated or backend issue
          // Consider redirecting based on status code if needed (e.g., 401/403)
           if (response.status === 401 || response.status === 403) {
               navigate('/auth');
           }
        }
      } catch (err) {
        setError('Error loading chat history.');
        console.error('Fetch history error:', err);
         // Also potentially navigate on network errors if appropriate
         // navigate('/auth');
      } finally {
        setIsLoadingHistory(false);
      }
    };

    // Only fetch history if authenticated or after consent logic triggers it
     if (isAuthenticated) { // Or maybe trigger based on consentGiven state? Adjust as needed.
        fetchHistory();
     } else {
        setIsLoadingHistory(false); // Ensure loading stops if not authenticated initially
     }

  }, [isAuthenticated, navigate]); // Depend on isAuthenticated now

  // --- Check Auth Status on Mount ---
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // --- Scroll on Message Update ---
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Consent Handling (no changes needed here) ---
  const handleCheckboxChange = () => {
    setIsChecked((prev) => !prev);
  };

  const handleConsent = () => {
    setConsentGiven(true);
    // Optionally trigger history fetch here if not done based on auth
    // checkAuthStatus(); // Re-check auth / fetch history after consent if needed
  };

  // --- Send Message Handling (MODIFIED) ---
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
    const messageWithInstruction = `${currentUserQuery}\n\n---\nInstruction: ${RESPONSE_WORD_COUNT_INSTRUCTION}`;

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

  // --- Key Press Handling (no changes needed here) ---
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // --- JSX Rendering (minor adjustments for clarity/consistency) ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 via-pink-500 to-purple-700 flex items-center justify-center px-4">
      {/* Consent Screen */}
       {!consentGiven && !isLoadingHistory && ( // Only show consent if not loading and consent not given
         <div className="fixed bottom-0 left-0 w-full bg-white text-center p-6 shadow-lg rounded-t-lg z-50">
            <p className="text-gray-800 mb-4 text-justify max-w-2xl m-auto"> {/* Centered & Max Width */}
             By proceeding with this chat, you agree to share your chat data with us to help improve your experience and ensure better service quality. Rest assured, your data will be securely processed and handled with the utmost confidentiality, following industry-standard privacy practices. We are committed to safeguarding your information and will only use it to enhance the support provided through this platform.
           </p>
           <div className="flex items-center justify-center mb-4">
             <input
               type="checkbox"
               id="agreeCheckbox"
               checked={isChecked}
               onChange={handleCheckboxChange}
               className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
             />
             <label htmlFor="agreeCheckbox" className="ml-2 text-gray-700 cursor-pointer">
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
      )}

      {/* Loading Indicator or Chat Interface */}
       {isLoadingHistory && (
         <div className="text-white text-xl">Loading Chat...</div> // Centered loading message
       )}

       {!isLoadingHistory && consentGiven && ( // Show chat only when history loaded (or failed) and consent given
         <div className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-2xl flex flex-col h-[90vh]">
            {/* Chat Header */}
           <div className="bg-gradient-to-r from-purple-700 to-purple-800 py-4 px-6 border-b border-gray-700 rounded-t-2xl">
             <h2 className="text-lg font-bold text-white">MindCare Chat</h2>
           </div>

            {/* Messages Area */}
           <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {error && <p className="text-center text-red-400 p-2 bg-red-900 bg-opacity-50 rounded">{error}</p>} {/* Improved error display */}
              {messages.map((msg, index) => (
               <div
                 key={msg._id || `msg-${index}`} // Use _id if available, fallback to index
                 className={`flex ${
                   msg.role === 'user' ? 'justify-end' : 'justify-start'
                 }`}
               >
                 <div
                    // Added 'whitespace-pre-wrap' for user messages too
                   className={`p-3 rounded-lg shadow-md max-w-[70%] break-words whitespace-pre-wrap ${
                     msg.role === 'user'
                       ? 'bg-purple-500 text-white'
                       : 'bg-gray-700 text-gray-300'
                   }`}
                 >
                   {msg.role === 'user' ? (
                     msg.content // Render user messages as plain text
                   ) : (
                      // Render AI ('model') messages using ReactMarkdown
                     <div className="prose prose-sm prose-invert max-w-none prose-p:my-1"> {/* Tailwind typography */}
                       <ReactMarkdown>
                          {typeof msg.content === 'string' ? msg.content : String(msg.content)} {/* Ensure string content */}
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
             <div ref={messagesEndRef}></div> {/* For scrolling */}
           </div>

            {/* Input Section */}
           <div className="bg-gray-900 p-4 border-t border-gray-700 flex items-center rounded-b-2xl">
             <textarea
               className="flex-1 bg-gray-700 text-white placeholder-gray-400 border-none rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none max-h-32 overflow-y-auto custom-scrollbar"
               placeholder="Type your message..."
               value={userMessage}
               onChange={(e) => setUserMessage(e.target.value)}
               onKeyPress={handleKeyPress}
               disabled={isLoadingReply || isLoadingHistory} // Disable input while loading
               rows={1} // Start with one row, expands via CSS max-h-32
             />
             <button
               onClick={handleSendMessage}
               className="ml-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
               disabled={isLoadingReply || isLoadingHistory || userMessage.trim() === ''} // Disable button appropriately
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