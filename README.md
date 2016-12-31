Foodbot-Webapp
===========

API server + frontend + scraper.

Dependencies: node, bower, npm, gulp, mongodb

To run: 
```
npm install && bower install
gulp build
npm start (and put in env variables)
```

And setup a daily cron job for the .scheduler.

Env variables required:
```
MEETUPAPIKEY
GOOGLEAPIKEY
MONGOURL
PORT
```

During development: type 'gulp' to compile and watch files

![screen shot 2014-12-05 at 1 51 39 am](https://cloud.githubusercontent.com/assets/2387719/5312114/5305cc84-7c21-11e4-9e8b-c45124d08faa.png)




