"use strict";

export let Mutex = (function () {
    function Mutex() {
        this._queue = [];
        this._pending = false;
    }
    Mutex.prototype.isLocked = function () {
        return this._pending;
    };
    Mutex.prototype.acquire = function () {
        var _this = this;
        var ticket = new Promise(function (resolve) { return _this._queue.push(resolve); });
        if (!this._pending) {
            this._dispatchNext();
        }
        return ticket;
    };
    Mutex.prototype.runExclusive = function (callback) {
        return this
            .acquire()
            .then(function (release) {
            var result;
            try {
                result = callback();
            }
            catch (e) {
                release();
                throw (e);
            }
            return Promise
                .resolve(result)
                .then(function (x) { return (release(), x); }, function (e) {
                release();
                throw e;
            });
        });
    };
    Mutex.prototype._dispatchNext = function () {
        if (this._queue.length > 0) {
            this._pending = true;
            this._queue.shift()(this._dispatchNext.bind(this));
        }
        else {
            this._pending = false;
        }
    };
    return Mutex;
}());
