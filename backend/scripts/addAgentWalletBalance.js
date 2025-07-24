const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
console.log('MongoDB URI:', process.env.MONGODB_URI);

// Import models
const Wallet = require('../models/Wallet');
const User = require('../models/User');

/**
 * Script to add a specified amount to an agent's wallet
 * Usage: node addAgentWalletBalance.js
 */
const addAgentWalletBalance = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');

    // Find all agent users and print them
    const agents = await User.find({ role: 'agent' });
    
    if (agents.length === 0) {
      console.log('No agent users found');
      process.exit(1);
    }
    
    console.log(`Found ${agents.length} agents:`);
    agents.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.firstName || ''} ${agent.lastName || ''} (${agent.email || 'No email'}) - ID: ${agent._id}`);
    });
    
    // Use the first agent or let user specify which agent to use
    const agent = agents[0];
    console.log(`\nUsing agent: ${agent.firstName || ''} ${agent.lastName || ''} (${agent.email || 'No email'}) - ID: ${agent._id}`);

    // Find or create the agent's wallet
    let wallet = await Wallet.findOne({ user: agent._id });
    console.log('Searching for wallet with user ID:', agent._id);
    
    if (!wallet) {
      console.log('No wallet found for agent, creating new wallet');
      wallet = new Wallet({
        user: agent._id,
        balance: 0,
        creditLimit: 0,
        transactions: [],
      });
    } else {
      console.log(`Found existing wallet with balance: ₹${wallet.balance.toLocaleString()}`);
    }

    const amountToAdd = 1000000;
    const previousBalance = wallet.balance;
    
    // Add the amount to the wallet balance
    wallet.balance += amountToAdd;
    
    // Add a transaction record
    wallet.transactions.push({
      type: 'credit',
      amount: amountToAdd,
      description: 'Initial wallet funding',
      reference: 'ADMIN-FUNDING',
      date: new Date(),
    });

    // Save the wallet
    await wallet.save();
    
    console.log(`Successfully added ₹${amountToAdd.toLocaleString()} to agent's wallet`);
    console.log(`Previous balance: ₹${previousBalance.toLocaleString()}`);
    console.log(`New balance: ₹${wallet.balance.toLocaleString()}`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

// Run the function
addAgentWalletBalance();
