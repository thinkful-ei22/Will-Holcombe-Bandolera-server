'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Subtopic = require('../models/subtopic');
const Snippet = require('../models/snippet');

const router = express.Router();
const passport =  require('passport');

/* ========== GET/READ ALL ITEMS ========== */
router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

router.get('/', (req, res, next) => {
  const userId = req.user.id;// or remove id if destructure
  Subtopic.find({userId})
    .sort('title')
    .then(results => {
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

  Subtopic.findById({_id: id, userId})
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
  const newSubtopic = { title, userId };
 
  /***** Never trust users - validate input *****/
  if (!name) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  Subtopic.create(newSubtopic)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Subtopic title already exists');
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

  const updateSubtopic = { title };

  Subtopic.findByIdAndUpdate({_id: id, userId}, updateSubtopic, { new: true })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Subtopic title already exists');
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

  const subtopicRemovePromise = Subtopic.findByIdAndRemove({_id: id, userId});

  const snippetRemovePromise = Snippet.updateMany(
    { subtopicId: id },
    { $unset: { subtopicId: '' } }
  );

  Promise.all([subtopicRemovePromise, snippetRemovePromise])
    .then(() => {
      res.sendStatus(204);
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
