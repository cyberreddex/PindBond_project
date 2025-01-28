import getPrismaInstance from "../utils/PrismaClient.js";
import { renameSync } from "fs";

// Add a new message
export const addMessage = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { message, from, to } = req.body;
    const getUser = onlineUsers.get(to);  // Assuming `onlineUsers` is a global variable or context

    if (!message || !from || !to) {
      return res.status(400).send("From, to, and message are required.");
    }

    const newMessage = await prisma.messages.create({
      data: {
        message,
        sender: { connect: { id: parseInt(from) } },
        reciever: { connect: { id: parseInt(to) } },
        messageStatus: getUser ? "delivered" : "sent",
      },
      include: { sender: true, reciever: true },
    });

    return res.status(201).send({ message: newMessage });
  } catch (err) {
    next(err);
  }
};

// Get messages between two users
export const getMessages = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { from, to } = req.params;

    const messages = await prisma.messages.findMany({
      where: {
        OR: [
          {
            senderId: parseInt(from),
            recieverId: parseInt(to),
          },
          {
            senderId: parseInt(to),
            recieverId: parseInt(from),
          },
        ],
      },
      orderBy: {
        id: "asc",
      },
    });

    const unreadMessages = [];
    messages.forEach((message) => {
      if (message.messageStatus !== "read" && message.senderId === parseInt(to)) {
        message.messageStatus = "read";
        unreadMessages.push(message.id);
      }
    });

    if (unreadMessages.length > 0) {
      await prisma.messages.updateMany({
        where: {
          id: { in: unreadMessages },
        },
        data: {
          messageStatus: "read",
        },
      });
    }

    res.status(200).json({ messages });
  } catch (err) {
    console.error("Error in getMessages:", err);
    res.status(500).send("Internal Server Error");
    next(err);
  }
};

// Add an image message
export const addImageMessage = async (req, res, next) => {
  try {
    if (req.file) {
      const date = Date.now();
      let fileName = "uploads/images/" + date + req.file.originalname;
      renameSync(req.file.path, fileName);
      const prisma = getPrismaInstance();
      const { from, to } = req.query;

      if (from && to) {
        const message = await prisma.messages.create({
          data: {
            message: fileName,
            sender: { connect: { id: parseInt(from) } },
            reciever: { connect: { id: parseInt(to) } },
            type: "image",
          },
        });
        return res.status(201).json({ message });
      }
      return res.status(400).send("From, to are required.");
    }
    return res.status(400).send("Image is required.");
  } catch (err) {
    next(err);
  }
};

// Add an audio message
export const addAudioMessage = async (req, res, next) => {
  try {
    if (req.file) {
      const date = Date.now();
      let fileName = "uploads/recordings/" + date + req.file.originalname;
      renameSync(req.file.path, fileName);
      const prisma = getPrismaInstance();
      const { from, to } = req.query;

      if (from && to) {
        const message = await prisma.messages.create({
          data: {
            message: fileName,
            sender: { connect: { id: parseInt(from) } },
            reciever: { connect: { id: parseInt(to) } },
            type: "audio",
          },
        });
        return res.status(201).json({ message });
      }
      return res.status(400).send("From, to are required.");
    }
    return res.status(400).send("Audio is required.");
  } catch (err) {
    next(err);
  }
};

// Get initial contacts with messages
export const getInitialContactswithMessages = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.from);
    const prisma = getPrismaInstance();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sentMessages: {
          include: { reciever: true, sender: true },
          orderBy: { createdAt: "desc" },
        },
        recievedMessages: {
          include: { reciever: true, sender: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Combine the sent and received messages
    const messages = [...user.sentMessages, ...user.recievedMessages];
    messages.sort((a, b) => b.createdAt - a.createdAt);

    const users = new Map();
    const messageStatusChange = [];

    // Iterate through messages to create contact list
    messages.forEach((msg) => {
      const isSender = msg.senderId === userId;
      const calculatedId = isSender ? msg.recieverId : msg.senderId;

      if (msg.messageStatus === "sent") {
        messageStatusChange.push(msg.id);
      }

      const { id, type, message, createdAt, messageStatus } = msg;

      // Create or update user contact information
      if (!users.has(calculatedId)) {
        let contact = {
          messageId: id,
          type,
          message,
          messageStatus,
          createdAt,
          senderId: msg.senderId,
          recieverId: msg.recieverId,
          totalUnreadMessages: 0,
        };

        contact = {
          ...contact,
          ...(isSender ? msg.reciever : msg.sender),
          totalUnreadMessages: isSender ? 0 : (messageStatus !== "read" ? 1 : 0),
        };

        users.set(calculatedId, contact);
      } else if (messageStatus !== "read" && !isSender) {
        const contact = users.get(calculatedId);
        users.set(calculatedId, {
          ...contact,
          totalUnreadMessages: contact.totalUnreadMessages + 1,
        });
      }
    });

    // Update message status to "delivered"
    if (messageStatusChange.length) {
      await prisma.messages.updateMany({
        where: { id: { in: messageStatusChange } },
        data: { messageStatus: "delivered" },
      });
    }

    // Assuming online users are managed somewhere globally
    const onlineUsers = []; 

    return res.status(200).json({
      users: Array.from(users.values()),
      onlineUsers,
    });
  } catch (err) {
    next(err);
  }
};
