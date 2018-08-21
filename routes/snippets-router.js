'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Snippet = require('../models/snippet');
const Subtopic = require('../models/subtopic');

const passport =  require('passport');


const router = express.Router();





router.use('/', passport.authenticate('jwt', { session: 
    false, failWithError: true }));



router.get('/', (req, res, next) => {
  //const { id } = req.params;
  const userId = req.user.id;
  
  const { subtopicId } = req.query;
  
  let filter = { userId };//not _id: userId etc.
  if (subtopicId) {
    filter.subTopicId = subtopicId; 
  }

  
  // if (tagId) {
  //   // filter.tags = tags;
  //   filter.tags = tagId;
  // }
  
  //.populate('tags') <=what did this do and do we need something like this?

  Snippet.find(filter)
      
    .sort({ updatedAt: 'desc' })
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

router.get('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  
  Snippet.findOne({ _id: id, userId })

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
  //tags default to empty if no value passed in
  const { title, image } = req.body;
  const userId = req.user.id;
  const subtopicId = req.body.subtopicId ? req.body.subtopicId : undefined;
  const newSnippet = { title, image, subtopicId, userId };
  // For folders, verify the folderId is a valid ObjectId and the item belongs to 
  // the current user. If the validation fails, then return an 
  // error message 'The folderId is not valid' with status 400.
  
    
  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  if (mongoose.Types.ObjectId.isValid(subtopicId)) {
    newSnippet.subtopicId = subtopicId;
  }
 

    
  
  Promise.all([
    validateSubtopicId(subtopicId, userId)
  ])
  
    //if all on one line then dont need return statment
    .then(()=> Snippet.create(newSnippet))
    .then(result => {
      //console.log(res.title);
      res
        .location(`${req.originalUrl}/${result.id}`)
        .status(201)
        .json(result);
    })
    .catch(err => {
      //console.log('CATCH BLOCK ERROR', err);
      next(err);
    });
      
});
  
/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const { id } = req.params;
  const { image, content, subtopicId } = req.body;
  const userId = req.user.id;
  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  
  if (title === '') {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  
  if (subtopicId && !mongoose.Types.ObjectId.isValid(subtopicId)) {
    const err = new Error('The `subtopicId` is not valid');
    err.status = 400;
    return next(err);
  }
  
  
  const updateNote = { image, content, subtopicId };
  
  Snippet.findByIdAndUpdate({ _id: id, userId }, updateNote, { new: true })
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
  
/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  
  Snippet.findByIdAndRemove({ _id: id, userId })
    .then(() => {
      res.sendStatus(204);
    })
    .catch(err => {
      next(err);
    });
});
  
module.exports = router;


function validateSubtopicId(subtopicId, userId) {
  if (subtopicId === undefined) {
    // console.log('HELLO');
    return Promise.resolve();
  }
  if (!mongoose.Types.ObjectId.isValid(subtopicId)) {
      
      
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    //console.log('ERROR FOLDER BLOCK', err);
    return Promise.reject(err);
  }
  return Subtopic.count({ _id: subtopicId, userId })
    .then(count => {
        
        
      if (count === 0) {
        const err = new Error('The `folderId` is not valid');
        err.status = 400;
          
        return Promise.reject(err);
      }
    });
}
  