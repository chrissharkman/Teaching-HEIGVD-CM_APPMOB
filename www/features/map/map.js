// The Inspctr Map module.

angular.module('inspctr.map', [])

.controller("MapIssuesCtrl", function(mapboxMapId, mapboxAccessToken, geolocation, $scope, IssueService, MapService, $log) {
	var callbackGetDeviceLoc = function(error) {
		if(error != null) {
			$log.debug(error)
		} else {
			$log.debug("in callbackGetDeviceLoc");
			$log.debug($scope)
			MapService.setMapCenter($scope);
			MapService.setMapZoom(17, $scope);
			MapService.setPositionMarker($scope);
		}
	};


	//MapService.getDevicePosition();
	//var boundingBox = MapService.getBoundingBox(position);
	//$scope.issues = IssueService.getIssuesWithinBoundingBox(header, boundingBox, callback);


	// Mapbox default map loading
	var mapboxTileLayer = "http://api.tiles.mapbox.com/v4/" + mapboxMapId;
	mapboxTileLayer = mapboxTileLayer + "/{z}/{x}/{y}.png?access_token=" + mapboxAccessToken;
	$scope.mapDefaults = {
		tileLayer: mapboxTileLayer
	};
	$scope.mapCenter = {
		// set default mapCenter
		lat: 0,
		lng: 0,
		zoom: 18
	};

	MapService.getDeviceLocation(geolocation, $scope, callbackGetDeviceLoc);
	$scope.mapMarkers = [];


})



.factory('MapService', function($log) {
	return {
		getBoundingBox: function(position) {
			return {
				// to be adapted: calculate bounding box from given position
				'from': {'lng':6.622009, 'lat':46.766129},
				'to': {'lng':6.651878, 'lat':46.784234}
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
		setMapZoom: function(zoom, $scope) {
			if ($scope.mapCenter != null) {
				$scope.mapCenter.zoom = zoom;
			} else {
				$log.debug("no MapCenter property");
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
			});
    	}
	}
})

function showPosition(position) {
	return "aaaaa";
}