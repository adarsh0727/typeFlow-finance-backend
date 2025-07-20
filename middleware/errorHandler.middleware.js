const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || 'An unexpected error occurred.',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = { errorHandler };