const ErrorResponse = require('../utils/errorResponse')
const Bootcamp = require('../models/Bootcamp');

// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  Public
exports.getBootcamps = async (req, res, next) => {
  try {
    const bootcamps = await Bootcamp.find();
    res
      .status(200)
      .json({ success: true, count: bootcamps.length, data: bootcamps });
  } catch (err) {
    next(err);
  }
};

// @desc    Get a bootcamp
// @route   GET /api/v1/bootcamps/:id
// @access  Public
exports.getBootcamp = async (req, res, next) => {
  try {
    const bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) {
      // For formatted ObjectID but not found in the DB
      // pass in an instance(object) of ErrorResponse to next() function
      return next(
        new ErrorResponse(
          `Bootcamp with the id of ${req.params.id} not found`,
          404
        )
      );
    }
    // else
    res.status(200).json({ success: true, data: bootcamp });
  } catch (err) {
    // For non-formatted ObjectID i.e more than normal characters
    next(err);
  }
};

// @desc    Create a new bootcamp
// @route   POST /api/v1/bootcamps/
// @access  Private
exports.createBootcamp = async (req, res, next) => {
  try {
    const bootcamp = await Bootcamp.create(req.body);
    res.status(201).json({ success: true, data: bootcamp });
  } catch (err) {
    next(err);
  }
};

// @desc    Update an existing bootcamp
// @route   PUT /api/v1/bootcamps/:id
// @access  Private
exports.updateBootcamp = async (req, res, next) => {
  try {
    const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!bootcamp) {
      return next(
        new ErrorResponse(
          `Bootcamp with the id of ${req.params.id} not found`,
          404
        )
      );
    }
    res.status(200).json({ success: true, data: bootcamp });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a bootcamp
// @route   DELETE /api/v1/bootcamps/:id
// @access  Private
exports.deleteBootcamp = async (req, res, next) => {
  try {
    const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);
    if (!bootcamp) {
      return next(
        new ErrorResponse(
          `Bootcamp with the id of ${req.params.id} not found`,
          404
        )
      );
    }
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
