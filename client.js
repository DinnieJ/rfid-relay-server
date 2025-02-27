const { io } = require("socket.io-client");

// Connect to the server
const socket = io("ws://localhost:3000", {
    transports: ["websocket"], // Force WebSocket connection
    reconnection: true, // Enable auto-reconnect
    reconnectionAttempts: 5, // Try 5 times before failing
    reconnectionDelay: 3000, // Wait 3 seconds before retrying
});

socket.on("connect", () => {
    console.log(`Connected to server with ID: ${socket.id}`);

    // Send a message to the server
    socket.emit("message", "Hello from the client!");
});

// Listen for messages from the server
socket.on("message", (data) => {
    console.log(`Received from server: ${data}`);
});

// Handle connection errors
socket.on("connect_error", (error) => {
    console.error(`Connection error: ${error}`);
});

// Handle disconnection
socket.on("disconnect", (reason) => {
    console.log(`Disconnected: ${reason}`);
});
