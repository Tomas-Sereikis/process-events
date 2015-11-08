'use strict';

var fs = require('fs-promise');
var path = require('path');
var mime = require('mime');
var fork = require('child_process').fork;
var uuid = require('node-uuid');
var assert = require('assert');
var isString = require('lodash-node/modern/lang/isString');
var EventEmitter = require('events');
var constants = require('./constants');

/**
 * @param filePath
 * @returns {*}
 */
function processFork (filePath) {
  var emitter = new EventEmitter();
  var rejects = new Map();
  var process = fork(filePath);

  /**
   * Send process message to emitter
   * @param process
   */
  function bindProcessMessageEmitter (process) {
    process.on('message', message => {
      emitter.emit(message.uuid, message.err, message.data);
    });
  }

  /**
   * When process is closed make sure to reject all promises that are not done
   * @param process
   */
  function bindProcessExitRejects (process) {
    // when process is closed make sure to reject all promises that are not done
    process.on('exit', function () {
      for (let id of rejects.keys()) {
        let reject = rejects.get(id);
        reject(new Error('Process was closed unexpectedly!'));
        rejects.delete(id);
      }
    });
  }

  bindProcessMessageEmitter(process);
  bindProcessExitRejects(process);

  return {
    /**
     * @returns {boolean}
     */
    isConnected() {
      return process.connected;
    },

    /**
     * Reopen closed process
     * @returns {Promise}
     */
    reopen() {
      if (this.isConnected()) {
        return Promise.reject(new Error('Process is not closed!'));
      } else {
        process = fork(filePath);
        bindProcessMessageEmitter(process);
        bindProcessExitRejects(process);
        return Promise.resolve(this);
      }
    },

    /**
     * Send message to process
     * @param {string} namespace
     * @param data
     * @returns {Promise}
     */
    send(namespace, data) {
      assert(isString(namespace));
      return new Promise((resolve, reject) => {
        if (this.isConnected()) {
          var id = uuid.v1();
          rejects.set(id, reject);
          process.send({uuid: id, namespace, data});
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
      return new Promise((resolve) => {
        // check if process it not closed yet
        if (this.isConnected()) {
          process.once('exit', () => resolve());
          process.send(constants.CLOSE_EVENT_MESSAGE);
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
    return processFork(fullPath);
  });
};