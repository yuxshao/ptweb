export let Util = (function() {
  function Util() {}

  Util.assertNumber = function(val, desc) {
    if (val == null) {
      throw new Error(desc + ' is required.');
    }
    if (typeof val !== 'number') {
      throw new Error(desc + ' must be a number.');
    }
  };

  Util.assertOrder = function(start, end, startName, endName, desc) {
    if (start >= end) {
      throw new Error(desc + ": " + startName + "(" + start + ") must be smaller than " + endName + "(" + end + ").");
    }
  };

  return Util;

})();
