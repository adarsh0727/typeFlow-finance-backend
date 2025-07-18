const Tesseract = require('tesseract.js');

async function recognizeText(filePath) {
  try {
    const { data: { text } } = await Tesseract.recognize(
      filePath,
      'eng', 
      { logger: m => console.log(m) } 
    );
    return text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to perform OCR.'); 
  }
}

module.exports = { recognizeText };
