const express = require('express');
const router = express.Router();

const { receiptProcessing } = require('../controllers/ocr.controller');
const fileUpload = require('express-fileupload');
const {protect} = require('../middleware/auth.middleware')

router.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // limit upto 50 
    useTempFiles : true, 
    tempFileDir : '/tmp/'
}));

router.post('/upload-receipt', protect, receiptProcessing);

module.exports = router;
