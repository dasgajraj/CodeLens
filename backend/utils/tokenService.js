const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function assertSecret(secret, name) {
    if (!secret) {
        throw new Error(`${name} is not configured in environment variables.`);
    }
    return secret;
}

const accessSecret = () => assertSecret(process.env.ACCESS_TOKEN_SECRET, 'ACCESS_TOKEN_SECRET');
const refreshSecret = () => assertSecret(process.env.REFRESH_TOKEN_SECRET, 'REFRESH_TOKEN_SECRET');

const accessExpiry = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const refreshExpiry = process.env.REFRESH_TOKEN_EXPIRY || '7d';

function signAccessToken(user) {
    return jwt.sign(
        {
            sub: user._id.toString(),
            email: user.email,
            name: user.name || ''
        },
        accessSecret(),
        { expiresIn: accessExpiry }
    );
}

function signRefreshToken(user) {
    return jwt.sign(
        {
            sub: user._id.toString()
        },
        refreshSecret(),
        { expiresIn: refreshExpiry }
    );
}

function verifyAccessToken(token) {
    return jwt.verify(token, accessSecret());
}

function verifyRefreshToken(token) {
    return jwt.verify(token, refreshSecret());
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
    signAccessToken,
    signRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    hashToken
};
