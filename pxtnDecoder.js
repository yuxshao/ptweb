(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

module.exports = _asyncToGenerator;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{}],2:[function(require,module,exports){
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

module.exports = _classCallCheck;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{}],3:[function(require,module,exports){
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

module.exports = _createClass;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{}],4:[function(require,module,exports){
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

module.exports = _interopRequireDefault;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{}],5:[function(require,module,exports){
function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    module.exports = _typeof = function _typeof(obj) {
      return typeof obj;
    };

    module.exports["default"] = module.exports, module.exports.__esModule = true;
  } else {
    module.exports = _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };

    module.exports["default"] = module.exports, module.exports.__esModule = true;
  }

  return _typeof(obj);
}

module.exports = _typeof;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{}],6:[function(require,module,exports){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var runtime = (function (exports) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function define(obj, key, value) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
    return obj[key];
  }
  try {
    // IE 8 has a broken Object.defineProperty that only works on DOM objects.
    define({}, "");
  } catch (err) {
    define = function(obj, key, value) {
      return obj[key] = value;
    };
  }

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  exports.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunction.displayName = define(
    GeneratorFunctionPrototype,
    toStringTagSymbol,
    "GeneratorFunction"
  );

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      define(prototype, method, function(arg) {
        return this._invoke(method, arg);
      });
    });
  }

  exports.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  exports.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      define(genFun, toStringTagSymbol, "GeneratorFunction");
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  exports.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return PromiseImpl.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return PromiseImpl.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new PromiseImpl(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  exports.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    if (PromiseImpl === void 0) PromiseImpl = Promise;

    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList),
      PromiseImpl
    );

    return exports.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        // Note: ["return"] must be used for ES3 parsing compatibility.
        if (delegate.iterator["return"]) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  define(Gp, toStringTagSymbol, "Generator");

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  exports.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };

  // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.
  return exports;

}(
  // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
  typeof module === "object" ? module.exports : {}
));

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  Function("r", "regeneratorRuntime = r")(runtime);
}

},{}],7:[function(require,module,exports){
module.exports = require("regenerator-runtime");

},{"regenerator-runtime":6}],8:[function(require,module,exports){
(function (process,__dirname){(function (){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var Module = typeof pxtnDecoder !== "undefined" ? pxtnDecoder : {};
var moduleOverrides = {};
var key;

for (key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

var arguments_ = [];
var thisProgram = "./this.program";

var quit_ = function quit_(status, toThrow) {
  throw toThrow;
};

var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = (typeof window === "undefined" ? "undefined" : (0, _typeof2["default"])(window)) === "object";
ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
ENVIRONMENT_IS_NODE = (typeof process === "undefined" ? "undefined" : (0, _typeof2["default"])(process)) === "object" && (0, _typeof2["default"])(process.versions) === "object" && typeof process.versions.node === "string";
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
var scriptDirectory = "";

function locateFile(path) {
  if (Module["locateFile"]) {
    return Module["locateFile"](path, scriptDirectory);
  }

  return scriptDirectory + path;
}

var read_, readAsync, readBinary, setWindowTitle;
var nodeFS;
var nodePath;

if (ENVIRONMENT_IS_NODE) {
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = require("path").dirname(scriptDirectory) + "/";
  } else {
    scriptDirectory = __dirname + "/";
  }

  read_ = function shell_read(filename, binary) {
    if (!nodeFS) nodeFS = require("fs");
    if (!nodePath) nodePath = require("path");
    filename = nodePath["normalize"](filename);
    return nodeFS["readFileSync"](filename, binary ? null : "utf8");
  };

  readBinary = function readBinary(filename) {
    var ret = read_(filename, true);

    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }

    assert(ret.buffer);
    return ret;
  };

  if (process["argv"].length > 1) {
    thisProgram = process["argv"][1].replace(/\\/g, "/");
  }

  arguments_ = process["argv"].slice(2);

  if (typeof module !== "undefined") {
    module["exports"] = Module;
  }

  process["on"]("uncaughtException", function (ex) {
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });
  process["on"]("unhandledRejection", abort);

  quit_ = function quit_(status) {
    process["exit"](status);
  };

  Module["inspect"] = function () {
    return "[Emscripten Module object]";
  };
} else if (ENVIRONMENT_IS_SHELL) {
  if (typeof read != "undefined") {
    read_ = function shell_read(f) {
      return read(f);
    };
  }

  readBinary = function readBinary(f) {
    var data;

    if (typeof readbuffer === "function") {
      return new Uint8Array(readbuffer(f));
    }

    data = read(f, "binary");
    assert((0, _typeof2["default"])(data) === "object");
    return data;
  };

  if (typeof scriptArgs != "undefined") {
    arguments_ = scriptArgs;
  } else if (typeof arguments != "undefined") {
    arguments_ = arguments;
  }

  if (typeof quit === "function") {
    quit_ = function quit_(status) {
      quit(status);
    };
  }

  if (typeof print !== "undefined") {
    if (typeof console === "undefined") console = {};
    console.log = print;
    console.warn = console.error = typeof printErr !== "undefined" ? printErr : print;
  }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = self.location.href;
  } else if (typeof document !== "undefined" && document.currentScript) {
    scriptDirectory = document.currentScript.src;
  }

  if (scriptDirectory.indexOf("blob:") !== 0) {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1);
  } else {
    scriptDirectory = "";
  }

  {
    read_ = function read_(url) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, false);
      xhr.send(null);
      return xhr.responseText;
    };

    if (ENVIRONMENT_IS_WORKER) {
      readBinary = function readBinary(url) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.responseType = "arraybuffer";
        xhr.send(null);
        return new Uint8Array(xhr.response);
      };
    }

    readAsync = function readAsync(url, onload, onerror) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";

      xhr.onload = function () {
        if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
          onload(xhr.response);
          return;
        }

        onerror();
      };

      xhr.onerror = onerror;
      xhr.send(null);
    };
  }

  setWindowTitle = function setWindowTitle(title) {
    document.title = title;
  };
} else {}

var out = Module["print"] || console.log.bind(console);
var err = Module["printErr"] || console.warn.bind(console);

for (key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}

moduleOverrides = null;
if (Module["arguments"]) arguments_ = Module["arguments"];
if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
if (Module["quit"]) quit_ = Module["quit"];

function getNativeTypeSize(type) {
  switch (type) {
    case "i1":
    case "i8":
      return 1;

    case "i16":
      return 2;

    case "i32":
      return 4;

    case "i64":
      return 8;

    case "float":
      return 4;

    case "double":
      return 8;

    default:
      {
        if (type[type.length - 1] === "*") {
          return 4;
        } else if (type[0] === "i") {
          var bits = Number(type.substr(1));
          assert(bits % 8 === 0, "getNativeTypeSize invalid bits " + bits + ", type " + type);
          return bits / 8;
        } else {
          return 0;
        }
      }
  }
}

var tempRet0 = 0;

var setTempRet0 = function setTempRet0(value) {
  tempRet0 = value;
};

var wasmBinary;
if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
var noExitRuntime = Module["noExitRuntime"] || true;

if ((typeof WebAssembly === "undefined" ? "undefined" : (0, _typeof2["default"])(WebAssembly)) !== "object") {
  abort("no native wasm support detected");
}

function getValue(ptr, type, noSafe) {
  type = type || "i8";
  if (type.charAt(type.length - 1) === "*") type = "i32";

  switch (type) {
    case "i1":
      return HEAP8[ptr >> 0];

    case "i8":
      return HEAP8[ptr >> 0];

    case "i16":
      return HEAP16[ptr >> 1];

    case "i32":
      return HEAP32[ptr >> 2];

    case "i64":
      return HEAP32[ptr >> 2];

    case "float":
      return HEAPF32[ptr >> 2];

    case "double":
      return HEAPF64[ptr >> 3];

    default:
      abort("invalid type for getValue: " + type);
  }

  return null;
}

var wasmMemory;
var ABORT = false;
var EXITSTATUS;

function assert(condition, text) {
  if (!condition) {
    abort("Assertion failed: " + text);
  }
}

var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

function UTF8ArrayToString(heap, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;

  while (heap[endPtr] && !(endPtr >= endIdx)) {
    ++endPtr;
  }

  if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(heap.subarray(idx, endPtr));
  } else {
    var str = "";

    while (idx < endPtr) {
      var u0 = heap[idx++];

      if (!(u0 & 128)) {
        str += String.fromCharCode(u0);
        continue;
      }

      var u1 = heap[idx++] & 63;

      if ((u0 & 224) == 192) {
        str += String.fromCharCode((u0 & 31) << 6 | u1);
        continue;
      }

      var u2 = heap[idx++] & 63;

      if ((u0 & 240) == 224) {
        u0 = (u0 & 15) << 12 | u1 << 6 | u2;
      } else {
        u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63;
      }

      if (u0 < 65536) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 65536;
        str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
      }
    }
  }

  return str;
}

function UTF8ToString(ptr, maxBytesToRead) {
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
}

function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) return 0;
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1;

  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);

    if (u >= 55296 && u <= 57343) {
      var u1 = str.charCodeAt(++i);
      u = 65536 + ((u & 1023) << 10) | u1 & 1023;
    }

    if (u <= 127) {
      if (outIdx >= endIdx) break;
      heap[outIdx++] = u;
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++] = 192 | u >> 6;
      heap[outIdx++] = 128 | u & 63;
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++] = 224 | u >> 12;
      heap[outIdx++] = 128 | u >> 6 & 63;
      heap[outIdx++] = 128 | u & 63;
    } else {
      if (outIdx + 3 >= endIdx) break;
      heap[outIdx++] = 240 | u >> 18;
      heap[outIdx++] = 128 | u >> 12 & 63;
      heap[outIdx++] = 128 | u >> 6 & 63;
      heap[outIdx++] = 128 | u & 63;
    }
  }

  heap[outIdx] = 0;
  return outIdx - startIdx;
}

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}

function lengthBytesUTF8(str) {
  var len = 0;

  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);
    if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
    if (u <= 127) ++len;else if (u <= 2047) len += 2;else if (u <= 65535) len += 3;else len += 4;
  }

  return len;
}

var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;

function UTF16ToString(ptr, maxBytesToRead) {
  var endPtr = ptr;
  var idx = endPtr >> 1;
  var maxIdx = idx + maxBytesToRead / 2;

  while (!(idx >= maxIdx) && HEAPU16[idx]) {
    ++idx;
  }

  endPtr = idx << 1;

  if (endPtr - ptr > 32 && UTF16Decoder) {
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  } else {
    var str = "";

    for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
      var codeUnit = HEAP16[ptr + i * 2 >> 1];
      if (codeUnit == 0) break;
      str += String.fromCharCode(codeUnit);
    }

    return str;
  }
}

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 2147483647;
  }

  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2;
  var startPtr = outPtr;
  var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;

  for (var i = 0; i < numCharsToWrite; ++i) {
    var codeUnit = str.charCodeAt(i);
    HEAP16[outPtr >> 1] = codeUnit;
    outPtr += 2;
  }

  HEAP16[outPtr >> 1] = 0;
  return outPtr - startPtr;
}

function lengthBytesUTF16(str) {
  return str.length * 2;
}

function UTF32ToString(ptr, maxBytesToRead) {
  var i = 0;
  var str = "";

  while (!(i >= maxBytesToRead / 4)) {
    var utf32 = HEAP32[ptr + i * 4 >> 2];
    if (utf32 == 0) break;
    ++i;

    if (utf32 >= 65536) {
      var ch = utf32 - 65536;
      str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
    } else {
      str += String.fromCharCode(utf32);
    }
  }

  return str;
}

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 2147483647;
  }

  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;

  for (var i = 0; i < str.length; ++i) {
    var codeUnit = str.charCodeAt(i);

    if (codeUnit >= 55296 && codeUnit <= 57343) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023;
    }

    HEAP32[outPtr >> 2] = codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }

  HEAP32[outPtr >> 2] = 0;
  return outPtr - startPtr;
}

function lengthBytesUTF32(str) {
  var len = 0;

  for (var i = 0; i < str.length; ++i) {
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
    len += 4;
  }

  return len;
}

function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - x % multiple;
  }

  return x;
}

var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

function updateGlobalBufferAndViews(buf) {
  buffer = buf;
  Module["HEAP8"] = HEAP8 = new Int8Array(buf);
  Module["HEAP16"] = HEAP16 = new Int16Array(buf);
  Module["HEAP32"] = HEAP32 = new Int32Array(buf);
  Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
  Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
  Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
  Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
  Module["HEAPF64"] = HEAPF64 = new Float64Array(buf);
}

var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;
var wasmTable;
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;

function preRun() {
  if (Module["preRun"]) {
    if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];

    while (Module["preRun"].length) {
      addOnPreRun(Module["preRun"].shift());
    }
  }

  callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  runtimeExited = true;
}

function postRun() {
  if (Module["postRun"]) {
    if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];

    while (Module["postRun"].length) {
      addOnPostRun(Module["postRun"].shift());
    }
  }

  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;

function addRunDependency(id) {
  runDependencies++;

  if (Module["monitorRunDependencies"]) {
    Module["monitorRunDependencies"](runDependencies);
  }
}

function removeRunDependency(id) {
  runDependencies--;

  if (Module["monitorRunDependencies"]) {
    Module["monitorRunDependencies"](runDependencies);
  }

  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }

    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback();
    }
  }
}

Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};

function abort(what) {
  if (Module["onAbort"]) {
    Module["onAbort"](what);
  }

  what += "";
  err(what);
  ABORT = true;
  EXITSTATUS = 1;
  what = "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
  var e = new WebAssembly.RuntimeError(what);
  throw e;
}

function hasPrefix(str, prefix) {
  return String.prototype.startsWith ? str.startsWith(prefix) : str.indexOf(prefix) === 0;
}

var dataURIPrefix = "data:application/octet-stream;base64,";

function isDataURI(filename) {
  return hasPrefix(filename, dataURIPrefix);
}

var fileURIPrefix = "file://";

function isFileURI(filename) {
  return hasPrefix(filename, fileURIPrefix);
}

var wasmBinaryFile = "emDecoder.wasm";

if (!isDataURI(wasmBinaryFile)) {
  wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinary(file) {
  try {
    if (file == wasmBinaryFile && wasmBinary) {
      return new Uint8Array(wasmBinary);
    }

    if (readBinary) {
      return readBinary(file);
    } else {
      throw "both async and sync fetching of the wasm failed";
    }
  } catch (err) {
    abort(err);
  }
}

function getBinaryPromise() {
  if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
    if (typeof fetch === "function" && !isFileURI(wasmBinaryFile)) {
      return fetch(wasmBinaryFile, {
        credentials: "same-origin"
      }).then(function (response) {
        if (!response["ok"]) {
          throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
        }

        return response["arrayBuffer"]();
      })["catch"](function () {
        return getBinary(wasmBinaryFile);
      });
    } else {
      if (readAsync) {
        return new Promise(function (resolve, reject) {
          readAsync(wasmBinaryFile, function (response) {
            resolve(new Uint8Array(response));
          }, reject);
        });
      }
    }
  }

  return Promise.resolve().then(function () {
    return getBinary(wasmBinaryFile);
  });
}

function createWasm() {
  var info = {
    "a": asmLibraryArg
  };

  function receiveInstance(instance, module) {
    var exports = instance.exports;
    Module["asm"] = exports;
    wasmMemory = Module["asm"]["o"];
    updateGlobalBufferAndViews(wasmMemory.buffer);
    wasmTable = Module["asm"]["s"];
    addOnInit(Module["asm"]["p"]);
    removeRunDependency("wasm-instantiate");
  }

  addRunDependency("wasm-instantiate");

  function receiveInstantiatedSource(output) {
    receiveInstance(output["instance"]);
  }

  function instantiateArrayBuffer(receiver) {
    return getBinaryPromise().then(function (binary) {
      var result = WebAssembly.instantiate(binary, info);
      return result;
    }).then(receiver, function (reason) {
      err("failed to asynchronously prepare wasm: " + reason);
      abort(reason);
    });
  }

  function instantiateAsync() {
    if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && !isFileURI(wasmBinaryFile) && typeof fetch === "function") {
      return fetch(wasmBinaryFile, {
        credentials: "same-origin"
      }).then(function (response) {
        var result = WebAssembly.instantiateStreaming(response, info);
        return result.then(receiveInstantiatedSource, function (reason) {
          err("wasm streaming compile failed: " + reason);
          err("falling back to ArrayBuffer instantiation");
          return instantiateArrayBuffer(receiveInstantiatedSource);
        });
      });
    } else {
      return instantiateArrayBuffer(receiveInstantiatedSource);
    }
  }

  if (Module["instantiateWasm"]) {
    try {
      var exports = Module["instantiateWasm"](info, receiveInstance);
      return exports;
    } catch (e) {
      err("Module.instantiateWasm callback failed with error: " + e);
      return false;
    }
  }

  instantiateAsync();
  return {};
}

function callRuntimeCallbacks(callbacks) {
  while (callbacks.length > 0) {
    var callback = callbacks.shift();

    if (typeof callback == "function") {
      callback(Module);
      continue;
    }

    var func = callback.func;

    if (typeof func === "number") {
      if (callback.arg === undefined) {
        wasmTable.get(func)();
      } else {
        wasmTable.get(func)(callback.arg);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var runtimeKeepaliveCounter = 0;

function keepRuntimeAlive() {
  return noExitRuntime || runtimeKeepaliveCounter > 0;
}

function getShiftFromSize(size) {
  switch (size) {
    case 1:
      return 0;

    case 2:
      return 1;

    case 4:
      return 2;

    case 8:
      return 3;

    default:
      throw new TypeError("Unknown type size: " + size);
  }
}

function embind_init_charCodes() {
  var codes = new Array(256);

  for (var i = 0; i < 256; ++i) {
    codes[i] = String.fromCharCode(i);
  }

  embind_charCodes = codes;
}

var embind_charCodes = undefined;

function readLatin1String(ptr) {
  var ret = "";
  var c = ptr;

  while (HEAPU8[c]) {
    ret += embind_charCodes[HEAPU8[c++]];
  }

  return ret;
}

var awaitingDependencies = {};
var registeredTypes = {};
var typeDependencies = {};
var char_0 = 48;
var char_9 = 57;

function makeLegalFunctionName(name) {
  if (undefined === name) {
    return "_unknown";
  }

  name = name.replace(/[^a-zA-Z0-9_]/g, "$");
  var f = name.charCodeAt(0);

  if (f >= char_0 && f <= char_9) {
    return "_" + name;
  } else {
    return name;
  }
}

function createNamedFunction(name, body) {
  name = makeLegalFunctionName(name);
  return new Function("body", "return function " + name + "() {\n" + '    "use strict";' + "    return body.apply(this, arguments);\n" + "};\n")(body);
}

function extendError(baseErrorType, errorName) {
  var errorClass = createNamedFunction(errorName, function (message) {
    this.name = errorName;
    this.message = message;
    var stack = new Error(message).stack;

    if (stack !== undefined) {
      this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "");
    }
  });
  errorClass.prototype = Object.create(baseErrorType.prototype);
  errorClass.prototype.constructor = errorClass;

  errorClass.prototype.toString = function () {
    if (this.message === undefined) {
      return this.name;
    } else {
      return this.name + ": " + this.message;
    }
  };

  return errorClass;
}

var BindingError = undefined;

function throwBindingError(message) {
  throw new BindingError(message);
}

var InternalError = undefined;

function throwInternalError(message) {
  throw new InternalError(message);
}

function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
  myTypes.forEach(function (type) {
    typeDependencies[type] = dependentTypes;
  });

  function onComplete(typeConverters) {
    var myTypeConverters = getTypeConverters(typeConverters);

    if (myTypeConverters.length !== myTypes.length) {
      throwInternalError("Mismatched type converter count");
    }

    for (var i = 0; i < myTypes.length; ++i) {
      registerType(myTypes[i], myTypeConverters[i]);
    }
  }

  var typeConverters = new Array(dependentTypes.length);
  var unregisteredTypes = [];
  var registered = 0;
  dependentTypes.forEach(function (dt, i) {
    if (registeredTypes.hasOwnProperty(dt)) {
      typeConverters[i] = registeredTypes[dt];
    } else {
      unregisteredTypes.push(dt);

      if (!awaitingDependencies.hasOwnProperty(dt)) {
        awaitingDependencies[dt] = [];
      }

      awaitingDependencies[dt].push(function () {
        typeConverters[i] = registeredTypes[dt];
        ++registered;

        if (registered === unregisteredTypes.length) {
          onComplete(typeConverters);
        }
      });
    }
  });

  if (0 === unregisteredTypes.length) {
    onComplete(typeConverters);
  }
}

function registerType(rawType, registeredInstance, options) {
  options = options || {};

  if (!("argPackAdvance" in registeredInstance)) {
    throw new TypeError("registerType registeredInstance requires argPackAdvance");
  }

  var name = registeredInstance.name;

  if (!rawType) {
    throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
  }

  if (registeredTypes.hasOwnProperty(rawType)) {
    if (options.ignoreDuplicateRegistrations) {
      return;
    } else {
      throwBindingError("Cannot register type '" + name + "' twice");
    }
  }

  registeredTypes[rawType] = registeredInstance;
  delete typeDependencies[rawType];

  if (awaitingDependencies.hasOwnProperty(rawType)) {
    var callbacks = awaitingDependencies[rawType];
    delete awaitingDependencies[rawType];
    callbacks.forEach(function (cb) {
      cb();
    });
  }
}

function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
  var shift = getShiftFromSize(size);
  name = readLatin1String(name);
  registerType(rawType, {
    name: name,
    "fromWireType": function fromWireType(wt) {
      return !!wt;
    },
    "toWireType": function toWireType(destructors, o) {
      return o ? trueValue : falseValue;
    },
    "argPackAdvance": 8,
    "readValueFromPointer": function readValueFromPointer(pointer) {
      var heap;

      if (size === 1) {
        heap = HEAP8;
      } else if (size === 2) {
        heap = HEAP16;
      } else if (size === 4) {
        heap = HEAP32;
      } else {
        throw new TypeError("Unknown boolean type size: " + name);
      }

      return this["fromWireType"](heap[pointer >> shift]);
    },
    destructorFunction: null
  });
}

var emval_free_list = [];
var emval_handle_array = [{}, {
  value: undefined
}, {
  value: null
}, {
  value: true
}, {
  value: false
}];

function __emval_decref(handle) {
  if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
    emval_handle_array[handle] = undefined;
    emval_free_list.push(handle);
  }
}

function count_emval_handles() {
  var count = 0;

  for (var i = 5; i < emval_handle_array.length; ++i) {
    if (emval_handle_array[i] !== undefined) {
      ++count;
    }
  }

  return count;
}

function get_first_emval() {
  for (var i = 5; i < emval_handle_array.length; ++i) {
    if (emval_handle_array[i] !== undefined) {
      return emval_handle_array[i];
    }
  }

  return null;
}

function init_emval() {
  Module["count_emval_handles"] = count_emval_handles;
  Module["get_first_emval"] = get_first_emval;
}

function __emval_register(value) {
  switch (value) {
    case undefined:
      {
        return 1;
      }

    case null:
      {
        return 2;
      }

    case true:
      {
        return 3;
      }

    case false:
      {
        return 4;
      }

    default:
      {
        var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
        emval_handle_array[handle] = {
          refcount: 1,
          value: value
        };
        return handle;
      }
  }
}

function simpleReadValueFromPointer(pointer) {
  return this["fromWireType"](HEAPU32[pointer >> 2]);
}

function __embind_register_emval(rawType, name) {
  name = readLatin1String(name);
  registerType(rawType, {
    name: name,
    "fromWireType": function fromWireType(handle) {
      var rv = emval_handle_array[handle].value;

      __emval_decref(handle);

      return rv;
    },
    "toWireType": function toWireType(destructors, value) {
      return __emval_register(value);
    },
    "argPackAdvance": 8,
    "readValueFromPointer": simpleReadValueFromPointer,
    destructorFunction: null
  });
}

function _embind_repr(v) {
  if (v === null) {
    return "null";
  }

  var t = (0, _typeof2["default"])(v);

  if (t === "object" || t === "array" || t === "function") {
    return v.toString();
  } else {
    return "" + v;
  }
}

function floatReadValueFromPointer(name, shift) {
  switch (shift) {
    case 2:
      return function (pointer) {
        return this["fromWireType"](HEAPF32[pointer >> 2]);
      };

    case 3:
      return function (pointer) {
        return this["fromWireType"](HEAPF64[pointer >> 3]);
      };

    default:
      throw new TypeError("Unknown float type: " + name);
  }
}

function __embind_register_float(rawType, name, size) {
  var shift = getShiftFromSize(size);
  name = readLatin1String(name);
  registerType(rawType, {
    name: name,
    "fromWireType": function fromWireType(value) {
      return value;
    },
    "toWireType": function toWireType(destructors, value) {
      if (typeof value !== "number" && typeof value !== "boolean") {
        throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
      }

      return value;
    },
    "argPackAdvance": 8,
    "readValueFromPointer": floatReadValueFromPointer(name, shift),
    destructorFunction: null
  });
}

function new_(constructor, argumentList) {
  if (!(constructor instanceof Function)) {
    throw new TypeError("new_ called with constructor type " + (0, _typeof2["default"])(constructor) + " which is not a function");
  }

  var dummy = createNamedFunction(constructor.name || "unknownFunctionName", function () {});
  dummy.prototype = constructor.prototype;
  var obj = new dummy();
  var r = constructor.apply(obj, argumentList);
  return r instanceof Object ? r : obj;
}

function runDestructors(destructors) {
  while (destructors.length) {
    var ptr = destructors.pop();
    var del = destructors.pop();
    del(ptr);
  }
}

function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
  var argCount = argTypes.length;

  if (argCount < 2) {
    throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
  }

  var isClassMethodFunc = argTypes[1] !== null && classType !== null;
  var needsDestructorStack = false;

  for (var i = 1; i < argTypes.length; ++i) {
    if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
      needsDestructorStack = true;
      break;
    }
  }

  var returns = argTypes[0].name !== "void";
  var argsList = "";
  var argsListWired = "";

  for (var i = 0; i < argCount - 2; ++i) {
    argsList += (i !== 0 ? ", " : "") + "arg" + i;
    argsListWired += (i !== 0 ? ", " : "") + "arg" + i + "Wired";
  }

  var invokerFnBody = "return function " + makeLegalFunctionName(humanName) + "(" + argsList + ") {\n" + "if (arguments.length !== " + (argCount - 2) + ") {\n" + "throwBindingError('function " + humanName + " called with ' + arguments.length + ' arguments, expected " + (argCount - 2) + " args!');\n" + "}\n";

  if (needsDestructorStack) {
    invokerFnBody += "var destructors = [];\n";
  }

  var dtorStack = needsDestructorStack ? "destructors" : "null";
  var args1 = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
  var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];

  if (isClassMethodFunc) {
    invokerFnBody += "var thisWired = classParam.toWireType(" + dtorStack + ", this);\n";
  }

  for (var i = 0; i < argCount - 2; ++i) {
    invokerFnBody += "var arg" + i + "Wired = argType" + i + ".toWireType(" + dtorStack + ", arg" + i + "); // " + argTypes[i + 2].name + "\n";
    args1.push("argType" + i);
    args2.push(argTypes[i + 2]);
  }

  if (isClassMethodFunc) {
    argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
  }

  invokerFnBody += (returns ? "var rv = " : "") + "invoker(fn" + (argsListWired.length > 0 ? ", " : "") + argsListWired + ");\n";

  if (needsDestructorStack) {
    invokerFnBody += "runDestructors(destructors);\n";
  } else {
    for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
      var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";

      if (argTypes[i].destructorFunction !== null) {
        invokerFnBody += paramName + "_dtor(" + paramName + "); // " + argTypes[i].name + "\n";
        args1.push(paramName + "_dtor");
        args2.push(argTypes[i].destructorFunction);
      }
    }
  }

  if (returns) {
    invokerFnBody += "var ret = retType.fromWireType(rv);\n" + "return ret;\n";
  } else {}

  invokerFnBody += "}\n";
  args1.push(invokerFnBody);
  var invokerFunction = new_(Function, args1).apply(null, args2);
  return invokerFunction;
}

function ensureOverloadTable(proto, methodName, humanName) {
  if (undefined === proto[methodName].overloadTable) {
    var prevFunc = proto[methodName];

    proto[methodName] = function () {
      if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
        throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!");
      }

      return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
    };

    proto[methodName].overloadTable = [];
    proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
  }
}

function exposePublicSymbol(name, value, numArguments) {
  if (Module.hasOwnProperty(name)) {
    if (undefined === numArguments || undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments]) {
      throwBindingError("Cannot register public name '" + name + "' twice");
    }

    ensureOverloadTable(Module, name, name);

    if (Module.hasOwnProperty(numArguments)) {
      throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!");
    }

    Module[name].overloadTable[numArguments] = value;
  } else {
    Module[name] = value;

    if (undefined !== numArguments) {
      Module[name].numArguments = numArguments;
    }
  }
}

function heap32VectorToArray(count, firstElement) {
  var array = [];

  for (var i = 0; i < count; i++) {
    array.push(HEAP32[(firstElement >> 2) + i]);
  }

  return array;
}

function replacePublicSymbol(name, value, numArguments) {
  if (!Module.hasOwnProperty(name)) {
    throwInternalError("Replacing nonexistant public symbol");
  }

  if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
    Module[name].overloadTable[numArguments] = value;
  } else {
    Module[name] = value;
    Module[name].argCount = numArguments;
  }
}

function dynCallLegacy(sig, ptr, args) {
  var f = Module["dynCall_" + sig];
  return args && args.length ? f.apply(null, [ptr].concat(args)) : f.call(null, ptr);
}

function dynCall(sig, ptr, args) {
  if (sig.indexOf("j") != -1) {
    return dynCallLegacy(sig, ptr, args);
  }

  return wasmTable.get(ptr).apply(null, args);
}

function getDynCaller(sig, ptr) {
  var argCache = [];
  return function () {
    argCache.length = arguments.length;

    for (var i = 0; i < arguments.length; i++) {
      argCache[i] = arguments[i];
    }

    return dynCall(sig, ptr, argCache);
  };
}

function embind__requireFunction(signature, rawFunction) {
  signature = readLatin1String(signature);

  function makeDynCaller() {
    if (signature.indexOf("j") != -1) {
      return getDynCaller(signature, rawFunction);
    }

    return wasmTable.get(rawFunction);
  }

  var fp = makeDynCaller();

  if (typeof fp !== "function") {
    throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction);
  }

  return fp;
}

var UnboundTypeError = undefined;

function getTypeName(type) {
  var ptr = ___getTypeName(type);

  var rv = readLatin1String(ptr);

  _free(ptr);

  return rv;
}

function throwUnboundTypeError(message, types) {
  var unboundTypes = [];
  var seen = {};

  function visit(type) {
    if (seen[type]) {
      return;
    }

    if (registeredTypes[type]) {
      return;
    }

    if (typeDependencies[type]) {
      typeDependencies[type].forEach(visit);
      return;
    }

    unboundTypes.push(type);
    seen[type] = true;
  }

  types.forEach(visit);
  throw new UnboundTypeError(message + ": " + unboundTypes.map(getTypeName).join([", "]));
}

function __embind_register_function(name, argCount, rawArgTypesAddr, signature, rawInvoker, fn) {
  var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
  name = readLatin1String(name);
  rawInvoker = embind__requireFunction(signature, rawInvoker);
  exposePublicSymbol(name, function () {
    throwUnboundTypeError("Cannot call " + name + " due to unbound types", argTypes);
  }, argCount - 1);
  whenDependentTypesAreResolved([], argTypes, function (argTypes) {
    var invokerArgsArray = [argTypes[0], null].concat(argTypes.slice(1));
    replacePublicSymbol(name, craftInvokerFunction(name, invokerArgsArray, null, rawInvoker, fn), argCount - 1);
    return [];
  });
}

function integerReadValueFromPointer(name, shift, signed) {
  switch (shift) {
    case 0:
      return signed ? function readS8FromPointer(pointer) {
        return HEAP8[pointer];
      } : function readU8FromPointer(pointer) {
        return HEAPU8[pointer];
      };

    case 1:
      return signed ? function readS16FromPointer(pointer) {
        return HEAP16[pointer >> 1];
      } : function readU16FromPointer(pointer) {
        return HEAPU16[pointer >> 1];
      };

    case 2:
      return signed ? function readS32FromPointer(pointer) {
        return HEAP32[pointer >> 2];
      } : function readU32FromPointer(pointer) {
        return HEAPU32[pointer >> 2];
      };

    default:
      throw new TypeError("Unknown integer type: " + name);
  }
}

function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
  name = readLatin1String(name);

  if (maxRange === -1) {
    maxRange = 4294967295;
  }

  var shift = getShiftFromSize(size);

  var fromWireType = function fromWireType(value) {
    return value;
  };

  if (minRange === 0) {
    var bitshift = 32 - 8 * size;

    fromWireType = function fromWireType(value) {
      return value << bitshift >>> bitshift;
    };
  }

  var isUnsignedType = name.indexOf("unsigned") != -1;
  registerType(primitiveType, {
    name: name,
    "fromWireType": fromWireType,
    "toWireType": function toWireType(destructors, value) {
      if (typeof value !== "number" && typeof value !== "boolean") {
        throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
      }

      if (value < minRange || value > maxRange) {
        throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ", " + maxRange + "]!");
      }

      return isUnsignedType ? value >>> 0 : value | 0;
    },
    "argPackAdvance": 8,
    "readValueFromPointer": integerReadValueFromPointer(name, shift, minRange !== 0),
    destructorFunction: null
  });
}

function __embind_register_memory_view(rawType, dataTypeIndex, name) {
  var typeMapping = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
  var TA = typeMapping[dataTypeIndex];

  function decodeMemoryView(handle) {
    handle = handle >> 2;
    var heap = HEAPU32;
    var size = heap[handle];
    var data = heap[handle + 1];
    return new TA(buffer, data, size);
  }

  name = readLatin1String(name);
  registerType(rawType, {
    name: name,
    "fromWireType": decodeMemoryView,
    "argPackAdvance": 8,
    "readValueFromPointer": decodeMemoryView
  }, {
    ignoreDuplicateRegistrations: true
  });
}

function __embind_register_std_string(rawType, name) {
  name = readLatin1String(name);
  var stdStringIsUTF8 = name === "std::string";
  registerType(rawType, {
    name: name,
    "fromWireType": function fromWireType(value) {
      var length = HEAPU32[value >> 2];
      var str;

      if (stdStringIsUTF8) {
        var decodeStartPtr = value + 4;

        for (var i = 0; i <= length; ++i) {
          var currentBytePtr = value + 4 + i;

          if (i == length || HEAPU8[currentBytePtr] == 0) {
            var maxRead = currentBytePtr - decodeStartPtr;
            var stringSegment = UTF8ToString(decodeStartPtr, maxRead);

            if (str === undefined) {
              str = stringSegment;
            } else {
              str += String.fromCharCode(0);
              str += stringSegment;
            }

            decodeStartPtr = currentBytePtr + 1;
          }
        }
      } else {
        var a = new Array(length);

        for (var i = 0; i < length; ++i) {
          a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
        }

        str = a.join("");
      }

      _free(value);

      return str;
    },
    "toWireType": function toWireType(destructors, value) {
      if (value instanceof ArrayBuffer) {
        value = new Uint8Array(value);
      }

      var getLength;
      var valueIsOfTypeString = typeof value === "string";

      if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
        throwBindingError("Cannot pass non-string to std::string");
      }

      if (stdStringIsUTF8 && valueIsOfTypeString) {
        getLength = function getLength() {
          return lengthBytesUTF8(value);
        };
      } else {
        getLength = function getLength() {
          return value.length;
        };
      }

      var length = getLength();

      var ptr = _malloc(4 + length + 1);

      HEAPU32[ptr >> 2] = length;

      if (stdStringIsUTF8 && valueIsOfTypeString) {
        stringToUTF8(value, ptr + 4, length + 1);
      } else {
        if (valueIsOfTypeString) {
          for (var i = 0; i < length; ++i) {
            var charCode = value.charCodeAt(i);

            if (charCode > 255) {
              _free(ptr);

              throwBindingError("String has UTF-16 code units that do not fit in 8 bits");
            }

            HEAPU8[ptr + 4 + i] = charCode;
          }
        } else {
          for (var i = 0; i < length; ++i) {
            HEAPU8[ptr + 4 + i] = value[i];
          }
        }
      }

      if (destructors !== null) {
        destructors.push(_free, ptr);
      }

      return ptr;
    },
    "argPackAdvance": 8,
    "readValueFromPointer": simpleReadValueFromPointer,
    destructorFunction: function destructorFunction(ptr) {
      _free(ptr);
    }
  });
}

function __embind_register_std_wstring(rawType, charSize, name) {
  name = readLatin1String(name);
  var decodeString, encodeString, getHeap, lengthBytesUTF, shift;

  if (charSize === 2) {
    decodeString = UTF16ToString;
    encodeString = stringToUTF16;
    lengthBytesUTF = lengthBytesUTF16;

    getHeap = function getHeap() {
      return HEAPU16;
    };

    shift = 1;
  } else if (charSize === 4) {
    decodeString = UTF32ToString;
    encodeString = stringToUTF32;
    lengthBytesUTF = lengthBytesUTF32;

    getHeap = function getHeap() {
      return HEAPU32;
    };

    shift = 2;
  }

  registerType(rawType, {
    name: name,
    "fromWireType": function fromWireType(value) {
      var length = HEAPU32[value >> 2];
      var HEAP = getHeap();
      var str;
      var decodeStartPtr = value + 4;

      for (var i = 0; i <= length; ++i) {
        var currentBytePtr = value + 4 + i * charSize;

        if (i == length || HEAP[currentBytePtr >> shift] == 0) {
          var maxReadBytes = currentBytePtr - decodeStartPtr;
          var stringSegment = decodeString(decodeStartPtr, maxReadBytes);

          if (str === undefined) {
            str = stringSegment;
          } else {
            str += String.fromCharCode(0);
            str += stringSegment;
          }

          decodeStartPtr = currentBytePtr + charSize;
        }
      }

      _free(value);

      return str;
    },
    "toWireType": function toWireType(destructors, value) {
      if (!(typeof value === "string")) {
        throwBindingError("Cannot pass non-string to C++ string type " + name);
      }

      var length = lengthBytesUTF(value);

      var ptr = _malloc(4 + length + charSize);

      HEAPU32[ptr >> 2] = length >> shift;
      encodeString(value, ptr + 4, length + charSize);

      if (destructors !== null) {
        destructors.push(_free, ptr);
      }

      return ptr;
    },
    "argPackAdvance": 8,
    "readValueFromPointer": simpleReadValueFromPointer,
    destructorFunction: function destructorFunction(ptr) {
      _free(ptr);
    }
  });
}

function __embind_register_void(rawType, name) {
  name = readLatin1String(name);
  registerType(rawType, {
    isVoid: true,
    name: name,
    "argPackAdvance": 0,
    "fromWireType": function fromWireType() {
      return undefined;
    },
    "toWireType": function toWireType(destructors, o) {
      return undefined;
    }
  });
}

function _abort() {
  abort();
}

function emscripten_realloc_buffer(size) {
  try {
    wasmMemory.grow(size - buffer.byteLength + 65535 >>> 16);
    updateGlobalBufferAndViews(wasmMemory.buffer);
    return 1;
  } catch (e) {}
}

function _emscripten_resize_heap(requestedSize) {
  var oldSize = HEAPU8.length;
  requestedSize = requestedSize >>> 0;
  var maxHeapSize = 2147483648;

  if (requestedSize > maxHeapSize) {
    return false;
  }

  for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
    var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
    overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
    var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
    var replacement = emscripten_realloc_buffer(newSize);

    if (replacement) {
      return true;
    }
  }

  return false;
}

function _exit(status) {
  exit(status);
}

var SYSCALLS = {
  mappings: {},
  buffers: [null, [], []],
  printChar: function printChar(stream, curr) {
    var buffer = SYSCALLS.buffers[stream];

    if (curr === 0 || curr === 10) {
      (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
      buffer.length = 0;
    } else {
      buffer.push(curr);
    }
  },
  varargs: undefined,
  get: function get() {
    SYSCALLS.varargs += 4;
    var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
    return ret;
  },
  getStr: function getStr(ptr) {
    var ret = UTF8ToString(ptr);
    return ret;
  },
  get64: function get64(low, high) {
    return low;
  }
};

function _fd_write(fd, iov, iovcnt, pnum) {
  var num = 0;

  for (var i = 0; i < iovcnt; i++) {
    var ptr = HEAP32[iov + i * 8 >> 2];
    var len = HEAP32[iov + (i * 8 + 4) >> 2];

    for (var j = 0; j < len; j++) {
      SYSCALLS.printChar(fd, HEAPU8[ptr + j]);
    }

    num += len;
  }

  HEAP32[pnum >> 2] = num;
  return 0;
}

function _setTempRet0($i) {
  setTempRet0($i | 0);
}

embind_init_charCodes();
BindingError = Module["BindingError"] = extendError(Error, "BindingError");
InternalError = Module["InternalError"] = extendError(Error, "InternalError");
init_emval();
UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");
var asmLibraryArg = {
  "i": __embind_register_bool,
  "h": __embind_register_emval,
  "e": __embind_register_float,
  "b": __embind_register_function,
  "c": __embind_register_integer,
  "a": __embind_register_memory_view,
  "f": __embind_register_std_string,
  "d": __embind_register_std_wstring,
  "j": __embind_register_void,
  "m": _abort,
  "l": _emscripten_resize_heap,
  "n": _exit,
  "g": _fd_write,
  "k": _setTempRet0
};
var asm = createWasm();

var ___wasm_call_ctors = Module["___wasm_call_ctors"] = function () {
  return (___wasm_call_ctors = Module["___wasm_call_ctors"] = Module["asm"]["p"]).apply(null, arguments);
};

var _malloc = Module["_malloc"] = function () {
  return (_malloc = Module["_malloc"] = Module["asm"]["q"]).apply(null, arguments);
};

var _free = Module["_free"] = function () {
  return (_free = Module["_free"] = Module["asm"]["r"]).apply(null, arguments);
};

var ___getTypeName = Module["___getTypeName"] = function () {
  return (___getTypeName = Module["___getTypeName"] = Module["asm"]["t"]).apply(null, arguments);
};

var ___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = function () {
  return (___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = Module["asm"]["u"]).apply(null, arguments);
};

var dynCall_iiji = Module["dynCall_iiji"] = function () {
  return (dynCall_iiji = Module["dynCall_iiji"] = Module["asm"]["v"]).apply(null, arguments);
};

var dynCall_jiji = Module["dynCall_jiji"] = function () {
  return (dynCall_jiji = Module["dynCall_jiji"] = Module["asm"]["w"]).apply(null, arguments);
};

Module["getValue"] = getValue;
var calledRun;

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
}

dependenciesFulfilled = function runCaller() {
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller;
};

function run(args) {
  args = args || arguments_;

  if (runDependencies > 0) {
    return;
  }

  preRun();

  if (runDependencies > 0) {
    return;
  }

  function doRun() {
    if (calledRun) return;
    calledRun = true;
    Module["calledRun"] = true;
    if (ABORT) return;
    initRuntime();
    preMain();
    if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
    postRun();
  }

  if (Module["setStatus"]) {
    Module["setStatus"]("Running...");
    setTimeout(function () {
      setTimeout(function () {
        Module["setStatus"]("");
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
}

Module["run"] = run;

function exit(status, implicit) {
  EXITSTATUS = status;

  if (implicit && keepRuntimeAlive() && status === 0) {
    return;
  }

  if (keepRuntimeAlive()) {} else {
    exitRuntime();
    if (Module["onExit"]) Module["onExit"](status);
    ABORT = true;
  }

  quit_(status, new ExitStatus(status));
}

if (Module["preInit"]) {
  if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];

  while (Module["preInit"].length > 0) {
    Module["preInit"].pop()();
  }
}

run();
Module["ENVIRONMENT"] = ENVIRONMENT_IS_WEB ? "WEB" : ENVIRONMENT_IS_WORKER ? "WORKER" : ENVIRONMENT_IS_NODE ? "NODE" : "SHELL";
Module["getNativeTypeSize"] = getNativeTypeSize;
Module["waitForReady"] = new Promise(function (resolve, _) {
  Module["onRuntimeInitialized"] = resolve;
});
if (!ENVIRONMENT_IS_NODE && typeof module !== "undefined") module["exports"] = Module;

}).call(this)}).call(this,require('_process'),"/src")
},{"@babel/runtime/helpers/interopRequireDefault":4,"@babel/runtime/helpers/typeof":5,"_process":14,"fs":12,"path":13}],9:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _emDecoder = require("./emDecoder");

// emscripten import method
var Memory = /*#__PURE__*/function () {
  function Memory(val) {
    (0, _classCallCheck2["default"])(this, Memory);
    var ptr, type, size;

    if (typeof val === "string") {
      size = (0, _emDecoder.getNativeTypeSize)(val);
      ptr = (0, _emDecoder._malloc)(size);
      type = val;
    } else {
      size = val;
      ptr = (0, _emDecoder._malloc)(size);
      type = "*";
    }

    this.ptr = ptr;
    this.type = type;
  }

  (0, _createClass2["default"])(Memory, [{
    key: "release",
    value: function release() {
      (0, _emDecoder._free)(this.ptr);
    }
  }, {
    key: "getValue",
    value: function getValue() {
      var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.type;
      var ptr = this.ptr;
      return (0, _emDecoder.getValue)(ptr, type);
    }
  }]);
  return Memory;
}();

exports["default"] = Memory;

},{"./emDecoder":8,"@babel/runtime/helpers/classCallCheck":2,"@babel/runtime/helpers/createClass":3,"@babel/runtime/helpers/interopRequireDefault":4}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = textDecoder;

function textDecoder(arraybuffer) {
  var charset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "shift_jis";
  return new Promise(function (resolve) {
    // Encoding API
    var decoder = new TextDecoder(charset);
    resolve(decoder.decode(arraybuffer));
  })["catch"](function () {
    // FileReader API
    return new Promise(function (resolve) {
      var blob = new Blob([arraybuffer], {
        type: "text/plain;charset=".concat(charset)
      });
      var reader = new FileReader();

      reader.onload = function () {
        resolve(this.result);
      };

      reader.readAsText(blob, charset);
    });
  });
}

},{}],11:[function(require,module,exports){
(function (global){(function (){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _memory = _interopRequireDefault(require("./memory"));

var _textDecoder = _interopRequireDefault(require("./textDecoder"));

var _emDecoder = require("./emDecoder");

// emscripten import
// constant
var TEMP_BUFFER_SIZE = 4096;
var eventKinds = [// from pxtone_source/pxtnEvelist.h
"NULL", "ON", "KEY", "PAN_VOLUME", "VELOCITY", "VOLUME", "PORTAMENT", "BEATCLOCK", "BEATTEMPO", "BEATNUM", "REPEAT", "LAST", "VOICENO", "GROUPNO", "TUNING", "PAN_TIME", "NUM"]; // main function
// type: noise | pxtone | stream
// inputBuffer: the input project/noise/tune file
// ch: # channels
// sps: samples per second?
// bps: bits per sample I think

function decode(_x, _x2, _x3, _x4, _x5) {
  return _decode.apply(this, arguments);
} // export


function _decode() {
  _decode = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(type, inputBuffer, ch, sps, bps) {
    var inputSize, inputBufferMem, get_heap, outputBuffer, outputStream, data, master, units, evels, outputMem, outputSizeMem, release, outputStart, outputEnd, pxVomitMem, docMem, releaseVomit, title, comment, titleMem, titleSizeMem, commentMem, commentSizeMem, _release, titleStart, commentStart, titleBuffer, commentBuffer, outputSize, _outputSizeMem, loopStartMem, loopEndMem, _release2, loopStart, loopEnd, beatNumMem, beatTempoMem, beatClockMem, measNumMem, repeatMeasMem, lastMeasMem, _release3, unitNumMem, namesMem, sizesMem, _release4, unitNum, sizesStart, sizesBuffer, namesStart, pointerArray, namesBuffer, i, size, nameBuffer, evelNumMem, kindsMem, unitsMem, valuesMem, clocksMem, _release5, evelNum, kindsStart, kindsBuffer, unitsStart, unitsBuffer, valuesStart, valuesBuffer, clocksStart, clocksBuffer, _i, outputArray, tempBufferMem, tempArray, _release6, pc, _size, deadline;

    return _regenerator["default"].wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            get_heap = function _get_heap(start, size, conv) {
              // we have to re-retrieve the buffer from HEAPU8 every time in case it
              // gets detached from a memory resize
              var buf = _emDecoder.HEAPU8.buffer.slice(start, start + size);

              if (typeof conv !== 'undefined') buf = new conv(buf);
              return buf;
            };

            _context5.next = 3;
            return _emDecoder.waitForReady;

          case 3:
            // input buffer 
            inputSize = inputBuffer.byteLength;
            inputBufferMem = new _memory["default"](inputSize); // write to Emscripten heap for binding calls

            new Uint8Array(_emDecoder.HEAPU8.buffer).set(new Uint8Array(inputBuffer), inputBufferMem.ptr); // get a buffer of data from the Emscripten heap

            // output
            outputBuffer = null, outputStream = null, data = null, master = null, units = null, evels = null;
            _context5.t0 = type;
            _context5.next = _context5.t0 === "noise" ? 10 : _context5.t0 === "pxtone" ? 22 : _context5.t0 === "stream" ? 22 : 149;
            break;

          case 10:
            outputMem = new _memory["default"]("*"), outputSizeMem = new _memory["default"]("i32");

            release = function release() {
              outputMem.release();
              outputSizeMem.release();
            };

            _context5.next = 14;
            return waitUntilIdle();

          case 14:
            if ((0, _emDecoder.decodeNoise)(inputBufferMem.ptr, inputSize, ch, sps, bps, outputMem.ptr, outputSizeMem.ptr)) {
              _context5.next = 17;
              break;
            }

            release();
            throw new Error("Decode Pxtone Noise Error.");

          case 17:
            outputStart = outputMem.getValue(), outputEnd = outputStart + outputSizeMem.getValue();
            outputBuffer = get_heap(outputStart, outputSizeMem.getValue());
            (0, _emDecoder._free)(outputStart);
            release();
            return _context5.abrupt("break", 150);

          case 22:
            // pxVomitMem points to the pxVomit instance. doc for pxwrDoc (some pointer to a ptcop file?)
            // this is allocation
            pxVomitMem = new _memory["default"]("*"), docMem = new _memory["default"]("*"); // create

            if ((0, _emDecoder.createPxtone)(inputBufferMem.ptr, inputSize, ch, sps, bps, pxVomitMem.ptr, docMem.ptr)) {
              _context5.next = 27;
              break;
            }

            pxVomitMem.release();
            docMem.release();
            throw new Error("Create Pxtone Vomit Error.");

          case 27:
            releaseVomit = function releaseVomit() {
              (0, _emDecoder.releasePxtone)(pxVomitMem.ptr, docMem.ptr);
              pxVomitMem.release();
              docMem.release();
            }; // text


            title = "", comment = "";
            titleMem = new _memory["default"]("*"), titleSizeMem = new _memory["default"]("i32");
            commentMem = new _memory["default"]("*"), commentSizeMem = new _memory["default"]("i32");

            _release = function _release() {
              titleMem.release();
              titleSizeMem.release();
              commentMem.release();
              commentSizeMem.release();
            };

            if ((0, _emDecoder.getPxtoneText)(pxVomitMem.ptr, titleMem.ptr, titleSizeMem.ptr, commentMem.ptr, commentSizeMem.ptr)) {
              _context5.next = 36;
              break;
            }

            _release();

            releaseVomit();
            throw new Error("Get Pxtone Vomit Text Error.");

          case 36:
            titleStart = titleMem.getValue(), commentStart = commentMem.getValue();

            if (!titleStart) {
              _context5.next = 42;
              break;
            }

            titleBuffer = get_heap(titleStart, titleSizeMem.getValue());
            _context5.next = 41;
            return (0, _textDecoder["default"])(titleBuffer);

          case 41:
            title = _context5.sent;

          case 42:
            if (!commentStart) {
              _context5.next = 47;
              break;
            }

            commentBuffer = get_heap(commentStart, commentSizeMem.getValue());
            _context5.next = 46;
            return (0, _textDecoder["default"])(commentBuffer);

          case 46:
            comment = _context5.sent;

          case 47:
            _release();

            _outputSizeMem = new _memory["default"]("i32");
            loopStartMem = new _memory["default"]("double"), loopEndMem = new _memory["default"]("double");

            _release2 = function _release2() {
              _outputSizeMem.release();

              loopStartMem.release();
              loopEndMem.release();
            };

            if ((0, _emDecoder.getPxtoneInfo)(pxVomitMem.ptr, ch, sps, bps, _outputSizeMem.ptr, loopStartMem.ptr, loopEndMem.ptr)) {
              _context5.next = 55;
              break;
            }

            _release2();

            releaseVomit();
            throw new Error("Get Pxtone Vomit Info Error.");

          case 55:
            outputSize = _outputSizeMem.getValue();
            loopStart = loopStartMem.getValue(), loopEnd = loopEndMem.getValue();
            data = {
              "loopStart": loopStart,
              "loopEnd": loopEnd,
              "title": title,
              "comment": comment,
              "byteLength": outputSize
            };

            _release2();

            beatNumMem = new _memory["default"]("i32");
            beatTempoMem = new _memory["default"]("float");
            beatClockMem = new _memory["default"]("i32");
            measNumMem = new _memory["default"]("i32");
            repeatMeasMem = new _memory["default"]("i32");
            lastMeasMem = new _memory["default"]("i32");

            _release3 = function _release3() {
              beatNumMem.release();
              beatTempoMem.release();
              beatClockMem.release();
              measNumMem.release();
              repeatMeasMem.release();
              lastMeasMem.release();
            };

            if ((0, _emDecoder.getPxtoneMaster)(pxVomitMem.ptr, beatNumMem.ptr, beatTempoMem.ptr, beatClockMem.ptr, measNumMem.ptr, repeatMeasMem.ptr, lastMeasMem.ptr)) {
              _context5.next = 70;
              break;
            }

            _release3();

            releaseVomit();
            throw new Error("Get Pxtone Vomit Master Error.");

          case 70:
            master = {
              beatNum: beatNumMem.getValue(),
              beatTempo: beatTempoMem.getValue(),
              beatClock: beatClockMem.getValue(),
              measNum: measNumMem.getValue(),
              repeatMeas: repeatMeasMem.getValue(),
              lastMeas: lastMeasMem.getValue()
            };

            _release3();

            unitNumMem = new _memory["default"]("i32");
            namesMem = new _memory["default"]("*"), sizesMem = new _memory["default"]("*");

            _release4 = function _release4() {
              unitNumMem.release();
              namesMem.release();
              sizesMem.release();
            };

            if ((0, _emDecoder.getPxtoneUnits)(pxVomitMem.ptr, unitNumMem.ptr, namesMem.ptr, sizesMem.ptr)) {
              _context5.next = 79;
              break;
            }

            _release4();

            releaseVomit();
            throw new Error("Get Pxtone Vomit Units Error.");

          case 79:
            unitNum = unitNumMem.getValue();
            sizesStart = sizesMem.getValue();
            sizesBuffer = get_heap(sizesStart, unitNum * (0, _emDecoder.getNativeTypeSize)("i32"), Int32Array);
            namesStart = namesMem.getValue();

            pointerArray = function () {
              switch ((0, _emDecoder.getNativeTypeSize)("*")) {
                case 1:
                  return Int8Array;

                case 2:
                  return Int16Array;

                case 4:
                  return Int32Array;

                default:
                  throw "pointer buffer cannot be converted to typed array";
              }
            }();

            namesBuffer = get_heap(namesStart, unitNum * (0, _emDecoder.getNativeTypeSize)("*"), pointerArray);
            units = new Array(unitNum);
            i = 0;

          case 87:
            if (!(i < unitNum)) {
              _context5.next = 96;
              break;
            }

            size = sizesBuffer[i];
            nameBuffer = get_heap(namesBuffer[i], size);
            _context5.next = 92;
            return (0, _textDecoder["default"])(nameBuffer);

          case 92:
            units[i] = _context5.sent;

          case 93:
            ++i;
            _context5.next = 87;
            break;

          case 96:
            (0, _emDecoder._free)(sizesStart);
            (0, _emDecoder._free)(namesStart);

            _release4();

            evelNumMem = new _memory["default"]("i32");
            kindsMem = new _memory["default"]("*"), unitsMem = new _memory["default"]("*");
            valuesMem = new _memory["default"]("*"), clocksMem = new _memory["default"]("*");

            _release5 = function _release5() {
              evelNumMem.release();
              kindsMem.release();
              unitsMem.release();
              valuesMem.release();
              clocksMem.release();
            };

            if ((0, _emDecoder.getPxtoneEvels)(pxVomitMem.ptr, evelNumMem.ptr, kindsMem.ptr, unitsMem.ptr, valuesMem.ptr, clocksMem.ptr)) {
              _context5.next = 107;
              break;
            }

            _release5();

            releaseVomit();
            throw new Error("Get Pxtone Vomit Evels Error.");

          case 107:
            evelNum = evelNumMem.getValue();
            kindsStart = kindsMem.getValue();
            kindsBuffer = get_heap(kindsStart, evelNum * (0, _emDecoder.getNativeTypeSize)("i8"), Uint8Array);
            unitsStart = unitsMem.getValue();
            unitsBuffer = get_heap(unitsStart, evelNum * (0, _emDecoder.getNativeTypeSize)("i8"), Uint8Array);
            valuesStart = valuesMem.getValue();
            valuesBuffer = get_heap(valuesStart, evelNum * (0, _emDecoder.getNativeTypeSize)("i32"), Int32Array);
            clocksStart = clocksMem.getValue();
            clocksBuffer = get_heap(clocksStart, evelNum * (0, _emDecoder.getNativeTypeSize)("i32"), Int32Array);
            evels = new Array(evelNum);

            for (_i = 0; _i < evelNum; ++_i) {
              evels[_i] = {
                kind: eventKinds[kindsBuffer[_i]],
                unit_no: unitsBuffer[_i],
                value: valuesBuffer[_i],
                clock: clocksBuffer[_i]
              };
            }

            (0, _emDecoder._free)(kindsStart);
            (0, _emDecoder._free)(unitsStart);
            (0, _emDecoder._free)(valuesStart);
            (0, _emDecoder._free)(clocksStart);

            _release5();

            if ((0, _emDecoder.prepareVomitPxtone)(pxVomitMem.ptr, 0)) {
              _context5.next = 126;
              break;
            }

            releaseVomit();
            throw new Error("Get Pxtone Prepare Vomit Error.");

          case 126:
            if (!(type === "pxtone")) {
              _context5.next = 147;
              break;
            }

            // outputSize is essentially sample_num
            outputBuffer = new ArrayBuffer(outputSize);
            outputArray = new Uint8Array(outputBuffer);
            tempBufferMem = new _memory["default"](TEMP_BUFFER_SIZE);
            tempArray = _emDecoder.HEAPU8.subarray(tempBufferMem.ptr, tempBufferMem.ptr + TEMP_BUFFER_SIZE);

            _release6 = function _release6() {
              tempBufferMem.release();
            }; // let deadline = await waitUntilIdle();


            pc = 0;

          case 133:
            if (!(pc < outputSize)) {
              _context5.next = 143;
              break;
            }

            _size = Math.min(TEMP_BUFFER_SIZE, outputSize - pc);

            if ((0, _emDecoder.vomitPxtone)(pxVomitMem.ptr, tempBufferMem.ptr, _size)) {
              _context5.next = 139;
              break;
            }

            _release6();

            releaseVomit();
            throw new Error("Pxtone Vomit Error.");

          case 139:
            // memcpy
            outputArray.set(_size === TEMP_BUFFER_SIZE ? tempArray : _emDecoder.HEAPU8.subarray(tempBufferMem.ptr, tempBufferMem.ptr + _size), pc); // if(!deadline || deadline && deadline.timeRemaining() === 0) deadline = await waitUntilIdle();

          case 140:
            pc += TEMP_BUFFER_SIZE;
            _context5.next = 133;
            break;

          case 143:
            // release
            _release6();

            releaseVomit();
            _context5.next = 148;
            break;

          case 147:
            if (type === "stream") {
              outputStream = {
                next: function () {
                  var _next = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(size) {
                    var tempBufferMem, release, buf;
                    return _regenerator["default"].wrap(function _callee4$(_context4) {
                      while (1) {
                        switch (_context4.prev = _context4.next) {
                          case 0:
                            tempBufferMem = new _memory["default"](size);

                            release = function release() {
                              tempBufferMem.release();
                            }; // if (!deadline || deadline && deadline.timeRemaining() === 0)
                            // deadline = await waitUntilIdle();


                            if ((0, _emDecoder.vomitPxtone)(pxVomitMem.ptr, tempBufferMem.ptr, size)) {
                              _context4.next = 6;
                              break;
                            }

                            release();
                            releaseVomit();
                            throw new Error("Pxtone Vomit Error.");

                          case 6:
                            buf = get_heap(tempBufferMem.ptr, size);
                            release();
                            return _context4.abrupt("return", buf);

                          case 9:
                          case "end":
                            return _context4.stop();
                        }
                      }
                    }, _callee4);
                  }));

                  function next(_x9) {
                    return _next.apply(this, arguments);
                  }

                  return next;
                }(),
                reset: function reset(position) {
                  if (!(0, _emDecoder.prepareVomitPxtone)(pxVomitMem.ptr, position)) {
                    releaseVomit();
                    throw new Error("Get Pxtone Prepare Vomit Error.");
                  }
                },
                release: function release() {
                  releaseVomit();
                },
                setMute: function setMute(unitNum, isMute) {
                  if (!(0, _emDecoder.setPxtoneUnitMute)(pxVomitMem.ptr, unitNum, isMute)) {
                    releaseVomit();
                    throw new Error("Set Pxtone Unit Mute Error.");
                  }
                },
                getMute: function getMute(unitNum) {
                  var isMuteMem = new _memory["default"]("i8");

                  if (!(0, _emDecoder.getPxtoneUnitMute)(pxVomitMem.ptr, unitNum, isMuteMem.ptr)) {
                    isMuteMem.release();
                    releaseVomit();
                    throw new Error("Get Pxtone Unit Mute Error.");
                  }

                  var isMute = isMuteMem.getValue();
                  isMuteMem.release();
                  return isMute != 0;
                }
              };
            }

          case 148:
            return _context5.abrupt("break", 150);

          case 149:
            throw new TypeError("decode type is invalid (".concat(type, ")"));

          case 150:
            return _context5.abrupt("return", {
              "buffer": outputBuffer,
              "stream": outputStream,
              "data": data,
              "master": master,
              "units": units,
              "evels": evels
            });

          case 151:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));
  return _decode.apply(this, arguments);
}

if (_emDecoder.ENVIRONMENT === "NODE") {
  module["exports"] = decode;
} else if (_emDecoder.ENVIRONMENT === "WEB") {
  global["pxtnDecoder"] = decode;
} else if (_emDecoder.ENVIRONMENT === "WORKER") {
  var handleExceptions = function handleExceptions(handle) {
    return /*#__PURE__*/function () {
      var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(e) {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                _context.next = 3;
                return handle(e["data"]);

              case 3:
                _context.next = 11;
                break;

              case 5:
                _context.prev = 5;
                _context.t0 = _context["catch"](0);
                console.log("Error while handling message");
                console.log("Data: ", e["data"]);
                console.log("Error: ", _context.t0);
                throw _context.t0;

              case 11:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, null, [[0, 5]]);
      }));

      return function (_x6) {
        return _ref.apply(this, arguments);
      };
    }();
  }; // e is a MessageEvent. import info is in data


  var handleMessage = /*#__PURE__*/function () {
    var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(data) {
      var type, types, stream_commands, sessionId, msg, buffer, stream, handleStream;
      return _regenerator["default"].wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              type = data["type"];
              types = ["noise", "pxtone", "stream"];
              stream_commands = ["stream_next", "stream_reset", "stream_release", "stream_set_mute", "stream_get_mute"];

              if (!(!types.includes(type) && !stream_commands.includes(type))) {
                _context3.next = 5;
                break;
              }

              throw new TypeError("worker message type is invalid (".concat(type, ")"));

            case 5:
              if (!stream_commands.includes(type)) {
                _context3.next = 7;
                break;
              }

              return _context3.abrupt("return");

            case 7:
              sessionId = data["sessionId"];
              _context3.next = 10;
              return decode(type, data["buffer"], data["ch"], data["sps"], data["bps"]);

            case 10:
              msg = _context3.sent;
              buffer = msg.buffer, stream = msg.stream;
              msg.sessionId = sessionId; // requestId added so that different worker calls of the same session
              // wouldn't get responses mixed up. (e.g., mute and next)

              msg.requestId = data["requestId"];
              delete msg.stream; // here the worker is responding to the main thread

              global["postMessage"](msg, stream ? [] : [buffer]); // stream

              if (stream) {
                handleStream = /*#__PURE__*/function () {
                  var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(data) {
                    var isMute;
                    return _regenerator["default"].wrap(function _callee2$(_context2) {
                      while (1) {
                        switch (_context2.prev = _context2.next) {
                          case 0:
                            if (!(data["sessionId"] !== sessionId)) {
                              _context2.next = 2;
                              break;
                            }

                            return _context2.abrupt("return");

                          case 2:
                            _context2.t0 = data["type"];
                            _context2.next = _context2.t0 === "stream_next" ? 5 : _context2.t0 === "stream_reset" ? 8 : _context2.t0 === "stream_release" ? 10 : _context2.t0 === "stream_set_mute" ? 12 : _context2.t0 === "stream_get_mute" ? 14 : 17;
                            break;

                          case 5:
                            _context2.next = 7;
                            return stream.next(data["size"]).then(function (next) {
                              return global["postMessage"]({
                                "sessionId": sessionId,
                                "requestId": data["requestId"],
                                "streamBuffer": next
                              });
                            });

                          case 7:
                            return _context2.abrupt("break", 17);

                          case 8:
                            stream.reset(data['position']);
                            return _context2.abrupt("break", 17);

                          case 10:
                            stream.release();
                            return _context2.abrupt("break", 17);

                          case 12:
                            stream.setMute(data['unitNum'], data['isMute']);
                            return _context2.abrupt("break", 17);

                          case 14:
                            isMute = stream.getMute(data['unitNum'], data['isMute']);
                            global["postMessage"]({
                              "sessionId": sessionId,
                              "requestId": data["requestId"],
                              "isMute": isMute
                            });
                            return _context2.abrupt("break", 17);

                          case 17:
                          case "end":
                            return _context2.stop();
                        }
                      }
                    }, _callee2);
                  }));

                  return function handleStream(_x8) {
                    return _ref3.apply(this, arguments);
                  };
                }();

                global["addEventListener"]("message", handleExceptions(handleStream));
              }

            case 17:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3);
    }));

    return function handleMessage(_x7) {
      return _ref2.apply(this, arguments);
    };
  }();

  ;
  global["addEventListener"]("message", handleExceptions(handleMessage));
}

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./emDecoder":8,"./memory":9,"./textDecoder":10,"@babel/runtime/helpers/asyncToGenerator":1,"@babel/runtime/helpers/interopRequireDefault":4,"@babel/runtime/regenerator":7}],12:[function(require,module,exports){

},{}],13:[function(require,module,exports){
(function (process){(function (){
// 'path' module extracted from Node.js v8.11.1 (only the posix part)
// transplited with Babel

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

function assertPath(path) {
  if (typeof path !== 'string') {
    throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
  }
}

// Resolves . and .. elements in a path with directory names
function normalizeStringPosix(path, allowAboveRoot) {
  var res = '';
  var lastSegmentLength = 0;
  var lastSlash = -1;
  var dots = 0;
  var code;
  for (var i = 0; i <= path.length; ++i) {
    if (i < path.length)
      code = path.charCodeAt(i);
    else if (code === 47 /*/*/)
      break;
    else
      code = 47 /*/*/;
    if (code === 47 /*/*/) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*.*/ || res.charCodeAt(res.length - 2) !== 46 /*.*/) {
          if (res.length > 2) {
            var lastSlashIndex = res.lastIndexOf('/');
            if (lastSlashIndex !== res.length - 1) {
              if (lastSlashIndex === -1) {
                res = '';
                lastSegmentLength = 0;
              } else {
                res = res.slice(0, lastSlashIndex);
                lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
              }
              lastSlash = i;
              dots = 0;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = '';
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0)
            res += '/..';
          else
            res = '..';
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0)
          res += '/' + path.slice(lastSlash + 1, i);
        else
          res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === 46 /*.*/ && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}

function _format(sep, pathObject) {
  var dir = pathObject.dir || pathObject.root;
  var base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');
  if (!dir) {
    return base;
  }
  if (dir === pathObject.root) {
    return dir + base;
  }
  return dir + sep + base;
}

var posix = {
  // path.resolve([from ...], to)
  resolve: function resolve() {
    var resolvedPath = '';
    var resolvedAbsolute = false;
    var cwd;

    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path;
      if (i >= 0)
        path = arguments[i];
      else {
        if (cwd === undefined)
          cwd = process.cwd();
        path = cwd;
      }

      assertPath(path);

      // Skip empty entries
      if (path.length === 0) {
        continue;
      }

      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charCodeAt(0) === 47 /*/*/;
    }

    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)

    // Normalize the path
    resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);

    if (resolvedAbsolute) {
      if (resolvedPath.length > 0)
        return '/' + resolvedPath;
      else
        return '/';
    } else if (resolvedPath.length > 0) {
      return resolvedPath;
    } else {
      return '.';
    }
  },

  normalize: function normalize(path) {
    assertPath(path);

    if (path.length === 0) return '.';

    var isAbsolute = path.charCodeAt(0) === 47 /*/*/;
    var trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*/*/;

    // Normalize the path
    path = normalizeStringPosix(path, !isAbsolute);

    if (path.length === 0 && !isAbsolute) path = '.';
    if (path.length > 0 && trailingSeparator) path += '/';

    if (isAbsolute) return '/' + path;
    return path;
  },

  isAbsolute: function isAbsolute(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47 /*/*/;
  },

  join: function join() {
    if (arguments.length === 0)
      return '.';
    var joined;
    for (var i = 0; i < arguments.length; ++i) {
      var arg = arguments[i];
      assertPath(arg);
      if (arg.length > 0) {
        if (joined === undefined)
          joined = arg;
        else
          joined += '/' + arg;
      }
    }
    if (joined === undefined)
      return '.';
    return posix.normalize(joined);
  },

  relative: function relative(from, to) {
    assertPath(from);
    assertPath(to);

    if (from === to) return '';

    from = posix.resolve(from);
    to = posix.resolve(to);

    if (from === to) return '';

    // Trim any leading backslashes
    var fromStart = 1;
    for (; fromStart < from.length; ++fromStart) {
      if (from.charCodeAt(fromStart) !== 47 /*/*/)
        break;
    }
    var fromEnd = from.length;
    var fromLen = fromEnd - fromStart;

    // Trim any leading backslashes
    var toStart = 1;
    for (; toStart < to.length; ++toStart) {
      if (to.charCodeAt(toStart) !== 47 /*/*/)
        break;
    }
    var toEnd = to.length;
    var toLen = toEnd - toStart;

    // Compare paths to find the longest common path from root
    var length = fromLen < toLen ? fromLen : toLen;
    var lastCommonSep = -1;
    var i = 0;
    for (; i <= length; ++i) {
      if (i === length) {
        if (toLen > length) {
          if (to.charCodeAt(toStart + i) === 47 /*/*/) {
            // We get here if `from` is the exact base path for `to`.
            // For example: from='/foo/bar'; to='/foo/bar/baz'
            return to.slice(toStart + i + 1);
          } else if (i === 0) {
            // We get here if `from` is the root
            // For example: from='/'; to='/foo'
            return to.slice(toStart + i);
          }
        } else if (fromLen > length) {
          if (from.charCodeAt(fromStart + i) === 47 /*/*/) {
            // We get here if `to` is the exact base path for `from`.
            // For example: from='/foo/bar/baz'; to='/foo/bar'
            lastCommonSep = i;
          } else if (i === 0) {
            // We get here if `to` is the root.
            // For example: from='/foo'; to='/'
            lastCommonSep = 0;
          }
        }
        break;
      }
      var fromCode = from.charCodeAt(fromStart + i);
      var toCode = to.charCodeAt(toStart + i);
      if (fromCode !== toCode)
        break;
      else if (fromCode === 47 /*/*/)
        lastCommonSep = i;
    }

    var out = '';
    // Generate the relative path based on the path difference between `to`
    // and `from`
    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
      if (i === fromEnd || from.charCodeAt(i) === 47 /*/*/) {
        if (out.length === 0)
          out += '..';
        else
          out += '/..';
      }
    }

    // Lastly, append the rest of the destination (`to`) path that comes after
    // the common path parts
    if (out.length > 0)
      return out + to.slice(toStart + lastCommonSep);
    else {
      toStart += lastCommonSep;
      if (to.charCodeAt(toStart) === 47 /*/*/)
        ++toStart;
      return to.slice(toStart);
    }
  },

  _makeLong: function _makeLong(path) {
    return path;
  },

  dirname: function dirname(path) {
    assertPath(path);
    if (path.length === 0) return '.';
    var code = path.charCodeAt(0);
    var hasRoot = code === 47 /*/*/;
    var end = -1;
    var matchedSlash = true;
    for (var i = path.length - 1; i >= 1; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          if (!matchedSlash) {
            end = i;
            break;
          }
        } else {
        // We saw the first non-path separator
        matchedSlash = false;
      }
    }

    if (end === -1) return hasRoot ? '/' : '.';
    if (hasRoot && end === 1) return '//';
    return path.slice(0, end);
  },

  basename: function basename(path, ext) {
    if (ext !== undefined && typeof ext !== 'string') throw new TypeError('"ext" argument must be a string');
    assertPath(path);

    var start = 0;
    var end = -1;
    var matchedSlash = true;
    var i;

    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
      if (ext.length === path.length && ext === path) return '';
      var extIdx = ext.length - 1;
      var firstNonSlashEnd = -1;
      for (i = path.length - 1; i >= 0; --i) {
        var code = path.charCodeAt(i);
        if (code === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else {
          if (firstNonSlashEnd === -1) {
            // We saw the first non-path separator, remember this index in case
            // we need it if the extension ends up not matching
            matchedSlash = false;
            firstNonSlashEnd = i + 1;
          }
          if (extIdx >= 0) {
            // Try to match the explicit extension
            if (code === ext.charCodeAt(extIdx)) {
              if (--extIdx === -1) {
                // We matched the extension, so mark this as the end of our path
                // component
                end = i;
              }
            } else {
              // Extension does not match, so our result is the entire path
              // component
              extIdx = -1;
              end = firstNonSlashEnd;
            }
          }
        }
      }

      if (start === end) end = firstNonSlashEnd;else if (end === -1) end = path.length;
      return path.slice(start, end);
    } else {
      for (i = path.length - 1; i >= 0; --i) {
        if (path.charCodeAt(i) === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else if (end === -1) {
          // We saw the first non-path separator, mark this as the end of our
          // path component
          matchedSlash = false;
          end = i + 1;
        }
      }

      if (end === -1) return '';
      return path.slice(start, end);
    }
  },

  extname: function extname(path) {
    assertPath(path);
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;
    for (var i = path.length - 1; i >= 0; --i) {
      var code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1)
            startDot = i;
          else if (preDotState !== 1)
            preDotState = 1;
      } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
        // We saw a non-dot character immediately before the dot
        preDotState === 0 ||
        // The (right-most) trimmed path component is exactly '..'
        preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      return '';
    }
    return path.slice(startDot, end);
  },

  format: function format(pathObject) {
    if (pathObject === null || typeof pathObject !== 'object') {
      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
    }
    return _format('/', pathObject);
  },

  parse: function parse(path) {
    assertPath(path);

    var ret = { root: '', dir: '', base: '', ext: '', name: '' };
    if (path.length === 0) return ret;
    var code = path.charCodeAt(0);
    var isAbsolute = code === 47 /*/*/;
    var start;
    if (isAbsolute) {
      ret.root = '/';
      start = 1;
    } else {
      start = 0;
    }
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    var i = path.length - 1;

    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;

    // Get non-dir info
    for (; i >= start; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1) startDot = i;else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
    // We saw a non-dot character immediately before the dot
    preDotState === 0 ||
    // The (right-most) trimmed path component is exactly '..'
    preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      if (end !== -1) {
        if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);else ret.base = ret.name = path.slice(startPart, end);
      }
    } else {
      if (startPart === 0 && isAbsolute) {
        ret.name = path.slice(1, startDot);
        ret.base = path.slice(1, end);
      } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
      }
      ret.ext = path.slice(startDot, end);
    }

    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);else if (isAbsolute) ret.dir = '/';

    return ret;
  },

  sep: '/',
  delimiter: ':',
  win32: null,
  posix: null
};

posix.posix = posix;

module.exports = posix;

}).call(this)}).call(this,require('_process'))
},{"_process":14}],14:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[11]);
