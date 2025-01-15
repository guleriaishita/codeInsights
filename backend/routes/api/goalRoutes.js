const express = require('express');
const router = express.Router();
const {
	getGoals,
	setGoal,
	updateGoal,
	deleteGoal,
} = require('../../controllers/goalController');

const { protectRoute } = require('../../middleware/authMiddleware');

router.route('/').get(protectRoute, getGoals).post(protectRoute, setGoal);

router
	.route('/:id')
	.delete(protectRoute, deleteGoal)
	.put(protectRoute, updateGoal);

module.exports = router;
