const asyncHandler = require('express-async-handler');
const Goal = require('../models/goalModel');
const User = require('../models/userModel');
// @description: get the goals
// @route: GET /api/goals
// @access: Private
const getGoals = asyncHandler(async (req, res) => {
	const goals = await Goal.find({ user: req.user.id });
	res.status(200).json(goals);
});

// @description: set the goal
// @route: POST /api/goals
// @access: Private
const setGoal = asyncHandler(async (req, res) => {
	if (!req.body.text) {
		res.status(400);
		throw new Error('Please add a text field');
	}

	const goal = await Goal.create({
		text: req.body.text,
		user: req.user.id,
	});

	res.status(200).json(goal);
});

// @description: update the goal
// @route: PUT /api/goals/:id
// @access: Private
const updateGoal = asyncHandler(async (req, res) => {
	const goal = await Goal.findById(req.params.id);

	if (!goal) {
		res.status(400);
		throw new Error('Goal not found');
	}

	//get the user
	const user = await User.findById(req.user.id);

	//check for user
	if (!user) {
		res.status(401);
		throw new Error('User not found');
	}

	//make sure the logged in user matches the user whose goal is being updated
	if (goal.user.toString() !== user.id) {
		res.status(401);
		throw new Error('Not authorized to update the goal');
	}
	const updatedGoal = await Goal.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
	});
	res
		.status(200)
		.json({ msg: `goal updated with id ${req.params.id}`, updatedGoal });
});

// @description: delete the goals
// @route: DELETE /api/goals/:id
// @access: Private
const deleteGoal = asyncHandler(async (req, res) => {
	const goal = await Goal.findById(req.params.id);

	if (!goal) {
		res.status(400);
		throw new Error('Goal not found');
	}

	//get the user
	const user = await User.findById(req.user.id);

	//check for user
	if (!user) {
		res.status(401);
		throw new Error('User not found');
	}

	//make sure the logged in user matches the user whose goal is being updated
	if (goal.user.toString() !== user.id) {
		res.status(401);
		throw new Error('Not authorized to update the goal');
	}

	//const deletedGoal = await Goal.findByIdAndDelete(req.params.id);
	await Goal.deleteOne(goal);
	res.status(200).json({ id: `goal deleted with id ${req.params.id}` });
});

module.exports = {
	getGoals,
	setGoal,
	updateGoal,
	deleteGoal,
};
