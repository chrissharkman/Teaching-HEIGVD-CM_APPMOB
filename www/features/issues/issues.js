// Inspctr issue features

angular.module('inspctr.issues', [])

.controller('IssueListCtrl', function(IssueService, $scope, placeholderImage, placeholderImagePath, $log) {
	var callback = function(error, data) {
		if(error != null) {
			$log.debug(error)
		} else {
			$scope.issues = data;
			$scope.issues = IssueService.checkPlaceholder($scope.issues);
		}
	};
	var header = {
		headers: {
        'x-pagination': '10;9',
        'x-sort': 'updatedOn'
		}
	}		
	$scope.issues = IssueService.getIssues(header, callback);
})

.controller('IssueDetailCtrl', function(IssueService, MapService, $scope, $stateParams, placeholderImage, placeholderImagePath, mapboxMapId, mapboxAccessToken, $window, $log) {

	var callbackDetails = function(error, data) {
		if(error != null) {
			$log.debug(error);
		} else {
			$scope.issue = data;
			$scope.issue = IssueService.checkPlaceholder($scope.issue);
		}
	};

	// define leaflet height
	var param = {percent:50};
	MapService.setMapHeight(document.querySelector('#map-detail'), $window, param);

	// start cascade of calls to load details, image, map and set map with correct height and marker
	MapService.initializeMap($scope);
	$scope.issue = IssueService.getIssueDetails($stateParams, callbackDetails);
})

.factory('IssueService', function($http, apiUrl, placeholderImage, placeholderImagePath, $log) {
	// function to determine, if config says that placeholder should be set (true).
	// Or if the actual issue does not have an actual imageUrl then also set a placeholder.
	function setPlaceholder(issue, placeholderImage) {
		return ((placeholderImage === 'true' && placeholderImage !== 'false') || (issue.imageUrl == ''))
	}

	return {
		getIssues: function(header, callback) {
			var callback;
			var header;
			return $http.get(apiUrl + "/issues", header)
			.success(function(data) {
				if (typeof callback === "function") {
					callback(null, data);
				}	
			})
			.error(function(error) {
				if (typeof callback === "function") {
					callback(error, null);
				}	
			})
			;
		},
		getIssuesWithinBounds: function(bounds, callback) {
			var callback;
			var boundingBox;
			var header = {
				"$and": [ {
					"lat": {
						"$gte": bounds.southWest.lat,
						"$lte": bounds.northEast.lat
					}
				}, {
					"lng": {
						"$gte": bounds.southWest.lng,
						"$lte": bounds.northEast.lng
					}
				}
				]
			}
			return $http.post(apiUrl + "/issues/search", header)
			.success(function(data) {
				if (typeof callback === "function") {
					callback(null, data);
				}	
			})
			.error(function(error) {
				if (typeof callback === "function") {
					callback(error, null);
				}	
			})
			;
		},
		getIssueDetails: function(stateParams, callback) {
			var callback;
			var stateParams;
			return $http.get(apiUrl + "/issues/" + stateParams.issueId)
			.success(function(data) {
				if (typeof callback === "function") {
					callback(null, data);
				}
			})
			.error(function(error){
				if (typeof callback === "function") {
					callback(error, null);
				}
			}) 
		},
		// checkPlaceholder can take issue or issues as parameter, a check is executed
		// if issues.id != null, so issues is a single issue
		checkPlaceholder: function(issues) {
			if (issues.id != null) {
				if(setPlaceholder(issues, placeholderImage)) {
					issues.imageUrl = placeholderImagePath;
				}
			} else {
				issues.forEach(function(issue) {
					if (setPlaceholder(issue, placeholderImage)) {
						issue.imageUrl = placeholderImagePath;
					}
				});
			}	
			return issues;	
		},
	};
});