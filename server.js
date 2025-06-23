const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const connectDb = require('./config/dbConnection')
const dotenv = require('dotenv').config()
const express = require('express')
const { notFound, errorHandler } = require('./middlewares/errorHandler')
const cors = require('cors')
const app = express()

const port = process.env.PORT || 5050
app.use(cors())
//app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())

// Define routes with the Netlify function base path
app.use('/.netlify/functions/api/auth', (req, res, next) => {
    console.log('Auth route hit');
    next();
}, require('./routes/authRoute'));

app.use('/.netlify/functions/api/products', (req, res, next) => {
    console.log('Products route hit');
    next();
}, require('./routes/productRoute'));

app.use('/.netlify/functions/api/users', require('./routes/userRoute'));
app.use('/.netlify/functions/api/carts', require('./routes/cartRoute'));
app.use('/.netlify/functions/api/orders', require('./routes/orderRoute'));

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start the server
app.listen(port, () => {
    connectDb();
    console.log(`Listening to ${port}`);
});