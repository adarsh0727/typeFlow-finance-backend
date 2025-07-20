// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const fileUpload = require('express-fileupload')
const { errorHandler } = require('./middleware/errorHandler.middleware');
const {connect} = require('./db/connect'); 
const ocrRoutes = require('./routes/ocr.routes'); 
const transactionRoutes = require('./routes/transaction.routes')
const categoryRoutes = require('./routes/category.routes')
const reportRoutes = require('./routes/report.routes')

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

connect();

app.use(cors({
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'], 
  credentials: true 
}));

app.use(express.json());


app.use('/api/categories', categoryRoutes); 
app.use('/api/transactions', transactionRoutes); 
app.use('/api/reports', reportRoutes); 
app.use('/api/ocr', ocrRoutes); 


app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});