const mongoose = require('mongoose')
const dotenv = require('dotenv').config()
const { MongoClient, GridFSBucket } = require('mongodb'); 

let bucket;

const connectDB = async() => {
    try {
        await mongoose.connect(process.env.MONGO_ATLAS)
        console.log('Connected to ATLAS-DB')

        // Initialize MongoClient for GridFS
        const client = new MongoClient(process.env.MONGO_LOCAL);
        await client.connect();
        const db = client.db(); // Get the database instance
        bucket = new GridFSBucket(db, { bucketName: 'uploads' });
        console.log('GridFSBucket initialized')
    } catch (error) {
        console.log(`Something went wrong`, error)
    }
}

// Function to get the initialized bucket
const getBucket = () => {
    if (!bucket) {
        throw new Error('GridFSBucket has not been initialized yet');
    }
    return bucket;
};

module.exports = {connectDB, getBucket}