const express = require('express');
const {app, server} = require('./lib/socket');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const PORT = process.env.PORT;

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.use(cookieParser());

// cors
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use('/api/auth', require('./routes/auth.route'));
app.use('/api/messages', require('./routes/message.route'));

app.get('/', (req, res) => {
    res.send('Hello World');
})

const connectDB = require('./lib/database');
connectDB();

const __dirname = path.resolve();
if(process.env.NODE_ENV === 'production'){
    app.use(express.static(path.join(__dirname, '../frontend/dist')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend", "dist', 'index.html'));
    })
}

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});