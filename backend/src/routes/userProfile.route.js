const express = require('express');
const router = express.Router();

const userProfileController = require('../controllers/userProfile.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/update-persona/:userId', authMiddleware, userProfileController.updateUserPersona);

module.exports = router;