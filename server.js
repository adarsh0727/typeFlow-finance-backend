// server.js
const express = require('express');
const dotenv = require('dotenv');
const {connect} = require('./db/connect'); 
const ocrRoutes = require('./routes/ocrRoutes'); 

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

connect();

app.use(express.json()); 


app.use('/api/ocr', ocrRoutes); 

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});