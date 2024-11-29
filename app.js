const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const auctionRoutes = require('./routes/auctionRoutes');

const app = express();

// Middleware
app.use(bodyParser.json());
// app.use(cors());

app.use(cors({
    origin: 'http://localhost:5000', // Frontend URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

// Routes
app.use('/auth', authRoutes);
app.use('/auction', auctionRoutes);

module.exports = app;
