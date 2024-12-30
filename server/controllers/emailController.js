const nodemailer = require("nodemailer");
const cron = require("node-cron");
const ScheduledEmail = require("../models/ScheduledEmail");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const jobs = new Map();

exports.scheduleEmail = async (req, res) => {
  try {
    const { recipient, subject, body, scheduleTime } = req.body;

    console.log("Request Body:", req.body);

    const scheduleDate = new Date(scheduleTime);
    if (isNaN(scheduleDate)) {
      return res.status(400).json({ message: "Invalid schedule time" });
    }

    // Create the scheduled email entry in the database
    const email = await ScheduledEmail.create({
      recipient,
      subject,
      body,
      scheduleTime: scheduleDate,
    });

    // Schedule the email task using setTimeout() instead of cron
    const delay = scheduleDate - new Date(); // Calculate delay until the scheduled time
    if (delay < 0) {
      return res.status(400).json({ message: "Scheduled time is in the past" });
    }

    // Set a timeout to send the email when the scheduled time comes
    const job = setTimeout(async () => {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: recipient,
          subject,
          text: body,
        });

        await ScheduledEmail.findByIdAndUpdate(email._id, { status: "sent" });
      } catch (err) {
        console.error("Error sending email:", err);
        await ScheduledEmail.findByIdAndUpdate(email._id, { status: "failed" });
      }
    }, delay);

    // Store the job for potential cancellation later
    jobs.set(email._id, job);

    // Return success response
    res.status(201).json({ message: "Email scheduled successfully", email });
  } catch (error) {
    console.error("Error scheduling email:", error);
    res.status(500).json({ message: "Failed to schedule email", error: error.message || error });
  }
};

exports.getScheduledEmails = async (req, res) => {
  try {
    const emails = await ScheduledEmail.find();
    console.log(emails)
    res.status(200).json(emails);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch scheduled emails", error });
  }
};

exports.getScheduledEmailById = async (req, res) => {
  try {
    const email = await ScheduledEmail.findById(req.params.id);
    if (!email) {
      return res.status(404).json({ message: "Email not found" });
    }
    res.status(200).json(email);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch email details", error });
  }
};

exports.cancelScheduledEmail = async (req, res) => {
  try {
    const email = await ScheduledEmail.findById(req.params.id);
    if (!email) {
      return res.status(404).json({ message: "Email not found" });
    }

    const job = jobs.get(email._id);
    if (job) {
      job.stop();
      jobs.delete(email._id);
    }

    await ScheduledEmail.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Scheduled email canceled" });
  } catch (error) {
    res.status(500).json({ message: "Failed to cancel email", error });
  }
};
