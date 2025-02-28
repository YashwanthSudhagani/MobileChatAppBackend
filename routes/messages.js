const express = require("express");
// const Message = require("../models/messagesModel"); 
// const mongoose = require("mongoose"); // ✅ Correct import
const multer = require("multer");
const path = require("path");

const { addMessage, getMessages,addCallMessage,getCallMessages,deleteMessage,updateMessage,uploadAudio } = require("../controllers/messagesController");
const router = express.Router();
 

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });
  
  const upload = multer({ storage });
  
  // File Upload Route
  router.post("/upload", upload.single("file"), uploadAudio);
// Route to add a new message (including emojis)
router.post("/addmsg", addMessage);
 
// Route to fetch messages between two 
router.post("/getmsg", getMessages);
router.put("/:messageId",updateMessage);
router.delete("/:messageId", deleteMessage);
 
router.post("/add-call", addCallMessage);
router.post("/get-calls", getCallMessages);

  
 
module.exports = router;
 