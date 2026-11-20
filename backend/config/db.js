const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

let mongoMemoryServerInstance = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  const uri = process.env.MONGO_URI;

  // 1. If explicit Atlas or external MongoDB URI is provided, attempt connection
  if (uri && uri.trim() !== '') {
    try {
      console.log(`[Database] Attempting connection to MongoDB via MONGO_URI...`);
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
      console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.error(`[Database] Failed to connect to MONGO_URI: ${err.message}`);
      console.log(`[Database] Falling back to persistent embedded MongoDB engine...`);
    }
  }

  // 2. Fallback to embedded persistent MongoDB for zero-configuration local runs & viva demos
  try {
    const cachedBin = path.join(__dirname, '../node_modules/.cache/mongodb-memory-server/mongod-x64-win32-7.0.24.exe');
    if (fs.existsSync(cachedBin)) {
      process.env.MONGOMS_SYSTEM_BINARY = cachedBin;
    }

    const { MongoMemoryServer } = require('mongodb-memory-server');
    const dataDir = path.join(__dirname, '../.mongo-data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    try {
      mongoMemoryServerInstance = await MongoMemoryServer.create({
        instance: {
          port: 27017,
          dbName: 'invento',
          dbPath: dataDir,
          storageEngine: 'wiredTiger'
        }
      });
    } catch (portErr) {
      mongoMemoryServerInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'invento',
          dbPath: dataDir,
          storageEngine: 'wiredTiger'
        }
      });
    }

    const memoryUri = mongoMemoryServerInstance.getUri('invento');
    const conn = await mongoose.connect(memoryUri);
    console.log(`[Database] Running embedded MongoDB instance at: ${memoryUri}`);
    console.log(`[Database] Storage directory: ${dataDir}`);
    console.log(`[Database] MongoDB Connected successfully (Local Storage Mode)`);
    return conn;
  } catch (err) {
    console.error(`[Database] Error starting embedded MongoDB: ${err.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServerInstance) {
      await mongoMemoryServerInstance.stop();
    }
  } catch (err) {
    console.error(`[Database] Error disconnecting: ${err.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
