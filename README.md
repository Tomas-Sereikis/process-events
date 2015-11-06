# Process Events

`npm install process-events --save`

Process events is a library from Node.js that can run custom events via forked processes and return there response as promise. 
This is useful when you have long running tasks and you don't what to lock your main application thread. 

### Examples

Main node process
```javascript
var processEvents = require('process-events');
var child = processEvents.processEvent('./processes/child.js');

var pe;
child.then(function (_pe_) {
  pe = _pe_;
  // send data to child process
  return pe.send('event-name', {a: 1, b: 2})
}).then(function (response) {
  // response from child process
  console.log(response); // {a: 2, b: 1}
  return pe.close();
});
```

File `./processes/child.js`
```javascript
var processChild = require('process-events').processChild();

// bind to custom event
processChild.bind('event-name', function (request) {
  // do some logic here
  // resolve event as promise
  return Promise.resolve({a: request.b, b: request.a});
});
```
