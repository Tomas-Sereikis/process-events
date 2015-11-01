var processChild = require('../../index').processChild();

processChild.bind('promise', function (message) {
  return Promise.resolve(message);
});