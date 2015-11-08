# Process Events

`npm install process-events --save`

Process events is a library from Node.js that can run custom events via forked processes and return there response as promise. 
This is useful when you have long running tasks and you don't what to lock your main application thread. 

### Examples

Main node process
```javascript
var processEvents = require('process-events');
var childProcess = processEvents.processEvent('./processes/child.js');

childProcess.then(function (process) {
  // send data to child process
  return process.send('name', {a: 1, b: 2}).then(function (response) {
    // response from child process
    console.log(response);  // {a: 2, b: 1}
    return process.send('name', {a: 3, b: 4});
  }).then(function () {
    // response from child process
    console.log(response);  // {a: 4, b: 3}
    return process.close();
  });
});
```

File `./processes/child.js`
```javascript
var processChild = require('process-events').processChild();

// bind to custom event
processChild.bind('name', function (request) {
  // do some logic here
  // resolve event as promise
  return Promise.resolve({a: request.b, b: request.a});
});
```

### API

Main process API.

```javascript
var processEvent = require('process-events').processEvent;
var worker = processEvent(workerFilePath: string);
```

Method | Description
--- | ---
`worker.isConnected(): boolean` | Returns child process connection state.
`worker.send(namespace: string, data: any?): Promise` | Sends message to child process.
`worker.close(): Promise` | Close child process. Node that if you don't close your process node script will continue to run forever or until process gets killed.
`worker.reopen(): Promise` | Will reopen child process after it was killed.

Child process API.

```javascript
var processChild = require('process-events').processChild;
```

Method | Description
--- | ---
`processChild.bind(namespace: string, callback: Function)` | Bind callback to child process worker. Callback can return `string` or a `Promise` - response will be send to main process.
