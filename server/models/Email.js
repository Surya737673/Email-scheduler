const mongoose = require('mongoose');

const EmailSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    scheduleTime: { type: Date, required: true },
    status: { type: String, default: 'scheduled' },
});

module.exports = mongoose.model('Email', EmailSchema);
