const mongoose = require('mongoose');

const connectDB = async () => {
  const db = await mongoose.connect(process.env.DEV_LOCAL_MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });
  console.log(`MongoDB Connected: ${db.connection.host}`.cyan.underline.bold);
};

module.exports = connectDB;
