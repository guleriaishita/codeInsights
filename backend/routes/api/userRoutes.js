const express = require('express');
const router = express.Router();
const {
	registerUser,
	loginUser,
	currentUser,
} = require('../../controllers/userController');
const { protectRoute } = require('../../middleware/authMiddleware');

router.post('/', registerUser);
router.post('/login', loginUser);
router.get('/currentUser', protectRoute, currentUser);

module.exports = router;
