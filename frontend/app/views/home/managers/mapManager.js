//all positions === new google.maps.LatLng(lat, lng); 

angular.module('app.home.managers')

.service('mapManager', function($rootScope, geocodeManager, mapRouteManager, mapMarkerManager, google, appConstants){
  var radius;
  var centerPosition;
  var radiusCircle;
  var home;

  this.init           = function(){
    this.map          = new google.maps.Map(document.getElementById("map"), appConstants.mapOptions.default); //map defined globally

    mapRouteManager.init(this.map, this);

    google.maps.event.addDomListener(window, 'resize', function(e) {
      this.redrawCenter(); 
    }.bind(this));

    google.maps.event.addListener(this.map, 'zoom_changed', function(e){
      this.redrawCenter(); 
      console.log("redrawCenter");
    }.bind(this));

    var position = appConstants.initialPosition; //Default location == sf
    this.setHomePosition(position, false);
  };

  this.updateMarkers     = function(foodEvents, startAddress){
    mapMarkerManager.flush();
    mapMarkerManager.addEventPins(foodEvents, startAddress, this.getMap(), this);
  };
  this.getMap           = function(){ return this.map; };

  this.setAddress       = function(address){
    console.log("Address:", address);
    return geocodeManager.getPosition(address)
    .then(function(position){
      this.setHomePosition(position);
      this.redrawRadius();
    }.bind(this));
  };

  this.getHomePosition   = function(){ return home.getPosition(); };

  //sets the home pin/position
  this.setHomePosition   = function(position, isVisible, isAnimated){
    if(isVisible === undefined){
      isVisible = true;
    }
    if(isAnimated === undefined){
      isAnimated = true;
    }
    if(home){ 
      home.setMap(null); 
    }
    var marker = home = new google.maps.Marker({ 
      title: 'My position', 
      map: this.getMap(),
      draggable: true, 
      position: position, 
      icon: appConstants.blankMarkerUri,
    });
    if(isAnimated){
      marker.setAnimation(google.maps.Animation.DROP);
    }
    //this fixes flicker bug on chrome
    if(isVisible){
      setTimeout(function(){
        marker.setIcon(appConstants.homeMarkerUri);
      }, 200);
    }
    if(!home.getPosition) debugger;
    this.setCenterPosition(home.getPosition());
    mapRouteManager.flush();


    google.maps.event.addListener(home, "dragend", function(e) { 
      var position = new google.maps.LatLng(e.latLng.lat(), e.latLng.lng());
      this.redrawCenter();
      this.redrawRadius();
      mapRouteManager.flush();
      $rootScope.$emit('dragEnded:home', {position:position});
    }.bind(this));
  };

  this.setCenterPosition = function(position){
    if(!this.map.getBounds()) return;
    centerPosition = position;
    this.redrawCenter();
  };
  //recenters map and offsets it
  this.redrawCenter      = function(){
    var ne            = this.map.getBounds().getNorthEast();
    var sw            = this.map.getBounds().getSouthWest();
    var delta         = Math.abs(ne.lng()-sw.lng());
    var lat           = 0.5 * (centerPosition.lat()+this.getHomePosition().lat());
    var lng           = 0.5 * (centerPosition.lng()+this.getHomePosition().lng());
    var offset = new google.maps.LatLng(lat, lng + delta*0.3*(-1));
    this.map.setCenter(offset); 
  };

  this.redrawRadius = function(){
    if(radiusCircle) { 
      radiusCircle.setMap(null);
    }
    radiusCircle = new google.maps.Circle({
      'strokeColor'   : '#b2182b',
      'strokeOpacity' : 0.7,
      'strokeWeight'  : 4,
      'fillColor'     : '#b2182b',
      'fillOpacity'   : 0.0,
      'map'           : this.getMap(),
      'center'        : this.getHomePosition(),
      'radius'        : this.getRadius() * 1.624 * 1000  
    });
  };

  this.getRadius         = function(){ return radius; };

  this.setRadius         = function(value){
    radius = value;
    this.redrawRadius();
  };

  

  
});
