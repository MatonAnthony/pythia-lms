'use strict';

// Setting up route
angular.module('courses').config(['$stateProvider', function($stateProvider) {
	// Courses state routing
	$stateProvider
	.state('listCourses', {
		url: '/courses',
		templateUrl: 'modules/courses/views/list-courses.client.view.html'
	})
	.state('registerCourses', {
		url: '/courses/register',
		templateUrl: 'modules/courses/views/register-courses.client.view.html'
	})
	.state('createCourse', {
		url: '/courses/create',
		templateUrl: 'modules/courses/views/create-course.client.view.html'
	})
	.state('viewCourse', {
		url: '/courses/:courseSerial',
		templateUrl: 'modules/courses/views/view-course.client.view.html'
	})
	.state('editCourse', {
		url: '/courses/:courseSerial/edit',
		templateUrl: 'modules/courses/views/edit-course.client.view.html'
	});
}]);
