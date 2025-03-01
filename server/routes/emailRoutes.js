require("dotenv").config();
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const EmailLog = require("../models/EmailLog");

// Email Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send Phishing Email
router.post("/send", async (req, res) => {
  const { email } = req.body;
  const trackingLink = `http://localhost:5000/api/emails/track-click?email=${email}`;
  const phishingFile = `http://localhost:5000/api/emails/track-file?email=${email}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Urgent: Account Verification Required",
    html: `<p>Click the link to verify your account: <a href="${trackingLink}">Verify Now</a></p>
           <p>Download and open this document: <a href="${phishingFile}">Important Document</a></p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    await EmailLog.create({ email });
    res.json({ message: "Phishing email sent!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Error sending email" });
  }
});

// Track Clicks
router.get("/track-click", async (req, res) => {
  const { email } = req.query;
  await EmailLog.updateOne({ email }, { clicked: true });
  res.redirect("https://www.cybersecurity-awareness.com");
});

// Track File Opens
router.get("/track-file", async (req, res) => {
  const { email } = req.query;
  await EmailLog.updateOne({ email }, { fileOpened: true });
  res.download("./static/phishing_document.pdf"); // Attach a real document here
});

module.exports = router;
