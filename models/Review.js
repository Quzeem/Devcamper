const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'Please add a title'],
    maxlength: [100, 'Maximum length of characters is 100'],
  },
  text: {
    type: String,
    required: [true, 'Please add some text'],
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: [true, 'Please add a rating between 1 and 10'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bootcamp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bootcamp',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

// Prevent a user from adding more than one review per bootcamp
ReviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });

// Static method to get the avg rating of all ratings for a specific bootcamp.
ReviewSchema.statics.getAverageRating = async function (bootcampId) {
  const aggObj = await this.aggregate([
    {
      $match: { bootcamp: bootcampId },
    },
    {
      $group: {
        _id: '$bootcamp',
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  try {
    await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
      averageRating: aggObj[0].averageRating,
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after a new rating is added
ReviewSchema.post('save', function () {
  this.constructor.getAverageRating(this.bootcamp);
});
// Call getAverageRating before a rating is removed
ReviewSchema.pre('remove', function () {
  this.constructor.getAverageRating(this.bootcamp);
});

module.exports = mongoose.model('Review', ReviewSchema);
