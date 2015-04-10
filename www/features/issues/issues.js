// Inspctr issue features

angular.module('inspctr.issues', [])

.controller('IssueListCtrl', function(IssueService, $scope, $rootScope, $filter, $ionicListDelegate, placeholderImage, placeholderImagePath, $log) {
	var firstSetLoaded = false;
	var moreDataAvailable = true;

	var callback = function(error, data) {
		if (error != null) {
			$log.debug(error)
		} else {
			$scope.loadedPages++;
			$scope.issues = data;
			$scope.issues = IssueService.checkPlaceholder($scope.issues);
			firstSetLoaded = true;
		}
	}

	// initialisation properties
	$scope.loadedPages = 0;
	$scope.itemsPerPage = 12;
	var header = {
		headers: {
        'x-pagination': "" + $scope.loadedPages + ";" + $scope.itemsPerPage + "",
        'x-sort': '-updatedOn'
		}
	}
	$scope.issueAction = {users:null,issueId:null};		
	$scope.issues = IssueService.getIssues(header, callback);

	// listener to erase deleted issues
	$scope.$on('userDeletedIssue', function(event, issueId) {
		var notIssueId = "!" + issueId;
		$scope.issues = $filter('filter') ($scope.issues, {id:notIssueId});
	});
	// listener to remove all items from list and reload freshly also newly created items
	$scope.$on('userInsertedIssue', function(event) {
		$scope.issues = [];
	});

	//// functionality for data loading in list

	$scope.loadMoreData = function() {
		var callbackAddMore = function(error, data) {
			if (error != null) {
				$log.debug(error);
			} else {
				if (data.length == 0) {
					moreDataAvailable = false;
				} else {
					data.forEach(function(issue) {
						$scope.issues.push(issue);
						$scope.issues = IssueService.checkPlaceholder($scope.issues);
					});
				}	
				$scope.loadedPages++;
				$log.debug($scope);
			 	$scope.$broadcast('scroll.infiniteScrollComplete');
			}
		}
		var header = {
			headers: {
        	'x-pagination': "" + $scope.loadedPages + ";" + $scope.itemsPerPage + "",
        	'x-sort': '-updatedOn'
			}
		}
		$scope.addIssues = IssueService.getIssues(header, callbackAddMore);
	}

	$scope.moreDataCanBeLoaded = function() {
		if (firstSetLoaded && moreDataAvailable) {
			return true;
		} else {
			return false;
		}
	}

	//// swipe functionality functions

	var postAssignAction = function(issueId) {
		var type = "assign";
		var comment = "";
		IssueService.changeIssueStatus(issueId, type, comment, $scope.issueAction.assigneeId, callbackChangeIssueStatus);
		$rootScope.$broadcast('newAssignment');		
	}

	var callbackGetUsers = function(error, data) {
		if (error != null) {
			$log.debug(error);
		} else {
			var what = {
				elements: "issueAction.users",
				label: "firstname + \" \" + element.lastname",
				returnValue: "id",
				id: "id",
				setFunction: "setChosenElement",
				newElementFunction: "",
				title: "Assign Staff",
				subTitle: "to the issue",
				newElementFunctionPossible: false 	
			}
			$scope.issueAction.users = data;
			IssueService.buildSelectionPopup(what, $scope);
		}
	}

	var callbackChangeIssueStatus = function(error, data) {
		if (error != null) {
			$log.debug(error)
		} else {
			for (var i = 0; i < $scope.issues.length; i++) {
				if ($scope.issues[i].id == data.id) {
					$scope.issues[i].state = data.state;
					$scope.issues[i].assignee = data.assignee;
				}
			}
		}
		$ionicListDelegate.closeOptionButtons();
	}

	$scope.assignIssue = function(issueId) {
		// if too many results, limit number of results
		var headerGetUsers = {
			headers: {
        	'x-pagination': '0;*',
        	//'x-sort': 'updatedOn'
			}	
		}
		$scope.issueAction.issueId = issueId;
		// start with popup
		IssueService.getUsers(headerGetUsers, callbackGetUsers);	
	}

	$scope.rejectIssue = function(issueId) {
		var type = "reject";
		var comment = "";
		IssueService.changeIssueStatus(issueId, type, comment, null, callbackChangeIssueStatus);	
	}

	$scope.setChosenElement = function(returnValue, id) {
		$scope.issueAction.assigneeId = id;
		postAssignAction($scope.issueAction.issueId);
	}


})

.controller('IssueDetailCtrl', function(IssueService, MapService, $rootScope, $scope, $state, $stateParams, $ionicHistory, $http, placeholderImage, placeholderImagePath, mapboxMapId, mapboxAccessToken, $window, $log) {

	var callbackIssueDeleted = function(error) {
		if (error != null) {
			$log.debug("in callbackIssueDeleted error");
			$log.debug(error);
		} else {
			setTimeout(function() {
				$rootScope.$broadcast('userDeletedIssue', $scope.issue.id);
			}, 20);
			$state.go("sideMenu.issueList");
		}
	}

	var callbackZoom = function(error) {
		if (error != null) {
			$log.debug(error);
		}
	}

	var callbackDetails = function(error, data) {
		var callbackSetAddress = function(error, formattedAddress) {
			if (error != null) {
				$log.debug("Error occurred when setting address");
			} else {
				$scope.issue.formattedAddress = formattedAddress;
				$scope.$digest();
			}	
		}
		if (error != null) {
			$log.debug(error);
		} else {
			$scope.issue = data;
			$scope.issue = IssueService.checkPlaceholder($scope.issue);
			MapService.setMapCenterOnIssue($scope.issue, $scope);
			MapService.setMapZoom(16, $scope, callbackZoom);
			MapService.setSingleIssueMarker($scope.issue, $scope);
			MapService.getAddress($scope.issue, callbackSetAddress);
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
	$scope.backView = function() {
		$ionicHistory.goBack();
	}
})

.controller('NewIssueCtrl', function(IssueService, CameraService, MapService, $scope, $rootScope, $ionicPopup, $state, $stateParams, $http, mapboxMapId, mapboxAccessToken, cameraFunctionalityAvailable, geolocation, qimgUrl, qimgToken, $window, $log) {
	// initialization of property .newIssue
	if ($scope.newIssue == null) {
		$scope.newIssue = {
			cameraFunctionalityAvailable: cameraFunctionalityAvailable,
			imageUrl: "",
			tags: ""
		};
		geolocation.getLocation().then(function(data){
			// function to activate geolocation before entering setLocation.
			// workaround for location bug.
		});
	}
	$scope.issueSaved = false;

	$scope.$on('userSettedLocation', function(event, coords) {
		$scope.newIssue.lat = coords.lat;
		$scope.newIssue.lng = coords.lng;
		$scope.$digest();
	});

	$scope.callbackSetLocation = function(error, data) {
		if (error != null) {
			$log.debug(error);
		} else {
			$log.debug("in callback Set location");
		}
	}

	var callbackSavedTags = function(error, data) {
		if (error != null) {
			$log.debug(error);
		} else {
			$scope.issueSaved = true;
			setTimeout(function() {
				$scope.issueSaved = false;
				$scope.clearNewIssue();
				$scope.$digest();
				setTimeout(function() {
					$rootScope.$broadcast('userInsertedIssue');				
				}, 20);
			}, 1500);
		}		
	}

	var callbackSavedIssue = function(error, data) {
		if (error != null) {
			$log.debug(error);
		} else {
			var tags = $scope.newIssue.tags.split();
			if (tags.length > 0) {
				IssueService.postNewTags(data.id, tags, callbackSavedTags);
			} else {
				callbackSavedTags();
			}	
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
				id: "id",
				setFunction: "setChosenElement",
				newElementFunction: "createNewElement",
				title: 'Select Issue Type',
    			subTitle: 'Please stay general',
    			newElementFunctionPossible: true
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

	$scope.setChosenElement = function(returnValue, id) {
		$scope.newIssue.issueType = returnValue;
		$scope.newIssue.issueTypeId = id;
	}

	$scope.createNewElement = function() {
		$scope.newIssue.issueType = "";
		setTimeout(function() {
			IssueService.createNewIssuePopup(IssueService.saveIssueType, callbackSavedIssueType, $scope);
		}, 30);
	}

	$scope.setLocation = function() {
		var coords = {
			lat: $scope.newIssue.lat,
			lng: $scope.newIssue.lng
		}

		setTimeout(function() {
			$rootScope.$broadcast('actualIssuePosition', coords);		
		}, 40);
		$state.go('setLocation');
	}

	$scope.addPicture = function() {
		if (cameraFunctionalityAvailable == "true") {
			CameraService.getPicture({
				quality: 75,
				targetWidth: 400,
				targetHeight: 300,
				destinationType: Camera.DestinationType.DATA_URL
			}).then(function(imageData) {
				$http({
					method: "POST",
					url: qimgUrl + "/images",
					headers: {
						Authorization: "Bearer " + qimgToken
					},
					data: {
						data: imageData
					}
				}).success(function(data) {
					$scope.newIssue.imageUrl = data.url;
				});
			});
		} else {
			alert("Camera functionality not available on this device.");
		}
	}

	$scope.issueComplete = function() {
		if ($scope.newIssue.issueType != null 
			&& $scope.newIssue.description != null 
			&& $scope.newIssue.lat != null 
			&& $scope.newIssue.lng != null) {
			return true
		} else {
			return false
		}
	}

	$scope.saveNewIssue = function() {
		if ($scope.issueComplete()) {
			IssueService.postNewIssue($scope.newIssue, callbackSavedIssue);
		} else {
			$log.debug("issue was not complete");
		}
	}

	$scope.clearNewIssue = function() {
		$scope.newIssue = {
			cameraFunctionalityAvailable: cameraFunctionalityAvailable,
			imageUrl: ""
		}
	}

})

.controller('MyIssueListCtrl', function(IssueService, AuthService, MapService, $scope, $rootScope, $filter, $ionicListDelegate, placeholderImage, placeholderImagePath, geolocation, $log) {

	var setIssuesDistances = function() {
		$scope.issues.forEach(function(issue) {
			setIssueDistance(issue);
		});
		try {
			$scope.$digest();
		} catch (exception) {
			setTimeout(function() {
				$scope.$digest()}, 2000);
		}	
	}
	
	var setIssueDistance = function(issue) {
		var callbackDistanceMatrix = function(response, status) {
			issue.distanceMatrix = response.rows[0].elements[0];
		}
		var daysSinceLastUpdate = function() {
			var update = new Date(issue.updatedOn);
			update = update.getTime();
			now = new Date().getTime();
			issue.hoursSinceUpdate = (now - update) / 1000 / 60 / 60;
		}
		var origin = new google.maps.LatLng($scope.geoposition.coords.latitude, $scope.geoposition.coords.longitude);
		var destination = new google.maps.LatLng(issue.lat, issue.lng);
		var service = new google.maps.DistanceMatrixService();
		service.getDistanceMatrix({
			origins: [origin],
			destinations: [destination],
			travelMode: google.maps.TravelMode.DRIVING,
			avoidHighways: false,
			avoidTolls: false
		}, callbackDistanceMatrix);
		daysSinceLastUpdate();
	}

	var callbackChangeIssueStatus = function(error, data) {
		if (error != null) {
			$log.debug(error)
		} else {
			for (var i = 0; i < $scope.issues.length; i++) {
				if ($scope.issues[i].id == data.id) {
					$scope.issues[i].state = data.state;
				}
			}
		}
		$ionicListDelegate.closeOptionButtons();
	}

	var callbackGeolocation = function(error, data) {
		if (error != null) {
			$log.debug(error);
		} else {
			// actually no need for
		}	
	}

	var callback = function(error, data) {
		if (error != null) {
			$log.debug(error);
		} else {
			$scope.loadedPages++;
			$scope.issues = data;
			$scope.issues = IssueService.checkPlaceholder($scope.issues);
			firstSetLoaded = true;
			setIssuesDistances();
		}
	}

	// listener to remove all items from list and reload freshly also newly created items
	$rootScope.$on('newAssignment', function(event) {
		$scope.doRefresh();
	});

	// action
	var firstSetLoaded = false;
	var moreDataAvailable = true;
	$scope.loadedPages = 0;
	$scope.itemsPerPage = 12;
	var header = {
		headers: {
			'x-pagination': "" + $scope.loadedPages + ";" + $scope.itemsPerPage + "",
			'x-sort': '-updatedOn'
		}
	}
	$scope.issueAction = {users:null,issueId:null};		

	// start action
	var currentUserId = AuthService.getUserId();
	MapService.getDeviceLocation(geolocation, $scope, callbackGeolocation);
	$scope.issues = IssueService.getMyIssues(AuthService.getUserId(), header, callback);

	// scope functionalities
	$scope.startIssue = function(issueId) {
		var type = "start";
		var comment = "";
		IssueService.changeIssueStatus(issueId, type, comment, null, callbackChangeIssueStatus);
	}
	$scope.resolveIssue = function(issueId) {
		var type = "resolve";
		var comment = "";
		IssueService.changeIssueStatus(issueId, type, comment, null, callbackChangeIssueStatus);
	}
	$scope.rejectIssue = function(issueId) {
		var type = "reject";
		var comment = "";
		IssueService.changeIssueStatus(issueId, type, comment, null, callbackChangeIssueStatus);	
	}
	$scope.doRefresh = function() {
		$scope.issues = IssueService.getMyIssues(AuthService.getUserId(), header, callback);
		$scope.$broadcast('scroll.refreshComplete');
	}

})



/********************************* SERVICE FROM HERE **********************************/

.factory('IssueService', function($http, apiUrl, placeholderImage, placeholderImagePath, $ionicPopup, $document, $log) {
	// function to determine, if config says that placeholder should be set (true).
	// Or if the actual issue does not have an actual imageUrl then also set a placeholder.
	function setPlaceholder(issue, placeholderImage) {
		return ((placeholderImage === 'true' && placeholderImage !== 'false') || (issue.imageUrl == ''))
	}

	function deleteIssueFromDB(issue, callback) {
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
		getMyIssues: function(userId, header, callback) {
			var body = {
				"_assignee":userId
			}
			return $http.post(apiUrl + "/issues/search", body, header)
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
		postNewIssue: function(issue, callback) {
			var body = {
				"description": issue.description,
				"lng": issue.lng,
				"lat": issue.lat,
				"imageUrl": issue.imageUrl,
				"issueTypeId": issue.issueTypeId
			}
			return $http.post(apiUrl + "/issues", body)
			.success(function(data) {
				if (typeof callback === "function") {
					callback(null, data);
				}
			})
			.error(function(error) {
				if (typeof callback === "function") {
					callback(error);
				}	
			});
		},
		postNewTags: function(issueId, tags, callback) {
			var body = {
  				"type": "addTags",
  				"payload": {
    				"tags": tags
				}
			}
			return $http.post(apiUrl + "/issues/" + issueId + "/actions", body)
			.success(function(data) {
				callback(null, data);
			})
			.error(function(error) {
				callback(error)
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
		getUsers: function(header, callback) {
			var callback;
			var header;
			return $http.get(apiUrl + "/users", header)
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
		changeIssueStatus: function(issueId, type, comment, assigneeId, callback) {
			var body = {
  				type: type,
  				payload: {
    				assigneeId: assigneeId,
    				comment: comment
  				}
			};
			return $http.post(apiUrl + "/issues/" + issueId + "/actions", body)
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
		//		title: "thePopupTitle",
		//		subTitle: "thePopupSubtitle"
		//		newElementFunctionPossible: true or false 	
		// }
		buildSelectionPopup: function(what, $scope) {
			var myPopup = $ionicPopup.show({
    			template: '<ion-list><ion-item ng-repeat="element in ' + what.elements +'" ng-click="' + what.setFunction + '(\'{{element.' + what.returnValue + '}}\',\'{{element.' + what.id +'}}\');closePopup()">{{element.' + what.label + '}}</ion-item>'
    				+ '<ion-item ng-if="' + what.newElementFunctionPossible + '" class="inspctr-create-new-element" ng-click="' + what.newElementFunction + '();closePopup()">New</ion-item>'
    				+ '<ion-item class="inspctr-close-popup" ng-click="closePopup()">Cancel</ion-item></ion-list>',
    			title: what.title,
    			subTitle: what.subTitle,
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

.factory("CameraService", function($q) {
	return {
		getPicture: function(options) {
			var deferred = $q.defer();
			navigator.camera.getPicture(function(result) {
			// do any magic you need
			deferred.resolve(result);
			}, function(err) {
				deferred.reject(err);
			}, options);
			return deferred.promise;
		}
	}
})
