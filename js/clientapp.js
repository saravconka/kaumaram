'use strict';

//1. App Declaration
var kaumaram = angular.module('kaumaram', ['ngRoute', 'ngSanitize', 'ngCookies']);

//2. FILTERS

kaumaram.filter('titleCase', function(){
	return function(input){
  	input = input || '';
    return input.replace(/\w\S*/g, function(txt) {return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  };
});

kaumaram.filter('translate', ['$rootScope', function($rootScope){
	return function(input){
  	input = input || '';
    return $rootScope.getText(input);
  };
}]);

/*
kaumaram.filter('filterArticles', ['$rootScope', '$cookies', 'ArtifactsFactory', function($rootScope, $cookies, ArtifactsFactory){
  return function(input){
    console.log(input);
    input = input || '';
    
    ArtifactsFactory.artliclesList.forEach(function(a){
      
      if($cookies['lang'] === 'ta'){
        
      } 
      if(a.text.title.tamil === input){
        return true;  
      } else {
        return false;
      }
      
    });
  };
}]);
*/

//End of 2. FILTERS

//3. FACTORIES

kaumaram.factory('ConfigSvc', function(){
  return {
    dBSource : 'fbs',
    langList : {
      'en_us':'English',
      'ta' : 'தமிழ்' 
    },
    defaultLang : 'ta',
    fbsUrl : 'https://boiling-torch-2538.firebaseio.com'
  };
});


kaumaram.factory('ResourceSvc', function(){
  return {
    resources : {
      langPreference : {en_us : 'Language Preference', ta : 'மொழி விருப்பம்'},
      artifacts : {en_us : 'Ancient artifacts', ta : 'புராண பதிவுகழ்'},
      author : {en_us : 'Author', ta : 'ஆசிரியர்'},
      songs : {en_us : 'Songs', ta : 'பாடல்கழ்'},
      song : {en_us : 'Song', ta : 'பாடல்'},
      autoScroll : { en_us : 'Automatic text scroll', ta : 'தானியங்கி உரை சுருள்'}
    }
  };
});


kaumaram.factory('AudioRenderFactory', function(){

  var audioRenderFactory = {};

  var captionsArr = [], captionBeingDisplayed = -1;

  function Trim(s) {
    return s.replace(/^\s+|\s+$/g, "");
  }

  // formats floating point seconds into the webvtt time string format
  function FormatTime(seconds) {
    var hh = Math.floor(seconds / (60 * 60));
    var mm = Math.floor(seconds / 60) % 60;
    var ss = seconds % 60;

    return (hh == 0 ? "" : (hh < 10 ? "0" : "") + hh.toString() + ":") + (mm < 10 ? "0" : "") + mm.toString() + ":" + (ss < 10 ? "0" : "") + ss.toFixed(3);
  }

  function FindCaptionIndex(seconds) {
      var below = -1;
      var above = captionsArr.length;
      console.log(captionsArr);
      console.log(seconds);
      var i = Math.floor((below + above) / 2);

      while (below < i && i < above) {

          if (captionsArr[i].start <= seconds && seconds < captionsArr[i].end)
              return i;
          
          if (seconds < captionsArr[i].start) {
              above = i;
          } else {
              below = i;
          }
          
          i = Math.floor((below + above) / 2);
      }

      return -1;
  }

  function getCaption(seconds){
    console.log(FindCaptionIndex(seconds));
    var ci = FindCaptionIndex(seconds);
    if(ci !== captionBeingDisplayed){
      captionBeingDisplayed = ci;
      if(ci != -1){
        var theCaption = ci;
        //$('#out').html(theCaption.caption);
        $('#transcriptSrc').children('span').removeClass('highlight');
        $('#transcriptSrc').children('span').eq(ci).addClass('highlight');
        
        var transcriptContainer = $('#transcriptSrc');
        var scrollTo = $('#transcriptSrc').children('span').eq(ci);
      
        transcriptContainer.animate({
          scrollTop:scrollTo.offset().top - transcriptContainer.offset().top + transcriptContainer.scrollTop()        
        }, 300);
      
      } else {
        //$('#out').html('');
        $('#transcriptSrc').children('span').removeClass('highlight');
      }
    }
  }

  function audioTimeUpdateEventHandler(){
    if($('#textAutoScroll').prop('checked')){
      var playTime = FormatTime($('#audioElm').prop('currentTime'));
      $('#audioElm').val(playTime);
      getCaption(playTime);
    } else {
      $('#transcriptSrc').children('span').removeClass('highlight');
    }
  }

  audioRenderFactory.renderAudio = function(){

    var cueStart = null, cueEnd = null, cueText = null;
  
    $(function(){
      $('#transcriptSrc').children('span').each(function(){
        cueStart = $(this).attr('begin');
        cueEnd = $(this).attr('end');
        cueText = $(this).attr('end');
        if(cueStart && cueEnd && cueText){
          captionsArr.push({ start:cueStart, end:cueEnd, caption:Trim(cueText)});
          cueStart = cueEnd = cueText = null;
        }
      });

      $('#audioElm').bind({
        //'play':audioPlayEventHandler,
        timeupdate: audioTimeUpdateEventHandler
      });
    });
  };

  return audioRenderFactory;

});

kaumaram.factory('ArtifactsFactory', ['$http', '$q', 'ConfigSvc',
  function($http, $q, ConfigSvc){

    var artifactsFactory = {};
    var fbRef = undefined;
    var artliclesList = undefined;
    var selectedArticle = undefined;

    // if(ConfigSvc.dBSource === 'fbs'){
    //   if(!angular.isString(ConfigSvc.fbsUrl) || ConfigSvc.fbsUrl === ''){
    //     throw 'fbsUrl is empty';
    //   }
    //   fbRef = new Firebase(ConfigSvc.fbsUrl);
    // }

    //Getters and Setters

    artifactsFactory.getFirebaseObject = function() {
      if(ConfigSvc.dBSource === 'fbs'){
        if(!angular.isString(ConfigSvc.fbsUrl) || ConfigSvc.fbsUrl === ''){
          throw 'fbsUrl is empty';
        }
        if(fbRef === undefined){
          fbRef = new Firebase(ConfigSvc.fbsUrl); 
        }
        return fbRef;
      }
    };

    artifactsFactory.getSelectedArticle = function() {
      return selectedArticle;
    };  

    artifactsFactory.setSelectedArticle = function(articleObj) {
      selectedArticle = articleObj;
    };
    //End of Getters and Setters


    //Private Functions 
    function getFireBaseURL() {
      if(!angular.isString(ConfigSvc.fbsUrl) || ConfigSvc.fbsUrl === ""){
        throw "fbsUrl is empty";
      }
      return ConfigSvc.fbsUrl;
    };
    //End of Private Functions 

    //Public Functions
    
    artifactsFactory.getArtifacts = function() {

      if(ConfigSvc.dBSource === 'fbs'){

        return $q(function(resolve, reject){
          var artifactsArr = [];

          function successCallBack(snapshot) {
            snapshot.forEach(function(data) {
              artifactsArr.push({
                "key":data.key(),
                "value":data.val()
              });

              resolve(artifactsArr);
            });
          }

          function failureCallBack(error) {
            reject(error);
          }

          artifactsFactory.getFirebaseObject().child("artifacts").on("value", successCallBack, failureCallBack);
          //fbs.child("artifacts").on("value", successCallBack, failureCallBack);

        });

      }
      else{
        throw "Currently do not support other providers other than FireBase";
      }

      return undefined;

    };

    artifactsFactory.getArticlesByArtifactName = function(artifactName) {

      if(ConfigSvc.dBSource === 'fbs'){
        var articlesRef = new Firebase(getFireBaseURL() + "/articles");

        return $q(function(resolve, reject){
          
          var articlesArr = [];

          function successCallBack(snapshot){
            articlesArr.push({
              "key":snapshot.key(),
              "value":snapshot.val()
            });
            
            artifactsFactory.artliclesList = articlesArr;

            resolve(articlesArr);
          }

          function failureCallBack(error){
            reject(error);
          }

          articlesRef.orderByChild("artifact").equalTo(artifactName).on('child_added', successCallBack, failureCallBack);

        });

      }
      else{
        throw "Currently do not support other providers other than FireBase";
      }

      return undefined;
    };


    artifactsFactory.getArticleDetail = function(number) {
      if(ConfigSvc.dBSource === 'fbs'){
        var articlesRef = new Firebase(getFireBaseURL() + "/articles");

        return $q(function(resolve, reject){
          
          var articlesArr = [];

          function successCallBack(snapshot){
            articlesArr.push({
              "key":snapshot.key(),
              "value":snapshot.val()
            });

            resolve(articlesArr);
          }

          function failureCallBack(error){
            reject(error);
          }

          articlesArr.orderByChild("artifact").equalTo(artifactName).on('child_added', successCallBack, failureCallBack);

        });

      }
      else{
        throw "Currently do not support other providers other than FireBase";
      }

      return undefined;
    }

    artifactsFactory.getArticlesByArtifactID = function(id){

      if(ConfigSvc.dBSource === 'fbs'){
        fbRef.once('value').then(function(snapshot){
          //console.log(snapshot.val());
          return snapshot.val();
        });
      }
      else{

        return $http.get('api/articles');
        //throw "Currently do not support other providers other than FireBase";
      }

      return undefined;
    };
    //End of Public Functions
    
    return artifactsFactory;

  }
]);

//End of 3. FACTORIES

//4. CONTROLLERS

kaumaram.controller('IndexController', ['$scope', '$timeout', 'ArtifactsFactory', 
  function($scope, $timeout, ArtifactsFactory){

      // $http.get('api/article')
      //   .success(function(data, status, headers, config){
      //     @scope.respData = data.respData;
      //   })
      //   .failure(function(error){

      //   });
      
      //console.log('bingoo');

      ArtifactsFactory.getArtifacts().then(
        function(data) {
          //console.log(data);
          $scope.artifacts = data;
        },
        function(error){
          console.log(error);
        }
      );
  }
]);


kaumaram.controller('ArtifactsController', ['$scope', '$routeParams', 'ArtifactsFactory', 
    function($scope, $routeParams, ArtifactsFactory){

      ArtifactsFactory.getArticlesByArtifactName($routeParams.artifactName).then(
        function(articles) {
          $scope.articles = articles;
        },
        function(error){
          console.log(error);
          throw error;
        }
      );

      $scope.selectedArticle = function(articleObj) {
        ArtifactsFactory.setSelectedArticle(articleObj);
      };
      
      $scope.filterArticle = function(){
        console.log($scope.searchArticle);
      };
      
    }
]);




kaumaram.controller('ArticleController', [
    '$scope', 
    '$routeParams', 
    '$sce',
    '$http',
    '$location',
    'translateFilter',
    'ArtifactsFactory',
    'AudioRenderFactory',
    'StorageSvc',
    function($scope, $routeParams, $sce, $http, $location, translateFilter, ArtifactsFactory, AudioRenderFactory, StorageSvc){
      
      var article = undefined;
      
      var init = function() {
        article = ArtifactsFactory.getSelectedArticle();
        if(article !== undefined){
          $scope.articles = ArtifactsFactory.artliclesList;
          console.log($scope.articles);
          $scope.article = article;
          $scope.audioUrl = $sce.trustAsResourceUrl(article.value.audioUrl);
          $scope.htmlData = $sce.trustAsHtml(translateFilter(article.value.text));
          AudioRenderFactory.renderAudio();
          
          $scope.selectedArticle = article;
          
          var favArr = StorageSvc.getArr('favouriteArticles');
          
          //if(favArr !== undefined && favArr.indexOf($scope.selectedArticle) !== -1){
          if(favArr !== null && parseInt(favArr.indexOf($scope.selectedArticle)) > -1){
            $scope.favourites = true;
            console.log('$scope.favourites: ' + $scope.favourites);
          }
        }
        else{
          $http.get('api/article/'+$routeParams.id)
            .success(function(data, status, headers, config){
              console.log(data.respData);
              console.log(data.respData.articleText);
              $scope.respData = data.respData;
              $scope.htmlData = $sce.trustAsHtml(data.respData.articleText);
            });
        }
      };
      
      
      $scope.setSelectedArticle = function(selectedArticleObj) {
        ArtifactsFactory.setSelectedArticle(selectedArticleObj);
        $location.path('/'+selectedArticleObj.value.artifact+'/'+selectedArticleObj.value.number);
      };
      
      $scope.markFavourite = function(favourites){
        
        if(favourites) {
          StorageSvc.setArr('favouriteArticles', $scope.selectedArticle);  
        } else {
          StorageSvc.removeArr('favouriteArticles');
          //StorageSvc.removeArr('favouriteArticles', $scope.selectedArticle);
        }
        
        /*
        var storedFavourites = [];
        
        if(localStorage.getItem('favouriteArticles') !== undefined) {
            storedFavourites = JSON.parse(localStorage.getItem('favouriteArticles'));
        }
        
        if($scope.favourites) {
          storedFavourites.push($scope.selectedArticle);
          localStorage.setItem('favouriteArticles', JSON.stringify(storedFavourites));
          console.log($scope.favourites + ' - ' +$scope.selectedArticle);
          
        } else {
          
          console.log($scope.favourites + ' - ' +$scope.selectedArticle);
          
          if(storedFavourites !== null) {
            storedFavourites.forEach(function(item){
              if(item.key === $scope.selectedArticle.key){
                console.log('Favourite marked=' + item.value.title.english);
                storedFavourites.splice(item);
                localStorage.setItem('favouriteArticles', JSON.stringify(storedFavourites));
              }
            });
          }
        } */
      };
      
      init();
    }
      
]);


kaumaram.controller('RootController', ['$scope', '$cookies', '$route', 'ConfigSvc', 
    function($scope, $cookies, $route, ConfigSvc){
      $scope.locale = {
        langList : ConfigSvc.langList,
        selectedLang : ConfigSvc.defaultLang //this sets the default value of the select in the UI
      };

      $scope.updateLangPreference = function(){
        $cookies['lang'] = $scope.locale.selectedLang;
        $route.reload();
      };

    }
]);


kaumaram.controller('FavouritesController',['$scope', 'StorageSvc', 'ArtifactsFactory', function($scope, StorageSvc, ArtifactsFactory){
  
  var favArticles = StorageSvc.get('favouriteArticles');
  console.log(favArticles);
  
  $scope.articles = favArticles;
  
  $scope.selectedArticle = function(articleObj) {
    ArtifactsFactory.setSelectedArticle(articleObj);
  };
  
}]);


kaumaram.factory('StorageSvc', [function(){
  
  var localStorageObj = {};
  
  localStorageObj.setValue = function(name, value){
    localStorage.setItem(name, value);
  };
  
  localStorageObj.setArr = function(name, arrItem){
    var storedArr = [];
    if(window.localStorage.getItem(name) != undefined) {
        storedArr = angular.fromJson(localStorage.getItem(name));
    }
    if(Array.isArray(storedArr)){
      storedArr.push(arrItem);
      localStorage.setItem(name, angular.toJson(storedArr));
    } else {
      console.error("Cannot store array item since it not a Array object");
    }
  };
  
  localStorageObj.removeArr = function(name, arrItem){
    
    if(arrItem === undefined){
      localStorage.removeItem(String(name));
    }
    else{
      var storedArr = [];
      if(localStorage.getItem(String(name)) !== null) {
          storedArr = angular.fromJson(localStorage.getItem(name));
      }
      if(Array.isArray(storedArr)){
        storedArr.pop(arrItem);
        localStorage.setItem(name, angular.toJson(storedArr));
      } else {
        console.error("Cannot remove array item since it not a Array object");
      }
    }
  };
  
  localStorageObj.getValue = function(name){
    if(localStorage.getItem(String(name)) === null){
      console.error("Cannot find stored item with name " + name);
    }
    return localStorage.getItem(name);
  };
  
  localStorageObj.getArr = function(name){
    if(localStorage.getItem(String(name)) === null){
      console.error("Cannot find stored item with name " + name);
    }
    return angular.fromJson(localStorage.getItem(name));
  };
  
  return localStorageObj;
  
}]);
//End of 4. CONTROLLERS


//5. Default Module statements

kaumaram.run(['$cookies', '$rootScope', '$routeParams', 'ConfigSvc', 'ResourceSvc', 
  function($cookies, $rootScope, $routeParams, ConfigSvc, ResourceSvc){
    //Setting Lang Cookie
    if($cookies['lang'] === undefined){
      $cookies['lang'] = ConfigSvc.defaultLang;
    } 

    //Set RootScope.resources to read all global resources
    $rootScope.resources = ResourceSvc.resources;

    $rootScope.getText = function(obj){

      if(obj !== undefined){
        if($cookies['lang'] === 'ta'){
          if(obj.hasOwnProperty('ta')){
            if(obj.ta === undefined){
              return "translation unavailable";
            }
            return obj.ta;
          }
          else if(obj.hasOwnProperty('tamil')){
            if(obj.tamil === undefined){
              return "translation unavailable";
            }
            return obj.tamil;
          }
        } 
        else if ($cookies['lang'] === 'en_us'){
          if(obj.hasOwnProperty('en_us')){
            if(obj.en_us === undefined){
              return "translation unavailable";
            }
            return obj.en_us;
          }
          else if(obj.hasOwnProperty('english')){
            if(obj.english === undefined){
              return "translation unavailable";
            }
            return obj.english;
          }
        }   
      }

      return "Invalid Key - cannot translate";

    };

    $rootScope.replaceSpaceWithHypen = function(obj){
      if(angular.isString(obj)){
        return obj.replace(' ', '-').toLowerCase();
      }
      return obj;
    };


  }
]);

//End of 5. Default Module statements

//ANGULAR APP CONFIGS
kaumaram.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
  
  $routeProvider.when('/', {
    templateUrl : '/templates/artifact-list.html',
    controller : 'IndexController'
  })
  //.when('/articles/:artifactName', {
  .when('/:artifactName', {
    templateUrl : '/templates/article-list.html',
    controller : 'ArtifactsController'
  })
  .when('/favourites', {
    templateUrl : '/templates/article-list.html',
    controller : 'FavouritesController'
  })
  //.when('/article-detail/:id', {
  .when('/:artifactName/:id', {
    templateUrl : '/templates/article-detail.html',
    controller : 'ArticleController'
  });

  $locationProvider.html5Mode(true);

}]);