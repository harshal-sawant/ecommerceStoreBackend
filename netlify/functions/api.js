const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { notFound, errorHandler } = require('../../middlewares/errorHandler');
const connectDb = require('../../config/dbConnection');
const cors = require('cors'); // ✅ Add this line

// Create an Express app
const app = express();

// Enable CORS
app.use(cors()); // Add the cors middleware to allow cross-origin requests

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Define routes
app.use('/api/auth', require('../../routes/authRoute'));
app.use('/api/products', require('../../routes/productRoute'));
app.use('/api/users', require('../../routes/userRoute'));
app.use('/api/carts', require('../../routes/cartRoute'));
app.use('/api/orders', require('../../routes/orderRoute'));

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Connect to the database
connectDb();

// Export the app as a Netlify function
const serverless = require('serverless-http');
module.exports.handler = serverless(app);