var map;
var places;
var layerIDs = []; // a list to filter against
var featuresAll = {}; // an object containing all features of different layers
var filterInput = $('#filter-input');
var filterGroup = $('#filter-group');
var filteredListGrp = $("#filtered-list-group");

$(document).ready(function() {

  mapboxgl.accessToken = 'pk.eyJ1IjoibGl1ZGluaW5nIiwiYSI6ImNqd2s2MnRrcTBoMGYzenA5ZjhtY3d1aDMifQ.-tydp-PYx-8BsuloTJgcwQ';

  var walkString = window.location.search;
  var walkParams = new URLSearchParams(walkString);

  var walkID = walkParams.get('id');
  var walkName = walkParams.get('name');

  //var walkDesc = sessionStorage.getItem(walkID); //adding description of walk, which was added to session storage on previous page

  $('#walk-name').html(walkName);
  //$('#walk-desc').html(walkDesc);

  // the value below will be replaced by a function return the url of all avaiable places
  var placesURL = `https://smartwalks-test-proxy.herokuapp.com/http://smartwalks.cetools.org/api/v1/walk/${walkID}/geojson`
  //https://cors-anywhere.herokuapp.com/

  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/liudining/ckc9wyfvi30el1irqy7rjs5us',
    center: [-0.1359, 51.5219],
    zoom: 11
  });

  var bounds = new mapboxgl.LngLatBounds();

  map.on('load', function() {

      map.addSource('places', {
        'type': 'geojson',
        'data': placesURL
      });

      $.getJSON(placesURL, function(data) {
          places = data;
          // console.log(places.features);

          //add to local storage
          sessionStorage.setItem('places', JSON.stringify(places));

          // fit map to all available places
          places.features.forEach(function(feature) {
            bounds.extend(feature.geometry.coordinates);
          });
          // console.log(bounds);
          map.fitBounds(bounds, {
            padding: 100
          });

          // extract category property to add layers of symbols of different categories
          $.each(data.features, function(i, v) {
            var category = v.properties['category'];
            var color = getCatColor(category);
            var layerID = 'poi-' + category.toLowerCase();
            if (!featuresAll[layerID]){
              featuresAll[layerID]= [];
              featuresAll[layerID].push(v);
            } else {
              featuresAll[layerID].push(v);
            };

            // Add a layer for each category if it hasn't been added already.
            if (!map.getLayer(layerID)) {
              map.addLayer({
                'id': layerID,
                'type': 'symbol',
                'source': 'places',
                'layout': {
                  'text-line-height': 1, // this is to avoid any padding around the "icon"
                  'text-padding': 0,
                  'text-anchor': 'bottom', // change if needed, "bottom" is good for marker style icons like in my screenshot,
                  'text-allow-overlap': true, // assuming you want this, you probably do
                  'text-field': String.fromCharCode('0xf3c5'), // IMPORTANT SEE BELOW: -- this should be the unicode character you're trying to render as a string -- NOT the character code but the actual character,
                  'icon-optional': true, // since we're not using an icon, only text.
                  'text-font': ['Font Awesome 5 Free Solid'],
                  'text-size': 18
                },
                'paint': {
                  'text-translate-anchor': 'viewport', // up to you to change this -- see the docs
                  'text-color': color,
                },
                'filter': ['==', 'category', category]
              });

              layerIDs.push(layerID);

              // Add checkbox and label elements for the layer.
              var input = document.createElement('input');
              input.type = 'checkbox';
              input.id = layerID;
              input.checked = true;
              filterGroup.append(input);

              var label = document.createElement('label');
              label.setAttribute('for', layerID);
              label.textContent = category;
              filterGroup.append(label);
              // console.log(filterGroup);

              // When the checkbox changes, update the visibility of the layer.
              input.addEventListener('change', function(e) {
                map.setLayoutProperty(
                  layerID,
                  'visibility',
                  e.target.checked ? 'visible' : 'none'
                );
              });
            };

          });

          // filter input related event
          filterInput.keyup(function(e) {
            // create an indicator to detect no-matched-place condition
            var noMatched = [];

            var inputValue = normalize(e.target.value);

            // clear any existing filtered listings
            filteredListGrp.html("");

            layerIDs.forEach(function(layerID) {
              var features = featuresAll[layerID];
              //map.queryRenderedFeatures( {
              //   layers: [layerID]
              // });
              // console.log(features);

              var filtered =
                features.filter(function(feature) {
                  var name = normalize(feature.properties.name);
                  var addr = normalize(feature.properties.address);
                  var postcode = normalize(feature.properties.postcode);
                  var w3wArr = str2CleanArr(feature.properties.w3w);
                  var w3w = w3wArr.join(".");

                  // optional features
                  var hashtagsArr = feature.properties.hashtags ? str2CleanArr(feature.properties.hashtags) : null;
                  var hashtags = hashtagsArr.join("#");

                  return name.indexOf(inputValue) > -1 ||
                    addr.indexOf(inputValue) > -1 || postcode.indexOf(inputValue) > -1 || w3w.indexOf(inputValue) > -1 || hashtags.indexOf(inputValue) > -1;
                });
              // console.log(filtered);

              // render the list of filtered places
              renderListings(filtered,inputValue, layerID, noMatched, layerIDs);

              // Set the filter to populate features into the layer.
              if (filtered.length) {
                  map.setFilter(layerID, [
                    "match",
                    ["get", "id"],
                    filtered.map(function(feature) {
                        return feature.properties.id;
                    }),
                    true,
                    false
                  ]);
              } else {
                  map.setLayoutProperty(
                    layerID,
                    'visibility',
                    'none'
                  );
                };

            });

          });
          layerIDs.forEach(function(layerID){
            // click the feature on map and pop out the place details
            map.on('click', layerID, function (e) {
            var name = e.features[0].properties.name;
            //console.log(name);
            var category = e.features[0].properties.category;
            //console.log(category);
            // optional features
            var hashtagsArr = e.features[0].properties.hashtags ? str2CleanArr(e.features[0].properties.hashtags) : null;
            var hashtags = hashtagsArr.join(" #");
            //console.log(hashtags);
            var imgSize = "square";
            var imgURL = "https://smartwalks.cetools.org/img/"+ "example" + "_" + imgSize + ".png";
            // var imgURL = "../../img/4CuSdZPANw7CUtdEjMEL_square.png"
            // just for demo
            //should be extracted from DB e.features[0].properties.img_square_100;
            // link to place detail
            var detailLink = "placeDetail.html";
            var w3wArr = str2CleanArr(e.features[0].properties.w3w);
            var w3w = w3wArr.join(".");
            //console.log(w3w);
            var postcode = e.features[0].properties.postcode;
            //console.log(postcode);
            var coordinates =
            // e.features[0].properties.location;
            //console.log(coordinates);
            e.features[0].geometry.coordinates.slice();
            //coordinates[0] - longitude; coordinates[1] - latitude

            renderCard(name,category,hashtags,imgURL,detailLink,w3w,coordinates, postcode);

            });

          });

      });

  });

  //toggle popup off when close button is clicked
  $(".btn-close").click(function(){
    $("#popup-info-wrap").addClass('d-none');
  });

  // relaod the page when click on the search bar
  $(".fa-search").click(function(){
        location.reload(true);
      });
  // click on the search bar and toggle off the popup card
  $("#search-bar").click(function(){
    if(!$("#popup-info-wrap").hasClass('d-none')){
      $("#popup-info-wrap").addClass('d-none');
    };
  });

});


//   // get the coordinates when move mouse
//   map.on('mousemove', function(e) {
//     document.getElementById('info-georef').innerHTML =
//       // e.lngLat is the longitude, latitude geographical position of the event
//       JSON.stringify(e.lngLat.wrap());
//   });
//



// });

// Add geolocate control to the map.
// map.addControl(
//   new mapboxgl.GeolocateControl({
//     positionOptions: {
//       enableHighAccuracy: true
//     },
//     trackUserLocation: true
//   })
// );

// When a click event occurs on a feature in the places layer, open a popup card
// at the bottom, show title, subtitle, geo-refs.
// map.on('click', 'places', function(e) {
//   var coordinates = e.features[0].geometry.coordinates.slice();
//   var name = e.features[0].properties.name;
//   var address = e.features[0].properties.address;
//   var lat = e.features[0].properties.lat;
//   var lng = e.features[0].properties.lng;
//   var w3w = e.features[0].properties.w3w;
//   // Ensure that if the map is zoomed out such that multiple
//   // copies of the feature are visible, the popup appears
//   // over the copy being pointed to.
//   while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
//     coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
//   }
//
//   new mapboxgl.Popup()
//     .setLngLat(coordinates)
//     .addTo(map);
// });
//
// // Change the cursor to a pointer when the mouse is over the places layer.
// map.on('mouseenter', 'places', function() {
//   map.getCanvas().style.cursor = 'pointer';
// });
//
// // Change it back to a pointer when it leaves.
// map.on('mouseleave', 'places', function() {
//   map.getCanvas().style.cursor = '';
// });

//   });
// });


// FUNCTIONS
// get the color for specific category
function getCatColor(category) {
  var clPalette = {
    "healthcare": "#B40156",
    "transport": "#FBBB00",
    "energy": "#00A0B8",
    "education": "#645070"
  };
  var catColor = clPalette[category.toLowerCase()];
  return catColor;
}

// normalize the user input
function normalize(str) {
  return $.trim(str).toLowerCase();
}

// convert string to clean array without empty element
function str2CleanArr(str, separators = [",", "\\."]) {
  var cleanStr = normalize(str).replace(/, /g, ",");
  var cleanArr = cleanStr.split(new RegExp(separators.join('|'), 'g')).filter(Boolean);
  return cleanArr;
}

// render the list of filtered items given the input value and layerID
function renderListings(features,inputValue,layerID, noMatched, layerIDs) {

  if (features.length && inputValue !== '') {
    // display the filtered list
    $("#filtered-list-wrap").removeClass("d-none");
    features.forEach(function(feature) {
      var name = feature.properties.name;
      var addr = feature.properties.address;
      // replaced by place detail page link later
      // var link = feature.properties.link;
      var detailLink = "placeDetail.html";
      var w3wArr = str2CleanArr(feature.properties.w3w);
      var w3w = w3wArr.join(".");

      // optional features
      var hashtagsArr = feature.properties.hashtags ? str2CleanArr(feature.properties.hashtags) : null;
      var hashtags = hashtagsArr.join(" #");

      // insert into the framed html
      filteredListGrp.append('<a href='+detailLink+' class="list-group-item list-group-item-action border-bottom"><div class="d-flex w-100 justify-content-between"><p class="mb-0">'+name+'</p><sm class="ex-sm text-muted">'+w3w+'</sm></div><p class="mb-0 text-muted"><sm class="ex-sm">#'+ hashtags+'</sm></p><p class="mb-1 text-muted"><small>'+addr+'</small></p></a>');
    });
  } else if (features.length === 0 && inputValue !== '') {
    noMatched.push("true");
    // console.log(noMatched);
    // console.log(inputValue.length);
    if (noMatched.length >= layerIDs.length) {
      $("#filtered-list-wrap").removeClass("d-none");
      filteredListGrp.html("");
      filteredListGrp.html('<a class="list-group-item list-group-item-action border-0"><p class="mb-1">No results found.</p></a>');
    }
  } else {
    filteredListGrp.html("");
    $("#filtered-list-wrap").addClass("d-none");
    // remove feature filters
    map.setFilter(layerID, ['has','id']);
    map.setLayoutProperty(
      layerID,
      'visibility',
      'visible'
    );
  }
}

// render the popup card with place details
function renderCard(name,category,hashtags,imgURL,link,w3w,coordinates, postcode){

  var catColor = getCatColor(category);

  newCardTitle = name +'<br> <button class="btn place__nonvisual-attr-category" type="button"> </button> <div class="place__nonvisual-attr-hashtags ml-1 d-inline-block"> #' + hashtags + '</div>';

  newCardText = '<i class="w3w-logo w3w-dark-blue"></i> ' + w3w +'<br>' + coordinates[0].toFixed(4)+', '+ coordinates[1].toFixed(4) +'&emsp;'+ postcode;
  // four spaces

  newCardImg = '<a href='+ link +' class="stretched-link"><img src='+imgURL+' alt=' +name+' class="card-img-top embed-responsive embed-responsive-1by1">';

  if ($("#popup-info-wrap").hasClass("d-none")){
    // display the popup card
    $("#popup-info-wrap").removeClass("d-none");
    $(".card-title").html(newCardTitle);
    $(".place__nonvisual-attr-category").text(category);
    $(".place__nonvisual-attr-category").css("background",catColor);
    $(".card-text").html(newCardText);
    $(".card-img").html(newCardImg);
  } else {
    $(".card-title").html(newCardTitle);
    $(".place__nonvisual-attr-category").text(category);
    $(".place__nonvisual-attr-category").css("background",catColor);
    $(".card-text").html(newCardText);
    $(".card-img").html(newCardImg);
  }

}
