'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var courses = require('../../app/controllers/courses.server.controller');
	var lessons = require('../../app/controllers/lessons.server.controller');

	// Lessons Routes
	app.route('/courses/:courseSerial/sequences/:sequenceIndex/lessons')
		.get(users.requiresLogin, courses.isRegistered(true), lessons.list)
		.post(users.requiresLogin, courses.hasAuthorization, lessons.create);

	app.route('/courses/:courseSerial/sequences/:sequenceIndex/lessons/:lessonIndex')
		.get(users.requiresLogin, courses.isRegistered(true), lessons.read)
		.put(users.requiresLogin, courses.hasAuthorization, lessons.update)
		.delete(users.requiresLogin, courses.hasAuthorization, lessons.delete);

	app.route('/courses/:courseSerial/sequences/:sequenceIndex/lessons/:lessonIndex/problems/:problemIndex/submit')
		.post(users.requiresLogin, lessons.submit);

	// Finish by binding the lesson middleware
	app.param('lessonIndex', lessons.lessonByIndex);
};
