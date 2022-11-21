const express = require('express');
const dotenv = require('dotenv').config();
const PORT = process.env.PORT;
const app = express();
const db = require('./config/mongoose');
const cors = require('cors');

app.use(express.urlencoded({extended: true}));
app.use(express.json({limit: '50mb'}));
app.use(cors());
app.use('/', require('./routes/index'));

app.listen(PORT, (error) => {
    if(error){
        console.log(`Error while running server on port: ${PORT}`, error)
        return;
    }
    console.log(`Server is Up and Running on Port: ${PORT}`);
})