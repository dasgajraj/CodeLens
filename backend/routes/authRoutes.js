const express = require('express');
const router = express.Router();
const {
    signup,
    login,
    refresh,
    logout,
    getUsers
} = require('../controllers/authController');
const {
    validateSignup,
    validateLogin,
    validateRefresh
} = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.post('/refresh', validateRefresh, refresh);
router.post('/logout', validateRefresh, logout);
router.get('/users', authenticate, getUsers);

module.exports = router;
