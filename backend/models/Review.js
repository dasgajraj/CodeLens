const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  title: { type: String, required: true },
  code: { type: String, required: true },
  language: { type: String, default: "javascript" },
  githubUrl: { type: String },
  userId: { type: String, required: true }, // For our Guest Mode ID
  status: { type: String, enum: ["pending", "reviewed"], default: "pending" },
  aiSuggestions: { type: String }, // Stores the Gemini output
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Review", reviewSchema);