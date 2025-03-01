const mongoose = require("mongoose");

const emailSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    sentAt: { type: Date, default: Date.now }  // Stores when the email was added
});

module.exports = mongoose.model("Email", emailSchema);
