const mongoose = require('mongoose') // Import the mongoose library for MongoDB interaction

// Define an asynchronous function to connect to the MongoDB database
const connectDb = async(req, res) => {
    try {
        // Attempt to connect to the MongoDB database using the connection string from environment variables
        const connect = await mongoose.connect(process.env.MONGO_URL)
        // Log a success message with the name of the connected database
        console.log(`connected to DB ${connect.connection.name}`);
    } catch (error) {
        // Log any errors that occur during the connection attempt
        console.log(error);
    }
}

// Export the connectDb function for use in other parts of the application
module.exports = connectDb