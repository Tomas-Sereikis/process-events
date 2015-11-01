/* global describe, pit, expect */
jest.autoMockOff();

var processEvents = require('../../index');
var createChild1 = () => processEvents.processEvent('./tests/processes/child1.js');
var createChild2 = () => processEvents.processEvent('./tests/processes/child2.js');

describe('process test', function () {
  pit('should get response from child1 no-promise bind', function () {
    var process;
    return createChild1().then(function (_process_) {
      process = _process_;
      return process.send('no-promise').then(function (response) {
        expect(response).toEqual({data: 'no-promise-response'});
        return process.close();
      });
    }).then(null, () => {
      process.close();
      return Promise.reject('Promise should not be rejected!');
    });
  });

  pit('should get response from child1 no-promise-message bind', function () {
    var process;
    return createChild1().then(function (_process_) {
      process = _process_;
      return process.send('no-promise-message', 'test').then(function (response) {
        expect(response).toBe('test.res');
        return process.close();
      });
    }).then(null, () => {
      process.close();
      return Promise.reject('Promise should not be rejected!');
    });
  });

  pit('should get multiple responses from child1 no-promise-message bind', function () {
    var process;
    return createChild1().then(function (_process_) {
      process = _process_;
      return process.send('no-promise-message', 'test1').then(function (response) {
        expect(response).toBe('test1.res');
        return process.send('no-promise-message', 'test2');
      }).then(function (response) {
        expect(response).toBe('test2.res');
        return process.close();
      });
    }).then(null, () => {
      process.close();
      return Promise.reject('Promise should not be rejected!');
    });
  });

  pit('should catch no-promise-error from child1 and not fail', function () {
    return createChild1().then(function (process) {
      return process.send('no-promise-error').then(function () {
        process.close();
        return Promise.reject('Promise was resolved while it should be rejected!');
      }, function () {
        return process.close();
      });
    });
  });

  pit('should resolve from child1 promise', function () {
    var process;
    return createChild1().then(function (_process_) {
      process = _process_;
      return process.send('promise', 'test').then(function (response) {
        expect(response).toBe('test');
        return process.close();
      });
    }).then(null, function () {
      process.close();
      return Promise.reject('Promise was rejected while it should be resolved!');
    });
  });

  pit('should reject from child1 promise', function () {
    return createChild1().then(function (process) {
      return process.send('promise-reject', 'test').then(function () {
        process.close();
        return Promise.reject('Promise was resolved while it should be rejected!');
      }, function (response) {
        expect(response).toBe('test');
        return process.close();
      });
    });
  });

  pit('should resolve from two different processes', function () {
    var promises;
    return Promise.all([
      createChild1(),
      createChild2()
    ]).then(function (_promises_) {
      promises = _promises_;
      return Promise.all([
        promises[0].send('promise', {a: 1}),
        promises[1].send('promise', {b: 2})
      ]);
    }).then(function (responses) {
      expect(responses[0]).toEqual({a: 1});
      expect(responses[1]).toEqual({b: 2});
      promises[0].close();
      promises[1].close();
    });
  });
});