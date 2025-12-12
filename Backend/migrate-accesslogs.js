// Migration script to update access logs from userEmail to username
require('dotenv').config();
const mongoose = require('mongoose');

async function updateAccessLogs() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get the accesslogs collection
        const db = mongoose.connection.db;
        const accessLogsCollection = db.collection('accesslogs');

        // Find all access logs with userEmail field
        const logsWithEmail = await accessLogsCollection.find({
            userEmail: { $exists: true }
        }).toArray();

        console.log(`Found ${logsWithEmail.length} access logs with userEmail field`);

        if (logsWithEmail.length === 0) {
            console.log('✅ All access logs already updated');
            process.exit(0);
        }

        // Update each log
        let updated = 0;
        for (const log of logsWithEmail) {
            await accessLogsCollection.updateOne(
                { _id: log._id },
                {
                    $set: { username: log.userEmail },
                    $unset: { userEmail: "" }
                }
            );
            updated++;
        }

        console.log(`✅ Updated ${updated} access logs`);
        console.log('✨ Migration completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
}

updateAccessLogs();
