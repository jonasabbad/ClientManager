// Vercel Serverless Function Entry Point
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('../dist/index.js');

module.exports = app;
