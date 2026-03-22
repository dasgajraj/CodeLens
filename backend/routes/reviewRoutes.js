const express = require("express");
const router = express.Router();
const { 
    createReview, 
    getReviews, 
    getAllReviews 
} = require("../controllers/reviewController");

// POST: Create a new review (Paste or GitHub)
router.post("/", createReview);

// GET: Fetch a single review by its ID
router.get("/:id", getReviews);

// GET: Fetch all reviews for a specific user
router.get("/user/:userId", getAllReviews);

module.exports = router;