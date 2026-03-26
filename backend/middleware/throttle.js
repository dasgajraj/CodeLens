const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = rateLimit;

const perUserReviewLimiter = rateLimit({
    windowMs: 30 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const headerUser = req.headers['x-user-id'];
        if (headerUser) {
            return String(headerUser).trim();
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
