const Wallet = require('../models/Wallet');
const User = require('../models/User');

// @desc    Get wallet by user ID
// @route   GET /api/wallet/:userId
// @access  Private/Admin/Sales
exports.getWalletByUserId = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.params.userId }).populate('user', 'name email companyName');

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get my wallet (for agents) - creates a wallet if it doesn't exist
// @route   GET /api/wallets/my-wallet
// @access  Private/Agent
exports.getMyWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user.id });

    // If wallet doesn't exist, create a new one for the agent
    if (!wallet) {
      console.log(`Creating new wallet for agent: ${req.user.id}`);
      
      wallet = new Wallet({
        user: req.user.id,
        balance: 0,
        creditLimit: 0,
        transactions: [],
        createdAt: new Date()
      });
      
      await wallet.save();
      console.log(`New wallet created successfully for agent: ${req.user.id}`);
    }

    res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (err) {
    console.error('Error in getMyWallet:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update wallet credit limit
// @route   PUT /api/wallet/:userId/credit-limit
// @access  Private/Admin/Sales
exports.updateCreditLimit = async (req, res) => {
  try {
    const { creditLimit } = req.body;

    // Validate credit limit
    if (creditLimit === undefined || creditLimit < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid credit limit',
      });
    }

    // Check if user exists and is an agent
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role !== 'agent') {
      return res.status(400).json({
        success: false,
        message: 'Credit limit can only be set for agents',
      });
    }

    // Update wallet
    const wallet = await Wallet.findOneAndUpdate(
      { user: req.params.userId },
      { creditLimit },
      { new: true, runValidators: true }
    );

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Add transaction to wallet
// @route   POST /api/wallet/:userId/transaction
// @access  Private/Admin/Sales
exports.addTransaction = async (req, res) => {
  try {
    const { type, amount, description, reference } = req.body;

    // Validate transaction data
    if (!type || !['credit', 'debit'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid transaction type (credit or debit)',
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount',
      });
    }

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a transaction description',
      });
    }

    // Check if user exists and is an agent
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role !== 'agent') {
      return res.status(400).json({
        success: false,
        message: 'Transactions can only be added to agent wallets',
      });
    }

    // Get wallet
    const wallet = await Wallet.findOne({ user: req.params.userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    // Calculate new balance
    let newBalance = wallet.balance;
    if (type === 'credit') {
      newBalance += amount;
    } else {
      // Check if debit would exceed available balance + credit limit
      if (amount > wallet.balance + wallet.creditLimit) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient funds. Transaction exceeds available balance and credit limit',
        });
      }
      newBalance -= amount;
    }

    // Add transaction
    wallet.transactions.push({
      type,
      amount,
      description,
      reference,
      date: Date.now(),
    });

    // Update balance
    wallet.balance = newBalance;

    await wallet.save();

    res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get all wallets with filters
// @route   GET /api/wallet
// @access  Private/Admin/Sales
exports.getAllWallets = async (req, res) => {
  try {
    const { search, minBalance, maxBalance, minCreditLimit, maxCreditLimit } = req.query;

    // Build query for wallet filtering
    const query = {};

    // Apply balance filters
    if (minBalance !== undefined) {
      query.balance = { $gte: parseFloat(minBalance) };
    }
    if (maxBalance !== undefined) {
      query.balance = { ...query.balance, $lte: parseFloat(maxBalance) };
    }

    // Apply credit limit filters
    if (minCreditLimit !== undefined) {
      query.creditLimit = { $gte: parseFloat(minCreditLimit) };
    }
    if (maxCreditLimit !== undefined) {
      query.creditLimit = { ...query.creditLimit, $lte: parseFloat(maxCreditLimit) };
    }

    // Get user IDs if searching by name or email
    let userIds = [];
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } },
        ],
        role: 'agent',
      }).select('_id');

      userIds = users.map(user => user._id);
      
      if (userIds.length > 0) {
        query.user = { $in: userIds };
      } else {
        // No users found matching search criteria
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
        });
      }
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const wallets = await Wallet.find(query)
      .populate('user', 'name email companyName')
      .skip(startIndex)
      .limit(limit)
      .sort({ balance: -1 });

    const total = await Wallet.countDocuments(query);

    res.status(200).json({
      success: true,
      count: wallets.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: wallets,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get wallet transaction history
// @route   GET /api/wallet/:userId/transactions
// @access  Private/Admin/Sales/Agent(own)
exports.getTransactionHistory = async (req, res) => {
  try {
    // Check if user is authorized to view this wallet
    if (req.user.role === 'agent' && req.user.id !== req.params.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this wallet',
      });
    }

    const wallet = await Wallet.findOne({ user: req.params.userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    // Pagination for transactions
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const transactions = wallet.transactions
      .sort((a, b) => b.date - a.date)
      .slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total: wallet.transactions.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(wallet.transactions.length / limit),
      },
      data: transactions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
