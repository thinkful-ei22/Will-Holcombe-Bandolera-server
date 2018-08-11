// 'use strict';
// const chai = require('chai');
// const chaiHttp = require('chai-http');


// const { app } = require('../index');


// chai.use(chaiHttp);
// const expect = chai.expect;

// const {TEST_DATABASE_URL} = require('../config');
// const {dbConnect, dbDisconnect} = require('../db-mongoose');
// // const {dbConnect, dbDisconnect} = require('../db-knex');

// // Set NODE_ENV to `test` to disable http layer logs
// // You can do this in the command line, but this is cross-platform
// process.env.NODE_ENV = 'test';

// // Clear the console before each run
// process.stdout.write('\x1Bc\n');

// chai.use(chaiHttp);

// before(function() {
//   return dbConnect(TEST_DATABASE_URL);
// });

// after(function() {
//   return dbDisconnect();
// });

// describe('Mocha and Chai', function() {
//   it('should be properly setup', function() {
//     expect(true).to.be.true;
//   });
// });
// describe('Reality check', function () {

//   it('true should be true', function () {
//     expect(true).to.be.true;
//   });

//   it('2 + 2 should equal 4', function () {
//     expect(2 + 2).to.equal(4);
//   });

// });


// // describe('Express static', function () {

// //   it('GET request "/" should return the index page', function () {
// //     return chai.request(app)
// //       .get('/')
// //       .then(function (res) {
// //         expect(res).to.exist;
// //         expect(res).to.have.status(200);
// //         expect(res).to.be.html;
// //       });
// //   });

// // });

// // describe('404 handler', function () {

// //   it('should respond with 404 when given a bad path', function () {
// //     return chai.request(TEST_DATABASE_URL)
// //       .get('/DOES/NOT/EXIST')
// //       .then(res => {
// //         expect(res).to.have.status(404);
// //       });
// //   });

// });
