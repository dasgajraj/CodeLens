const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose
    .connect(process.env.MONGO_URI)
    .then(()=> console.log("Connected to MongoDB"))
    .catch((err) => console.log("Error connecting to MongoDB:", err));
    
const PORT = process.env.PORT || 5000;

app.get('/health',(req,res)=>{
    res.json({
        status: true,
        timestamp: new Date().toLocaleDateString(),
    })
})

app.listen(PORT,()=>{
    console.log('Server is running on port', PORT);
})