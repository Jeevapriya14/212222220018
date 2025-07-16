const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortCode: { type: String, required: true, unique: true },
  expiry: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  clicks: [
    {
      timestamp: { type: Date, default: Date.now },
      referrer: String,
      location: String,
    }
  ],
});

module.exports = mongoose.model("Url", urlSchema);
