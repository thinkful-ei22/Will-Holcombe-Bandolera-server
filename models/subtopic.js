'use strict';
var mongoose = require ('mongoose');

const subtopicSchema = new mongoose.Schema({
    
  title:{
    type: String,
    required: true,
    unque: true
  },
  

  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: false  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false  }

});

//folderSchema.index({ name: 1, userId: 1}, { unique: true });

subtopicSchema.set('timestamps', true);

// Customize output for `res.json(data)`, `console.log(data)` etc.
subtopicSchema.set('toObject', {
  virtuals:  true,     // include built-in virtual `id`
  versionKey: false,  // remove `__v` version key
  transform: (doc, ret) => {
    delete ret._id; // delete `_id`
  }
});

module.exports = mongoose.model('Subtopics', subtopicSchema);