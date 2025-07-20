const express = require('express');
const router = express.Router();

const { receiptProcessing } = require('../controllers/ocr.controller');
const fileUpload = require('express-fileupload');

router.use(fileUpload({
  createParentPath: true 
}));

router.post('/upload-receipt', receiptProcessing);

module.exports = router;
