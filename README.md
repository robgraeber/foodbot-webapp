Foodbot-Webapp
===========

API server + frontend + scraper.

Dependencies: node, bower, npm, gulp, mongodb

To run: npm/bower install, ". keys.sh", "gulp build", run server.js 

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

![screen shot 2014-12-05 at 1 51 39 am](https://cloud.githubusercontent.com/assets/2387719/5312114/5305cc84-7c21-11e4-9e8b-c45124d08faa.png)




