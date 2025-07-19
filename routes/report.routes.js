// backend/src/routes/report.routes.js
const express = require('express');
const {
  getExpensesByCategory,
  getMonthlySpending,
  getIncomeVsExpense,
  getDashboardSummary
} = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/expenses-by-category', protect, getExpensesByCategory);
router.get('/monthly-spending', protect, getMonthlySpending);
router.get('/income-vs-expense', protect, getIncomeVsExpense);
router.get('/dashboard-summary', protect, getDashboardSummary); // optional route

module.exports = router;