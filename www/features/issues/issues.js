// Inspctr issue features

angular.module('inspctr.issues', [])

.controller('IssueListCtrl', function(IssueService, $scope, placeholderImage, placeholderImagePath, $log) {
	var callback = function(error, data) {
		if(error != null) {
			$log.debug(error)
		} else {
			$scope.issues = data;
			$scope.issues.forEach(function(issue) {
				if (setPlaceholder(issue, placeholderImage)) {
					issue.imageUrl = placeholderImagePath;
				}
			});
			$log.debug(data)
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

.controller('IssueDetailCtrl', function(IssueService, $scope, $stateParams, placeholderImage, placeholderImagePath, $log) {
	$log.debug($stateParams);
	var callback = function(error, data) {
		if(error != null) {
			$log.debug(error);
		} else {
			$scope.issue = data;
			if (setPlaceholder($scope.issue, placeholderImage)) {
				$scope.issue.imageUrl = placeholderImagePath;
			}
			$log.debug(data);
		}
	};
	$scope.issue = IssueService.getIssueDetails($stateParams, callback);
})

.factory('IssueService', function($http, apiUrl, $log) {
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
		getIssuesWithinBoundingBox: function(boundingBox, callback) {
			var callback;
			var boundingBox;
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
			$log.debug("in getIssueDetails");
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

		}
	};
});

// function to determine, if config says that placeholder should be set (true).
// Or if the actual issue does not have an actual imageUrl then also set a placeholder.
function setPlaceholder(issue, placeholderImage) {
	return ((placeholderImage === 'true' && placeholderImage !== 'false') || (issue.imageUrl == ''))
}