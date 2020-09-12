const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const Bootcamp = require('../models/Bootcamp');

// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  let query;
  // Copy req.query(query object) into reqQuery
  const reqQuery = { ...req.query };
  // Things to exclude from fields to match for filtering
  const excludeFields = ['select', 'sort', 'page', 'limit'];
  // Loop over excludeFields and delete them from reqQuery(request query)
  excludeFields.forEach((param) => delete reqQuery[param]);
  // Create query string
  let queryStr = JSON.stringify(reqQuery);
  // Create mongoDB operators ($gt, $gte, etc.)
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  // Finding resource
  query = Bootcamp.find(JSON.parse(queryStr)).populate('courses');

  // Select Fields from document(s) --- Bootcamp.find().select()
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }
  // Sort Documents by field(s) --- Ascending(1) or Descending(-1)
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    // default sort using createdAt in descending order
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const totalDoc = await Bootcamp.countDocuments();
  query = query.skip(startIndex).limit(limit);
  // Executing query
  const bootcamps = await query;
  // Pagination Result
  const pagination = {};
  // show/hide next logic
  if (endIndex < totalDoc) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }
  // show/hide prev logic
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }
  // Send response
  res.status(200).json({
    success: true,
    count: bootcamps.length,
    pagination,
    data: bootcamps,
  });
});

// @desc    Get a bootcamp
// @route   GET /api/v1/bootcamps/:id
// @access  Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
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
});

// @desc    Create a new bootcamp
// @route   POST /api/v1/bootcamps/
// @access  Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.create(req.body);
  res.status(201).json({ success: true, data: bootcamp });
});

// @desc    Update an existing bootcamp
// @route   PUT /api/v1/bootcamps/:id
// @access  Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
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
});

// @desc    Delete a bootcamp
// @route   DELETE /api/v1/bootcamps/:id
// @access  Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Bootcamp with the id of ${req.params.id} not found`,
        404
      )
    );
  }
  // Trigger cascade deletion of associated documents
  bootcamp.remove();

  res.status(200).json({ success: true, data: {} });
});

// @desc    Get bootcamps within a radius
// @route   /api/v1/bootcamps/radius/:zipcode/:distance
// @access  Public
exports.getBootcampsWithinRadius = asyncHandler(async (req, res, next) => {
  // Get zipcode and distance from user
  const { zipcode, distance } = req.params;

  //  Get long and lat by geocoding
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const long = loc[0].longitude;

  // Calc radius using radians --> radius(r) = distance(d) / radius of the earth(R)
  // R = 3,963 mi(in miles) or 6,378 km(in kilometres)
  // For our distance(d), we're assuming it's in miles.
  const radius = distance / 3963;

  // Get bootcamps within the radius calculated from tdistancehe specified
  const bootcamps = await Bootcamp.find({
    location: { $geoWithin: { $centerSphere: [[long, lat], radius] } },
  });
  res
    .status(200)
    .json({ success: true, count: bootcamps.length, data: bootcamps });
});

// @desc    Upload photo for bootcamp
// @route   PUT /api/v1/bootcamps/:id/photo
// @access  Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Bootcamp with the id of ${req.params.id} not found`,
        404
      )
    );
  }

  // Check if a file was uploaded
  if (!req.files) {
    return next(new ErrorResponse('Please upload a file', 404));
  }

  //  Destructure file object from req.files
  const { file } = req.files;

  // Make sure the file is a photo
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse('Please upload an image file', 404));
  }

  // Check filesize
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload an image file less than ${process.env.MAX_FILE_UPLOAD}`,
        404
      )
    );
  }

  // Create custom filename
  file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

  // Upload file
  file.mv(path.join(process.env.FILE_UPLOAD_PATH, file.name), async (err) => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse('Problem with file upload', 500));
    }
    // else insert the file name into the DB
    await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });
    // Send response
    res.status(200).json({ success: true, data: file.name });
  });
});
