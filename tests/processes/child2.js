var processChild = require('../../index').processChild();

processChild.bind('promise', function (message) {
  return Promise.resolve(message);
});

processChild.bind('promise-long', function () {
  return new Promise(function (resolve) {
    setTimeout(resolve, 10000);
  });
});

processChild.bind('exit', function () {
  process.exit(0);
});