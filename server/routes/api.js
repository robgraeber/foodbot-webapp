
/************************************************************************
 * Module dependencies
 ***********************************************************************/
var Promise = require('bluebird');
var http = require('http');
var request = Promise.promisifyAll(require('request'));
var _ = require('underscore');

/************************************************************************
 * Other dependencies
 ***********************************************************************/
var foodPhrases = require('../shared/foodPhrases');
var excludedPhrases = require('../shared/excludedPhrases');

/************************************************************************
 * Database access
 ***********************************************************************/
var mongo = require('mongojs')
var db = mongo(process.env.MONGOURL, ['meetup','eventbrite','coordsTable'], {authMechanism: 'ScramSHA1'});
Promise.promisifyAll(db.meetup);
Promise.promisifyAll(db.eventbrite);
Promise.promisifyAll(db.coordsTable);

/************************************************************************
 * Main Function
 ***********************************************************************/

module.exports = function(req, res){
  res.header("Access-Control-Allow-Origin", "*");
  // Below changed the default address for testing purposes
  var address = req.query.address || '94108';
  console.log('address: ',address);
  var time = req.query.time || new Date().getTime();
  var radius = req.query.radius || 5;
  var googleApiKey = process.env.GOOGLEAPIKEY || "123FAKEKEY";
  // console.log("address:", address, "time:", time);

  // to Prevent a call to the google maps api and stay under the 2500 request a day,
  // we store the adresses that have been queried in an address collection
  
  // if the address is in the collection, we retrieve the latitude and longitude stored 
  // otherwise we send a request to the google maps api
  var checkCoords = function(address){
    return db.coordsTable.findOneAsync({_id: address.toLowerCase().trim()})
      .then(function(result){
        if(result){
          console.log('Got coords from database');
          return {lat: result.lat, lng: result.lng};
        }else{
          console.log('Coords not in database');
          return googleMapsRequest(address);
        }
      });
    };
  /************************************************************************
   * Converting the Address to latitude and longitude data
   ***********************************************************************/
  // qs : object containing querystring values to be appended to the uri 
  var googleMapsRequest = function(address){
    return request.getAsync({url:"https://maps.googleapis.com/maps/api/geocode/json", qs:{key:googleApiKey, sensor:"false", address:address}})
      .then(function(args){
        var body = JSON.parse(args[1]);
        if(body.status === "OK"){
          var lat = body.results[0].geometry.location.lat;
          var lng = body.results[0].geometry.location.lng;
          console.log("Lat:", lat, "Long:", lng, "Status: OK");
          //database insertion
          db.coordsTable.save({_id:address.toLowerCase().trim(),lat: lat,lng: lng});
          return {lat: lat, lng: lng};
        }else {
          throw "API Error: "+body.status;
        }
      });
  };

  /************************************************************************
   * Getting the next events from the different collections
   ***********************************************************************/
  var lat;
  var lng;
  Promise.all([checkCoords(address)])
  .spread(function(data){
    console.log("Querying database for events");
    var timer = new Date().getTime();

    console.log(data.lng, data.lat);
    lat = data.lat;
    lng = data.lng;
    var query = {
      location : { $geoWithin : { $centerSphere : [ [ data.lng, data.lat ], radius / 3959 ] } },
      time: { $gt: time-5*60*60*1000 }
    };
    var explainQuery = { $query: query, $explain: 1 };
    return new Promise(function(resolve, reject) {
        var resolveCount = 0;
        var results = [];
        db.meetup.find(query)
        .limit(1000)
        .toArray(function(err, values) {
          results = results.concat(values);
          resolveCount++;
          if (resolveCount === 2) {
            resolve(results);
          }
        })

        db.eventbrite.find(query)
        .limit(1000)
        .toArray(function(err, values) {
          results = results.concat(values);
          resolveCount++;
          if (resolveCount === 2) {
            resolve(results);
          }
        })
    })
    .then(function(results){
      console.log("Db query time:",new Date().getTime()-timer);
      return results;
    });
  })
  
  /**********************************************************************
   * Taking out the finished events from the results
   **********************************************************************/
  .filter(function(item){
    return item.time + item.duration > time; 
  })

  /**********************************************************************
   * Remove items that have excluded terms in the venue names
   **********************************************************************/
  .filter(function(item){
    // console.log('\n\n',excludedPhrases.venueTerms);
    _.each(excludedPhrases.venueTerms, function(regexp){
      // console.log(item.name);
      if(item.name.match(regexp)) item.excluded = true;
      // item.name = item.name.replace(regexp, '<strong><span class="label label-warning">'+regexp+'</span></strong>');
    });
    return !item.excluded;
    // return item;
  })

  /************************************************************************
   * Retrieve events that have Our FoodPhrases in description
   ***********************************************************************/
  .filter(function(item){
    //filters for foods terms and adds found food to json
    var foodProvided = [];
    if(!item.description){
      return false;
    }
    // console.log(item.description);
    _.each(foodPhrases.regexpList, function(regexp){
      var matches = item.description.match(regexp) || [];
      // item.description = item.description.replace(regexp, '<strong><span class="label label-success">'+regexp+'</span></strong>');
      // console.log(regexp);
      foodProvided = foodProvided.concat(matches);
    });
    item.foodProvided = _.map(foodProvided, function(food){
      return food.toLowerCase().trim();
    });

    return item.foodProvided.length > 0;
  })

  /************************************************************************
   * Exclude events that have excluded Phrases in description
   ***********************************************************************/
  .filter(function(item){
    //filters excluded terms from description
    for(var i = 0; i < excludedPhrases.regexpList.length; i++){
      var regexp = excludedPhrases.regexpList[i];
      var matches = item.description.match(regexp);
      // item.description = item.description.replace(regexp, '<strong><span class="label label-danger">'+regexp+'</span></strong>');
      if(matches){
        return false;
      }
    }
    return true;
  })
  .map(function(item){
    var evtLat = item.venue.address.latitude;
    var evtLng = item.venue.address.longitude;
    if(evtLat !== null && evtLng !== null){
      dist = distance(lat, lng, evtLat, evtLng);
      item.distance = dist;
      // return dist < radius;
    }
    return item;
  })
  /************************************************************************
   * Return the filtered events
   ***********************************************************************/
  .then(function(results){
    console.log("Results returned:", results.length);
    results = _.sortBy(results, function(o) { return o.time; });
    res.send({results:results, status:"OK"});
  })
  .catch(function(err){
    console.log("Error:", err);
    res.send({results:[], status:err+""});
  });
};

/************************************************************************
 * Extra Functions
 ***********************************************************************/
function distance(lat1, lon1, lat2, lon2) {
   var radlat1 = Math.PI * lat1/180;
   var radlat2 = Math.PI * lat2/180;
   var radlon1 = Math.PI * lon1/180;
   var radlon2 = Math.PI * lon2/180;
   var theta = lon1-lon2;
   var radtheta = Math.PI * theta/180;
   var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
   dist = Math.acos(dist);
   dist = dist * 180/Math.PI;
   dist = dist * 60 * 1.1515;
   return dist;
 }
// setInterval(function(){
//   db.runCommand({ping:1})
//   .then(function(res) {
//     if(res.ok){ 
//       // console.log("We're still up!");
//     }
//   });
// }, 3000);