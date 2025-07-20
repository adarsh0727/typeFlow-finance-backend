const Category = require('../models/category.model');
const { errorHandler } = require('../middleware/errorHandler.middleware');
const mongoose = require('mongoose'); 

const getCategories = async (req, res) => {
  try {
   
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentication required. User ID not found.' });
    }
    
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const categories = await Category.find({
      $or: [
        { userId: userId },   
        { userId: null }    
      ]
    }).sort({ name: 1 }); 
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    errorHandler(res, error, 500); 
  }
};

module.exports = {
  getCategories 
};