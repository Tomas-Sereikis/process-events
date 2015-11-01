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
  forked.on('message', message => emitter.emit(message.uuid, message.err, message.data));
  return {
    /**
     * Send message to process
     * @param {string} namespace
     * @param data
     * @returns {Promise}
     */
    send(namespace, data) {
      return new Promise(function (resolve, reject) {
        var id = uuid.v1();
        forked.send({uuid: id, namespace, data});
        emitter.once(id, function (err, data) {
          if (err) return reject(err.data);
          resolve(data);
        });
      });
    },
    /**
     * Close process
     * @returns {Promise}
     */
    close() {
      return new Promise(function (resolve) {
        forked.once('exit', resolve);
        forked.send(constants.CLOSE_EVENT_MESSAGE);
      });
    }
  };
}

/**
 * @param filePath
 * @returns {Promise}
 */
function processEvent (filePath) {
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
}

module.exports = processEvent;