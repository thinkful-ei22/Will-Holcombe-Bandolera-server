
'use strict';
const express = require('express');
const bodyParser = require('body-parser');

const  User  = require('../models/users');

const router = express.Router();

const jsonParser = bodyParser.json();

// Post to register a new user
router.post('/', jsonParser, (req, res) => {
  
  const requiredFields = ['username', 'password'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  }

  const stringFields = ['username', 'password', 'fullName'];
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== 'string'
  );

  if (nonStringField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Incorrect field type: expected string',
      location: nonStringField
    });
  }

  // If the username and password aren't trimmed we give an error.  Users might
  // expect that these will work without trimming (i.e. they want the password
  // "foobar ", including the space at the end).  We need to reject such values
  // explicitly so the users know what's happening, rather than silently
  // trimming them and expecting the user to understand.
  // We'll silently trim the other fields, because they aren't credentials used
  // to log in, so it's less of a problem.
  const explicityTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicityTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );

  if (nonTrimmedField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedField
    });
  }

  const sizedFields = {
    username: {
      min: 1
    },
    password: {
      min: 10,
      // bcrypt truncates after 72 characters, so let's not give the illusion
      // of security by storing extra (unused) info
      max: 72
    }
  };
  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      'min' in sizedFields[field] &&
            req.body[field].trim().length < sizedFields[field].min
  );
  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      'max' in sizedFields[field] &&
            req.body[field].trim().length > sizedFields[field].max
  );

  if (tooSmallField || tooLargeField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField]
          .min} characters long`
        : `Must be at most ${sizedFields[tooLargeField]
          .max} characters long`,
      location: tooSmallField || tooLargeField
    });
  }

  let {username, password, fullName = ''} = req.body;
  // Username and password come in pre-trimmed, otherwise we throw an error
  // before this
  fullName = fullName.trim();
  

  return User.find({username})
    .count()
    .then(count => {
      if (count > 0) {
        // There is an existing user with the same username
        
        return Promise.reject({
          
          code: 422,
          reason: 'ValidationError',
          message: 'Username already taken',
          location: 'username'
        });
      }
      // If there is no existing user, hash the password
      
      return User.hashPassword(password);
    })
    .then(hash => {
      
      return User.create({
        username,
        password: hash,
        fullName
        
      });
    })
    .then(user => {
   
      return res.status(201).json(user.serialize());
    })
    .catch(err => {
      // Forward validation errors on to the client, otherwise give a 500
      // error because something unexpected has happened
      if (err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({code: 500, message: 'Internal server error'});
    });
});

// Never expose all your users like below in a prod application
// we're just doing this so we have a quick way to see
// if we're creating users. keep in mind, you can also
// verify this in the Mongo shell.
router.get('/', (req, res) => {
  return User.find()
    .then(users => res.json(users.map(user => user.serialize())))
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});

module.exports = router;







// 'use strict';
// const express = require('express');




// const  User  = require('../models/users');//  ** added/user// two dots

// const router = express.Router();



// router.post('/', function (req, res, next) {

// //console.log(req.body);
//   const requiredFields = ['username', 'password'];
//   const missingField = requiredFields.find(field => !(field in req.body));

//   if (missingField) {
//     const err = new Error(`Missing '${missingField}' in request body`);
//     err.status = 422;
//     return next(err);
//   }

//   const stringFields = ['username', 'password', 'fullName'];
//   const nonStringField = stringFields.find(
//     field => field in req.body && typeof req.body[field] !== 'string'
//   );

//   if (nonStringField) {
//     const err = new Error(`Field: '${nonStringField}' must be type String`);
//     err.status = 422;
//     return next(err);
//   }

//   const explicityTrimmedFields = ['username', 'password'];
//   const nonTrimmedField = explicityTrimmedFields.find(
//     field => req.body[field].trim() !== req.body[field]
//   );

//   if (nonTrimmedField) {
//     const err = new Error(`Field: '${nonTrimmedField}' cannot start or end with whitespace`);
//     err.status = 422;
//     return next(err);
//   }

//   // bcrypt truncates after 72 characters, so let's not give the illusion
//   // of security by storing extra **unused** info
//   const sizedFields = {
//     username: { min: 1 },
//     password: { min: 8, max: 72 }
//   };

//   const tooSmallField = Object.keys(sizedFields).find(
//     field => 'min' in sizedFields[field] &&
//       req.body[field].trim().length < sizedFields[field].min
//   );
//   if (tooSmallField) {
//     const min = sizedFields[tooSmallField].min;
//     const err = new Error(`Field: '${tooSmallField}' must be at least ${min} characters long`);
//     err.status = 422;
//     return next(err);
//   }

//   const tooLargeField = Object.keys(sizedFields).find(
//     field => 'max' in sizedFields[field] &&
//       req.body[field].trim().length > sizedFields[field].max
//   );

//   if (tooLargeField) {
//     const max = sizedFields[tooLargeField].max;
//     const err = new Error(`Field: '${tooLargeField}' must be at most ${max} characters long`);
//     err.status = 422;
//     return next(err);
//   }

//   // Username and password were validated as pre-trimmed
//   let { username, password, fullName = '' } = req.body;
//   fullName = fullName.trim();

//   return User.hashPassword(password)
//     .then(digest => {
//       const newUser = {
//         username,
//         password: digest,
//         fullName
//       };
//       return User.create(newUser);
//     })
//     .then(result => {
//       return res.status(201).location(`/api/users/${result.id}`).json(result);
//     })
//     .catch(err => {
//       if (err.code === 11000) {
//         err = new Error('The username already exists');
//         err.status = 400;
//       }
//       next(err);
//     });
// });
// module.exports = router;