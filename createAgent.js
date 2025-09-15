const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Import User model using absolute path
const User = require('./models/User');

async function createAgent() {
  console.log('Starting agent creation process...');
  
  try {
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    // Connect to MongoDB with better options
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ Successfully connected to MongoDB');

    // Agent details
    const agentData = {
      name: 'Agent 2',
      email: 'agent2@navigatio.com',
      password: 'Agent123!',
      role: 'agent',
      isApproved: true,
      companyName: 'Navigatio',
      phone: '1234567890',
      address: '123 Main St',
      city: 'Mumbai'
    };

    console.log('Checking if agent already exists...');
    // Check if agent already exists
    const existingAgent = await User.findOne({ email: agentData.email });
    if (existingAgent) {
      console.log(`❌ Agent with email ${agentData.email} already exists.`);
      console.log('Agent details:', {
        _id: existingAgent._id,
        role: existingAgent.role,
        isApproved: existingAgent.isApproved
      });
      return;
    }

    console.log('Hashing password...');
    // Hash password
    const salt = await bcrypt.genSalt(10);
    agentData.password = await bcrypt.hash(agentData.password, salt);

    console.log('Creating new agent...');
    // Create agent
    const agent = new User(agentData);
    await agent.save();

    console.log('\n✅ Agent created successfully!');
    console.log('================================');
    console.log(`Name: ${agentData.name}`);
    console.log(`Email: ${agentData.email}`);
    console.log('Password: Agent123! (as provided)');
    console.log(`Role: ${agentData.role}`);
    console.log(`Status: ${agentData.isApproved ? 'Approved' : 'Pending Approval'}`);
    console.log('================================');

  } catch (error) {
    console.error('\n❌ Error creating agent:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.name === 'MongoServerError') {
      console.error('MongoDB Error Code:', error.code);
    }
    
    if (error.errors) {
      console.error('Validation errors:');
      Object.values(error.errors).forEach(err => {
        console.error(`- ${err.properties.message}`);
      });
    }
  } finally {
    // Close the connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB');
    } else {
      console.log('\nℹ️ No active MongoDB connection to close');
    }
  }
}

// Run the function
createAgent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled rejection:', error);
    process.exit(1);
  });
