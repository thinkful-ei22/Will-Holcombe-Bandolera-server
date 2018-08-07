'use strict';
var mongoose = require ('mongoose');

const snippetSchema = mongoose.Schema({
    
  title:{
    type: String,
    required: true
  },
  content: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true  }

});

snippetSchema.set('timestamps', true);

// Customize output for `res.json(data)`, `console.log(data)` etc.
snippetSchema.set('toObject', {
  virtuals:  true,     // include built-in virtual `id`
  versionKey: false,  // remove `__v` version key
  transform: (doc, ret) => {
    delete ret._id; // delete `_id`
  }
});

module.exports = mongoose.model('Snippets', snippetSchema);