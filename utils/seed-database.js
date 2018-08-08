'use strict';
const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');
console.log(MONGODB_URI);

//const User = require('../models/users');
const Snippet = require('../models/snippet');
const Topic = require('../models/topic');
const Subtopic = require('../models/subtopic');

const seedSnippets = require('../db/seed/snippets');
const seedTopics = require('../db/seed/topics');
const seedSubtopics = require('../db/seed/subtopics');
//const seedUsers = require('../db/seed/users');

mongoose.connect((MONGODB_URI))
  .then(() => mongoose.connection.db.dropDatabase())
  .then(() => { 
    console.info('Seeding Database');
    return Promise.all([
      Snippet.insertMany(seedSnippets),
      Subtopic.insertMany(seedSubtopics),
      Subtopic.createIndexes(),
      Topic.insertMany(seedTopics),
      Topic.createIndexes()
      //User.insertMany(seedUsers),
      //User.createIndexes()

    ]);
 
  })
  .then(() => {
    console.info('Disconnecting');
  })
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error(err);
  });