// controllers/authController.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import config from "../config/config.js";
import twilio from 'twilio';


// Helper function to set the JWT cookie
const sendTokenResponse = (user, statusCode, res) => {
  // Create JWT Payload
  const payload = {
    user: {
      id: user.id,
    },
  };

  // Sign the token
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: "1h" });

  // const options = {
  //   expires: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
  //   httpOnly: true, // Cookie can't be accessed by client-side scripts
  //   secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
  //   sameSite: "strict", // Or 'lax' depending on your needs
  // };
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    expires: new Date(Date.now() + 60 * 60 * 1000),
  };
  // Send user data (excluding password) along with setting the cookie
  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  res
    .status(statusCode)
    .cookie("token", token, options) // Set cookie
    .json({
      success: true,
      user: userData, // Send user data back
    });
};

// Signup Function - Updated
export const signup = async (req, res) => {
  const { name, email, phone, confirmPassword} = req.body;
  res.status(500).json({ success: false, message: "Server error" });
  console.log("Signup data:", req.body); // Log the request body for debugging
  const password = confirmPassword; // Extract password from request body
  // try {
  //   let user = await User.findOne({ email });
  //   if (user) {
  //     return res.status(400).json({ success: false, message: 'User already exists' });
  //   }

  //   user = new User({ name, email,phone, password });
  //   await user.save();

  //   sendTokenResponse(user, 201, res); // Use helper to set cookie and send response

  // } catch (err) {
  //   console.error('Signup error:', err.message);
  //   res.status(500).json({ success: false, message: 'Server error' });
  // }
};

// Login Function - Updated
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email }).select("+password"); // Include password for comparison
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Credentials" });
    }

    sendTokenResponse(user, 200, res); // Use helper to set cookie and send response
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Verify Token Function - New
export const verifyToken = async (req, res) => {
  const token = req.cookies.token; // Read token from cookie

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, no token" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Find user based on token payload
    const user = await User.findById(decoded.user.id).select("-password"); // Exclude password

    if (!user) {
      // Clear cookie if user not found for some reason
      res.clearCookie("token");
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, user not found" });
    }

    // User is verified
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Token verification error:", err.message);
    // Clear cookie if token is invalid
    res.clearCookie("token");
    res
      .status(401)
      .json({ success: false, message: "Not authorized, token failed" });
  }
};

// Logout Function - New
export const logout = (req, res) => {
  res.cookie("token", "none",{
    httpOnly: true,
    secure: true,
    sameSite: "None",
    expires: new Date(Date.now()),
  });
  res.status(200).json({ success: true, message: "User logged out" });
};
export const twilioauth = async (req, res) => {
 
  console.log(`Incoming message from ${req.body.From}: ${req.body.Body}`);

  // Create a TwiML response object
  const twiml = new twilio.twiml.MessagingResponse();

  try {
    // --- Your User Fetching Logic ---
    // 1. Fetch user data
    const users = await User.find()
                        .sort({ score: -1 }) 
                        .lean();
    console.log(`Found ${users.length} users.`);

    if (!users || users.length === 0) {
      twiml.message("No user data found in the database.");
      res.writeHead(200, { "Content-Type": "text/xml" });
      res.end(twiml.toString());
      return;
    }

    // 2. Prepare user data (score is already fetched)
    //    No need for async map here as the score is directly on the user object
    const usersWithScores = users.map((user) => ({
      userId: user._id,
      name: user.name || "N/A",
      phoneNo: user.phone || "N/A",
      email: user.email || "N/A",
      score: user.score !== undefined ? user.score : 0, // Ensure score has a default
    }));
    console.log("Successfully prepared user data.");

    // 3. Format the data for the SMS response
    let responseMessage = "📊 *User Leaderboard*\n================\n\n";

    usersWithScores.forEach((user, index) => {
      responseMessage += `*${index + 1}.* *Name:* ${user.name}\n`;
      responseMessage += `📧 *Email:* ${user.email || 'N/A'}\n`;
      responseMessage += `📞 *Phone:* ${user.phoneNo || 'N/A'}\n`;
      responseMessage += `📋 *Score:* *${user.score}*\n`;
      responseMessage += `------------------------------\n\n`;
    });
    

    // Trim trailing separator
    responseMessage = responseMessage.trim();

    // Twilio SMS messages have limits (typically 1600 chars).
    // Long messages are automatically split, but it's good to be aware.
    if (responseMessage.length > 1600) {
      console.warn(
        "Response message is very long and might be split by Twilio."
      );
      // Optionally truncate if needed, though Twilio handles splitting.
      // responseMessage = responseMessage.substring(0, 1590) + "... (truncated)";
    }

    // Add the formatted message to the TwiML response
    twiml.message(responseMessage);
  } catch (error) {
    console.error("Error processing webhook:", error);
    // Send a user-friendly error message via SMS
    twiml.message(
      "Sorry, there was an error fetching the user data. Please try again later."
    );
  }

  // Send the TwiML response back to Twilio
  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
};
