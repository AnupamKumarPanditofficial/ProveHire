const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    heading: {
        type: String,
        required: true,
        trim: true
    },
    subtitle: {
        type: String,
        required: true,
        trim: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    deadline: {
        type: String, // Storing as string to match existing frontend date picker output
        required: true
    },
    category: {
        type: String,
        enum: ['Hackathons', 'Webinars', 'Meetups', 'Workshops', 'Other', 'All Events'],
        default: 'Hackathons'
    }
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
