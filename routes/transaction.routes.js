const express = require('express');
const {
  createTransaction,
  getTransactions,
  updateTransaction, 
  deleteTransaction 
} = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.route('/')
  .post(protect, createTransaction) 
  .get(protect, getTransactions);  

router.route('/:id')
  .put(protect, updateTransaction)    
  .delete(protect, deleteTransaction); 

module.exports = router;