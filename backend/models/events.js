const mongoose = require('mongoose')

const File = new mongoose.Schema({
    filename: { type: String},
    id: { type: String},
    contentType: { type: String},
    fileId: { type: String},
    length: { type: Number}
});

const eventSchema = mongoose.Schema({
    eventName: {type: String, required: true},
    eventDescription: {type: String, required: true},
    date: {type: String, required: true},
    time: {type: String, required: true},
    location: {type: String, required: true},
    file: File,
    additionalInfo: {type: String},
})

module.exports = mongoose.model('Event', eventSchema)