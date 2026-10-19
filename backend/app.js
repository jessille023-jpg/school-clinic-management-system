const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const db = require('./config/db');

app.use(cors());
app.use(express.json());

// mag test database connection
app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 AS connected');

        res.json({
            message: 'Database connected successfully!',
            result: rows[0]
        });
    } catch (error) {
        console.error('Database connection error:', error.message);

        res.status(500).json({
            message: 'Database connection failed',
            error: error.message
        });
    }
});

//  mga API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/visits', require('./routes/visitRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Home route
app.get('/', (req, res) => {
    res.send('School Clinic Management System API is running...');
});

module.exports = app;
