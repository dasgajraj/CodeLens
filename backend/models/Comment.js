const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review", required: true },
  lineNumber: { type: Number, required: true },
  text: { type: String, required: true },
  author: { type: String, required: true },
  resolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Comment", commentSchema);