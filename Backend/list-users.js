// Script to list all users
require('dotenv').config();
const mongoose = require('mongoose');

async function listAllUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get the users collection
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Find all users
        const allUsers = await usersCollection.find({}).toArray();

        console.log(`📊 Total users: ${allUsers.length}\n`);
        console.log('='.repeat(80));

        for (const user of allUsers) {
            console.log(`\nUser ID: ${user._id}`);
            console.log(`Username: ${user.username || 'NOT SET'}`);
            console.log(`Email: ${user.email || 'NOT SET'}`);
            console.log(`Is Admin: ${user.isAdmin || false}`);
            console.log(`Created: ${user.createdAt}`);
            console.log(`Files Uploaded: ${user.filesUploaded || 0}`);
            console.log(`Is Blocked: ${user.isBlocked || false}`);
            console.log('-'.repeat(80));
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

listAllUsers();
