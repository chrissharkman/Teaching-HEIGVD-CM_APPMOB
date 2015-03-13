// Inspctr Navigation features: controllers, functions

angular.module('inspctr.nav', [])

.controller('NavigationCtrl', function($scope, $ionicSideMenuDelegate) {
  $scope.toggleLeft = function() {
    $ionicSideMenuDelegate.toggleLeft();
  };
})