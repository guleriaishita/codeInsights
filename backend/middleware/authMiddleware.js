const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

// This middleware protects our route checking the jwt

const protectRoute = asyncHandler(async (req, res, next) => {
	let token;

	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer')
	) {
		try {
			//get the token from header authorization obj
			//we have something like 'Bearer token' and we want token [2nd item]
			token = req.headers.authorization.split(' ')[1];

			//verify the token
			const decoded = jwt.verify(token, process.env.JWT_SECRET);

			//get user from the token, toekn has the user_id as a payload
			req.user = await User.findById(decoded.id).select('-password');
			next();
		} catch (err) {
			console.log(err);
			res.status(401);
			throw new Error('Not Authorized');
		}
	}

	if (!token) {
		res.status(401);
		throw new Error('Not Authorized, and no token found');
	}
});

module.exports = { protectRoute };
