const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const refreshTokenSchema = new mongoose.Schema({
    tokenHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: { type: String, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    refreshTokens: { type: [refreshTokenSchema], default: [] }
}, { timestamps: true });
userSchema.pre('save', async function hashPassword() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});
userSchema.methods.comparePassword = function comparePassword(candidate) {
    return bcrypt.compare(candidate, this.password);
};

userSchema.methods.addRefreshToken = function addRefreshToken(tokenHash) {
    this.refreshTokens.push({ tokenHash });
    return this.save();
};

userSchema.methods.removeRefreshToken = function removeRefreshToken(tokenHash) {
    this.refreshTokens = this.refreshTokens.filter((entry) => entry.tokenHash !== tokenHash);
    return this.save();
};

userSchema.methods.clearRefreshTokens = function clearRefreshTokens() {
    this.refreshTokens = [];
    return this.save();
};

module.exports = mongoose.model('User', userSchema);
