const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const reviewRoutes = require("./routes/reviewRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please slow down." }
});

app.use(cors());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use('/api', apiLimiter);
app.use(express.json({ limit: '5mb', strict: false }));
app.use(express.text({ type: 'text/plain', limit: '5mb' }));
app.use("/api/reviews", reviewRoutes);

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

app.use(errorHandler);

app.listen(PORT,()=>{
    console.log('Server is running on port', PORT);
})