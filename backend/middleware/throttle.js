const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = rateLimit;

const perUserReviewLimiter = rateLimit({
    windowMs: 30 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        if (req.user && req.user.id) {
            return req.user.id;
        }
        return ipKeyGenerator(req);
    },
    handler: (req, res) => {
        return res.status(429).json({
            message: 'Too many review requests from this user. Please wait a few seconds before retrying.'
        });
    }
});

module.exports = {
    perUserReviewLimiter
};
