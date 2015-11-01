var processChild = require('../../index').processChild();

processChild.bind('no-promise', function () {
  return {data: 'no-promise-response'};
});

processChild.bind('no-promise-message', function (text) {
  return [text, 'res'].join('.');
});

processChild.bind('no-promise-error', function () {
  throw new Error();
});

processChild.bind('promise', function (message) {
  return Promise.resolve(message);
});

processChild.bind('promise-reject', function (message) {
  return Promise.reject(message);
});