const errorHandler = (res, error, statusCode = 500) => {
    console.error("API Error:", error.message, error.stack);

    const code = error.statusCode || statusCode;

    res.status(code).json({
        message: error.message || 'An unexpected error occurred',
    });
};

module.exports = { errorHandler };