const Router = require('express').Router();
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	username: { type: String, required: true },
	exercises: { type: Array },
});

const User = mongoose.model('user', userSchema);

Router.get('/exercise/users', (req, res) => {
	User.find({})
		.select(['_id', 'username'])
		.exec((err, data) => {
			res.json(data);
		});
});

Router.get('/exercise/log', (req, res) => {
	let { userId, limit } = req.query;
	let fromDate = req.query['from'];
	let toDate = req.query['to'];

	fromDate = new Date(fromDate).getTime();
	toDate = toDate ? new Date(toDate).getTime() : new Date().getTime();

	User.findById(userId, (err, data) => {
		if (err) res.send('user not found', 404);

		let exercises = data.exercises;
		if (fromDate) {
			exercises = data.exercises.filter((el) => {
				return el.date >= fromDate && el.date <= toDate;
			});
		}

		exercises = exercises
			.map((el) => {
				el.date = new Date(el.date).toDateString();
				return el;
			})
			.slice(0, limit);

		res.json({
			userId: data._id,
			username: data.username,
			count: exercises.length,
			log: exercises,
		});
	});
});

Router.post('/exercise/new-user', (req, res) => {
	User.findOne({ username: req.body.username }, (err, data) => {
		if (data) res.send('User Already exists');

		let newUser = new User({
			username: req.body.username,
			exercises: [],
		});

		newUser.save((err, data) => {
			if (err) res.send(err._message);

			res.json({ username: data.username, _id: data._id });
		});
	});
});

Router.post('/exercise/add', (req, res) => {
	User.findById(req.body.userId, (err, user) => {
		if (!user) res.end('There is no user with this ID', 404);

		let { description, duration, date } = req.body;
		date = date ? new Date(date).getTime() : new Date().getTime();
		if (description == '') res.end('description is required', 400);

		if (duration == '') res.end('duration is required', 400);

		user.exercises.push({ description, duration: +duration, date });
		user.save((err, data) => {
			res.json({
				_id: data._id,
				description,
				duration: +duration,
				date: new Date(date).toDateString(),
				username: data.username,
			});
		});
	});
});

module.exports = Router;
