const { Server } = require("socket.io");

module.exports = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected");
    // Define socket events
    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  return io;
};
