const { randomUUID, randomInt } = require("crypto");
const { createServer } = require("http");
const { argv } = require("process");
const { Server } = require("socket.io");

const httpServer = createServer();

let scanners = {}

let devices = {}

let sessionData = {}
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ["websocket"],
    pingInterval: 25000,
    pingTimeout: 5000
});
console.log("Listening at port", argv[2])

function responseSuccess(socket, msg) {
    socket.emit("response", {"success": true, msg: msg})
}

function responseErr(socket, msg) {
    socket.emit("response", {"success": false, msg: msg})
}

io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);


    // Handle errors properly
    socket.on("error", (error) => {
        console.error(`Socket error: ${error.message}`);
    });

    socket.on("scanner:connect", (data) => {
        scanners[socket.id] = { scannerId: data }
        console.log(scanners)
        socket.emit("response", "Register scanner successful")
    })

    socket.on("device:connect", (data) => {
        devices[socket.id] = { deviceId: data }
        console.log(devices)
        responseSuccess(socket, "Connect device successfully")
    })
    // Handle disconnection
    socket.on("disconnect", (reason) => {
        console.log(`Client disconnected: ${socket.id}, Reason: ${reason}`);
    });

    socket.on("device:createSession", () => {
        console.log("CREATE NEW SESSION")
        if (!devices[socket.id]) {
            responseErr(socket, "Can't create new session from non client device")
            return
        }
        let roomId = randomUUID()
        let otp = randomInt(100000000).toString().padStart(8, "0")
        sessionData[otp] = {
            deviceId: socket.id, 
            scannerId: null,
            roomId: roomId
        }
        socket.join(roomId)
        console.log(otp)
        responseSuccess(socket, `Create room session successful: `,)
        socket.emit("clientDevice:receiveOTP", otp)
    })

    socket.on("device:joinRoom", (roomId) => {
        socket.join(roomId)
    })

    socket.on("scanner:joinSession", (otp) => {
        if (!scanners[socket.id]) {
            responseErr(socket, "Can't join new session from client device")
            return
        }

        if (!sessionData[otp]) {
            responseErr(socket, "No session found")
            return
        }
        sessionData[otp].scannerId = socket.id
        socket.join(sessionData[otp].roomId)
        socket.emit("clientScanner:sessionJoined", sessionData[otp].roomId)
        socket.to(sessionData[otp].deviceId).emit("clientDevice:sessionJoined", sessionData[otp].roomId)
    })

    socket.on("scanner:sendTag", (tagData, roomId) => {
        socket.broadcast.to(roomId).emit("clientDevice:receiveTag", tagData)
    })

});


// Start the server
httpServer.listen(process.env.PORT || 3000, "0.0.0.0")
// io.listen(httpServer)