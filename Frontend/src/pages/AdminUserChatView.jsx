// src/pages/AdminUserChatView.jsx
import React, { useState, useEffect, useRef,useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // Import useParams, useNavigate, useLocation
import ReactMarkdown from 'react-markdown';

const AdminUserChatView = () => {
  const { userId } = useParams(); // Get userId from URL parameter
  const navigate = useNavigate(); // To navigate back
  // const location = useLocation(); // To get state passed from AdminPanel
  // const userName = location.state?.userName || 'User'; // Get userName passed via route state

  const [messages, setMessages] = useState([]); // Stores the chat messages for this user
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const API_BASE_URL = 'https://major-backend-r7lx.onrender.com'; // <<< Use your actual API base URL

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
            if(data.user.email != "adminmasle@gmail.com") {
                navigate('/chat'); 
            }
        } else {
            navigate('/chat'); 
        }
      } 
    } catch (error) {
      console.error('Error verifying auth status:', error);
    //   setIsAuthenticated(false);
        navigate('/chat'); // Redirect to Auth page if error occurs
    } 
  }, []);

  // Check auth status when the app loads
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100); // Small delay
  };

  // Fetch chat history for the specific user
  useEffect(() => {
    const fetchHistory = async () => {
      // setIsLoadingHistory(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE_URL}/api/chat/history/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // <<< IMPORTANT
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(data.history || []);
          setIsLoading(false);
        } else {
          setError('Failed to load chat history.');
          console.error('Failed to fetch history:', await response.text());
        }
      } catch (err) {
        setError('Error loading chat history.');
        console.error('Fetch history error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [userId]); 

  useEffect(() => {
    if (!isLoading) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-100">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <h1 className="text-2xl font-bold text-gray-800">
          Chat History for <span className="text-sm font-normal text-gray-500">(ID: {userId})</span>
        </h1>
        <button
          onClick={() => navigate('/admin')} // Navigate back to the main admin panel
          className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded text-sm transition duration-150 ease-in-out"
        >
          &larr; Back to Admin Panel
        </button>
      </div>

      {/* Loading State */}
      {isLoading && <p className="text-center text-gray-500 py-10">Loading chat history...</p>}

      {/* Error State */}
      {error && (
         <div className="text-center py-4 px-4 my-5 bg-red-100 text-red-700 border border-red-300 rounded-md">
             <p>Error: {error}</p>
         </div>
      )}

      {/* Chat Display Area (Read-Only) */}
      {!isLoading && !error && (
        <div className="w-full bg-gray-800 rounded-lg shadow-lg flex flex-col h-[calc(80vh)]"> {/* Adjust height as needed */}
          {/* Optional Chat Header inside the box */}
          {/* <div className="bg-gradient-to-r from-purple-700 to-purple-800 py-3 px-5 border-b border-gray-700 rounded-t-lg">
             <h2 className="text-md font-semibold text-white">Conversation</h2>
           </div> */}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.length === 0 ? (
                <p className="text-center text-gray-400 py-10">No chat messages found for this user.</p>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={msg._id || index} // Use database _id if available
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`p-3 rounded-lg shadow-md max-w-[75%] break-words whitespace-pre-wrap ${ // whitespace-pre-wrap preserves line breaks
                      msg.role === 'user'
                        ? 'bg-purple-500 text-white' // User message style
                        : 'bg-gray-700 text-gray-300' // Model message style
                    }`}
                  >
                    {/* Render user messages as plain text, model messages with Markdown */}
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      // Apply prose classes for Tailwind markdown styling if needed
                      <div className="prose prose-sm prose-invert max-w-none prose-p:my-1">
                         <ReactMarkdown>
                           {/* Ensure content is a string */}
                           {String(msg.content || '')}
                         </ReactMarkdown>
                      </div>
                    )}
                    {/* Optional: Display timestamp */}
                    {msg.timestamp && (
                        <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-purple-200' : 'text-gray-400'} text-right`}>
                            {new Date(msg.timestamp).toLocaleString()}
                        </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef}></div>
          </div>

          {/* No Input Section - This area is intentionally left blank for read-only view */}
          {/* <div className="bg-gray-900 p-3 border-t border-gray-700 rounded-b-lg text-center">
             <p className="text-sm text-gray-500">Read-only view</p>
           </div> */}
        </div>
      )}
    </div>
  );
};

export default AdminUserChatView;

// Helper function placeholder (replace with your actual auth token logic)
// const getAuthToken = () => {
//   return localStorage.getItem('adminAuthToken'); // Example
// };

// Add this CSS to your global stylesheet (e.g., index.css) for scrollbar styling if you used `custom-scrollbar`
/*
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #2d3748; // gray-800
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #4a5568; // gray-600
  border-radius: 10px;
  border: 2px solid #2d3748; // gray-800
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #718096; // gray-500
}
*/