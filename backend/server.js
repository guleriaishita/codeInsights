const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const apiGuidelines = require('./routes/guidelines_api');
const apiReviewfile = require('./routes/reviewfile_api');
const apiReviewcodebase = require('./routes/reviewcodebase_api');
const apiOutput = require('./routes/outputs_api');
require('dotenv').config();


const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    Origin: 'http://localhost:5173/', // Your React app's URL
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads directory statically
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api', apiGuidelines);
app.use('/api',apiReviewfile);
app.use('/api',apiReviewcodebase);
app.use('/api/output',apiOutput);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});