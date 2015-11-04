var isPromise = require('is-promise');
var EventEmitter = require('events');
var constants = require('./constants');
var emitter = new EventEmitter();

/**
 * @param {string} id
 */
function responseMessage (id) {
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
module.exports = function processChild () {
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
        var message = responseMessage(id);
        try {
          var res = callback(data);
          if (isPromise(res)) {
            // if its a promise then resolve or reject it
            res.then(res => message.resolve(res), err => message.reject(err));
          } else {
            // if its not a promise then resolve it
            message.resolve(res);
          }
        } catch (err) {
          // send reject message
          message.reject(err);
        }
      });
    }
  };
}