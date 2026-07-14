const mongoose = require('mongoose')
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDatabase = async () => {
    try {
        await mongoose.connect(process.env.URL)
        console.log(" Connected to database ")
    } catch (error) {
        console.error(" Failed to connect to database: ", error.message)
    }
}



module.exports = connectDatabase;