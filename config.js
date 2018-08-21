'use strict';

require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 8080,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
 
  MONGODB_URI:
        process.env.DATABASE_URL || 'mongodb://WebUser:shadow1@ds215502.mlab.com:15502/snippets',
  TEST_MONGODB_URI:
        process.env.TEST_DATABASE_URL ||
        'mongodb://WebUser:shadow1@ds119640.mlab.com:19640/bandolera_test',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME
};
//changed = to : in above