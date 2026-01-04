// Vercel serverless function entry point
require('dotenv').config({ path: '../Backend/.env' });
const app = require('../Backend/server');

module.exports = app;
