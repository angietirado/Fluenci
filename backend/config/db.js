const dns = require('dns');
const mongoose = require('mongoose');

// Windows DNS sometimes fails SRV lookups for mongodb+srv (querySrv ECONNREFUSED)
if (process.platform === 'win32') {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
}

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI); 

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;