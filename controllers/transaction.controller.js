const Transaction = require('../models/transaction.model.js');
const Category = require('../models/category.model.js');
const { errorHandler } = require('../utils/errorHandler.js'); 


const createTransaction = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentication required. User not found.' });
    }

    const { type, amount, date, description, categoryId, paymentMethod, tags, merchantName } = req.body;
    const userId = req.user._id;

    if (!type || !amount || !date || !categoryId) {
      return res.status(400).json({ message: 'Missing required transaction fields: type, amount, date, categoryId.' });
    }
    if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ message: 'Invalid transaction type. Must be "income" or "expense".' });
    }
    if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number.' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Selected category not found.' });
    }

    if (category.userId && category.userId.toString() !== userId.toString() && category.userId !== null) {
        return res.status(403).json({ message: 'You do not have permission to use this category.' });
    }
    if (category.type !== 'both' && category.type !== type) {
        return res.status(400).json({ message: `Selected category "${category.name}" is a "${category.type}" category, but transaction is "${type}".` });
    }

    const transactionData = {
      userId,
      type,
      amount,
      date: new Date(date),
      description: description || '',
      merchantName: merchantName || '',
      category: {
        _id: category._id,
        name: category.name
      },
      paymentMethod: paymentMethod || '',
      tags: tags || [],
      source: 'manual',
    };

    const newTransaction = await Transaction.create(transactionData);

    res.status(201).json({
      message: 'Transaction added successfully!',
      transaction: newTransaction
    });

  } catch (error) {
    errorHandler(res, error, 500);
  }
};


const getTransactions = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Authentication required. User not found.' });
        }
        const userId = req.user._id;
        const { startDate, endDate, type, categoryId, sortBy = 'date', sortOrder = 'desc', page = 1, limit = 10 } = req.query;

        let query = { userId };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        if (type && ['income', 'expense'].includes(type)) {
            query.type = type;
        }

        if (categoryId) {
            query['category._id'] = categoryId;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const parsedLimit = parseInt(limit);

        const sortOptions = {};
        if (sortBy) {
            sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }

        const transactions = await Transaction.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parsedLimit);

        const totalTransactions = await Transaction.countDocuments(query);

        res.status(200).json({
            transactions,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalTransactions / parsedLimit),
            totalTransactions
        });

    } catch (error) {
        errorHandler(res, error, 500);
    }
};

// update
const updateTransaction = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentication required. User not found.' });
    }

    const transactionId = req.params.id;
    const userId = req.user._id;
    const updateFields = req.body;

    if (updateFields.amount !== undefined && (isNaN(updateFields.amount) || updateFields.amount <= 0)) {
        return res.status(400).json({ message: 'Amount must be a positive number.' });
    }
    if (updateFields.type && !['income', 'expense'].includes(updateFields.type)) {
        return res.status(400).json({ message: 'Invalid transaction type. Must be "income" or "expense".' });
    }
    if (updateFields.date) {
        updateFields.date = new Date(updateFields.date); 
    }

    if (updateFields.categoryId) {
        const category = await Category.findById(updateFields.categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Selected category not found for update.' });
        }

        if (category.userId && category.userId.toString() !== userId.toString() && category.userId !== null) {
            return res.status(403).json({ message: 'You do not have permission to use this category.' });
        }

        if (updateFields.type && category.type !== 'both' && category.type !== updateFields.type) {
            return res.status(400).json({ message: `Updated category "${category.name}" is a "${category.type}" category, but new transaction type is "${updateFields.type}".` });
        } else if (!updateFields.type && category.type !== 'both' && category.type !== (await Transaction.findById(transactionId)).type) {

            return res.status(400).json({ message: `Updated category "${category.name}" is a "${category.type}" category, but transaction is "${(await Transaction.findById(transactionId)).type}".` });
        }

        updateFields.category = {
            _id: category._id,
            name: category.name
        };
        delete updateFields.categoryId; 
    }

    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: transactionId, userId: userId },
      { $set: updateFields, updatedAt: Date.now() }, 
      { new: true, runValidators: true }
    );

    if (!updatedTransaction) {
      return res.status(404).json({ message: 'Transaction not found or you do not have permission to update it.' });
    }

    res.status(200).json({
      message: 'Transaction updated successfully!',
      transaction: updatedTransaction
    });

  } catch (error) {
    errorHandler(res, error, 500);
  }
};

// delete
const deleteTransaction = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentication required. User not found.' });
    }

    const transactionId = req.params.id;
    const userId = req.user._id;

    const deletedTransaction = await Transaction.findOneAndDelete({
      _id: transactionId,
      userId: userId
    });

    if (!deletedTransaction) {
      return res.status(404).json({ message: 'Transaction not found or you do not have permission to delete it.' });
    }

    res.status(200).json({ message: 'Transaction deleted successfully!' });

  } catch (error) {
    errorHandler(res, error, 500);
  }
};


module.exports = {
  createTransaction,
  getTransactions,
  updateTransaction, 
  deleteTransaction 
};