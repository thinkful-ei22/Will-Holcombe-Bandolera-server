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

describe('Bandolera API - Topics', function () {






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

  describe('GET /api/folders', function () {

    it('should return a list sorted by name with the correct number of folders', 
      function () {

      
        const dbPromise = Topic.find({userId: user.id });
        const apiPromise = chai.request(app)
          .get('/api/topics')
          .set('Authorization', `Bearer ${token}`); // <<== Add this

        return Promise.all([dbPromise, apiPromise])
          .then(([data, res]) => {
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.a('array');
            expect(res.body).to.have.length(data.length);
          });
      });

    it('should return a list with the correct fields and values', function () {
      
      const dbPromise = Topic.find({ userId: user.id }); // <<== Add filter on User Id
      const apiPromise = chai.request(app)
        .get('/api/topics')
        .set('Authorization', `Bearer ${token}`); // <<== Add Authorization header
    
      return Promise.all([dbPromise, apiPromise])
      //need _data in there
        .then(([_data, res]) => {
         
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          res.body.forEach(function (item) {
            
            expect(item).to.be.a('object');
            expect(item).to.have.keys('id', 'title', 'userId', 'createdAt', 'updatedAt');  // <<== Update assertion
          });
        });
    });


    describe('GET /api/folders/:id', function () {

      it('should return correct folder', function () {
        let data;
        Topic.findOne({ userId: user.id })
          .then(_data => { //why no brackets here?
            data = _data;
       
            const apiPromise = chai.request(app)
              .get(`/api/topics/${data.id}`)
              .set('Authorization', `Bearer ${token}`);
            return apiPromise;
          })
    
          .then((res) => {
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.all.keys('id', 'title', 'createdAt', 'userId', 'updatedAt');
            expect(res.body.id).to.equal(data.id);
            expect(res.body.title).to.equal(data.title);
            expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
            expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
          });
      });

      it('should respond with a 400 for an invalid id', function () {
        const apiPromise = chai.request(app)
          .get('/api/topics/NOT-VALID-ID22')
          .set('Authorization', `Bearer ${token}`);
        return apiPromise
          .then(res => {
            //console.log(res.status);
            expect(res).to.have.status(400);
            expect(res.body.message).to.equal('The `id` is not valid');
          });
      });

      it('should respond with a 404 for an ID that does not exist', function () {
        // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
        const apiPromise = chai.request(app)
          .get('/api/topics/999999999999999999999999')
          .set('Authorization', `Bearer ${token}`);
        return apiPromise
          .then(res => {
            expect(res).to.have.status(404);
          });
      });
    });
 

    describe('POST /api/folders', function () {

      it('should create and return a new item when provided valid data', function () {
        const newItem = { title: 'newFolder' };
        let body;

        const apiPromise = chai.request(app)
          .post('/api/topics')
          .set('Authorization', `Bearer ${token}`)
          .send(newItem);
        return apiPromise
          .then(function (res) {
            body = res.body;
            //console.log(res.body);
            expect(res).to.have.status(201);
            expect(res).to.have.header('location');
            expect(res).to.be.json;
            expect(body).to.be.a('object');
            expect(body).to.have.all.keys('id', 'title', 'createdAt', 'updatedAt', 'userId');
            
            //return userId in addition
            return Topic.findById(body.id);
          })
          .then(data => {
            //console.log(data);
            //console.log(body.name, data.name);
            expect(mongo.ObjectID(user.id)).to.eql(data.userId);
            expect(body.id).to.equal(data.id);
            expect(body.title).to.equal(data.title);
            //casting as date
            expect(new Date(body.createdAt)).to.eql(data.createdAt);
            expect(new Date(body.updatedAt)).to.eql(data.updatedAt);
          });
      });

      it('should return an error when missing "name" field', function () {
        const newItem = { 'foo': 'bar' };
        return chai.request(app)
          .post('/api/topics')
          .set('Authorization', `Bearer ${token}`)
          .send(newItem)
          .then(res => {
            expect(res).to.have.status(400);
            expect(res).to.be.json;
            expect(res.body).to.be.a('object');
            expect(res.body.message).to.equal('Missing `title` in request body');
          });
      });

      // it('should return an error when given a duplicate name', function () {
      //   return Topic.findOne({userId: user.id })
      //     .then(data => {
      //         //console.log(data);
      //       const newItem = { title: data.title };
      //       return chai.request(app).post('/api/topics').set('Authorization', `Bearer ${token}`)
      //         .send(newItem);
      //     })
      //     .then(res => {
      //       expect(res).to.have.status(400);
      //       expect(res).to.be.json;
      //       expect(res.body).to.be.a('object');
      //       expect(res.body.message).to.equal('Folder name already exists');
      //     });
      // });

    });

    describe('PUT /api/folders/:id', function () {

      it('should update the folder', function () {
        const updateItem = { title: 'Updated Name' };
        let data;
        return Topic.findOne({userId: user.id })
          .then(_data => {
            data = _data;
            return chai.request(app).put(`/api/topics/${data.id}`)
              .set('Authorization', `Bearer ${token}`)
              .send(updateItem);
          })
          .then(function (res) {
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.all.keys('id', 'title', 'createdAt', 'updatedAt', 'userId');
            expect(res.body.id).to.equal(data.id);
            expect(res.body.title).to.equal(updateItem.title);
            expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
            // expect item to have been updated
            expect(new Date(res.body.updatedAt)).to.greaterThan(data.updatedAt);
          });
      });


      it('should respond with a 400 for an invalid id', function () {
        const updateItem = { title: 'Blah' };
        return chai.request(app)
          .put('/api/topics/NOT-A-VALID-ID')
          .set('Authorization', `Bearer ${token}`)
          
          .send(updateItem)
          .then(res => {
            expect(res).to.have.status(400);
            expect(res.body.message).to.equal('The `id` is not valid');
          });
      });

      it('should respond with a 404 for an id that does not exist', function () {
        const updateItem = { title: 'Blah' };
        // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
        return chai.request(app)
          .put('/api/topics/DOESNOTEXIST')
          .set('Authorization', `Bearer ${token}`)
          .send(updateItem)
          .then(res => {
            expect(res).to.have.status(404);
          });
      });

      it('should return an error when missing "name" field', function () {
        const updateItem = {};
        let data;
        return Topic.findOne({userId: user.id })
          .then(_data => {
            data = _data;
            return chai.request(app).put(`/api/topics/${data.id}`)
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

      // it('should return an error when given a duplicate name', function () {
      //   return Topic.find({userId: user.id }).limit(2)
      //     .then(results => {
      //       const [item1, item2] = results;
      //       item1.title = item2.title;
      //       return chai.request(app)
      //         .put(`/api/topics/${item1.id}`)
      //         .set('Authorization', `Bearer ${token}`)
      //         .send(item1);
      //     })
      //     .then(res => {
      //       expect(res).to.have.status(400);
      //       expect(res).to.be.json;
      //       expect(res.body).to.be.a('object');
      //       expect(res.body.message).to.equal('Folder name already exists');
      //     });
      // });

    });

    describe('DELETE /api/folders/:id', function () {

      it('should delete an existing document and respond with 204', function () {
          console.log(user.id);
        let data;
        return Topic.findOne({userId: user.id })
          .then(_data => {
              
            data = _data;
            return chai.request(app).delete(`/api/topics/${data.id}`)
              .set('Authorization', `Bearer ${token}`);
          })
          .then(function (res) {
            expect(res).to.have.status(204);
            expect(res.body).to.be.empty;
            return Topic.count({ _id: data.id });
          })
          .then(count => {
            expect(count).to.equal(0);
          });
      });

      it('should respond with a 400 for an invalid id', function () {
        return chai.request(app)
          .delete('/api/topics/NOT-A-VALID-ID')
          .set('Authorization', `Bearer ${token}`)
          .then(res => {
            expect(res).to.have.status(400);
            expect(res.body.message).to.equal('The `id` is not valid');
          });
      });

    });

  });
});