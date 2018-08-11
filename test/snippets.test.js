'use strict';
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const express = require('express');

const mongo = require('mongodb');

const { app, runServer, closeServer } = require('../index');

const Topic = require('../models/topic');
const Subtopic = require('../models/subtopic');
const Snippet = require('../models/snippet');
const  User  = require('../models/users');
const seedSubtopics = require('../db/seed/subtopics');
const seedSnippets = require('../db/seed/snippets');
const seedUsers = require('../db/seed/users');
const seedTopics = require('../db/seed/topics');

const { TEST_MONGODB_URI } = require('../config');

const {JWT_SECRET} = require('../config');
const {JWT_EXPIRY} = require('../config');
const jwt = require('jsonwebtoken');
chai.use(chaiHttp);
const expect = chai.expect;

describe('Bandolera API --Snippets', function () {






  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
    .then(() => mongoose.connection.db.dropDatabase());
      
  });

  let token; 
  let user;

  beforeEach(function () {
    return Promise.all([
      User.insertMany(seedUsers),
      Subtopic.insertMany(seedSubtopics),
      Subtopic.createIndexes(),
      Snippet.insertMany(seedSnippets),
      Snippet.createIndexes(),
      Topic.insertMany(seedTopics),
      Topic.createIndexes()

    ])
      .then(([users]) => {
        user = users[1];
        //console.log(user);
        token = jwt.sign({ user }, JWT_SECRET, {
          subject: user.username,
          expiresIn: JWT_EXPIRY
        });

      });
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /api/notes', function () {
    it('should return the correct number of Notes', function () {
      return Promise.all([
        Snippet.find({ userId: user.id }),
        chai.request(app)
          .get('/api/snippets')
          .set('Authorization', `Bearer ${token}`)
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return a list with the correct right fields', function () {
      return Promise.all([
        Snippet.find({ userId: user.id }).sort({ updatedAt: 'desc' }),
        chai.request(app)
          .get('/api/snippets')
          .set('Authorization', `Bearer ${token}`)
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (item, i) {
            expect(item).to.be.a('object');
            // Note: folderId and content are optional
            expect(item).to.include.all.keys('id', 'title', 'content', 'createdAt', 'updatedAt', 'subtopicId', 'userId');
            expect(item.id).to.equal(data[i].id);
            expect(item.title).to.equal(data[i].title);
            expect(item.content).to.equal(data[i].content);
            expect(item.userId).to.equal(data[i].userId.toHexString());
            expect(new Date(item.createdAt)).to.eql(data[i].createdAt);
            expect(new Date(item.updatedAt)).to.eql(data[i].updatedAt);
          });
        });
    });

    
    // it('should return correct search results for a subTopicId query', function () {
    //   let data;
    //   return Subtopic.findOne()
    //     .then((_data) => {
    //       data = _data;
    //       return Promise.all([
    //         Snippet.find({ subtopicId: data.id, userId: user.id }),
    //         chai.request(app)
    //           .get(`/api/snippets/${data.id}`)
    //           .set('Authorization', `Bearer ${token}`)
    //       ]);
    //     })
    //     .then(([data, res]) => {
    //       expect(res).to.have.status(200);
    //       expect(res).to.be.json;
    //       expect(res.body).to.be.a('array');
    //       expect(res.body).to.have.length(data.length);
    //     });
    // });

  });

  describe('GET /api/notes/:id', function () {
    it('should return correct notes', function () {
      let data;

      return Snippet.findOne({ userId: user.id })
        .then(_data => {
          data = _data;

          return chai.request(app)
            .get(`/api/snippets/${data.id}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.all.keys('id', 'title', 'content', 'createdAt', 'updatedAt', 'subtopicId', 'userId');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(res.body.userId).to.equal(data.userId.toHexString());
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should respond with status 400 and an error message when `id` is not valid', function () {
      return chai.request(app)
        .get('/api/snippets/NOT-A-VALID-ID')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });

    it('should respond with a 404 for an id that does not exist', function () {
      // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
      return chai.request(app)
        .get('/api/snippets/DOESNOTEXIST')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

  });

  describe('POST /api/notes', function () {

    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        title: 'The best article about cats ever!',
        subtopicId: '111111111111111111111101',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...'
      };
      let res;

      return chai.request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.all.keys('id', 'title', 'content', 'createdAt', 'updatedAt', 'subtopicId', 'userId');
          return Snippet.findOne({ _id: res.body.id, userId: user.id });
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(res.body.userId).to.equal(data.userId.toHexString());
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should return an error when missing "title" field', function () {
      const newItem = {
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...'
      };
      return chai.request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

    it('should return an error when `folderId` is not valid ', function () {
      const newItem = {
        title: 'What about dogs?!',
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...',
        folderId: 'NOT-A-VALID-ID'
      };
      return chai.request(app)
        .post('/api/snipepts')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(404);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          //expect(res.body.message).to.equal('The `folderId` is not valid');
        });
    });
//should be 400 instead of 404 - add handling?

  });

  describe('PUT /api/notes/:id', function () {

    it('should update the note when provided valid data', function () {
      const updateItem = {
        title: 'What about dogs?!',
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...'
      };
      let data;
      return Snippet.findOne({ userId: user.id })
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/snippets/${data.id}`)
            .send(updateItem)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.all.keys('id', 'title', 'content', 'createdAt', 'updatedAt', 'subtopicId', 'userId');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(updateItem.title);
          expect(res.body.content).to.equal(updateItem.content);
          expect(res.body.userId).to.equal(data.userId.toHexString());
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          // expect note to have been updated
          expect(new Date(res.body.updatedAt)).to.greaterThan(data.updatedAt);
        });
    });

    it('should respond with status 400 and an error message when `id` is not valid', function () {
      const updateItem = {
        title: 'What about dogs?!',
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...'
      };
      return chai.request(app)
        .put('/api/snippets/NOT-A-VALID-ID')
        .set('Authorization', `Bearer ${token}`)
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });

    it('should respond with a 404 for an id that does not exist', function () {
      // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
      const updateItem = {
        title: 'What about dogs?!',
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...'
      };
      return chai.request(app)
        .put('/api/snippets/DOESNOTEXIST')
        .set('Authorization', `Bearer ${token}`)
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

    it('should return an error when "title" is an empty string', function () {
      const updateItem = {
        title: ''
      };
      let data;
      return Snippet.findOne({ userId: user.id })
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/snippets/${data.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

    // it('should return an error when `folderId` is not valid ', function () {
    //   const updateItem = {
    //     subtopicId: 'NOT-A-VALID-ID'
    //   };
    //   return Snippet.findOne({ userId: user.id })
    //     .then(data => {
    //       return chai.request(app)
    //         .put(`/api/snippets/${data.id}`)
    //         .set('Authorization', `Bearer ${token}`)
    //         .send(updateItem);
    //     })
    //     .then(res => {
    //       expect(res).to.have.status(400);
    //       expect(res).to.be.json;
    //       expect(res.body).to.be.a('object');
    //       expect(res.body.message).to.equal('The `subtopicId` is not valid');
    //     });
    // });

//add handling for incorrect subtopic id entry?

  });

  describe('DELETE /api/notes/:id', function () {

    it('should delete an existing document and respond with 204', function () {
      let data;
      return Snippet.findOne({ userId: user.id })
        .then(_data => {
          data = _data;

          return chai.request(app)
            .delete(`/api/snippets/${data.id}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(res => {
          expect(res).to.have.status(204);
          return Snippet.count({ _id: data.id });
        })
        .then(count => {
          expect(count).to.equal(0);
        });
    });

    it('should respond with a 400 for an invalid id', function () {
      return chai.request(app)
        .delete('/api/snippets/NOT-A-VALID-ID')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });

  });

});
