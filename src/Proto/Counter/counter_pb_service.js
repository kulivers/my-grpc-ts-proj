// package: count
// file: counter.proto

var counter_pb = require("./counter_pb");
var grpc = require("@improbable-eng/grpc-web").grpc;

var Counter = (function () {
  function Counter() {}
  Counter.serviceName = "count.Counter";
  return Counter;
}());

Counter.GetCounter = {
  methodName: "GetCounter",
  service: Counter,
  requestStream: false,
  responseStream: false,
  requestType: counter_pb.Empty,
  responseType: counter_pb.CounterReply
};

Counter.Increment = {
  methodName: "Increment",
  service: Counter,
  requestStream: false,
  responseStream: false,
  requestType: counter_pb.Empty,
  responseType: counter_pb.CounterReply
};

Counter.SetCounter = {
  methodName: "SetCounter",
  service: Counter,
  requestStream: false,
  responseStream: false,
  requestType: counter_pb.CounterRequest,
  responseType: counter_pb.Empty
};

Counter.AccumulateCount = {
  methodName: "AccumulateCount",
  service: Counter,
  requestStream: true,
  responseStream: false,
  requestType: counter_pb.CounterRequest,
  responseType: counter_pb.CounterReply
};

Counter.Countdown = {
  methodName: "Countdown",
  service: Counter,
  requestStream: false,
  responseStream: true,
  requestType: counter_pb.Empty,
  responseType: counter_pb.CounterReply
};

exports.Counter = Counter;

function CounterClient(serviceHost, options) {
  this.serviceHost = serviceHost;
  this.options = options || {};
}

CounterClient.prototype.getCounter = function getCounter(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Counter.GetCounter, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

CounterClient.prototype.increment = function increment(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Counter.Increment, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

CounterClient.prototype.setCounter = function setCounter(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(Counter.SetCounter, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

CounterClient.prototype.accumulateCount = function accumulateCount(metadata) {
  var listeners = {
    end: [],
    status: []
  };
  var client = grpc.client(Counter.AccumulateCount, {
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport
  });
  client.onEnd(function (status, statusMessage, trailers) {
    listeners.status.forEach(function (handler) {
      handler({ code: status, details: statusMessage, metadata: trailers });
    });
    listeners.end.forEach(function (handler) {
      handler({ code: status, details: statusMessage, metadata: trailers });
    });
    listeners = null;
  });
  return {
    on: function (type, handler) {
      listeners[type].push(handler);
      return this;
    },
    write: function (requestMessage) {
      if (!client.started) {
        client.start(metadata);
      }
      client.send(requestMessage);
      return this;
    },
    end: function () {
      client.finishSend();
    },
    cancel: function () {
      listeners = null;
      client.close();
    }
  };
};

CounterClient.prototype.countdown = function countdown(requestMessage, metadata) {
  var listeners = {
    data: [],
    end: [],
    status: []
  };
  var client = grpc.invoke(Counter.Countdown, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onMessage: function (responseMessage) {
      listeners.data.forEach(function (handler) {
        handler(responseMessage);
      });
    },
    onEnd: function (status, statusMessage, trailers) {
      listeners.status.forEach(function (handler) {
        handler({ code: status, details: statusMessage, metadata: trailers });
      });
      listeners.end.forEach(function (handler) {
        handler({ code: status, details: statusMessage, metadata: trailers });
      });
      listeners = null;
    }
  });
  return {
    on: function (type, handler) {
      listeners[type].push(handler);
      return this;
    },
    cancel: function () {
      listeners = null;
      client.close();
    }
  };
};

exports.CounterClient = CounterClient;

