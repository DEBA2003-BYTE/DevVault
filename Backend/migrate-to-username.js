// Migration script to drop old email index
require('dotenv').config();
const mongoose = require('mongoose');

async function dropEmailIndex() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get the users collection
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Drop the email_1 index
        try {
            await usersCollection.dropIndex('email_1');
            console.log('✅ Successfully dropped email_1 index');
        } catch (error) {
            if (error.code === 27) {
                console.log('ℹ️  Index email_1 does not exist (already dropped)');
            } else {
                throw error;
            }
        }

        // Create username index if it doesn't exist
        try {
            await usersCollection.createIndex({ username: 1 }, { unique: true });
            console.log('✅ Successfully created username_1 index');
        } catch (error) {
            if (error.code === 85 || error.code === 86) {
                console.log('ℹ️  Username index already exists');
            } else {
                throw error;
            }
        }

        console.log('\n✨ Migration completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
}

dropEmailIndex();
