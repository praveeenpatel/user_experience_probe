# v2-loadtest-scripts


The load testing scripts seperated for passive browsing, generating chat loads, cobrowsing. Each folder has the script to run.

You need to replace the hostname based on the testing environment and you can give the testname based on the test you were performing. Additionally can also specify the pages parameter to test on concurrent users.

logData will be logging your data and metrics will be the json key value pair that has different timinings based on the tests we have performed with the script.

1. `widget-load` - Will be the time taken in milliseconds to load.
2. `page-load` - Will be the time taken in milliseconds to load our page.

Will also be having the time taken in milli seconds for the api calls in case of `init`, `creating chat(create)` and `adding the new messages(add-message)`. Har files data are been using to extact the response time.

The scripts includes the time taken in milliseconds to establish the websocket connection and this is done with dumping of the websockets data. `CRM websocket connection` time and `webrtc socket connection` times and `socket send/receive` frame times were drawn as part of the metrics.

All this will be collected as part of the testing performing and a `metrics` object with these timing values were logged.


