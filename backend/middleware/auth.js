const { verifyAccessToken } = require('../utils/tokenService');

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization header with Bearer token is required' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = verifyAccessToken(token);

        req.user = {
            id: decoded.sub,
            email: decoded.email,
            name: decoded.name
        };

        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired access token' });
    }
}
 
module.exports = {
    authenticate
};
