// Inspctr issue features

angular.module('inspctr.issues', [])

.controller('IssueListCtrl', function(IssueService, $scope, $log) {
	var callback = function(error, data) {
		if(error != null) {
			$log.debug(error)
		} else {
			$scope.issues = data;
			$log.debug(data)
		}
	};
	$scope.issues = IssueService.getIssues(callback);
})

.factory('IssueService', function($http, apiUrl, $log) {
	return {
		getIssues: function(callback) {
			var callback;
			var header = {
				headers: {
        		//'x-pagination': '10;6',
        		'x-sort': 'updatedOn'
		    	}
			};
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
		}
	};
})