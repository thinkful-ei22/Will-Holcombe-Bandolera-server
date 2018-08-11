'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Subtopic = require('../models/subtopic');
//const Snippet = require('../models/snippet');
const Topic = require('../models/topic');
const Snippet = require('../models/snippet');

const router = express.Router();
const passport =  require('passport');

/* ========== GET/READ ALL ITEMS ========== */
router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

router.get('/', (req, res, next) => {
  const userId = req.user.id;// or remove id if destructure
  Topic.find({userId})
    .sort('title')
    .then(results => {
      console.log(results);
      res.json(results);
      
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const { id } = req.params;
  const { userId }= req.user;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    //console.log(err.message);
    return next(err);
  }

  Topic.findById({_id: id, userId})
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const { title } = req.body;
  const  userId  = req.user.id;
  const newTopic = { title, userId };
 
  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  Topic.create(newTopic)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Topic title already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const { id } = req.params;
 
  const { title } = req.body;
  const { userId } = req.user;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const updateTopic = { title };
  //console.log(updateTopic);

  Topic.findByIdAndUpdate({_id: id, userId}, updateTopic, { new: true })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Topic name already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.user;
  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  //const topicRemovePromise = Topic.findByIdAndRemove({_id: id, userId});

  //let snippetsUnderTopicToDelete = [];
  // {$in: subtopicsId }
  
  Subtopic.find({ topicId: id }, userId)
    .then( subtopics => subtopics.map( subtopic => {
      //console.log(subtopic.id);
      return subtopic.id;
    }))
    .then(subtopicIds => { 
      
      //console.log({subtopicsId : {$in: subtopicId }});
      //console.log(subtopicIds);
      const promises = subtopicIds.map(subtopicId => {
        return  Snippet.deleteMany({subtopicId  });
      });
      return Promise.all(promises);
    })
    .then(()=> 
      Subtopic.deleteMany(
        { topicId: id },
        userId
      ))
    .then(() =>   
      Topic.deleteOne(
        {_id: id},
        userId
      ))
    .then(() => {
      res.sendStatus(204);
    })
    .catch(err => {
      next(err);
    });
});


// const subtopicRemovePromise = Subtopic.deleteMany(
//   { topicId: id },
//   userId
// );

// const deleteTopic = Topic.deleteOne(
//   {_id: id},
//   userId
// );

// Promise.all([ subtopicRemovePromise, snippetsUnderTopicToDelete, deleteTopic])
  
module.exports = router;





// const subtopicRemovePromise = Subtopic.findByIdAndRemove({_id: id, userId});

// // const snippetRemovePromise = Snippet.updateMany(
// //   { subtopicId: id },
// //   { $unset: { subtopicId: '' } }
// // );
// const snippetRemovePromise = Snippet.deleteMany(
//   { subtopicId: id }, userId
// );


// Promise.all([subtopicRemovePromise, snippetRemovePromise])
//   .then(() => {
//     res.sendStatus(204);
//   })
//   .catch(err => {
//     next(err);
//   });
// });