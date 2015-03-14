// The Inspctr Map module.

angular.module('inspctr.map', [])

.controller("MapIssuesCtrl", function(mapboxMapId, mapboxAccessToken, $scope, IssueService) {
	var callback = function(error, data) {
		if(error != null) {
			$log.debug(error)
		} else {
			$scope.issues = data;


			$scope.mapCenter
			$log.debug(data)
		}
	};

	//MapService.getDevicePosition();
	//var boundingBox = MapService.getBoundingBox(position);

	//$scope.issues = IssueService.getIssuesWithinBoundingBox(header, boundingBox, callback);


	var mapboxTileLayer = "http://api.tiles.mapbox.com/v4/" + mapboxMapId;
	mapboxTileLayer = mapboxTileLayer + "/{z}/{x}/{y}.png?access_token=" + mapboxAccessToken;
	$scope.mapDefaults = {
		tileLayer: mapboxTileLayer
	};
	$scope.mapCenter = {
		// set mapCenter on DevicePosition
		lat: 46.77,
		lng: 6.63,
		zoom: 14
	};
	$scope.mapMarkers = [];
})

.factory('MapService', function(position, $log) {
	return {
		getBoundingBox: function(position) {
			return {
				// to be adapted: calculate bounding box from given position
				'from': {'lng':6.622009, 'lat':46.766129},
				'to': {'lng':6.651878, 'lat':46.784234}
			}
		}
	}
})