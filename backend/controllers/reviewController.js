const Review = require('../models/Review');
const axios = require('axios');

exports.createReview = async(req,res)=>{
    try{
        const {title, url, code, language, userId } = req.body;
        let finalCode = code;

        // github import

        if(url && url.includes("github.com")){
            const rawUrl = url
                .replace("github.com", "raw.githubusercontent.com")
                .replace("/blob/",'/');
            const response = await axios.get(rawUrl);
            finalCode = response.data;
        }
        const newReview = new Review({
            title,
            code: finalCode,
            githubUrl: url||"",
            language: language||"javascript",
            userId
        });
        await newReview.save();
        res.status(201).json({ message: "Review created successfully", review: newReview });
    }
    catch(err){
        console.error("Error creating review:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getReviews = async(req,res)=>{
    try{
        const review = await Review.findById(req.params.id);
        if(!review){
            return res.status(404).json({ message: "Review not found" });
        }
        res.json(review);

    }
    catch(err){
        console.error("Error fetching review:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getAllReviews = async(req,res)=>{
    try{
        const reviews = await Review.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(reviews);
    }
    catch(err){
        console.error("Error fetching reviews:", err);
        res.status(500).json({ message: "Server error" });
    }
}