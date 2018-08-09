'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { PORT, CLIENT_ORIGIN } = require('./config');
const { dbConnect } = require('./db-mongoose');


const app = express();
const snippetsRouter = require('./routes/snippets-router');
const subtopicsRouter = require('./routes/subtopics-router');
const topicsRouter = require('./routes/topics-router');
const usersRouter = require('./routes/users-router');
const authRouter = require('./routes/auth');

const passport = require('passport');
const localStrategy = require('./passport/local');
const jwtStrategy = require('./passport/jwt');
passport.use(localStrategy);
passport.use(jwtStrategy);

app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'common' : 'dev', {
    skip: (req, res) => process.env.NODE_ENV === 'test'
  })
);

app.use(express.static('public'));
app.use(express.json());

app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);


// app.post('/api/login', (req, res) => {
//   res.send('Hello');
// });


app.use('/api/snippets', snippetsRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/subtopics', subtopicsRouter);
app.use('/api/users', usersRouter);
app.use('/api/login', authRouter);





// Custom 404 Not Found route handler
app.use((req, res, next) => {
  
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Custom Error Handler
app.use((err, req, res, next) => {
  //console.log('ERROR', err);
  if (err.status) {
    const errBody = Object.assign({}, err, { message: err.message });
    res.status(err.status).json(errBody);
  } else {

    res.status(500).json({ message: 'Internal Server Error' });
  }
});



function runServer(port = PORT) {
  const server = app
    .listen(port, () => {
      console.info(`App listening on port ${server.address().port}`);
    })
    .on('error', err => {
      console.error('Express failed to start');
      console.error(err);
    });
}

if (require.main === module) {
  dbConnect();
  runServer();
}

module.exports = { app };
