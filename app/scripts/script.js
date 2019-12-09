      
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

      /** Removes census data from each shape on the map and resets the UI. */
      function clearCensusData() {
        censusMin = Number.MAX_VALUE;
        censusMax = -Number.MAX_VALUE;
        console.log("DEBUG!!!");
        console.log(map);
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
statoportApp.controller('formController', ['$scope', function($scope) {
    $scope.censuses = [
      {name: 'Please select census data', value: "not_an_option"},
      {name:'Gross Domestic Product  per Capita ($ Dollars)', value:'https://www.googleapis.com/download/storage/v1/b/my-map-app-jsons/o/GrossDomesticProductperCapita.json?generation=1574196973432878&alt=media'},
      {name:'High School Attainment', value:'https://www.googleapis.com/download/storage/v1/b/my-map-app-jsons/o/HighSchoolAttainment.json?generation=1574197235523339&alt=media'},
    ];

    $scope.change = function() {
      if ($scope.censusSelect.value != 'not_an_option') {
          clearCensusData();
          loadCensusData($scope.censusSelect.value);
          //console.log($scope.censusSelect.value);
      }
    }

    $scope.censusSelect = $scope.censuses[0];
    //$scope.change();
  }]);

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
    