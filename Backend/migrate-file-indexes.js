// Migration script to fix file upload index issue
require('dotenv').config();
const mongoose = require('mongoose');

async function fixFileIndexes() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get the files collection
        const db = mongoose.connection.db;
        const filesCollection = db.collection('files');

        // Drop the old s3Key_1 index if it exists
        try {
            await filesCollection.dropIndex('s3Key_1');
            console.log('✅ Successfully dropped s3Key_1 index');
        } catch (error) {
            if (error.code === 27) {
                console.log('ℹ️  Index s3Key_1 does not exist (already dropped)');
            } else {
                console.log('⚠️  Could not drop s3Key_1 index:', error.message);
            }
        }

        // Create fileKey index if it doesn't exist
        try {
            await filesCollection.createIndex({ fileKey: 1 }, { unique: true });
            console.log('✅ Successfully created fileKey_1 index');
        } catch (error) {
            if (error.code === 85 || error.code === 86) {
                console.log('ℹ️  fileKey index already exists');
            } else {
                console.log('⚠️  Could not create fileKey index:', error.message);
            }
        }

        console.log('\n✨ File indexes migration completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
}

fixFileIndexes();
