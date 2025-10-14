const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to the database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Update the Sightseeing schema
exports.up = async function(next) {
  try {
    await connectDB();
    
    // Get the collection
    const db = mongoose.connection.db;
    const collection = db.collection('sightseeings');
    
    // Update the schema to include 'NONE' in the enum
    await db.command({
      collMod: 'sightseeings',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          properties: {
            transferType: {
              bsonType: 'string',
              enum: ['SIC', 'PVT', 'NONE'],
              description: 'Must be either SIC, PVT, or NONE.'
            }
          }
        }
      }
    });
    
    console.log('Successfully updated transferType enum to include NONE');
    next();
  } catch (err) {
    console.error('Migration failed:', err);
    next(err);
  }
};

// Revert the changes (if needed)
exports.down = async function(next) {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    
    // Revert the schema to original enum values
    await db.command({
      collMod: 'sightseeings',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          properties: {
            transferType: {
              bsonType: 'string',
              enum: ['SIC', 'PVT'],
              description: 'Must be either SIC or PVT.'
            }
          }
        }
      }
    });
    
    console.log('Successfully reverted transferType enum changes');
    next();
  } catch (err) {
    console.error('Migration rollback failed:', err);
    next(err);
  }
};
