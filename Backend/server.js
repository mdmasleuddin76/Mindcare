// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pm2 from 'pm2'; // Import the pm2 API
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import config from './config/config.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// --- Request Counter & Limit ---
let requestCounter = 0;
const REQUEST_LIMIT = 450; // Set your desired limit (using 5 from your log example)
let isShuttingDown = false;
let server;

// --- Shutdown Function ---
// const shutDownServer = () => {
//     if (isShuttingDown) {
//         console.log('Shutdown already in progress.');
//         return;
//     }
//     isShuttingDown = true;
//     console.log(`Request limit (${REQUEST_LIMIT}) reached. Attempting graceful shutdown and PM2 stop...`);

//     // 1. Stop accepting new HTTP connections
//     server.close((err) => {
//         if (err) {
//             console.error('Error closing HTTP server:', err);
//             // Even if server closing fails, still try to stop via PM2
//         } else {
//             console.log('HTTP server closed gracefully.');
//         }

//         // 2. Check if running under PM2 and tell PM2 to stop the app permanently
//         const pm2ProcessId = process.env.pm_id;

//         if (pm2ProcessId !== undefined) {
//             console.log(`Running under PM2 (pm_id: ${pm2ProcessId}). Instructing PM2 to stop...`);
//             pm2.connect((connectErr) => {
//                 if (connectErr) {
//                     console.error('Error connecting to PM2:', connectErr);
//                     // Fallback: Exit the process anyway, PM2 might still restart it
//                     process.exit(1);
//                     return;
//                 }

//                 pm2.stop(pm2ProcessId, (stopErr) => {
//                     pm2.disconnect(); // Disconnect from PM2 daemon
//                     if (stopErr) {
//                         console.error(`Error stopping app via PM2 (pm_id: ${pm2ProcessId}):`, stopErr);
//                         // Fallback: Exit the process
//                         process.exit(1);
//                     } else {
//                         console.log(`Successfully told PM2 to stop app (pm_id: ${pm2ProcessId}). Process should exit shortly.`);
//                         // No need to call process.exit() here - PM2 stop will terminate it,
//                         // and crucially, it won't mark it for auto-restart because *we* issued the stop command.
//                     }
//                 });
//             });
//         } else {
//             // Not running under PM2, just exit normally
//             console.log('Not running under PM2. Exiting process.');
//             process.exit(0);
//         }
//     });

//     // Optional: Add a final timeout in case server.close() or PM2 interaction hangs indefinitely
//     setTimeout(() => {
//         console.error('Shutdown process timed out. Forcing exit.');
//         process.exit(1);
//     }, 15000); // 15 seconds timeout
// };


// --- Middleware ---

// CORS configuration
// const corsOptions = {
//     origin: '*', // Make sure this matches exactly
//     credentials: true,
//     // Also consider adding methods and headers explicitly for robustness
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//     allowedHeaders: 'Content-Type,Authorization', // Add any other custom headers your frontend sends
// };
const corsOptions = {
  origin: 'https://www.maslecicdtest.me', // ✅ exact frontend domain
  credentials: true, // ✅ allow cookies to be sent
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: false }));
// Cookie Parser Middleware
app.use(cookieParser());

// Body Parser Middleware
app.use(express.json());

// --- Request Counting Middleware ---
// app.use((req, res, next) => {
//     if (isShuttingDown) {
//         res.status(503).send({ message: 'Server is shutting down.' });
//         return;
//     }

//     requestCounter++;
//     console.log(`Request Count: ${requestCounter}/${REQUEST_LIMIT}`);

//     if (requestCounter >= REQUEST_LIMIT) {
//         res.status(503).send({ message: 'Request limit reached. Server is shutting down.' });
//         setImmediate(shutDownServer); // Ensure response is sent before starting shutdown
//     } else {
//         next();
//     }
// });


// --- API Routes ---
app.get('/', (req, res) => res.send('MindCare API Running'));
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);


// --- Start Server ---
const PORT = config.port || process.env.PORT || 5000;
server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
