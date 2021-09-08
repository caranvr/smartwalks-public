//initialise key variables
var map;
var places;
var userPosition; 
var placesVisited = 0; //keep track of how many places a user has visited
var addedPlace = false; //keep track of whether a user has added a place

$(document).ready(function() {

	//initialise map
	mapboxgl.accessToken = 'pk.eyJ1IjoibGl1ZGluaW5nIiwiYSI6ImNqd2s2MnRrcTBoMGYzenA5ZjhtY3d1aDMifQ.-tydp-PYx-8BsuloTJgcwQ';

	map = new mapboxgl.Map({
		container: 'map',
	    style: 'mapbox://styles/liudining/ckc9wyfvi30el1irqy7rjs5us',
	    center: [-0.10821641386856672, 51.56395358082209],
	    zoom: 11
	});

	//get current user position to display on map, using mapbox geolocateControl
	const geolocate = new mapboxgl.GeolocateControl({
			positionOptions: {
				enableHighAccuracy: true
			},
			// When active the map will receive updates to the device's location as it changes.
			trackUserLocation: true,
			// Draw an arrow next to the location dot to indicate which direction the device is heading.
			showUserHeading: true
		});

	map.addControl(geolocate);

	geolocate.on('geolocate', function(e) {
		var lon = e.coords.longitude;
		var lat = e.coords.latitude;
		userPosition = [lon, lat];
	});

	//add places as source from session storage
	places = JSON.parse(sessionStorage.getItem('places'));

	//LOAD MAP
	map.on('load', function() {

		map.addSource('places', {
			'type': 'geojson',
			'data': places,
			'generateId': true
		});

		//hard coding test
		//map.addSource('places', {
		//	'type': 'geojson',
		//	'data': {
		//		'type': 'FeatureCollection',
		//		'features': [
		//			{
		//				'type': 'Feature',
		//				'geometry': {
		//					'type': 'Point',
		//					'coordinates': [-0.10821641386856672, 51.56395358082209]
		//				},
		//				'properties': {
		//					'id': 'edyS0koKFMVeTh4KaXbC',
		//					'name': 'Test place',
		//					'description': 'This is a test'
		//				}
		//			}
		//		]
		//	},
		//	'generateId': true
		//});

		var bounds = new mapboxgl.LngLatBounds();

		//fit map to available places
		places.features.forEach(function(feature) {
	        bounds.extend(feature.geometry.coordinates);
	    });
	          // console.log(bounds);
	    map.fitBounds(bounds, {
	        padding: 100
	    });

	    //add places to layer
	    map.addLayer({
	    	'id': 'place-points',
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
	                  'text-color': [
		                'case',
		                	['boolean', ['feature-state', 'click'], false],
		                	'#64bdbb',
		                	'#888888'
	            		]
	                }
	    });

		//track user position
		geolocate.trigger();

		//add click event to open AR view page for place if within a certain distance
		map.on('click', 'place-points', function(e) {

			console.log(e.features[0].id);

			//set threshold distance (25 meters)
			var threshold = 0.025;

			//get distance from current position to place (getDistance function)
			dist = getDistance(e.features[0].geometry.coordinates, userPosition);

			if (dist <= threshold) {
				
				//add 1 to number of places visited
				placesVisited += 1;
				
				//if distance is within threshold, create iframe that links to place AR view template
				createIFrame(e.features[0].id);
				
				//change color of map marker to indicate that it has already been visited
				map.setFeatureState({
					source: 'places',
					id: e.features[0].id,
				}, {
					click: true
				});

			} else {
				console.log(e.features[0]);
				//display div w place name + message to move closer 
				$('body').append(
					`<div class="card popup-info">
						<i class="fa fa-times-circle btn-close" id="close-popup"></i>
						<div class="col-sm-4">
							<img src="./img/${e.features[0].properties.img_square_100}" class="card-img-top
						</div>
						<div class="col-sm-8">
							<div class="card-body"
								<h2 class="card-title"><b>${e.features[0].properties.name}</b></h2>
								<p class="card-text">Please move closer to view more information about this place.</p>
							</div>
						</div>
					</div>`)

				$('#close-popup').click(function() {
					$('.popup-info').remove();
				});
			}

		});

	});

	//event listener for plus button
	$('#add-place').click(function() {
		if ($(this).hasClass('inactive-btn')) {
			alert("You must visit all places before adding a new place.");
		} 

		//FUNCTIONALITY TO MAKE FINISHING WALK CONDITIONAL ON ADDING A PLACE: implement after testing
		//else {
			//open overlay popup with google form
			//addedPlace = true;
			//$('#finish-walk').removeClass('inactive-btn');
		//}
	});

	//event listener for finished button
	$('#finish-walk').click(function(e) {
		if($(this).hasClass('inactive-btn')) {
			alert("You must visit all places before finishing the walk.")
			e.preventDefault();
		}
	});


	//IMPLEMENT WHEN PLACES ARE TAKEN FROM SESSION STORAGE
	//add prompt to add place when all places have been visited and iframe isn't on screen
	

	//if (addedPlace = true) {
		//$('#finish-walk').removeClass('inactive-btn');
	//}

	

	//add check button to top right if addedPlace = true

	//get distance from current position to place, using turf.js library
	//https://labs.mapbox.com/education/proximity-analysis/point-distance/
	function getDistance(poi, pos) {
		//poi = coordinates for poi
		//pos = current location

		var to = poi; //has to be an array in the form of [lng, lat]
		var from = pos;
		var options = { units: 'kilometers' };

		//get the actual distance
		var distance = turf.distance(to, from, options);
		return distance;
	}

	//create iframe for AR view
	//to-do: set iframe CSS on page to fullscreen, and add a close button to the page as well
	function createIFrame(placeID) {
		var ARview = document.createElement('iframe');
		ARview.setAttribute('id', 'ar-view')
		ARview.setAttribute('src', `ar-view.html?id=${placeID}`);

		$('body').append(ARview);
	}

	//alert when user tries to go back and they haven't finished the walk
	window.addEventListener('beforeunload', function(e){
		if (placesVisited > 0 && placesVisited < places.features.length) {
			e.returnValue = 'Your walk progress will be lost'
		}
	});

});

//called from iframe
function closeIFrame() {
	$('#ar-view').remove();

	if (placesVisited >= places.features.length && $('iframe').length == 0) {

		alert(`You have visited all places! To finish the walk, click the check button at the bottom of the screen.`);

		$('#add-place').removeClass('inactive-btn');
		$('#finish-walk').removeClass('inactive-btn');


	}
}

