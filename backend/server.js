const path = require('path');
const express = require('express');
const colors = require('colors');
const dotenv = require('dotenv').config();
const { errorHandler } = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

//connect to the database
connectDB();

//init express
const app = express();

//middleware (to use the req.body data)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/goals', require('./routes/api/goalRoutes'));
app.use('/api/users', require('./routes/api/userRoutes'));

//use the error handler, this will override the default express error handler
app.use(errorHandler);

app.listen(PORT, () => {
	console.log(`server started on the port: ${PORT}`);
});
