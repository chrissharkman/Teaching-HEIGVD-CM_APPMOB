// The Inspctr Map module.

angular.module('inspctr.map', [])

.controller("MapIssuesCtrl", function(mapboxMapId, mapboxAccessToken, geolocation, leafletEvents, $scope, $window, IssueService, MapService, $log) {
	var callbackSetMarkerIssues = function(error, data) {
		if (error != null) {
			$log.debug(error);
		} else {
			MapService.setIssueMarker(data, $scope);
		}	
	};

	var callbackGetIssues = function(error, data) {
		if (error != null) {
			$log.debug(error);
		} else {
			setTimeout(function() {
				IssueService.getIssuesWithinBounds($scope.mapBounds, callbackSetMarkerIssues);
			}, 1500);
		}
	};

	var callbackGetBoundingBox = function(error, data) {
		if (error != null) {
			$log.debug(error);
		} else {
			MapService.getBoundingBox($scope, callbackGetIssues);
		}
	};

	var callbackGetDeviceLoc = function(error, data) {
		if(error != null) {
			$log.debug(error)
		} else {
			MapService.setMapCenter($scope);
			MapService.setMapZoom(17, $scope, callbackGetBoundingBox);
			MapService.setPositionMarker($scope);
		}
	};

	// set optimal leaflet map height
	var paramMapHeightReduction = {pixel:44};
	MapService.setMapHeight(document.querySelector('#map-full'), $window, paramMapHeightReduction);

	// start cascade of calls to fill map with position and issues
	MapService.initializeMap($scope);
	MapService.getDeviceLocation(geolocation, $scope, callbackGetDeviceLoc);

	// initialize event listeners
	var mapEventsToReload = ['moveend', 'resize'];
	mapEventsToReload.forEach(function(eventName) {
		$scope.$on('leafletDirectiveMap.' + eventName, function(event) {
			MapService.getBoundingBox($scope, callbackGetIssues);
		})
	})
})



.controller('MapSetLocationCtrl', function(mapboxMapId, mapboxAccessToken, geolocation, leafletEvents, $ionicHistory, $stateParams, $scope, $rootScope, $window, IssueService, MapService, $log) {

	var callbackZoomMap = function(error, data) {
		if (error != null) {
			$log.debug(error);
		}
	}

	var callbackGetDeviceLoc = function(error, data) {
		if(error != null) {
			$log.debug(error)
		} else {
			MapService.setMapCenter($scope);
			MapService.setMapZoom(17, $scope, callbackZoomMap);
			MapService.setIssueLocationMarker($scope.geoposition.coords.latitude, $scope.geoposition.coords.longitude, $scope);
		}
	};

	$scope.$on('actualIssuePosition', function(event, coords) {
		if (coords.lat == null) {
			MapService.getDeviceLocation(geolocation, $scope, callbackGetDeviceLoc);	
		} else {
			MapService.setMapCenterOnIssue(coords, $scope);
			MapService.setMapZoom(17, $scope, callbackZoomMap);
			MapService.setIssueLocationMarker(coords.lat, coords.lng, $scope);
		}
	});

	setTimeout(function() {
		var paramMapHeightReduction = {pixel:0};
		MapService.setMapHeight(document.querySelector('#map-full'), $window, paramMapHeightReduction);
	}, 40);

	// start cascade of calls to initialize map
	MapService.initializeMap($scope);

	// function to return data to newIssue-View via $rootScope.$broadcast, data set from scope.mapMarker
	$scope.goBackAndBroadcast = function() {
		var coords = {
			lat: $scope.mapMarkers.issue.lat,
			lng: $scope.mapMarkers.issue.lng
		}
		setTimeout(function() {
			$rootScope.$broadcast('userSettedLocation', coords);
		}, 20);
		$ionicHistory.goBack();
	}

	$scope.localisationReadyCall = function() {
		$scope.localisationReady = true;
	}


})



.factory('MapService', function(mapboxMapId, mapboxAccessToken, IssueService, $log) {

	function markerAlreadySet(issue, $scope) {
		var markerAlreadySet = false;
		$scope.mapMarkers.forEach(function(marker) {
			if (marker.id == issue.id) {
				markerAlreadySet = true;
			}
		});
		return markerAlreadySet;
	}

	return {
		// initializeMap is a function to make Mapbox default map loading and default properties
		initializeMap: function($scope) {
			var mapboxTileLayer = "http://api.tiles.mapbox.com/v4/" + mapboxMapId;
			mapboxTileLayer = mapboxTileLayer + "/{z}/{x}/{y}.png?access_token=" + mapboxAccessToken;
			$scope.mapDefaults = {
				tileLayer: mapboxTileLayer
			};
			$scope.mapCenter = {
				lat: 46.94754502213663,
				lng: 7.440694570541382,
				zoom: 18
			};
			$scope.mapMarkers = [];
		},
		getBoundingBox: function($scope, callback) {
			$scope.mapBounds;
			if ($scope.mapBounds != null) {
				callback(null);
			}	
		},
		getDeviceLocation: function(geolocation, $scope, callback) {
			var callbackGeoloc = function(data) {
				$scope.geoposition = data;
			}

    		if (geolocation.getLocation()) {
    			geolocation.getLocation().then(function(data) {
    				callbackGeoloc(data);
    				callback(null);
    			}).catch(function(data) {
    				$scope.geoposition.coords.latitude = 46.94754502213663;
    				$scope.geoposition.coords.longitude = 7.440694570541382;
    				callback(null);
    			});
    		} else { 
        		$log.debug("Geolocation is not supported or permitted.");
    		}
		},
		getAddress: function(issue, callback) {
			var geocoder = new google.maps.Geocoder();
			var latlng = new google.maps.LatLng(issue.lat, issue.lng);
			var formattedAddress;
			geocoder.geocode({'latLng': latlng}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK && typeof callback === "function") {
					callback(null, results[0].formatted_address);
				} else {
					callback("error");
				}
			});

		},
		setMapCenter: function($scope) {
			if ($scope.geoposition != null && $scope.mapCenter != null) {
				$scope.mapCenter.lat = $scope.geoposition.coords.latitude;
				$scope.mapCenter.lng = $scope.geoposition.coords.longitude;
			} else {
				$log.debug("No $scope.geoposition or $scope.mapCenter found. Default set for mapCenter.");
				$scope.mapCenter = {
					lat: 46.77,
					lng: 6.63
				};
			}
		},
		setMapCenterOnIssue: function(issue, $scope) {
			if ($scope.mapCenter != null) {
				$scope.mapCenter.lat = issue.lat;
				$scope.mapCenter.lng = issue.lng;
			} else {
				$log.debug("no $scope.mapCenter found. Default set for mapCenter.");
				$scope.mapCenter = {
					lat: 46.77,
					lng: 6.63
				};
			}
		},
		setMapZoom: function(zoom, $scope, callback) {
			if ($scope.mapCenter != null) {
				$scope.mapCenter.zoom = zoom;
				callback(null);
			} else {
				$log.debug("no MapCenter property");
				callback(err);
			}
		},
		setPositionMarker: function($scope) {
			var local_icons = {
        		position_icon: {
            	iconUrl: 'img/position-icon.png',
            	shadowUrl: 'img/position-icon-shadow.png',
            	iconSize:     [40, 40], // size of the icon
            	shadowSize:   [40, 40], // size of the shadow
            	iconAnchor:   [20, 20], // point of the icon which will correspond to marker's location
            	shadowAnchor: [20, 20],  // the same for the shadow
            	popupAnchor:  [0, -10] // point from which the popup should open relative to the iconAnchor
            	}	
        	}
        	$scope.mapMarkers.push({
        		lat: $scope.geoposition.coords.latitude,
        		lng: $scope.geoposition.coords.longitude,
				icon: local_icons.position_icon,
				id: "position-icon"
			});
    	},
    	setIssueMarker: function(issues, $scope) {
			issues = IssueService.checkPlaceholder(issues);
    		issues.forEach(function(issue) {
    			if (!markerAlreadySet(issue, $scope)) {
    				$scope.mapMarkers.push({
    					lat: issue.lat,
						lng: issue.lng,
						id: issue.id,
						message: "<p>{{issue.description}}</p><img src='{{issue.imageUrl}}' width='200px' />",
						getMessageScope: function() {
							var scope = $scope.$new();
							scope.issue = issue;
							return scope;
						}
					});
    			}
    		})
    	},
    	setIssueLocationMarker: function(latitude, longitude, $scope) {
    		// check if issue marker is already positionned. if yes, just set new lat + lng, if no, extend scope
    		if ($scope.mapMarkers.issue != null) {
    			$scope.mapMarkers.issue.lat = latitude;
    			$scope.mapMarkers.issue.lng = longitude;
    		} else {
    			angular.extend($scope, {
    				mapMarkers: {
    					issue: {
    						lat: latitude,
    						lng: longitude,
    						focus: true,
    						draggable: true
    					}
    				}
    			});
    		}
    		$scope.localisationReadyCall();
    	},
    	setSingleIssueMarker: function(issue, $scope) {
    		if (!markerAlreadySet(issue, $scope)) {
    			$scope.mapMarkers.push({
    				lat: issue.lat,
    				lng: issue.lng,
    				id: issue.id
    			});
    		}
    	},
    	// setMapHeight is needed to make fill the screen with the map.
    	// the parameter needs a pair of key/value: either pixel or percent: {pixel:200} or {percent:80}
    	setMapHeight: function(map, win, parameter) {
    		var mapHeight = win.innerHeight;
	        if (parameter.pixel != null) {
	        	mapHeight = mapHeight - parameter.pixel;
	        } else if (parameter.percent != null) {
	        	mapHeight = mapHeight * parameter.percent / 100;
	        }
	        map.style.height = mapHeight + "px";
    	}
    }
})
