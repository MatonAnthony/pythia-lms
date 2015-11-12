'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	net = require('net'),
	Course = mongoose.model('Course'),
	Sequence = mongoose.model('Sequence'),
	Lesson = mongoose.model('Lesson'),
	Problem = mongoose.model('Problem'),
	Registration = mongoose.model('Registration'),
	_ = require('lodash'),
	moment = require('moment');

/**
 * Create a lesson
 */
exports.create = function(req, res) {
	// Check course
	var courseSerial = req.body.courseSerial;
	Course.findOne({'serial': courseSerial}, 'serial sequences').populate('sequences', 'lessons').exec(function(err, course) {
		if (err || ! course) {
			return res.status(400).send({
				message: errorHandler.getLoadErrorMessage(err, 'course', courseSerial)
			});
		}
		var sequence = course.sequences[req.body.sequenceIndex - 1];
		var lesson = new Lesson({
			'name': req.body.name,
			'start': req.body.start,
			'end': req.body.end,
			'context': req.body.context,
			'problems': req.body.problems
		});
		lesson.user = req.user;
		lesson.save(function(err) {
			if (err) {
				return res.status(400).send({
					message: errorHandler.getErrorMessage(err)
				});
			}
			// Add the lesson to the sequence
			sequence.lessons.push(lesson);
			sequence.save(function(err) {
				if (err) {
					return res.status(400).send({
						message: errorHandler.getErrorMessage(err)
					});
				}
				res.jsonp({
					'lessonIndex': sequence.lessons.length
				});
			});
		});
	});
};

/**
 * Show the current Lesson
 */
exports.read = function(req, res) {
	res.jsonp(req.lesson);
};

/**
 * Update a lesson
 */
exports.update = function(req, res) {
	var lesson = req.lesson;
	lesson = _.extend(lesson, req.body);
	lesson.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		}
		res.jsonp(lesson);
	});
};

/**
 * Delete a lesson
 */
exports.delete = function(req, res) {
	var lesson = req.lesson ;

	lesson.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(lesson);
		}
	});
};

/**
 * List of lessons
 */
exports.list = function(req, res) { 
	Lesson.find().sort('-created').populate('user', 'displayName').exec(function(err, lessons) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(lessons);
		}
	});
};

/**
 * Lesson middleware
 */
exports.lessonByIndex = function(req, res, next, index) { 
	Lesson.findById({'_id': req.sequence.lessons[index - 1]._id}, 'name start end context problems user').populate('problems', 'name description points authors').exec(function(err, lesson) {
		if (err || ! lesson) {
			return errorHandler.getLoadErrorMessage(err, 'lesson', index + ' of sequence ' + req.sequence.name + ' of course ' + req.course.serial, next);
		}
		req.lesson = lesson;
		next();
	});
};

/**
 * Problem middleware
 */
exports.problemByIndex = function(req, res, next, index) {
	Problem.findById({'_id': req.lesson.problems[index - 1]._id}, 'name').exec(function(err, problem) {
		if (err || ! problem) {
			return errorHandler.getLoadErrorMessage(err, 'problem', index + ' of lesson ' + req.lesson.name + ' of sequence ' + req.sequence.name + ' of course ' + req.course.serial, next);
		}
		req.problem = problem;
		next();
	});
};

/**
 * Sequence authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	// Authorized lesson if current date between start and end date
	// for registered user, not for admin nor coordinator
	var isCoordinator = req.course.coordinators.some(function(element, index, array) {
		return element.id === req.user.id;
	});
	if ((req.user.roles.indexOf('admin') === -1 && ! isCoordinator) && (req.lesson.start !== null && moment().isBefore(moment(req.lesson.start)) ||
		req.lesson.end !== null && moment().isAfter(moment(req.lesson.end)))) {
		return res.status(403).send('Lesson not accessible.');
	}
	next();
};

/*
 * Submit a problem
 */
var getRegistration = function(registration, course, sequenceIndex, lessonIndex, problemIndex) {
	// Fill the registration object if necessary
	// Get the sequence
	while (registration.sequences.length < sequenceIndex) {
		registration.sequences.push([]);
	}
	var sequence = registration.sequences[sequenceIndex - 1];
	// Get the lesson
	while (sequence.lessons.length < lessonIndex) {
		sequence.lessons.push([]);
	}
	var lesson = sequence.lessons[lessonIndex - 1];
	// Get the problem
	while (lesson.problems.length < problemIndex) {
		lesson.problems.push([]);
	}
	return registration;
};
var generateFeedback = function(problem, result, output) {
	var message = '';
	// Get the default message, if any
	if (output.feedback.message !== undefined) {
		message = output.feedback.message;
	}
	// Check the status of the submission
	if (result.status === 'success') {
		message = '<p>{{\'FEEDBACK.SUCCESS\' | translate}}</p>';
	}
	// Check any quality message
	var quality = output.feedback.quality;
	if (quality !== undefined && quality.message !== undefined) {
		message += quality.message;
	}
	// Build the feedback message according to problem type
	switch (problem.type) {
		case 'unit-testing':
			if (output.feedback.example !== undefined) {
				message = '<p>{{\'FEEDBACK.WRONG_RESULT\' | translate}}</p><ul>';
				if (output.feedback.example.input !== undefined) {
					message += '<li>{{\'FEEDBACK.INPUT\' | translate}}: ' + output.feedback.example.input + '</li>';
				}
				message += '<li>{{\'FEEDBACK.EXPECTED_RESULT\' | translate}}: ' + output.feedback.example.expected + '</li>';
				message += '<li>{{\'FEEDBACK.YOUR_RESULT\' | translate}}: ' + output.feedback.example.actual + '</li></ul>';
			}
		break;
	}
	return message;
};
exports.submit = function(req, res) {
	// Check course
	var courseSerial = req.params.courseSerial;
	Course.findOne({'serial': courseSerial}, '_id sequences').populate('sequences', 'lessons').exec(function(err, course) {
		if (err || ! course) {
			return res.status(400).send({
				message: errorHandler.getLoadErrorMessage(err, 'course', courseSerial)
			});
		}
		// Load the lesson
		var lessonId = course.sequences[req.params.sequenceIndex - 1].lessons[req.params.lessonIndex - 1];
		Lesson.findById({'_id': lessonId}).exec(function(err, lesson) {
			if (err || ! lesson) {
				return res.status(400).send({
					message: errorHandler.getLoadErrorMessage(err, 'lesson', lessonId)
				});
			}
			// Load the problem
			var problemId = lesson.problems[req.params.problemIndex - 1];
			Problem.findById({'_id': problemId}, 'points task type').exec(function(err, problem) {
				if (err || ! problem) {
					return res.status(400).send({
						message: errorHandler.getLoadErrorMessage(err, 'problem', problemId)
					});
				}
				// Trying to reach Pythia queue
				var status = 'failed';
				var message = '<p>An error occurred during the grading of your submission, please try again later.</p>';
				var data = '';
				var submissions = [];
				var newregistration = null;
				var socket = new net.Socket();
				var score = 0;
				socket.setEncoding('utf8');
				// On connexion, send the request to the Pythia grader
				socket.on('connect', function() {
					socket.write(JSON.stringify({
						'message': 'launch',
						'id': 'test',
						'task': problem.task,
						'input': JSON.stringify({
							'tid': 'task1',
							'fields': JSON.parse(req.body.input)
						})
					}));
				});
				// On data reception, if complete JSON object, handle it
				socket.on('data', function(chunk) {
					data += chunk;
					try {
						// Get and analyse result provided by Pythia
						var result = JSON.parse(data);
						var output = JSON.parse(result.output);
						// Check whether the problem has been solved
						if (result.status === 'success') {
							status = output.status;
						}
						// Get the score, if any
						if (output.feedback.score !== undefined) {
							score = Math.round(output.feedback.score * problem.points);
							var quality = output.feedback.quality;
							if (quality !== undefined) {
								score = parseInt(score * quality.weight);
							}
						}
						// Build the feedback message
						message = generateFeedback(problem, result, output);
						// Save submission in user
						// Get registration for this course
						Registration.findOne({'course': course.id, 'user': req.user.id}, function(err, registration) {
							// Get the problem
							registration = getRegistration(registration, course, req.params.sequenceIndex, req.params.lessonIndex, req.params.problemIndex);
							var sequence = registration.sequences[req.params.sequenceIndex - 1];
							var lesson = sequence.lessons[req.params.lessonIndex - 1];
							var problem = lesson.problems[req.params.problemIndex - 1];
							problem.submissions.push({
								'status': status,
								'answer': req.body.input,
								'feedback': {
									'message': message,
									'raw': output.feedback
								}
							});
							// Update the score and success status
							// For the problem
							problem.score = score;
							problem.succeeded = status === 'success';
							// For the lesson
							lesson.succeeded = true;
							lesson.score = 0;
							lesson.progress = 0;
							for (var i = 0; i < lesson.problems.length; i++) {
								var s = lesson.problems[i].submissions;
								var success = ! (s.length === 0 || s[s.length - 1].status !== 'success');
								lesson.succeeded &= success;
								lesson.score += lesson.problems[i].score;
								if (success) {
									lesson.progress++;
								}
							}
							lesson.progress /= lesson.problems.length;
							// For the sequence
							sequence.succeeded = true;
							sequence.score = 0;
							sequence.progress = 0;
							for (var j = 0; j < sequence.lessons.length; j++) {
								sequence.succeeded &= sequence.lessons[j].succeeded;
								sequence.score += sequence.lessons[j].score;
								if (sequence.lessons[j].succeeded) {
									sequence.progress++;
								}
							}
							sequence.progress /= sequence.lessons.length;
							// For the course
							registration.score = 0;
							registration.progress = 0;
							for (var k = 0; k < registration.sequences.length; k++) {
								registration.score += registration.sequences[k].score;
								if (registration.sequences[k].succeeded) {
									registration.progress++;
								}
							}
							registration.progress /= course.sequences.length;
							// Save submission in database
							registration.save(function(err) {
								if (err) {
									return res.status(400).send({
										message: errorHandler.getErrorMessage(err)
									});
								}
								newregistration = registration;
								socket.destroy();
							});
						});
					} catch (err) {
						console.log('Pythia error: ' + err);
						console.log('Current data: ' + data);
					}
				});
				// On close, send back answer to the client
				socket.on('close', function(had_error) {
					res.jsonp({
						'status': had_error ? 'error' : status,
						'message': message,
						'registration': newregistration,
						'score': score
					});
				});
				// On error, generate an error message
				socket.on('error', function(err) {
					switch (err.errno) {
						case 'ECONNREFUSED':
							message = 'The grading server is not reachable, please try again later.';
						break;
					}
				});
				socket.connect(9000, '127.0.0.1');
			});
		});
	});
};

/**
 * Get all the registrations to a course
 */
exports.getRegistrations = function(req, res) {
	Registration.find({'course': req.course}, 'user sequences').populate('user', 'firstname lastname').exec(function(err, registrations) {
		if (err) {
			return errorHandler.getLoadErrorMessage(err, 'registration', 'for course ' + req.course.id);
		}
		var problemstats = [];
		for (var i = 0; i < registrations.length; i++) {
			if (req.params.sequenceIndex - 1 < registrations[i].sequences.length) {
				var sequence = registrations[i].sequences[req.params.sequenceIndex - 1];
				if (req.params.lessonIndex - 1 < sequence.lessons.length) {
					var lesson = sequence.lessons[req.params.lessonIndex - 1];
					problemstats.push({
						'user': registrations[i].user,
						'problems': lesson.problems
					});
				}
			}
		}
		res.jsonp({
			'problemstats': problemstats,
			'lesson': req.lesson
		});
	});
};
