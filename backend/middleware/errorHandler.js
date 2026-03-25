function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || err.status || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);

    const payload = {
        message: statusCode === 500 ? 'Internal server error' : err.message || 'Internal server error'
    };

    if (err.details) {
        payload.details = err.details;
    }

    if (!isProduction && err.stack) {
        payload.stack = err.stack;
    }

    return res.status(statusCode).json(payload);
}

module.exports = errorHandler;
