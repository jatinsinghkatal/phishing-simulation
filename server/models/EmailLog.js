const mongoose = require("mongoose");

const EmailLogSchema = new mongoose.Schema({
  email: { type: String, required: true },
  opened: { type: Boolean, default: false },
  clicked: { type: Boolean, default: false },
  fileOpened: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("EmailLog", EmailLogSchema);
