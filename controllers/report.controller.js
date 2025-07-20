const Transaction = require('../models/transaction.model');
const { errorHandler } = require('../utils/errorHandler');
const mongoose = require('mongoose');

// expense by category for graphs

const getExpensesByCategory = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentication required. User not found.' });
    }
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const { startDate, endDate } = req.query;
    let dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    const pipeline = [
      {
        $match: {
          userId: userId,
          type: 'expense',
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }) // date filter
        }
      },
      {
        $group: {
          _id: '$category.name', // grp by catg. name 
          totalAmount: { $sum: '$amount' } // amt sum for each catg.
        }
      },
      {
        $sort: { totalAmount: -1 } // desc order
      },
      {
        $project: {
          _id: 0, 
          category: '$_id',  // renaming
          amount: '$totalAmount' // renaming
        }
      }
    ];

    const expensesByCategory = await Transaction.aggregate(pipeline);

    res.status(200).json(expensesByCategory);
  } catch (error) {
    errorHandler(res, error, 500);
  }
};

// for last 12 months, monthly spending amount.
const getMonthlySpending = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentication required. User not found.' });
    }
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const now = new Date();

    // going back 1 full year and setting up time to start of the first day of that month
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(now.getFullYear() - 1); 
    twelveMonthsAgo.setDate(1); 
    twelveMonthsAgo.setHours(0, 0, 0, 0); 

    const pipeline = [
      {
        $match: {
          userId: userId,
          type: 'expense', 
          date: { $gte: twelveMonthsAgo, $lte: now }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 } 
      },
      {
        $project: {
          _id: 0,
          monthYear: {
            $dateToString: { format: '%Y-%m', date: { $dateFromParts: { year: '$_id.year', month: '$_id.month' } } }
          }, // YYYY-MM
          amount: '$totalAmount'
        }
      }
    ];

    const monthlyData = await Transaction.aggregate(pipeline);

    // result arr for 12 months
    const result = [];
    for (let i = 0; i < 12; i++) {
        const d = new Date(twelveMonthsAgo);
        d.setMonth(d.getMonth() + i);
        const monthYear = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        const existingData = monthlyData.find(item => item.monthYear === monthYear);
        result.push(existingData || { monthYear, amount: 0 });
    }

    res.status(200).json(result);
  } catch (error) {
    errorHandler(res, error, 500);
  }
};

// income vs expense for last 12 months
const getIncomeVsExpense = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentication required. User not found.' });
    }
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const now = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(now.getFullYear() - 1);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const pipeline = [
      {
        $match: {
          userId: userId,
          date: { $gte: twelveMonthsAgo, $lte: now }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalIncome: {
            $sum: {
              $cond: { if: { $eq: ['$type', 'income'] }, then: '$amount', else: 0 }
            }
          },
          totalExpense: {
            $sum: {
              $cond: { if: { $eq: ['$type', 'expense'] }, then: '$amount', else: 0 }
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 } 
      },
      {
        $project: {
          _id: 0,
          monthYear: {
            $dateToString: { format: '%Y-%m', date: { $dateFromParts: { year: '$_id.year', month: '$_id.month' } } }
          },
          income: '$totalIncome',
          expense: '$totalExpense'
        }
      }
    ];

    const monthlyData = await Transaction.aggregate(pipeline);

    // res arr
    const result = [];
    for (let i = 0; i < 12; i++) {
        const d = new Date(twelveMonthsAgo);
        d.setMonth(d.getMonth() + i);
        const monthYear = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        const existingData = monthlyData.find(item => item.monthYear === monthYear);
        result.push(existingData || { monthYear, income: 0, expense: 0 });
    }

    res.status(200).json(result);
  } catch (error) {
    errorHandler(res, error, 500);
  }
};

//summary
const getDashboardSummary = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentication required. User not found.' });
    }
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const today = new Date();
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Total Balance (sum of all income - sum of all expenses)
    const balancePipeline = [
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: { if: { $eq: ['$type', 'income'] }, then: '$amount', else: 0 } }
          },
          totalExpense: {
            $sum: { $cond: { if: { $eq: ['$type', 'expense'] }, then: '$amount', else: 0 } }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalBalance: { $subtract: ['$totalIncome', '$totalExpense'] }
        }
      }
    ];

    const balanceResult = await Transaction.aggregate(balancePipeline);
    const totalBalance = balanceResult.length > 0 ? balanceResult[0].totalBalance : 0;

    // Monthly Income/Expenses for current month and previous month
    const monthlyDataPipeline = [
      {
        $match: {
          userId: userId,
          date: { $gte: startOfPreviousMonth, $lte: today } 
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          income: { $sum: { $cond: { if: { $eq: ['$type', 'income'] }, then: '$amount', else: 0 } } },
          expense: { $sum: { $cond: { if: { $eq: ['$type', 'expense'] }, then: '$amount', else: 0 } } }
        }
      }
    ];

    const monthlyData = await Transaction.aggregate(monthlyDataPipeline);

    let currentMonthIncome = 0;
    let currentMonthExpense = 0;
    let previousMonthIncome = 0;
    let previousMonthExpense = 0;

    monthlyData.forEach(data => {
      const monthDate = new Date(data._id.year, data._id.month - 1);
      if (monthDate.getMonth() === today.getMonth() && monthDate.getFullYear() === today.getFullYear()) {
        currentMonthIncome = data.income;
        currentMonthExpense = data.expense;
      } else if (monthDate.getMonth() === startOfPreviousMonth.getMonth() && monthDate.getFullYear() === startOfPreviousMonth.getFullYear()) {
        previousMonthIncome = data.income;
        previousMonthExpense = data.expense;
      }
    });

   // % changes
    const incomeChange = previousMonthIncome > 0 ? ((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100 : (currentMonthIncome > 0 ? 100 : 0);
    const expenseChange = previousMonthExpense > 0 ? ((currentMonthExpense - previousMonthExpense) / previousMonthExpense) * 100 : (currentMonthExpense > 0 ? 100 : 0);

    // savings rate
    const savingsRate = (currentMonthIncome > 0) ? (((currentMonthIncome - currentMonthExpense) / currentMonthIncome) * 100) : 0;

    res.status(200).json({
      totalBalance: totalBalance,
      monthlyIncome: currentMonthIncome,
      monthlyExpenses: currentMonthExpense,
      incomeChange: parseFloat(incomeChange.toFixed(2)),
      expenseChange: parseFloat(expenseChange.toFixed(2)),
      savingsRate: parseFloat(savingsRate.toFixed(2))
    });

  } catch (error) {
    errorHandler(res, error, 500);
  }
};


module.exports = {
  getExpensesByCategory,
  getMonthlySpending,
  getIncomeVsExpense,
  getDashboardSummary 
};