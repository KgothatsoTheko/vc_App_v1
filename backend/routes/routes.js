const express = require('express')
const events = require('../models/events')
const router = express.Router()
const multer = require('multer');
const { getBucket } = require('../dbconn/dbconn.js');
const { Readable } = require('stream');
const { default: mongoose } = require('mongoose');

// Initialize multer for file handling
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//default path
router.get('/', (req, res) => {
    res.status(200).send("Welcome to VC-Backend")
})
//add event
router.post('/add-event', async(req, res)=>{
    try {
        const body = req.body
    const event = events
    //new instance
    const newEvent = new event(body)
    //save instance and send reponse
    const result = await newEvent.save()
    res.status(201).send(result)
    } catch (error) {
        console.log(error);
    res.status(500).send(`Internal server error`)
    }
})
//get event
router.get('/get-events', async(req, res)=> {
    try {
        const result = await events.find()
        res.status(200).send(result)
    } catch (error) {
        console.log(error);
        res.status(500).send(`Internal server error`)
    }
})
//delete event
router.delete('/delete-event/:id', async(req, res)=> {
    try {
        const id = req.params._id;

        // Delete the event using an object with the id
        const result = await events.deleteOne({ id });

        if (result.deletedCount === 0) {
            return res.status(404).send("Event not found");
        }

        res.status(200).send("Event deleted successfully");
    } catch (error) {
        console.log(error);
        res.status(500).send(`Internal server error`)
    }
})
//update event
router.put('/update-event/:id', async(req, res)=> {
    try {
        const id = req.params._id; // Get the event name from the URL parameter
        const filter = { id }; // Create a filter object for the event to be updated
        const body = req.body; // Get the updated data from the request body

        // Update the event
        const updatedEvent = await events.updateOne(filter, body);

        // Check if any documents were matched and updated
        if (updatedEvent.matchedCount === 0) {
            return res.status(404).send("Event not found");
        }

        res.status(200).send("Event updated successfully");
    } catch (error) {
        console.log(error);
        res.status(500).send(`Internal server error`)
    }

})
// upload a file for an event
router.post('/upload/:eventName', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("No file uploaded");
        }

        // Find the event by eventName
        const existingEvent = await events.findOne({ eventName: req.params.eventName });
        if (!existingEvent) {
            return res.status(404).send("Event not found");
        }

        const { originalname, mimetype, buffer } = req.file;

        const bucket = getBucket()
        // Open upload stream to GridFS
        const uploadStream = bucket.openUploadStream(originalname, {
            contentType: mimetype,
            metadata: { event: req.params.eventName }
        });

        const readBuffer = new Readable();
        readBuffer.push(buffer);
        readBuffer.push(null);

        // Pipe buffer to GridFS
        readBuffer.pipe(uploadStream)
            .on('error', (err) => res.status(500).send("Error uploading file"))
            .on('finish', async () => {
                const newFile = {
                    filename: originalname,
                    id: uploadStream.id.toString(),
                    contentType: mimetype,
                    length: buffer.length,
                    fileId: new Date().getTime().toString(),
                };

                // Save file information in the event object
                existingEvent.file = newFile;
                await existingEvent.save();

                res.status(201).send({
                    message: "File uploaded successfully",
                    file: newFile
                });
            });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// get a file for an event
router.get('/get-file/:id', (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send("Invalid file ID");
    }

    const bucket = getBucket()

    // Download file stream from GridFS
    const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(id));

    downloadStream.on('error', (err) => {
        if (err.code === 'ENOENT') {
            return res.status(404).send("File not found");
        }
        return res.status(500).send("Internal Server Error");
    });

    downloadStream.on('file', (file) => {
        res.set('Content-Type', file.contentType);
    });

    downloadStream.pipe(res);
});



module.exports = router