'use strict';

var fs = require('fs-promise');
var path = require('path');
var mime = require('mime');
var fork = require('child_process').fork;
var uuid = require('node-uuid');
var EventEmitter = require('events');
var constants = require('./constants');

/**
 * @param forked
 * @returns {*}
 */
function processFork (forked) {
  var emitter = new EventEmitter();
  var rejects = new Map();

  forked.on('message', message => emitter.emit(message.uuid, message.err, message.data));
  // when process is closed make sure to reject all promises that are not done
  forked.on('exit', function () {
    for (let id of rejects.keys()) {
      let reject = rejects.get(id);
      reject(new Error('Process was closed unexpectedly!'));
      rejects.delete(id);
    }
  });

  return {
    /**
     * Send message to process
     * @param {string} namespace
     * @param data
     * @returns {Promise}
     */
    send(namespace, data) {
      return new Promise(function (resolve, reject) {
        if (forked.connected) {
          var id = uuid.v1();
          rejects.set(id, reject);
          forked.send({uuid: id, namespace, data});
          emitter.once(id, function (err, data) {
            err ? reject(err.data) : resolve(data);
            rejects.delete(id);
          });
        } else {
          reject(new Error('Process is closed!'));
        }
      });
    },

    /**
     * Close process
     * @returns {Promise}
     */
    close() {
      return new Promise(function (resolve) {
        // check if process it not closed yet
        if (forked.connected) {
          forked.once('exit', () => resolve());
          forked.send(constants.CLOSE_EVENT_MESSAGE);
        } else {
          resolve();
        }
      });
    }
  };
}

/**
 * @param filePath
 * @returns {Promise}
 */
module.exports = function processEvent (filePath) {
  var fullPath = path.resolve(filePath);
  return fs.stat(fullPath).then(function () {
    // make sure that process type is valid
    if (constants.PROCESS_FILE_TYPES.indexOf(mime.lookup(fullPath)) === -1) {
      return Promise.reject('File mime type is not valid for event process!');
    }
    return fork(fullPath);
  }).then(function (forked) {
    return processFork(forked);
  });
};