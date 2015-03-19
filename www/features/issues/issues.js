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

.controller('IssueDetailCtrl', function(IssueService, MapService, $scope, $state, $stateParams, placeholderImage, placeholderImagePath, mapboxMapId, mapboxAccessToken, $window, $log) {

	var callbackIssueDeleted = function(error) {
		if (error != null) {
			$log.debug("in callbackIssueDeleted error");
			$log.debug(error);
		} else {
			$log.debug("callbackIssueDeleted OK");
			$state.go("sideMenu.issueList");
		}
	}

	var callbackZoom = function(error) {
		if (error != null) {
			$log.debug(error);
		}
	}

	var callbackDetails = function(error, data) {
		if (error != null) {
			$log.debug(error);
		} else {
			$scope.issue = data;
			$scope.issue = IssueService.checkPlaceholder($scope.issue);
			MapService.setMapCenterOnIssue($scope.issue, $scope);
			MapService.setMapZoom(16, $scope, callbackZoom);
			MapService.setSingleIssueMarker($scope.issue, $scope);
		}
	};

	// define leaflet height
	var param = {percent:35};
	MapService.setMapHeight(document.querySelector('#map-detail'), $window, param);

	// start cascade of calls to load details, image, map and set map with correct height and marker
	MapService.initializeMap($scope);
	IssueService.getIssueDetails($stateParams, callbackDetails);
	$scope.deleteIssue = function() {
		IssueService.deleteIssueDialog($scope.issue, callbackIssueDeleted);
	};
})

.controller('NewIssueCtrl', function(IssueService, MapService, $scope, $ionicPopup, $state, $stateParams, mapboxMapId, mapboxAccessToken, $window, $log) {
	$log.debug("in NewIssueCtrl");

	if ($scope.newIssue == null) {
		$scope.newIssue = {lng: "",lat: ""};
	}
	// twice a call from stateChangeSuccess. Why? 
	$scope.$on('$stateChangeSuccess', 
		function(event, toState, toParams, fromState, fromParams){
    	if (fromState.name == "setLocation") {
    		setTimeout(function() {
    			$log.debug(event);
	    		$scope.newIssue.lat = $stateParams.lat;
    			$scope.newIssue.lng = $stateParams.lng;
    		}, 30);	
    	} 
	})

	$scope.callbackSetLocation = function(error, data) {
		if (error != null) {
			$log.debug(error);
		} else {
			$log.debug("in callback Set location");
		}
	}

	var callbackSavedIssueType = function(error, data) {
		if (error != null) {
			$log.debug(error);
		} else {
			$scope.newIssue.issueTypeId = data.id;
		}	
	}

	var callbackGetIssues = function(error, data) {
		if (error != null) {
			$log.debug(error);
		} else {
			var what = {
				elements: "issueTypes",
				label: "name",
				returnValue: "name",
				setFunction: "setChosenElement",
				newElementFunction: "createNewElement"
			}
			$scope.issueTypes = data;
			IssueService.buildSelectionPopup(what, $scope);
		}
	}	


	// if too many results, limit number of results
	var headerGetIssues = {
		headers: {
        	//'x-pagination': '10;9',
        	//'x-sort': 'updatedOn'
		}	
	}

	$scope.showIssueTypePopup = function(headerGetIssues) {
		IssueService.getIssueTypes(headerGetIssues, callbackGetIssues)
	}

	$scope.setChosenElement = function(returnValue) {
		$scope.newIssue.issueType = returnValue;
	}

	$scope.createNewElement = function() {
		$scope.newIssue.issueType = "";
		setTimeout(function() {
			IssueService.createNewIssuePopup(IssueService.saveIssueType, callbackSavedIssueType, $scope);
		}, 30);
	}

})


.factory('IssueService', function($http, apiUrl, placeholderImage, placeholderImagePath, $ionicPopup, $document, $log) {
	// function to determine, if config says that placeholder should be set (true).
	// Or if the actual issue does not have an actual imageUrl then also set a placeholder.
	function setPlaceholder(issue, placeholderImage) {
		return ((placeholderImage === 'true' && placeholderImage !== 'false') || (issue.imageUrl == ''))
	}

	function deleteIssueFromDB(issue, callback) {
		$log.debug(issue);
		return $http.delete(apiUrl + "/issues/" + issue.id)
		.success(function() {
			if (typeof callback === "function") {
				callback(null);
			}	
		})
		.error(function(error) {
			if (typeof callback === "function") {
				callback(error);
			}	
		})	
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
		// delete issue function with confirmation popup
		deleteIssueDialog: function(issue, callback) {
			var confirmPopup = $ionicPopup.confirm({
				title: 'Delete Issue',
				template: 'Are you sure you want to delete this issue?'
			});
			confirmPopup.then(function(res) {
				if(res) {
					deleteIssueFromDB(issue, callback);
				}
			});
		},
		getIssueTypes: function(header, callback) {
			var callback;
			var header;
			return $http.get(apiUrl + "/issueTypes", header)
			.success(function(data) {
				if (typeof callback === "function") {
					callback(null, data);
				}	
			})
			.error(function(error) {
				if (typeof callback === "function") {
					callback(error, null);
				}	
			});
		},
		saveIssueType: function($scope, callback) {
			var body = {
				name: $scope.newIssue.issueType
			};
			return $http.post(apiUrl + "/issueTypes", body)
			.success(function(data) {
				if (typeof callback === "function") {
					callback(null, data);
				}
			})
			.error(function(error) {
				if (typeof callback === "function") {
					callback(error, null);
				}	
			});
		},
		// buildSelectionPopup is a general function to build popups with a content,
		// that either calls a setChosenElement(id) or a createNewElement()
		// The what parameter is an object with three properties = {
		// 		elements: "theElementInScope",
		//		label: "thePropertyNameToDisplay",
		//		returnValue: "thePropertyIdToSetIntoFunction",
		//		setFunction: "nameOfFunctionToSetElement",
		//		newElementFunction: "nameOfFunctionForNewElement" 	
		// }
		buildSelectionPopup: function(what, $scope) {
			var myPopup = $ionicPopup.show({
    			template: '<ion-list><ion-item ng-repeat="element in ' + what.elements +'" ng-click="' + what.setFunction + '(\'{{element.' + what.returnValue + '}}\');closePopup()">{{element.' + what.label + '}}</ion-item>'
    				+ '<ion-item class="inspctr-create-new-element" ng-click="' + what.newElementFunction + '();closePopup()">New</ion-item>'
    				+ '<ion-item class="inspctr-close-popup" ng-click="closePopup()">Cancel</ion-item></ion-list>',
    			title: 'Select Issue Type',
    			subTitle: 'Please stay general',
    			scope: $scope,
        	});
        	$scope.closePopup = function() {
        		myPopup.close();
        	}
		},
		createNewIssuePopup: function(save, callback, $scope) {
			$log.debug($scope);
			var myPopup = $ionicPopup.show({
				template: '<input ng-model="newIssue.issueType">',
				title: 'Set new issue type',
				subTitle: 'Please stay general.',
				scope: $scope,
				buttons: [
				{ 	text: 'Cancel',
					onTap: function(e) {
						$scope.closePopup();
					}
				},
				{
					text: '<b>Save</b>',
					type: 'button-positive',
					onTap: function(e) {
						if (!$scope.newIssue.issueType) {
							e.preventDefault();
						} else {
							save($scope, callback);
						}
					}
				}
				]
			});
			$scope.closePopup = function() {
        		myPopup.close();
        	}
		}
	};
})


