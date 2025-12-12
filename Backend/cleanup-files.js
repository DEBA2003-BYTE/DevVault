// Migration script to clean up files and fix indexes
require('dotenv').config();
const mongoose = require('mongoose');

async function cleanupAndFixIndexes() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get the files collection
        const db = mongoose.connection.db;
        const filesCollection = db.collection('files');

        // Delete files with null fileKey (these are broken uploads)
        const deleteResult = await filesCollection.deleteMany({
            $or: [
                { fileKey: null },
                { fileKey: { $exists: false } }
            ]
        });
        console.log(`✅ Deleted ${deleteResult.deletedCount} broken file records`);

        // Drop all existing indexes except _id
        const indexes = await filesCollection.indexes();
        for (const index of indexes) {
            if (index.name !== '_id_') {
                try {
                    await filesCollection.dropIndex(index.name);
                    console.log(`✅ Dropped index: ${index.name}`);
                } catch (error) {
                    console.log(`⚠️  Could not drop ${index.name}:`, error.message);
                }
            }
        }

        // Create proper fileKey index
        try {
            await filesCollection.createIndex({ fileKey: 1 }, { unique: true });
            console.log('✅ Successfully created fileKey_1 index');
        } catch (error) {
            console.log('⚠️  Could not create fileKey index:', error.message);
        }

        console.log('\n✨ Cleanup and migration completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
}

cleanupAndFixIndexes();
