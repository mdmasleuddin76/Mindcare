// src/pages/AdminPanel.js
import React, { useState, useEffect ,useCallback} from 'react';
import { useNavigate } from 'react-router-dom'; // If needed for view action

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
const navigate = useNavigate(); // Use if 'View' navigates to a new page
const API_BASE_URL = 'https://major-backend-r7lx.onrender.com'; // Or import from a config file

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

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // --- !!! IMPORTANT !!! ---
        // Replace with your actual API endpoint and authentication method
        // You'll likely need to send an authorization token (e.g., JWT)
        // in the headers, which your backend will verify to ensure
        // the request is from the logged-in admin.
        const response = await fetch(`${API_BASE_URL}/api/chat/users/scores`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Example: Include auth token if needed
            // 'Authorization': `Bearer ${getAuthToken()}` // Replace getAuthToken()
          },
          credentials: 'include'
        });

        if (!response.ok) {
          // Handle HTTP errors (e.g., 401 Unauthorized, 403 Forbidden, 500 Server Error)
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // // Assuming the backend returns an array of users like:
        // // [ { userId: '1', name: 'John Doe', phoneNo: '123-456-7890', score: 85 }, ... ]
        // const fakeData = [
        //     { userId: '1', name: 'Alice Johnson', phoneNo: '9876543210', score: 72 },
        //     { userId: '2', name: 'Bob Smith', phoneNo: '8765432109', score: 88 },
        //     { userId: '3', name: 'Charlie Brown', phoneNo: '7654321098', score: 55 },
        //     { userId: '4', name: 'Diana Prince', phoneNo: '6543210987', score: 91 },
        //     { userId: '5', name: 'Ethan Hunt', phoneNo: '5432109876', score: 63 },
        //   ];
        setUsers(data);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError(err.message || 'Failed to fetch user data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleViewUser = (userId) => { 
    console.log("Navigating to view chat for user ID:", userId);
    // Use navigate to go to the new route, passing userId
    navigate(`/admin/user/${userId}`); 
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-50"> {/* Match background if needed */}
      <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">Admin Panel - User Scores</h1>

      {isLoading && (
        <div className="text-center py-4">
          <p className="text-blue-600">Loading user data...</p>
          {/* Optional: Add a spinner */}
        </div>
      )}

      {error && (
        <div className="text-center py-4 px-4 bg-red-100 text-red-700 border border-red-300 rounded-md">
          <p>Error: {error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="w-full text-left border-collapse">
            <thead className="bg-blue-100 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700 uppercase tracking-wider">Phone Number</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700 uppercase tracking-wider">Mental Condition Score</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.userId || user.id} className="hover:bg-gray-50"> {/* Use a unique key */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.phoneNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{user.score}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewUser(user.userId || user.id)} // Pass unique user identifier
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded text-xs transition duration-150 ease-in-out"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;