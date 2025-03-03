const Messages = require("../models/messagesModel");
const mongoose = require("mongoose");
const VoiceMessage = require('../models/VoiceMessage');

 
 
module.exports.addMessage = async (req, res) => {
  try {
    const { from, to, message } = req.body;
 
    if (!message || message.trim() === "") {
      return res.status(400).json({ msg: "Message cannot be empty" });
    }
 
    // Store the message in the database asynchronously
    const data = await Messages.create({
      message: { text: message },
      users: [from, to],
      sender: from,
    });
 
    console.log("Message stored:", data);
    return res.json({ msg: "Message added successfully." });
 
  } catch (error) {
    console.error("Error adding message:", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};
 
 
module.exports.getMessages = async (req, res) => {
  try {
    const { from, to } = req.body;

    const messages = await Messages.find({
      users: { $all: [from, to] },
    }).sort({ createdAt: 1 });

    return res.json(messages.map(msg => ({
      fromSelf: msg.sender.toString() === from,
      message: msg.message.text || msg.message.audio, // Send either text or audio
      type: msg.message.audio ? "audio" : "text", // Identify type
    })));
  } catch (error) {
    console.error("Fetch messages error:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

 

// Store a call log message
module.exports.addCallMessage = async (req, res) => {
  try {
    const { from, to, type, status } = req.body;
 
    const callMessage = await Messages.create({
      message: { text: `Call ${status}: ${type}` },
      users: [from, to],
      sender: from,
      type: "call",
    });
 
    res.status(200).json({ success: true, message: callMessage });
  } catch (error) {
    console.error("Error saving call message:", error);
    res.status(500).json({ success: false, msg: "Internal Server Error" });
  }
};
 
// Retrieve call logs between two users
module.exports.getCallMessages = async (req, res) => {
  try {
    const { from, to } = req.body;
    const callLogs = await Messages.find({
      users: { $all: [from, to] },
      type: "call",
    }).sort({ createdAt: 1 });
 
    res.status(200).json(callLogs);
  } catch (error) {
    console.error("Error fetching call logs:", error);
    res.status(500).json({ success: false, msg: "Internal Server Error" });
  }
};
// Save call details
exports.addCall = async (req, res) => {
  try {
    const { from, to, callType, callStatus } = req.body;
 
    const call = new Call({ from, to, callType, callStatus });
    await call.save();
 
    res.status(201).json({ message: "Call details saved", call });
  } catch (error) {
    res.status(500).json({ error: "Error saving call details" });
  }
};
 
// Fetch call logs
exports.getCall = async (req, res) => {
  try {
    const { from, to } = req.body;
 
    const calls = await Call.find({
      $or: [
        { from, to },
        { from: to, to: from },
      ],
    }).sort({ timestamp: -1 });
 
    res.json(calls);
  } catch (error) {
    res.status(500).json({ error: "Error fetching call logs" });
  }
};
 
// // Edit a Message
// module.exports.editMessage = async (req, res) => {
//   try {
//     const { text } = req.body;
//     const updatedMessage = await Messages.findByIdAndUpdate(
//       req.params.messageId,
//       { "message.text": text },
//       { new: true }
//     );
//     if (!updatedMessage) return res.status(404).json({ error: "Message not found" });
 
//     res.json(updatedMessage);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to update message" });
//   }
// };
 
module.exports.updateMessage = async (req, res) => {
  try {
    let messageId = req.params.messageId.trim(); // ✅ Trim to remove spaces/newlines
    const { text } = req.body;
 
    // ✅ Ensure messageId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: "Invalid message ID format" });
    }
 
    // ✅ Find the existing message first
    const existingMessage = await Messages.findById(messageId);
    if (!existingMessage) {
      return res.status(404).json({ error: "Message not found" });
    }
 
    console.log("Updating message:", messageId, "with text:", text); // Debugging log
 
    // ✅ Update only the `text` field inside `message` object
    const updatedMessage = await Messages.findByIdAndUpdate(
      messageId,
      { $set: { "message.text": text } }, // ✅ Properly update nested field
      { new: true, runValidators: true }
    );
 
    res.json(updatedMessage);
  } catch (err) {
    console.error("Error updating message:", err); // Log the error
    res.status(500).json({ error: "Failed to update message", details: err.message });
  }
};
 
// Delete a Message
module.exports.deleteMessage = async (req, res) => {
  try {
    let messageId = req.params.messageId.trim(); // ✅ Trim messageId
 
    // ✅ Check if messageId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: "Invalid message ID format" });
    }
 
    // ✅ Delete the message
    const deletedMessage = await Messages.findByIdAndDelete(messageId);
 
    if (!deletedMessage) {
      return res.status(404).json({ error: "Message not found" });
    }
 
    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    console.error("Error deleting message:", err); // ✅ Log error for debugging
    res.status(500).json({ error: "Failed to delete message", details: err.message });
  }
};

module.exports.uploadAudio = (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file uploaded');
  }

  // Generate a URL for the uploaded file
  const audioUrl = `http://localhost:5000/api/messages/upload-audio/${file.filename}`;

  res.json({ audioUrl });
};


// Handle voice message upload
module.exports.sendVoiceMessage = async (req, res) => {
  try {
    const { from, to } = req.body;

    if (!req.file) {
      return res.status(400).json({ msg: 'Audio file is required' });
    }

    const audioUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const newVoiceMessage = new VoiceMessage({
      sender: from,
      receiver: to,
      audioUrl,
    });

    await newVoiceMessage.save(); 

    res.status(201).json({ audioUrl });
  } catch (error) {
    console.error('Error saving voice message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


module.exports.getVoiceMessages = async (req, res) => {
  try {
    const { from, to } = req.params;

    const messages = await VoiceMessage.find({
      $or: [
        { sender: from, receiver: to },
        { sender: to, receiver: from },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "username") // ✅ Populate sender's username
      .populate("receiver", "username"); // ✅ Populate receiver's username

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching voice messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
