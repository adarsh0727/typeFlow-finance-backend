const express = require('express');
const router = express.Router();

const { receiptProcessing } = require('../controller/ocrController');
const fileUpload = require('express-fileupload');

router.use(fileUpload({
  createParentPath: true 
}));

router.post('/upload-receipt', receiptProcessing);

module.exports = router;
