
/**
extended array of objects, always sorted

@class SortedList
@extends Array
@module interval-tree2
 */
var SortedList,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

SortedList = (function(superClass) {
  extend(SortedList, superClass);


  /**
  @constructor
  @param {String} compareKey key name to compare objects. The value of the key must be a number.
   */


  /**
  key name to compare objects. The value of the key must be a number.
  @property {String} compareKey
   */

  function SortedList(compareKey) {
    this.compareKey = compareKey;
  }


  /**
  insert a value
  
  @method insert
  @param {any} val
  @return {Number} inserted position
   */

  SortedList.prototype.insert = function(val) {
    var pos;
    pos = this.bsearch(val);
    this.splice(pos + 1, 0, val);
    return pos + 1;
  };


  /**
  remove the value in the given position
  
  @method remove
  @param {Number} pos position
  @return {SortedList} self
   */

  SortedList.prototype.remove = function(pos) {
    this.splice(pos, 1);
    return this;
  };


  /**
  get maximum value in the list
  
  @method max
  @return {Number}
   */

  SortedList.prototype.max = function() {
    var ref;
    return (ref = this[this.length - 1]) != null ? ref[this.compareKey] : void 0;
  };


  /**
  get minimum value in the list
  
  @method min
  @return {Number}
   */

  SortedList.prototype.min = function() {
    var ref;
    return (ref = this[0]) != null ? ref[this.compareKey] : void 0;
  };


  /**
  binary search
  
  @method bsearch
  @param {any} val
  @return {Number} position of the value
   */

  SortedList.prototype.bsearch = function(val) {
    var comp, epos, mpos, mval, spos;
    if (!this.length) {
      return -1;
    }
    mpos = null;
    mval = null;
    spos = 0;
    epos = this.length;
    while (epos - spos > 1) {
      mpos = Math.floor((spos + epos) / 2);
      mval = this[mpos];
      comp = this.compare(val, mval);
      if (comp === 0) {
        return mpos;
      }
      if (comp > 0) {
        spos = mpos;
      } else {
        epos = mpos;
      }
    }
    if (spos === 0 && this.compare(this[0], val) > 0) {
      return -1;
    } else {
      return spos;
    }
  };


  /**
  smallest thing >= val
  
  @method firstPositionOf
  @param {any} val
  @return {Number} leftmost position of the value
   */

  SortedList.prototype.firstPositionOf = function(val) {
    var index, num, ref;
    index = this.bsearch(val);
    if (index === -1) {
      return 0; /* edited - should not be -1 */
    }
    num = val[this.compareKey];
    ref = this[index]
    if (num === ((ref = this[index]) != null ? ref[this.compareKey] : void 0)) {
      while (true) {
        if (index <= 0) {
          break;
        }
        if (this[index - 1][this.compareKey] < num) {
          break;
        }
        index--;
      }
    } else {
      index++;
    }
    return index;
  };


  /**
  largest thing < val
  
  @method lastPositionOf
  @param {any} val
  @return {Number} rightmost position of the value
   */

  SortedList.prototype.lastPositionOf = function(val) {
    var index, num;
    index = this.bsearch(val);
    if (index === -1) {
      return -1;
    }
    num = val[this.compareKey];
    if (index === this.length - 1 && num > this.max()) {
      return index + 1;
    }
    while (true) {
      if (index + 1 >= this.length) {
        break;
      }
      if (this[index + 1][this.compareKey] > num) {
        break;
      }
      index++;
    }
    return index;
  };


  /**
   * sorted.toArray()
   * get raw array
   *
   */

  SortedList.prototype.toArray = function() {
    return this.slice();
  };


  /**
  comparison function. Compares two objects by this.compareKey
  
  @method compare
  @private
  @param {any} a
  @param {any} b
   */

  SortedList.prototype.compare = function(a, b) {
    var c;
    if (a == null) {
      return -1;
    }
    if (b == null) {
      return 1;
    }
    c = a[this.compareKey] - b[this.compareKey];
    if (c > 0) {
      return 1;
    } else if (c === 0) {
      return 0;
    } else {
      return -1;
    }
  };

  return SortedList;

})(Array);

export { SortedList };
