const express = require('express');
const {getCategories} = require('../controllers/category.controller'); 
const { protect } = require('../middleware/auth.middleware'); 

const router = express.Router();

router.route('/')
  .get(protect, getCategories); 

module.exports = router;