// Migration script to add username to existing users
require('dotenv').config();
const mongoose = require('mongoose');

async function addUsernameToExistingUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get the users collection
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Find users without username
        const usersWithoutUsername = await usersCollection.find({
            $or: [
                { username: null },
                { username: { $exists: false } }
            ]
        }).toArray();

        console.log(`Found ${usersWithoutUsername.length} users without username`);

        if (usersWithoutUsername.length === 0) {
            console.log('✅ All users already have usernames');
            process.exit(0);
        }

        // Update each user
        for (const user of usersWithoutUsername) {
            // Generate username from email or use a default
            let username;
            if (user.email) {
                // Use email prefix as username
                username = user.email.split('@')[0];
            } else {
                // Generate random username
                username = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            }

            // Make sure username is unique
            let finalUsername = username;
            let counter = 1;
            while (await usersCollection.findOne({ username: finalUsername })) {
                finalUsername = `${username}_${counter}`;
                counter++;
            }

            // Update user
            await usersCollection.updateOne(
                { _id: user._id },
                { $set: { username: finalUsername } }
            );

            console.log(`✅ Updated user ${user._id}: username = ${finalUsername}`);
        }

        console.log('\n✨ Migration completed successfully!');
        console.log(`Updated ${usersWithoutUsername.length} users`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
}

addUsernameToExistingUsers();
