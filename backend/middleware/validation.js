const Joi = require('joi');
const { URL } = require('url');

const ALLOWED_GITHUB_HOSTS = new Set([
    'github.com',
    'www.github.com',
    'raw.githubusercontent.com'
]);

const githubUrlSchema = Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .trim()
    .max(500)
    .custom((value, helpers) => {
        try {
            const parsed = new URL(value);
            if (!ALLOWED_GITHUB_HOSTS.has(parsed.hostname.toLowerCase())) {
                return helpers.message('URL must point to github.com or raw.githubusercontent.com');
            }
        } catch (err) {
            return helpers.message('URL must be a valid GitHub link');
        }

        return value;
    }, 'GitHub URL Validation');

const createReviewSchema = Joi.object({
    title: Joi.string().trim().max(120).optional(),
    url: githubUrlSchema.optional(),
    code: Joi.alternatives().try(
        Joi.string().max(500000),
        Joi.object(),
        Joi.array()
    ).optional(),
    language: Joi.string().trim().max(40).optional(),
    userId: Joi.string().trim().max(64).optional()
}).or('url', 'code');

function validateCreateReview(req, res, next) {
    if (typeof req.body === 'string') {
        if (!req.body.trim()) {
            return res.status(400).json({ message: 'Request body cannot be empty text' });
        }
        return next();
    }

    const { error } = createReviewSchema.validate(req.body || {}, {
        abortEarly: false,
        allowUnknown: true
    });

    if (error) {
        return res.status(400).json({
            message: 'Validation failed',
            details: error.details.map((detail) => detail.message.replace(/"/g, ''))
        });
    }

    return next();
}

module.exports = {
    validateCreateReview
};
