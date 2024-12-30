const express = require("express");
const { scheduleEmail, getScheduledEmails, getScheduledEmailById, cancelScheduledEmail } = require("../controllers/emailController");

const router = express.Router();

router.post("/schedule-email", scheduleEmail);

router.get("/scheduled-emails", getScheduledEmails);

router.get("/scheduled-emails/:id", getScheduledEmailById);

router.delete("/scheduled-emails/:id", cancelScheduledEmail);

module.exports = router;
