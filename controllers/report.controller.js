const Transaction = require('../models/transaction.model');
const { errorHandler } = require('../middleware/errorHandler.middleware');
const mongoose = require('mongoose');

// expense by category for graphs

const getExpensesByCategory = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentication required. User not found.' });
    }

    
    const userId = req.user._id.toString();
console.log('User ID type:', typeof userId, userId); 
    // console.log(userId);
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = {
      userId: userId, 
      type: 'expense',
    };

    if (Object.keys(dateFilter).length > 0) {
      matchStage.date = dateFilter;
    }

    const pipeline = [
      { $match: matchStage },
      { $group: { _id: '$category.name', totalAmount: { $sum: '$amount' } } },
      { $sort: { totalAmount: -1 } },
      { $project: { _id: 0, category: '$_id', amount: '$totalAmount' } }
    ];

    const expensesByCategory = await Transaction.aggregate(pipeline);
    console.log('DEBUG: Aggregation result:', expensesByCategory);
    res.status(200).json(expensesByCategory);
  } catch (error) {
    next(error);
  }
};


// for last 12 months, monthly spending amount.
const getMonthlySpending = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentication required. User not found.' });
    }

    const userId = req.user._id.toString(); 

    const now = new Date();

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
            $dateToString: {
              format: '%Y-%m',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month'
                }
              }
            }
          },
          amount: '$totalAmount'
        }
      }
    ];

    const monthlyData = await Transaction.aggregate(pipeline);

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

    const userId = req.user._id.toString(); 

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
            $dateToString: {
              format: '%Y-%m',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month'
                }
              }
            }
          },
          income: '$totalIncome',
          expense: '$totalExpense'
        }
      }
    ];

    const monthlyData = await Transaction.aggregate(pipeline);

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
    const userId = req.user._id.toString(); 


    const today = new Date();
    // For current/previous month calculations
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // For last 30 days calculations
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0); // Start of 30 days ago

    
    const overallAnd30DaysPipeline = [
      { $match: { userId: userId } }, 
      {
        $facet: { 
          "overallBalance": [
            {
              $group: {
                _id: null,
                totalIncome: { $sum: { $cond: { if: { $eq: ['$type', 'income'] }, then: '$amount', else: 0 } } },
                totalExpense: { $sum: { $cond: { if: { $eq: ['$type', 'expense'] }, then: '$amount', else: 0 } } }
              }
            },
            {
              $project: {
                _id: 0,
                totalBalance: { $subtract: ['$totalIncome', '$totalExpense'] }
              }
            }
          ],
          "last30DaysSummary": [
            { $match: { date: { $gte: thirtyDaysAgo, $lte: today } } }, // Filter transactions only for the last 30 days
            {
              $group: {
                _id: null,
                income: { $sum: { $cond: { if: { $eq: ['$type', 'income'] }, then: '$amount', else: 0 } } },
                expense: { $sum: { $cond: { if: { $eq: ['$type', 'expense'] }, then: '$amount', else: 0 } } },
                totalTransactions: { $sum: 1 }
              }
            },
            {
              $project: {
                _id: 0,
                netIncome: { $subtract: ['$income', '$expense'] },
                totalExpense: '$expense',
                totalTransactions: '$totalTransactions'
              }
            }
          ]
        }
      }
    ];

    const [overallAnd30DaysResult] = await Transaction.aggregate(overallAnd30DaysPipeline);

    const totalBalance = (overallAnd30DaysResult?.overallBalance?.[0]?.totalBalance) || 0;
    const last30DaysSummary = (overallAnd30DaysResult?.last30DaysSummary?.[0]) || { netIncome: 0, totalExpense: 0, totalTransactions: 0 };


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
    const savingsRate = (currentMonthIncome > 0) ? (((currentMonthIncome - currentMonthExpense) / currentMonthIncome) / currentMonthIncome) * 100 : 0; 

    res.status(200).json({
      // Overall Balance
      totalBalance: totalBalance,

      // Monthly Summary
      monthlyIncome: currentMonthIncome,
      monthlyExpenses: currentMonthExpense,
      incomeChange: parseFloat(incomeChange.toFixed(2)),
      expenseChange: parseFloat(expenseChange.toFixed(2)),
      savingsRate: parseFloat(savingsRate.toFixed(2)),

      // Last 30 Days Summary (New Addition)
      netIncomeLast30Days: last30DaysSummary.netIncome,
      totalExpenseLast30Days: last30DaysSummary.totalExpense,
      totalTransactionsLast30Days: last30DaysSummary.totalTransactions,
    });

  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    errorHandler(res, error, 500);
  }
};


module.exports = {
  getExpensesByCategory,
  getMonthlySpending,
  getIncomeVsExpense,
  getDashboardSummary
};