const User = require('../models/User');
const {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    hashToken
} = require('../utils/tokenService');

function sanitizeUser(user) {
    return {
        id: user._id.toString(),
        name: user.name || '',
        email: user.email
    };
}

async function persistRefreshToken(user, token) {
    const tokenHash = hashToken(token);
    await user.addRefreshToken(tokenHash);
    return tokenHash;
}

async function issueTokenPair(user) {
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    await persistRefreshToken(user, refreshToken);
    return { accessToken, refreshToken };
}

exports.signup = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists with this email' });
        }

        const user = await User.create({ name, email, password });
        const tokens = await issueTokenPair(user);

        return res.status(201).json({
            message: 'Signup successful',
            user: sanitizeUser(user),
            tokens
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'User already exists with this email' });
        }
        return next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const tokens = await issueTokenPair(user);
        return res.json({
            message: 'Login successful',
            user: sanitizeUser(user),
            tokens
        });
    } catch (error) {
        return next(error);
    }
};

exports.refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        }

        const tokenHash = hashToken(refreshToken);
        const user = await User.findById(decoded.sub);
        if (!user) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const stored = user.refreshTokens.find((entry) => entry.tokenHash === tokenHash);
        if (!stored) {
            return res.status(401).json({ message: 'Refresh token has been revoked' });
        }

        await user.removeRefreshToken(tokenHash);

        const newAccessToken = signAccessToken(user);
        const newRefreshToken = signRefreshToken(user);
        await persistRefreshToken(user, newRefreshToken);

        return res.json({
            message: 'Token refreshed',
            tokens: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        return next(error);
    }
};

exports.logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: 'refreshToken is required' });
        }

        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (err) {
            return res.status(200).json({ message: 'Logged out' });
        }

        const user = await User.findById(decoded.sub);
        if (!user) {
            return res.status(200).json({ message: 'Logged out' });
        }

        const tokenHash = hashToken(refreshToken);
        await user.removeRefreshToken(tokenHash);
        return res.json({ message: 'Logged out' });
    } catch (error) {
        return next(error);
    }
};

exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        return res.json({
            count: users.length,
            users: users.map(sanitizeUser)
        });
    } catch (error) {
        return next(error);
    }
};
