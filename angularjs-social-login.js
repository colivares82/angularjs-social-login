'use strict';

var socialLogin = angular.module('socialLogin', []);

socialLogin.provider('social', function () {
  var fbKey, fbApiV;
  return {
    setFbKey: function (obj) {
      fbKey = obj.appId;
      fbApiV = obj.apiVersion;
      var d = document, fbJs, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
      fbJs = d.createElement('script');
      fbJs.id = id;
      fbJs.async = true;
      fbJs.src = '//connect.facebook.net/en_US/sdk.js';

      fbJs.onload = function () {
        FB.init({
          appId: fbKey,
          status: true,
          cookie: true,
          xfbml: true,
          version: fbApiV
        });
      };

      ref.parentNode.insertBefore(fbJs, ref);
    },
    $get: function () {
      return {
        fbKey: fbKey,
        fbApiV: fbApiV
      };
    }
  };
});

socialLogin.factory('socialLoginService', function ($window, $rootScope) {
  return {
    logout: function () {
      FB.logout(function () {
        $window.localStorage.removeItem('_login_provider');
        $rootScope.$broadcast('event:social-sign-out-success', 'success');
      });
    },
    setProvider: function (provider) {
      $window.localStorage.setItem('_login_provider', provider);
    }
  };
});

socialLogin.directive('fbLogin', function ($rootScope, social, socialLoginService, $q) {
  return {
    restrict: 'EA',
    scope: {},
    replace: true,
    link: function (scope, ele) {
      ele.on('click', function () {
        var fetchUserDetails = function () {
          var deferred = $q.defer();
          FB.api('/me?fields=name,email,picture', function (res) {
            if (!res || res.error) {
              deferred.reject('Error occured while fetching user details.');
            } else {
              deferred.resolve({
                name: res.name,
                email: res.email,
                uid: res.id,
                provider: 'facebook',
                imageUrl: res.picture.data.url
              });
            }
          });
          return deferred.promise;
        };
        FB.getLoginStatus(function (response) {
          if (response.status === 'connected') {
            fetchUserDetails().then(function (userDetails) {
              userDetails['token'] = response.authResponse.accessToken;
              socialLoginService.setProvider('facebook');
              $rootScope.$broadcast('event:social-sign-in-success', userDetails);
            });
          } else {
            FB.login(function (response) {
              if (response.status === 'connected') {
                fetchUserDetails().then(function (userDetails) {
                  userDetails['token'] = response.authResponse.accessToken;
                  socialLoginService.setProvider('facebook');
                  $rootScope.$broadcast('event:social-sign-in-success', userDetails);
                });
              }
            }, {scope: 'email', auth_type: 'rerequest'});
          }
        });
      });
    }
  };
});

