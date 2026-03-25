const express = require("express");
const router = express.Router();
const { 
    createReview, 
    getReviews, 
    getAllReviews,
    deleteReview
} = require("../controllers/reviewController");
const { validateCreateReview } = require("../middleware/validation");

// POST: Create a new review (Paste or GitHub)
router.post("/", validateCreateReview, createReview);

// GET: Fetch all reviews for the authenticated user (header)
router.get("/user", getAllReviews);

// GET: Fetch a single review by its ID
router.get("/:id", getReviews);

// DELETE: Remove a review by its ID
router.delete("/:id", deleteReview);

module.exports = router;