const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

// Configure AWS
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Configure multer for S3 upload
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `uploads/${req.user.userId}/${uniqueSuffix}-${file.originalname}`);
        }
    }),
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

// Delete file from S3
async function deleteFileFromS3(fileKey) {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey
    };

    try {
        await s3.deleteObject(params).promise();
        return true;
    } catch (error) {
        console.error('Error deleting file from S3:', error);
        return false;
    }
}

// Get signed URL for file download
function getSignedUrl(fileKey) {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
        Expires: 3600 // URL expires in 1 hour
    };

    return s3.getSignedUrl('getObject', params);
}

module.exports = {
    upload,
    deleteFileFromS3,
    getSignedUrl,
    s3
};
