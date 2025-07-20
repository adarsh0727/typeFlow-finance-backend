// server.js
const express = require('express');
const dotenv = require('dotenv');
const {connect} = require('./db/connect'); 
const ocrRoutes = require('./routes/ocr.routes'); 
const transactionRoutes = require('./routes/transaction.routes')
// const categoryRoutes = require('./routes/transaction.routes')
const reportRoutes = require('./routes/report.routes')

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

connect();

app.use(express.json()); 


app.use('/api/ocr', ocrRoutes); 
app.use('/api/transactions', transactionRoutes); 
// app.use('/api/categories', categoryRoutes); 
app.use('/api/reports', reportRoutes); 


app.get('/', (req, res) => {
    res.send('API is running...');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});