
      
      var mapStyle = [{
        'stylers': [{'visibility': 'off'}]
      }, {
        'featureType': 'landscape',
        'elementType': 'geometry',
        'stylers': [{'visibility': 'on'}, {'color': '#fcfcfc'}]
      }, {
        'featureType': 'water',
        'elementType': 'geometry',
        'stylers': [{'visibility': 'on'}, {'color': '#bfd4ff'}]
      }];
      var map;
      var censusMin = Number.MAX_VALUE, censusMax = -Number.MAX_VALUE;

      function initMap() {

        // load the map
        map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: 40, lng: -100},
          zoom: 4,
          styles: mapStyle
        });


        // set up the style rules and events for google.maps.Data
        map.data.setStyle(styleFeature);
        map.data.addListener('mouseover', mouseInToRegion);
        map.data.addListener('mouseout', mouseOutOfRegion);

        // wire up the button
        // var selectBox = document.getElementById('census-variable');
        // google.maps.event.addDomListener(selectBox, 'change', function() {
        //   clearCensusData();
        //   loadCensusData(selectBox.options[selectBox.selectedIndex].value);
        // });


        // state polygons only need to be loaded once, do them now
        loadMapShapes();

      }

      /** Loads the state boundary polygons from a GeoJSON source. */
      function loadMapShapes() {
        // load US state outline polygons from a GeoJson file
        map.data.loadGeoJson('https://storage.googleapis.com/mapsdevsite/json/states.js', { idPropertyName: 'STATE' });

        // wait for the request to complete by listening for the first feature to be
        // added
        google.maps.event.addListenerOnce(map.data, 'addfeature', function() {
          google.maps.event.trigger(document.getElementById('census-variable'),
              'change');
        });
      }

      /**
       * Loads the census data from a simulated API call to the US Census API.
       *
       * @param {string} variable
       */
      function loadCensusData(variable) {
        // load the requested variable from the census API (using local copies)
        var xhr = new XMLHttpRequest();
        // xhr.open('GET', variable + '.json');
        xhr.open('GET', variable);
        xhr.onload = function() {
          var censusData = JSON.parse(xhr.responseText);
          censusData.shift(); // the first row contains column names
          censusData.forEach(function(row) {
            var censusVariable = parseFloat(row[0]);
            var stateId = row[1];
            console.log(stateId);

            // keep track of min and max values
            if (censusVariable < censusMin) {
              censusMin = censusVariable;
            }
            if (censusVariable > censusMax) {
              censusMax = censusVariable;
            }

            // update the existing row with the new data
            map.data
              .getFeatureById(stateId)
              .setProperty('census_variable', censusVariable);
          });

          // update and display the legend
          document.getElementById('census-min').textContent =
              censusMin.toLocaleString();
          document.getElementById('census-max').textContent =
              censusMax.toLocaleString();
        };
        xhr.send();
      }

      function loadCensusData_new(variable) {
          var censusData = variable;
          censusData.shift(); // the first row contains column names
          censusData.forEach(function(row) {
            var censusVariable = parseFloat(row[0]);
            var stateId = row[1];
            // console.log(stateId);

            // keep track of min and max values
            if (censusVariable < censusMin) {
              censusMin = censusVariable;
            }
            if (censusVariable > censusMax) {
              censusMax = censusVariable;
            }

            // update the existing row with the new data
            map.data
              .getFeatureById(stateId)
              .setProperty('census_variable', censusVariable);
          });

          // update and display the legend
          document.getElementById('census-min').textContent =
              censusMin.toLocaleString();
          document.getElementById('census-max').textContent =
              censusMax.toLocaleString();
      }

      /** Removes census data from each shape on the map and resets the UI. */
      function clearCensusData() {
        censusMin = Number.MAX_VALUE;
        censusMax = -Number.MAX_VALUE;
        // console.log("DEBUG!!!");
        // console.log(map);
        map.data.forEach(function(row) {
          row.setProperty('census_variable', undefined);
        });
        document.getElementById('data-box').style.display = 'none';
        document.getElementById('data-caret').style.display = 'none';
      }

      /**
       * Applies a gradient style based on the 'census_variable' column.
       * This is the callback passed to data.setStyle() and is called for each row in
       * the data set.  Check out the docs for Data.StylingFunction.
       *
       * @param {google.maps.Data.Feature} feature
       */
      function styleFeature(feature) {
        // var low = [5, 69, 54];  // color of smallest datum
        // var high = [151, 83, 34];   // color of largest datum

        var low = [186, 100, 33];  // color of smallest datum
        var high = [15, 100, 67];   // color of largest datum

        // delta represents where the value sits between the min and max
        var delta = (feature.getProperty('census_variable') - censusMin) /
            (censusMax - censusMin);

        var color = [];
        for (var i = 0; i < 3; i++) {
          // calculate an integer color based on the delta
          color[i] = (high[i] - low[i]) * delta + low[i];
        }

        // determine whether to show this shape or not
        var showRow = true;
        if (feature.getProperty('census_variable') == null ||
            isNaN(feature.getProperty('census_variable'))) {
          showRow = false;
        }

        var outlineWeight = 0.5, zIndex = 1;
        if (feature.getProperty('state') === 'hover') {
          outlineWeight = zIndex = 2;
        }

        return {
          strokeWeight: outlineWeight,
          strokeColor: '#fff',
          zIndex: zIndex,
          fillColor: 'hsl(' + color[0] + ',' + color[1] + '%,' + color[2] + '%)',
          fillOpacity: 1,
          visible: showRow
        };
      }

      /**
       * Responds to the mouse-in event on a map shape (state).
       *
       * @param {?google.maps.MouseEvent} e
       */
      function mouseInToRegion(e) {
        // set the hover state so the setStyle function can change the border
        e.feature.setProperty('state', 'hover');

        var percent = (e.feature.getProperty('census_variable') - censusMin) /
            (censusMax - censusMin) * 100;

        // update the label
        document.getElementById('data-label').textContent =
            e.feature.getProperty('NAME');
        document.getElementById('data-value').textContent =
            e.feature.getProperty('census_variable').toLocaleString();
        document.getElementById('data-box').style.display = 'block';
        document.getElementById('data-caret').style.display = 'block';
        document.getElementById('data-caret').style.paddingLeft = percent + '%';
      }

      /**
       * Responds to the mouse-out event on a map shape (state).
       *
       * @param {?google.maps.MouseEvent} e
       */
      function mouseOutOfRegion(e) {
        // reset the hover state, returning the border to normal
        e.feature.setProperty('state', 'normal');
      }

//Angular for select

let statoportApp = angular.module('statoportApp', []);
//statoportApp.controller('formController', ['$scope', function($scope, $http) {
statoportApp.controller('formController', function($scope, $http) {
  $scope.dataForm = document.getElementById("data-form");
  $scope.q1Arr = [];
  $scope.q2Arr = [];
  $scope.q3Arr = [];
  $scope.q4Arr = [];

  let getSelectOptions = function() {
		$http.get('/censuses').then(function(response) {
      console.log('Sending request for /censuses...');
      $scope.censuses = response.data;
      console.log($scope.censuses);
      $scope.censusSelect = $scope.censuses[0];
		});
	}

  getSelectOptions();
  
    // $scope.censuses = [
    //   {name: 'Please select census data', value: "not_an_option"},
    //   {name:'Gross Domestic Product  per Capita ($ Dollars)', value:'https://www.googleapis.com/download/storage/v1/b/my-map-app-jsons/o/GrossDomesticProductperCapita.json?generation=1574196973432878&alt=media'},
    //   {name:'High School Attainment', value:'https://www.googleapis.com/download/storage/v1/b/my-map-app-jsons/o/HighSchoolAttainment.json?generation=1574197235523339&alt=media'},
    // ];

    $scope.change = function() {
      if ($scope.censusSelect.value != 'not_an_option') {
          clearCensusData();
          // loadCensusData($scope.censusSelect.value);
          loadCensusData_new($scope.censusSelect.value);
          // console.log($scope.censuses);
          //console.log($scope.censusSelect.value);
      }
    }

    // console.log('$scope');
    // console.log($scope);    
    // console.log('$scope.censusSelect');
    // console.log($scope.censusSelect);
    // console.log('$scope.censuses');
    // console.log($scope.censuses);

    //$scope.censusSelect = $scope.censuses[0];
    //$scope.change();
  //}]);

  let getStatesforQuiz = function() {
		$http.get('/states').then(function(response) {
      console.log('Sending request for /states...');
      $scope.states = response.data;
      console.log($scope.states);
		});
  }
  
  $scope.getAllStates = function(){
    getStatesforQuiz();
  }

  $scope.getStatesQ1 = function(){
    let newArr = [];
      // console.log("$scope.question.q1");
      // console.log($scope.question.q1);
      let arr = $scope.states;
      arr.sort(function(a, b) {
        return parseFloat(a.tempjanuary) - parseFloat(b.tempjanuary);
      });
      console.log("arr sort tempjanuary");
      console.log(arr);
      if ($scope.question.q1 == "cold"){
        for (let i = 0; i < Math.floor(arr.length / 2); i++){
          newArr.push(arr[i]);
        }
      }
      if ($scope.question.q1 == "heat"){
        for (let i = Math.floor(arr.length / 2); i <= arr.length-1; i++){
          newArr.push(arr[i]);
        }
      }
      console.log("newArr");
      console.log(newArr);
    
      //return newArr;
      $scope.q1Arr = newArr;
  }

  $scope.getStatesQ2 = function(){
    // console.log("$scope.question.q2");
    // console.log($scope.question.q2);
    
    // let arr = $scope.getStatesQ1();
    let arr = $scope.q1Arr;

    let newArr = [];
    arr.sort(function(a, b) {
      return parseFloat(a.сrimerate) - parseFloat(b.сrimerate);
    });
    console.log("arr sort crimerate");
    console.log(arr);
    if ($scope.question.q2 == "yes"){
      for (let i = 0; i < Math.floor(arr.length / 2); i++){
        newArr.push(arr[i]);
      }
    }
    if ($scope.question.q2 == "no"){
      for (let i = Math.floor(arr.length / 2); i <= arr.length - 1; i++){
        newArr.push(arr[i]);
      }
    }
    console.log("newArr");
    console.log(newArr);
    
    //return newArr;
    $scope.q2Arr = newArr;
}

$scope.getStatesQ3 = function(){
  // console.log("$scope.question.q3");
  // console.log($scope.question.q3);
  
  //let arr = $scope.getStatesQ2();
  let arr = $scope.q2Arr;

  let newArr = [];
  arr.sort(function(a, b) {
    return parseFloat(a.percapitaincome) - parseFloat(b.percapitaincome);
  });
  console.log("arr sort percapitaincome");
  console.log(arr);
  if ($scope.question.q3 == "yes"){
    for (let i = 0; i < Math.floor(arr.length / 2); i++){
      newArr.push(arr[i]);
    }
  }
  if ($scope.question.q3 == "no"){
    for (let i = Math.floor(arr.length / 2); i <= arr.length - 1; i++){
      newArr.push(arr[i]);
    }
  }
  console.log("newArr");
  console.log(newArr);
  
  //return newArr;
  $scope.q3Arr = newArr;
}

$scope.getStatesQ4 = function(){
  // console.log("$scope.question.q4");
  // console.log($scope.question.q4);
  
  //let arr = $scope.getStatesQ3();
  let arr = $scope.q3Arr;
  
  let newArr = [];
  arr.sort(function(a, b) {
    return parseFloat(a.population) - parseFloat(b.population);
  });
  console.log("arr sort population");
  console.log(arr);
  if ($scope.question.q4 == "less"){
    for (let i = 0; i < Math.floor(arr.length / 2); i++){
      newArr.push(arr[i]);
    }
  }
  if ($scope.question.q4 == "dense"){
    for (let i = Math.floor(arr.length / 2); i <= arr.length - 1; i++){
      newArr.push(arr[i]);
    }
  }
  console.log("newArr");
  console.log(newArr);
  
  //return newArr;
  $scope.q4Arr = newArr;
}

$scope.getStatesQ5 = function(){
  // console.log("$scope.question.q5");
  // console.log($scope.question.q5);
  
  //let arr = $scope.getStatesQ4();
  let arr = $scope.q4Arr;
  let urlImage = '';
  let temp = '';

  arr.sort(function(a, b) {
    return parseFloat(a.natparks) - parseFloat(b.natparks);
  });
  console.log("arr sort natparks");
  console.log(arr);
  if ($scope.question.q5 == "yes"){
    // console.log("your state is ");
    // console.log(arr[arr.length - 1]);
  
    // console.log("your state  name is ");
    // console.log(arr[arr.length - 1]);

    urlImage = "\"imgparks/" + arr[arr.length - 1].num + ".png" + "\"";
    temp = "<img" + " " + "src=" + urlImage + " ";
    temp = temp + "width=" + "\"" + 190 + "\"" + " " + "height=" + "\"" + 150 + "\"" + ">";
    $scope.stateImage = temp;
    document.getElementById("pForImg").innerHTML = $scope.stateImage;
    console.log("$scope.stateImage");
    console.log($scope.stateImage);
    // document.innerHTML = $scope.stateImage;

    $scope.stateName = arr[arr.length - 1].name;
    $scope.stateNickname = arr[arr.length - 1].nickname;
    $scope.stateTempJanuary = arr[arr.length - 1].tempjanuary;
    $scope.stateTempJuly = arr[arr.length - 1].tempjuly;
    $scope.stateNumParks = arr[arr.length - 1].natparks;
    $scope.statePerCapitaIncome = arr[arr.length - 1].percapitaincome;
    $scope.stateCrimeRate = arr[arr.length - 1].сrimerate;
    $scope.stateFunFacts = arr[arr.length - 1].funfacts;
  }
  if ($scope.question.q5 == "no"){
    // console.log("your state is ");
    // console.log(arr[0]);

    // return arr[0];
    // console.log("your state  name is ");
    // console.log(arr[0].name);

    urlImage = "\"imgparks/" + arr[0].num + ".png" + "\"";
    temp = "<img" + " " + "src=" + urlImage + " ";
    temp = temp + "width=" + "\"" + 190 + "\"" + " " + "height=" + "\"" + 150 + "\"" + ">";
    $scope.stateImage = temp;
    document.getElementById("pForImg").innerHTML = $scope.stateImage;
    console.log("$scope.stateImage");
    console.log($scope.stateImage);
    // document.innerHTML = $scope.stateImage;

    $scope.stateName = arr[0].name;
    $scope.stateNickname = arr[0].nickname;
    $scope.stateTempJanuary = arr[0].tempjanuary;
    $scope.stateTempJuly = arr[0].tempjuly;
    $scope.stateNumParks = arr[0].natparks;
    $scope.statePerCapitaIncome = arr[0].percapitaincome;
    $scope.stateCrimeRate = arr[0].сrimerate;
    $scope.stateFunFacts = arr[0].funfacts;
  }
}

$scope.clearRadio = function(){
  $scope.question.q1 = null;
  $scope.question.q2 = null;
  $scope.question.q3 = null;
  $scope.question.q4 = null;
  $scope.question.q5 = null;
}

});

//End angular for select


// Code for quiz

let startQuiz = document.getElementById('startQuiz');
let questionOne = document.getElementById('question1');
let questionTwo = document.getElementById('question2');
let questionTree = document.getElementById('question3');
let questionFour = document.getElementById('question4');
let questionFive = document.getElementById('question5');
let resultState = document.getElementById('result');

let btnfromStartTo1 = document.getElementById('fromStartTo1');
let btnFrom1to2 = document.getElementById('from1to2');
let btnFrom2to3 = document.getElementById('from2to3');
let btnFrom3to4 = document.getElementById('from3to4');
let btnFrom4to5 = document.getElementById('from4to5');
let btnFrom5toResult = document.getElementById('from5toResult');

startQuiz.addEventListener('submit', function(){
  event.preventDefault();

});

questionOne.addEventListener('submit', function(){
    event.preventDefault();

});

questionTwo.addEventListener('submit', function(){
    event.preventDefault();

});

questionTree.addEventListener('submit', function(){
  event.preventDefault();

});

questionFour.addEventListener('submit', function(){
  event.preventDefault();

});

questionFive.addEventListener('submit', function(){
  event.preventDefault();

});

resultState.addEventListener('submit', function(){
  event.preventDefault();

});

btnfromStartTo1.addEventListener('click', function(){
  event.preventDefault();
  startQuiz.style.display="none";
  questionOne.style.display="block";
  questionTwo.style.display="none";
  questionTree.style.display="none";
  questionFour.style.display="none";
  questionFive.style.display="none";
  resultState.style.display="none";

});

btnFrom1to2.addEventListener('click', function(){
  event.preventDefault();
  startQuiz.style.display="none";
  questionOne.style.display="none";
  questionTwo.style.display="block";
  questionTree.style.display="none";
  questionFour.style.display="none";
  questionFive.style.display="none";
  resultState.style.display="none";

});

btnFrom2to3.addEventListener('click', function(){
    event.preventDefault();
    startQuiz.style.display="none";
    questionOne.style.display="none";
    questionTwo.style.display="none";
    questionTree.style.display="block";
    questionFour.style.display="none";
    questionFive.style.display="none";
    resultState.style.display="none";
  
});

btnFrom3to4.addEventListener('click', function(){
  event.preventDefault();
  startQuiz.style.display="none";
  questionOne.style.display="none";
  questionTree.style.display="none";
  questionTwo.style.display="none";
  questionFour.style.display="block";
  questionFive.style.display="none";
  resultState.style.display="none";
});

btnFrom4to5.addEventListener('click', function(){
  event.preventDefault();
  startQuiz.style.display="none";
  questionOne.style.display="none";
  questionTree.style.display="none";
  questionTwo.style.display="none";
  questionFour.style.display="none";
  questionFive.style.display="block";
  resultState.style.display="none";
});

btnFrom5toResult.addEventListener('click', function(){
  event.preventDefault();
  startQuiz.style.display="none";
  questionOne.style.display="none";
  questionTree.style.display="none";
  questionTwo.style.display="none";
  questionFour.style.display="none";
  questionFive.style.display="none";
  resultState.style.display="block";
});


resultState.addEventListener('click', function(){
  event.preventDefault();
  startQuiz.style.display="block";
  questionOne.style.display="none";
  questionTree.style.display="none";
  questionTwo.style.display="none";
  questionFour.style.display="none";
  questionFive.style.display="none";
  resultState.style.display="none";
});
//End Code for quiz
    