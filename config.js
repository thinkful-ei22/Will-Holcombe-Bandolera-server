'use strict';

module.exports = {
  PORT: process.env.PORT || 8080,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  REACT_APP_API_BASE_URL="https://fathomless-harbor-21488.herokuapp.com/",
  MONGODB_URI:
        process.env.DATABASE_URL || 'mongodb://WebUser:shadow1@ds215502.mlab.com:15502/snippets',
  TEST_DATABASE_URL:
        process.env.TEST_DATABASE_URL ||
        'mongodb://localhost/thinkful-backend-test'
  // DATABASE_URL:
  //     process.env.DATABASE_URL || 'postgres://localhost/thinkful-backend',
  // TEST_DATABASE_URL:
  //     process.env.TEST_DATABASE_URL ||
  //     'postgres://localhost/thinkful-backend-test'
};
