const path = require('path');
const fs = require('fs');
const { recognizeText } = require('../utils/ocrHelper');
const { parseReceiptWithGemini } = require('../utils/parser');
const Transaction = require('../models/transaction');
const Category = require('../models/category');
const { errorHandler } = require('../utils/errorHandler');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

async function receiptProcessing(req, res) {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Authentication required. User not found.' });
  }

  const userId = req.user._id;

  if (!req.files || !req.files.receipt) {
    return res.status(400).json({ message: 'No files were uploaded.' });
  }

  const file = req.files.receipt;
  const filePath = path.join(uploadDir, `${Date.now()}_${file.name}`);

  try {
    await file.mv(filePath);

    const rawText = await recognizeText(filePath);
    console.log('OCR Text:', rawText);

    const parsed = await parseReceiptWithGemini(rawText);
    console.log('Parsed Data:', parsed);

    let category = await Category.findOne({ clerkUserId: null, name: 'Uncategorized' });
    if (!category) {
      category = await Category.create({
        name: 'Uncategorized',
        type: 'expense',
        clerkUserId: null,
      });
    }

    let matchedCat = await Category.findOne({
      name: parsed.category,
      clerkUserId: { $in: [userId, null] },
    });

    if (!matchedCat) matchedCat = category;

    const tx = {
      userId,
      type: ['deposit', 'refund'].includes(parsed.transactionType?.toLowerCase()) ? 'income' : 'expense',
      amount: parsed.amount || 0,
      date: parsed.date ? new Date(parsed.date) : new Date(),
      description: parsed.description || `Receipt from ${parsed.merchantName || 'Unknown Merchant'}`,
      category: {
        _id: matchedCat._id,
        name: matchedCat.name,
      },
      source: 'receipt_ocr',
      originalFileName: file.name,
      merchantName: parsed.merchantName || 'Unknown Merchant',
      paymentMethod: parsed.paymentMethod || null,
    };

    const savedTx = await Transaction.create(tx);

    fs.unlink(filePath, (err) => {
      if (err) console.error('Temp file cleanup error:', err);
    });

    return res.status(201).json({
      message: 'Receipt processed and transaction created.',
      transaction: savedTx,
    });
  } catch (err) {
    console.error('Receipt processing error:', err);

    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) console.error('Temp file cleanup error on failure:', unlinkErr);
    });

    errorHandler(res, err, 500);
  }
}

module.exports = { receiptProcessing };
