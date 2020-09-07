const express = require('express');
const dotenv = require('dotenv');
const logger = require('morgan');
const colors = require('colors');
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./config/db');

// Load enviroment variables
dotenv.config({ path: './config/config.env' });

// Connect to Database
connectDB();

// Route files
const bootcamps = require('./routes/bootcamps');

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(logger('dev'));
}

// Mount routers
app.use('/api/v1/bootcamps', bootcamps);

// Custom Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow
      .bold
  )
);

// Global Handler for Unhandled Promise Rejections - close the server when this kind of err happens
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process with failure
  server.close(() => process.exit(1));
});
