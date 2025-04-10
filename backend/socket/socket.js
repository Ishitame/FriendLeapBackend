import { Server } from "socket.io";
import express from "express";
import http from "http";
import {Notification} from "../models/notificationModel.js"; // Import Notification model

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSocketMap = {}; // Stores socket ID corresponding to user ID
const usersOnline = new Set(); // Stores only unique users

export const getReceiverSocketId = (receiverId) => userSocketMap[receiverId];

io.on("connection", (socket) => {
  
    console.log("New connection established:", socket.id);

        socket.on("userIsOnline", (user) => {
            console.log("heheheehehehhheheheh");
            
            if (!user?._id) return;

    userSocketMap[user._id] = socket.id;
    usersOnline.add(user._id);
    console.log(`${user._id} is now online`);
        });

  socket.on("freindsRelatedNotification", async (data) => {
    try {
      let { fromUserId, fromUserName, toUserId, type } = data;

      if (!fromUserId || !toUserId || !type) {
        console.log("Invalid notification data");
        return;
      }

      const newNotification = new Notification({
        fromUserId,
        fromUserName,
        toUserId,
        type, // "follow" or "unfollow"
        read: false,
        timestamp: new Date(),
      });

      console.log("New notification:", newNotification);
      

      await newNotification.save();

      console.log(userSocketMap);
      
   
      const receiverSocketId = userSocketMap[toUserId];

      if (receiverSocketId) {
        console.log(receiverSocketId+"bhjte time");
        
        io.to(receiverSocketId).emit("notification", {
          id: newNotification._id,
          user: fromUserName,
          type,
          timestamp: newNotification.timestamp,
          read: false,
        });
      }
    } catch (error) {
      console.error("Error handling notification:", error);
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Find the userId by socket ID and remove from userSocketMap
    const userId = Object.keys(userSocketMap).find(
      (key) => userSocketMap[key] === socket.id
    );

    if (userId) {
      delete userSocketMap[userId];
      usersOnline.delete(userId);
      console.log(`${userId} is now offline`);
    }
  });
});

export { app, server, io };
