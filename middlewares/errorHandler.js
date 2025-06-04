// Middleware to handle 404 errors (resource not found)
const notFound = (req, res, next) => {
    // Create a new error object with a message indicating the requested URL was not found
    const error = new Error(`Not Found: ${req.originalUrl}`);
    // Set the HTTP status code to 404
    res.status(404);
    // Pass the error to the next middleware
    next(error);
};


// Middleware to handle errors
const errorHandler = (err, req, res, next) => {
    // If the response status code is 200 (OK), set it to 500 (Internal Server Error)
    const statusCode = res.statusCode == 200 ? 500 : res.statusCode;
    // Set the HTTP status code for the response
    res.status(statusCode);
    // Send a JSON response with the error message and stack trace
    res.json({
        msg: err?.message, // Error message
        stack: err?.stack  // Stack trace (useful for debugging)
    });
};

module.exports = { notFound, errorHandler }