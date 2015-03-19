// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('inspctr', ['ui.router', 'ionic', 'inspctr.auth', 'inspctr.constants', 'inspctr.nav', 'inspctr.issues', 'inspctr.map', 'leaflet-directive', 'geolocation'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})


.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

    // This is the abstract state for the sideMenu directive.
    .state('sideMenu', {
      url: '/sideMenu',
      abstract: true,
      templateUrl: 'features/navigation/sideMenu.html',
      controller: 'NavigationCtrl'
    })

    .state('sideMenu.newIssue', {
      // The URL (here "/newIssue") is used only internally with Ionic; you never see it displayed anywhere.
      // In an Angular website, it would be the URL you need to go to with your browser to enter this state.
      url: '/newIssue/:lng?lat',
      views: {
        // The "tab-newIssue" view corresponds to the <ion-nav-view name="tab-newIssue"> directive used in the tabs.html template.
        'mainContent': {
          // This defines the template that will be inserted into the directive.
          templateUrl: 'features/issues/newIssue.html'
        }
      }
    })

    .state('sideMenu.issueMap', {
      url: '/issueMap',
      views: {
        'mainContent': {
          templateUrl: 'features/issues/issueMap.html'
        }
      }
    })

    .state('sideMenu.myIssues', {
      url: '/myIssues',
      views: {
        'mainContent': {
          templateUrl: 'features/issues/myIssues.html'
        }
      }
    })

    .state('sideMenu.issueList', {
      url: '/issueList',
      views: {
        'mainContent': {
          templateUrl: 'features/issues/issueList.html'
        }
      }
    })

    .state('sideMenu.issueDetail', {
      url: '/issueDetail/:issueId',
      controller: function($stateParams) {
        $stateParams.issueId;
      },
      views: {
        'mainContent': {
          templateUrl: 'features/issues/issueDetail.html'
        }
      }
    })

    .state('setLocation', {
      url: '/setLocation',
      templateUrl: 'features/map/locationsetter.html',
    })

    .state('login', {
      url: '/login',
      controller: 'LoginCtrl',
      templateUrl: 'features/auth/login.html'
    })
  ;

  // Define the default state (i.e. the first screen displayed when the app opens).
  $urlRouterProvider.otherwise(function($injector) {
    $injector.get('$state').go('sideMenu.issueList'); // Go to the new issue tab by default.
  });
})

.run(function(AuthService, $rootScope, $state) {

  // Listen for the $stateChangeStart event of AngularUI Router.
  // This event indicates that we are transitioning to a new state.
  // We have the possibility to cancel the transition in the callback function.
  $rootScope.$on('$stateChangeStart', function(event, toState) {

    // If the user is not logged in and is trying to access another state than "login"...
    if (!AuthService.currentUserId && toState.name != 'login') {

      // ... then cancel the transition and go to the "login" state instead.
      event.preventDefault(); // this preventDefault is necessary
      $state.go('login');
    }
  });
})

.config(function($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptor');
})

.config(function($logProvider){
  $logProvider.debugEnabled(true);
});
