const dns = require('dns');
const mongoose = require('mongoose');

// Windows DNS sometimes fails SRV lookups for mongodb+srv (querySrv ECONNREFUSED)
if (process.platform === 'win32') {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error(
            'MONGO_URI is not defined. Set it in Vercel Environment Variables or backend/config/config.env'
        );
    }

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(process.env.MONGO_URI).then((m) => {
            console.log(`MongoDB Connected: ${m.connection.host}`);
            return m;
        });
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (error) {
        cached.promise = null;
        console.error(`Error connecting to MongoDB: ${error.message}`);
        throw error;
    }
};

module.exports = connectDB;
