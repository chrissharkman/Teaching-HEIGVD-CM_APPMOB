angular.module('inspctr.auth', ['angular-storage'])

  .service('AuthService', function() {

    var service = {
    //  currentUserId: store.get('currentUserId'),
      currentUserId: null,

      setUser: function(user) {
        service.currentUserId = user.userId;
     //   store.set('currentUserId', user.userId);
      },

      unsetUser: function() {
        service.currentUserId = null;
    //    store.remove('currentUserId');
      }
    };

    return service;
  })

 .controller('LoginCtrl', function(AuthService, $http, $ionicHistory, $ionicLoading, $scope, $state) {

    // The $ionicView.beforeEnter event happens every time the screen is displayed.
    $scope.$on('$ionicView.beforeEnter', function() {
      // Re-initialize the user object every time the screen is displayed.
      // The first name and last name will be automatically filled from the form thanks to AngularJS's two-way binding.
      $scope.user = {}; // inizialisation of an empty user object; if you log out, the fields will be empty again
    });

    // Add the register function to the scope.
    $scope.register = function() {

      // Forget the previous error (if any).
      delete $scope.error;

      // Show a loading message if the request takes too long.
      $ionicLoading.show({
        template: 'Logging in...',
        delay: 750
      });

      // Make the request to retrieve or create the user.
      $http({
        method: 'POST',
        url: 'http://localhost:8100/api-proxy/users/logister',
        data: $scope.user
      }).success(function(user) {

        // If successful, give the user to the authentication service.
        AuthService.setUser(user);

        // Hide the loading message.
        $ionicLoading.hide();

        // Set the next view as the root of the history.
        // Otherwise, the next screen will have a "back" arrow pointing back to the login screen.
        $ionicHistory.nextViewOptions({
          disableBack: true,
          historyRoot: true
        });

        // Go to the issue creation tab.
        $state.go('tab.newIssue');

      }).error(function() {

        // If an error occurs, hide the loading message and show an error message.
        $ionicLoading.hide();
        $scope.error = 'Could not log in.';
      });
    };
  })

 .controller('LogoutCtrl', function(AuthService, $scope, $state) {
    $scope.logOut = function() {
      AuthService.unsetUser();
      $state.go('login');
    };
  })

;