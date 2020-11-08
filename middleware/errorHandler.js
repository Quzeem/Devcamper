const ErrorResponse = require('../utils/errorResponse');

// Custom Error Handler --- uses custom error response object instantiated from ErrorResponse class instead of the default
const errorHandler = (err, req, res, next) => {
  // To avoid sending seperate response object in every if statement
  let error = { ...err }; // Make a copy of err object;

  // Include message property in err object also as a property in error object variable
  error.message = err.message;

  // Log error to the console for the developer
  // stack contains the error description and the possible files where the error is comming from
  console.log(err.stack.red);

  // check for error type to set a specific response message and status code
  // Mongoose bad ObjectId -- CastError
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    // assign the instance(object) of custom ErrorResponse Class Constructor to error object variable
    error = new ErrorResponse(message, 404); // error object
    // console.log(error);
  }
  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message); // array
    error = new ErrorResponse(message, 400);
  }

  res
    .status(error.statusCode || 500)
    .json({ success: false, error: error.message || 'Server Error' });
};

module.exports = errorHandler;
