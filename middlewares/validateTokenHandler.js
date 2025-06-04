const jwt = require('jsonwebtoken') // Importing the JSON Web Token library
const asyncHandler = require('express-async-handler') // Importing async handler for handling async errors

// Middleware to validate the token
const validateToken = (req, res, next) => {
    // Extract the Authorization header from the request
    const authHeader = req.headers.Authorization || req.headers.authorization
    // Check if the Authorization header exists and starts with 'Bearer'
    if (authHeader && authHeader.startsWith('Bearer')) {
        // Extract the token from the Authorization header
        const token = authHeader.split(' ')[1]
        // Verify the token using the secret key
        jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
            if (err) {
                // If token verification fails, return a 401 Unauthorized response
                res.status(401).json('Token is not Valid')
            }
            if (!err) {
                // If token is valid, attach the decoded user information to the request object
                req.user = decoded
                next() // Proceed to the next middleware
            }
        })
    } else {
        // If no token is provided, return a 401 Unauthorized response
        return res.status(401).json('You are not authenticated')
    }
}

// Middleware to validate the token and check if the user is authorized
const validateTokenAndAuth = (req, res, next) => {
    // Call validateToken middleware
    validateToken(req, res, () => {
        // Check if the user ID matches the request parameter or if the user is an admin
        if (req.user._id == req.params.id || req.user.isAdmin) {
            next() // Proceed to the next middleware
        } else {
            // If the user is not authorized, return a 400 Bad Request response
            res.status(400).json('You do not have the permission')
        }
    })
}

// Middleware to validate the token and check if the user is an admin
const AdminAuth = (req, res, next) => {
    // Call validateToken middleware
    validateToken(req, res, () => {
        // Check if the user is an admin
        if (req.user.isAdmin) {
            next() // Proceed to the next middleware
        } else {
            // If the user is not an admin, return a 400 Bad Request response
            res.status(400).json('Only Admin has Access')
        }
    })
}

// Exporting the middleware functions for use in other parts of the application
module.exports = { validateToken, validateTokenAndAuth, AdminAuth }