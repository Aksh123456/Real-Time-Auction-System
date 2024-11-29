const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const socketConfig = require('./config/socket');
const socketManager = require('./socketManager');

const PORT = 3000;

// Database connection
connectDB();

// Create server and setup socket.io
const server = http.createServer(app);
const io = socketConfig(server);

// Initialize Socket.IO
socketManager(io);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
