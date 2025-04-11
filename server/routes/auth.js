const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateToken } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', validateToken, authController.getCurrentUser);
router.put('/password', validateToken, authController.changePassword);

module.exports = router; 