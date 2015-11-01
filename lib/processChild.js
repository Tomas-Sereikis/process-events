var isPromise = require('is-promise');
var EventEmitter = require('events');
var constants = require('./constants');
var emitter = new EventEmitter();

/**
 * @param process
 * @param {string} id
 */
function sendMessage (process, id) {
  return {
    resolve(data) {
      process.send({uuid: id, data});
    },
    reject(data) {
      process.send({uuid: id, err: {data}});
    }
  }
}

/**
 * Process instance
 * @returns {{bind: (function(*=, *))}}
 */
function processChild () {
  process.on('message', function (message) {
    // check if we relieved close message, then close process
    if (constants.CLOSE_EVENT_MESSAGE === message) {
      process.exit();
    } else {
      // send message to emitter
      emitter.emit(message.namespace, message.uuid, message.data);
    }
  });

  return {
    /**
     * Bind callback to process event namespace
     * @param namespace
     * @param callback
     */
    bind(namespace, callback) {
      // bind to process event
      emitter.on(namespace, function (id, data) {
        var processMessage = sendMessage(process, id);
        try {
          var response = callback(data);
          if (isPromise(response)) {
            // if its a promise then resolve or reject it
            response.then(res => processMessage.resolve(res), err => processMessage.reject(err));
          } else {
            // if its not a promise then resolve it
            processMessage.resolve(response);
          }
        } catch (err) {
          // send reject message
          processMessage.reject(err);
        }
      });
    }
  };
}

module.exports = processChild;