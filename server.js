require("dotenv").config();  // Load environment variables
const mongoose = require("mongoose");
const express = require("express");
const mailgun = require("mailgun-js");

// ✅ Initialize Express
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ MongoDB Connection
console.log("MongoDB URI:", process.env.MONGO_URI || "Not Found");
if (!process.env.MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is not defined in .env file.");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected!"))
.catch(err => console.log("❌ MongoDB Connection Error:", err));

// ✅ Define Email Model
const emailSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    sentAt: { type: Date, default: Date.now }  
});
const Email = mongoose.model("Email", emailSchema);

// ✅ API to Store Emails
app.post("/add-email", async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }
    try {
        const newEmail = new Email({ email });
        await newEmail.save();
        res.json({ message: "✅ Email saved successfully!", email });
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).json({ error: "⚠️ Email already exists!" });
        } else {
            res.status(500).json({ error: "Internal Server Error", details: err });
        }
    }
});

// ✅ Initialize Mailgun
const mg = mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN
});

// ✅ Email Sending Function
const sendEmail = async (toEmail, phishingLink, phishingFile) => {
    const data = {
        from: process.env.MAILGUN_FROM_EMAIL,
        to: toEmail,
        subject: "Important Security Update",
        html: `<p>Hello,</p>
               <p>Please review this security update:</p>
               <a href="${phishingLink}">Click Here</a>
               <br>
               <p>Or download the file: <a href="${phishingFile}">Download</a></p>`
    };
    try {
        await mg.messages().send(data);
        console.log(`📩 Email sent to ${toEmail}`);
    } catch (error) {
        console.error("❌ Email sending error:", error);
    }
};

// ✅ API to Send Emails to All Stored Users
app.post("/send-emails", async (req, res) => {
    const { phishingLink, phishingFile } = req.body;
    if (!phishingLink || !phishingFile) {
        return res.status(400).json({ error: "⚠️ phishingLink and phishingFile are required!" });
    }
    try {
        const emails = await Email.find();
        if (emails.length === 0) {
            return res.status(400).json({ error: "⚠️ No emails found!" });
        }
        let sentCount = 0;
        for (const user of emails) {
            await sendEmail(user.email, phishingLink, phishingFile);
            sentCount++;
            await new Promise(resolve => setTimeout(resolve, 1000)); // ⏳ 1-second delay
        }
        res.json({ message: `📨 Emails sent to ${sentCount} users via Mailgun` });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error });
    }
});

// ✅ Start Server
app.listen(5000, () => console.log("🚀 Server running on port 5000"));
