// Inspctr issue features

angular.module('inspctr.issues', [])

.controller('IssueListCtrl', function(IssueService, $scope) {
	var callback = function(error, data) {
		if(error != null) {
			console.log(error);
		} else {
			console.log("everything ok callback");
		}
	};


	$scope.issues = IssueService.getIssues(callback);
})

.factory('IssueService', function($http, apiUrl) {
	return {
		getIssues: function() {
			return $http.get(apiUrl + "/issues")
			.success(function(data, callback) {
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
		}
	};
})