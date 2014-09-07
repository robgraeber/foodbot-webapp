
/**
 * Module dependencies
 */
var express = require('express');
var api = require('./routes/api');
var path = require('path');
var app = module.exports = express();

/**
 * Configuration
 */
app.set('port', process.env.PORT || 8000);
app.use(express.compress());
app.use(express.static(path.join(__dirname, 'public')));
/**
 * Routes
 */
app.get('/api', api);

/**
 * Start Server
 */
app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});