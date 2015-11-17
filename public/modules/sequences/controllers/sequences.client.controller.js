'use strict';

// Sequences controller
angular.module('sequences').controller('SequencesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Courses', 'Sequences', '$http', function($scope, $stateParams, $location, Authentication, Courses, Sequences, $http) {
	$scope.authentication = Authentication;
	$scope.score = 0;
	$scope.progress = 0;

	// Create new sequence
	$scope.create = function() {
		// Create new sequence object
		var sequence = new Sequences ({
			name: this.name,
			description: this.description,
			start: this.start,
			end: this.end,
			courseSerial: $scope.course.serial
		});
		// Redirect after save
		sequence.$save(function(response) {
			$location.path('courses/' + $scope.course.serial + '/sequences/' + response.sequenceIndex);

			// Clear form fields
			$scope.name = '';
			$scope.description = '';
			$scope.start = '';
			$scope.end = '';
		}, function(errorResponse) {
			$scope.error = errorResponse.data.message;
		});
	};

	// Remove existing sequence
	$scope.remove = function(sequence) {
		if (sequence) {
			sequence.$remove();
			for (var i in $scope.sequences) {
				if ($scope.sequences [i] === sequence) {
					$scope.sequences.splice(i, 1);
				}
			}
		} else {
			$scope.sequence.$remove(function() {
				$location.path('sequences');
			});
		}
	};

	// Update existing sequence
	$scope.update = function() {
		var sequence = $scope.sequence;
		sequence.$update({
			courseSerial: $scope.courseSerial,
			sequenceIndex: $scope.sequenceIndex
		}, function() {
			$location.path('courses/' + $scope.courseSerial + '/sequences/' + $scope.sequenceIndex);
		}, function(errorResponse) {
			$scope.error = errorResponse.data.message;
		});
	};

	// Find existing sequence
	$scope.findOne = function() {
		$scope.courseSerial = $stateParams.courseSerial;
		$scope.sequenceIndex = $stateParams.sequenceIndex;
		$scope.sequence = Sequences.get({
			courseSerial: $stateParams.courseSerial,
			sequenceIndex: $stateParams.sequenceIndex
		}, function() {
			// Get the registration information
			$http.get('/registrations/' + $stateParams.courseSerial).success(function(data, status, header, config) {
				$scope.registration = data;
				if ($scope.registration !== null && $scope.registration.sequences.length >= $scope.sequenceIndex) {
					// Extract the total score and progress
					var sequence = $scope.registration.sequences[$scope.sequenceIndex - 1];
					$scope.score = sequence.score;
					$scope.progress = parseInt(sequence.progress * 100);
				}
			});
		});
	};

	// Find existing course
	$scope.findCourse = function() {
		$scope.course = Courses.get({ 
			courseSerial: $stateParams.courseSerial
		});
	};

	// Build an array of consecutive integers from 0 to n-1
	$scope.getNumber = function(n) {
		var tab = [];
		for (var i = 0; i < n; i++) {
			tab.push(i);
		}
		return tab;
	};

	// Test whether the current user has one of the specified roles
	$scope.hasRole = function(roles) {
		return $scope.authentication.user && roles.some(function(element, index, array) {
			return $scope.authentication.user.roles.indexOf(element) !== -1;
		});
	};

	// Test whether the current user is a coordinator of this course
	$scope.isCoordinator = function() {
		return $scope.authentication.user && $scope.course.coordinators.some(function(element, index, array) {
			return $scope.authentication.user._id === element._id;
		});
	};

	// Test whether the specified date is before now
	$scope.isBefore = function(date) {
		return moment().isBefore(moment(date));
	};

	// Test whether the specified date is after now
	$scope.isAfter = function(date) {
		return moment().isAfter(moment(date));
	};
}]);
