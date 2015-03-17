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

	var callbackGetIssues = function(error) {
		if (error != null) {
			$log.debug(error);
		} else {
			setTimeout(function() {
				IssueService.getIssuesWithinBounds($scope.mapBounds, callbackSetMarkerIssues);
			}, 1500);
		}
	};

	var callbackGetBoundingBox = function(error) {
		if (error != null) {
			$log.debug(error);
		} else {
			MapService.getBoundingBox($scope, callbackGetIssues);
		}
	};

	var callbackGetDeviceLoc = function(error) {
		if(error != null) {
			$log.debug(error)
		} else {
			MapService.setMapCenter($scope);
			MapService.setMapZoom(17, $scope, callbackGetBoundingBox);
			MapService.setPositionMarker($scope);
		}
	};

	// set optimal leaflet map height
	var paramMapHeightReduction = {pixel:88};
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
				lat: 0,
				lng: 0,
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
    			});
    		} else { 
        		$log.debug("Geolocation is not supported or permitted.");
    		}
		},
		setMapCenter: function($scope) {
			if ($scope.geoposition != null && $scope.mapCenter != null) {
				$scope.mapCenter.lat = $scope.geoposition.coords.latitude;
				$scope.mapCenter.lng = $scope.geoposition.coords.longitude;
			} else {
				$log.debug("No $scope.geoposition or $scope.mapCenter found. Default set for mapCenter.")
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
