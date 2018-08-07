'use strict';
const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');
const Note = require('../models/note');

const User = require('../models/users');
const Topic = require('../models/topics');
const Subtopic = require('../models/subtopic');

const seedSnippets = require('../db/seed/snippets');
const seedTopics = require('../db/seed/topics');
const seedSubtopics = require('../db/seed/subtopics');
const seedUsers = require('../db/seed/users');

mongoose.connect(MONGODB_URI)
  .then(() => mongoose.connection.db.dropDatabase())
  .then(() => { 
    console.info('Seeding Database');
    return Promise.all([
      Snippet.insertMany(seedSnippets),
      Subtopic.insertMany(seedSubtopics),
      Subtopic.createIndexes(),
      Topic.insertMany(seedTopics),
      Topic.createIndexes(),
      User.insertMany(seedUsers),
      User.createIndexes()

    ]);
 
  })
  .then(results => {
    console.info(`Inserted ${results.length} Notes`);
  })
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error(err);
  });