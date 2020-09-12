const advancedResults = (model, populate) => async (req, res, next) => {
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
  query = model.find(JSON.parse(queryStr)).populate('courses');

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
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const totalDoc = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  // Check for populate argument
  if (populate) {
    query = query.populate(populate);
  }

  // Executing query
  const results = await query;

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

  // add advancedResults object as a property to response object
  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  };

  // call the next function in the application request-response cycle
  next();
};

module.exports = advancedResults;
