Foodbot-Webapp
===========

API server + frontend + scraper.

Dependencies: node, bower, npm, gulp, mongodb

To run: npm/bower install, export keys, "gulp build", run server.js 

And set a daily cron job for the .scheduler.

Fill out a keys.sh file:
```
#!/bin/bash

export MEETUPAPIKEY='@@@@@@'
export GOOGLEAPIKEY='@@@@@@'
export MONGOURL='mongodb://@@@@@@@:27017/@@@@@'
export PORT=8000
```
During development: type 'gulp' to compile and watch files

Please fork and improve! :)



