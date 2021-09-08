const functions = require('firebase-functions');
const admin = require('firebase-admin');
const firebaseHelper = require('firebase-functions-helper');
const express = require('express');
const bodyParser = require('body-parser');

admin.initializeApp(functions.config().firebase);

const db = admin.firestore();
const app = express();
const main = express();

// 🔥 Firebase Variables 🔥
const walksCollection = 'walks';
const placesCollection = 'places';

// Express Variables
main.use('/api/v1', app);
main.use(bodyParser.json());
main.use(bodyParser.urlencoded({ extended: false }));

app.get('/place/:placeID', (req, res) => {
  firebaseHelper.firestore
  .getDocument(db, placesCollection, req.params.placeID)
  .then(doc => {
  	res.setHeader('Content-Type', 'application/json')
  	res.status(200).send(doc);
  	return doc;
  })
  .catch(error => res.status(400).send(`Cannot get place: ${error}`));
});

app.get('/walk', (req, res) => {
  firebaseHelper.firestore
  .backup(db, walksCollection)
  .then(async data => {    
    let docs = data['walks'];
    var returnJSON = {};
    returnJSON.walks = [];
	
    for (const key in data.walks) {
    	var obj = {};
    	obj.id = "/walk/"+key;
    	obj.name = data.walks[key].name;
      obj.description = data.walks[key].description; //adding a description for display 
    	obj.numberOfStops = data.walks[key].stops.length;
    	obj.stops = [];


		for (const walksKey in data.walks[key].stops) {
	  		var ref = data.walks[key].stops[walksKey].id;

	  		/* eslint-disable no-await-in-loop */
	  	 	var result = await firebaseHelper.firestore.getDocument(db, placesCollection, ref);	  		
	  		/* eslint-enable no-await-in-loop */

	   		var placeObj = {};

	   		// Keys we want
	   		var returnKeys = ["name", "category", "location", "w3w", "pluscode", "postcode", "hashtags"];

	   		// Loop all keys;
	   		for (placeInnerKey in result) {
	  			placeObj.id = "/place/" + data.walks[key].stops[walksKey].id;
	  			if(result.hasOwnProperty(placeInnerKey)){
	  				if(returnKeys.indexOf(placeInnerKey) !== -1){
	    				placeObj[placeInnerKey] = result[placeInnerKey];
	  				}
	  			}
			}

			obj.stops.push(placeObj);

	  	}

		returnJSON['walks'].push(obj);
    }

    res.status(200).send(returnJSON);
    return docs;
  })
  .catch(error => res.status(400).send(`Cannot get place: ${error}`));
});

app.get('/walk/:walkID', (req, res) => {
  firebaseHelper.firestore
  .getDocument(db, walksCollection, req.params.walkID)
  .then(doc => {
    let stops = doc['stops'];
    var obj;
    var returnJSON = {};
    returnJSON.name  = doc["name"];
    returnJSON.stops = [];
    var array = [];
    
    for (const key in stops) {
    	array.push(stops[key].id);
    }
     
    returnJSON.stops = array;

    return returnJSON;
  }).then( async data => {
  	// console.log("Data");
  	// console.log(data.stops);

  	for (const key in data.stops) {
  		var ref = data.stops[key];

		/* eslint-disable no-await-in-loop */
  		var result = await firebaseHelper.firestore.getDocument(db, placesCollection, ref);
  		/* eslint-enable no-await-in-loop */

  		var placeObj = {};

  		// Keys we want
  		var returnKeys = ["name", "category", "location", "w3w", "pluscode", "postcode", "hashtags"];

  		// Loop all keys;
  		for (innerKey in result) {
  			placeObj.id = "/place/" + data["stops"][key];
  			if(result.hasOwnProperty(innerKey)){
  				if(returnKeys.indexOf(innerKey) !== -1){
    				placeObj[innerKey] = result[innerKey];
  				}
  			}
		}

		data.stops[key] = placeObj;

  	}

  	// Return final JSON
  	res.setHeader('Content-Type', 'application/json')
    res.status(200).send(data);

    return data;
  })
  .catch(error => res.status(400).send(`Cannot get place: ${error}`));
});

app.get('/walk/:walkID/geojson', (req, res) => {
  firebaseHelper.firestore
  .getDocument(db, walksCollection, req.params.walkID)
  .then(doc => {
    let stops = doc['stops'];
    var obj;

    var returnJSON = {};
    returnJSON.name  = doc["name"];
    returnJSON.stops = [];
    var array = [];
    
    for (const key in stops) {
    	array.push(stops[key].id);
    }
     
    returnJSON.stops = array;

    return returnJSON;
  }).then( async data => {
  	// console.log("Data");
  	// console.log(data.stops);

  	for (const key in data.stops) {
  		var ref = data.stops[key];

  		/* eslint-disable no-await-in-loop */
  		var result = await firebaseHelper.firestore.getDocument(db, placesCollection, ref);
  		/* eslint-enable no-await-in-loop */

  		var placeObj = {};

  		// Keys we want
  		var returnKeys = ["name", "category", "location", "w3w", "pluscode", "postcode", "hashtags"];

  		// Loop all keys;
  		for (innerKey in result) {
  			placeObj.id = "/place/" + data["stops"][key];
  			if(result.hasOwnProperty(innerKey)){
  				//if(returnKeys.indexOf(innerKey) != -1){
    				placeObj[innerKey] = result[innerKey];
  				//}
  			}
		}

		data.stops[key] = placeObj;

  	}

  	// Convert to GeoJSON
  	var GeoJSON = JSON2GeoJSON(data);

  	// Return final JSON
  	res.setHeader('Content-Type', 'application/json')
    res.status(200).send(GeoJSON);

    return GeoJSON;
  })
  .catch(error => res.status(400).send(`Cannot get place: ${error}`));
});

function JSON2GeoJSON(obj){
	 var geojson = {
  		type: "FeatureCollection",
  		features: [],
	};

	for (i = 0; i < obj.stops.length; i++) {
		geojson.features.push({
    		"type": "Feature",
    		"geometry": {
      			"type": "Point",
      			"coordinates": [obj.stops[i]['location']["_longitude"], obj.stops[i]['location']["_latitude"]]
    		},
    		"properties": obj.stops[i]
    	});

	}

	return geojson;

}


exports.locationData = functions.https.onRequest(main);
