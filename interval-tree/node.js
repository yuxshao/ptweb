import { SortedList } from "./sorted-list.js"


/**
node of IntervalTree, containing intervalsj

@class Node
@module interval-tree2
 */

export let Node = (function() {

  /**
  @constructor
  @param {Number} center center of the node
   */
  function Node(center) {
    this.center = center;

    /**
    another node whose center is less than this.center
    
    @property {Node} left
     */
    this.left = null;

    /**
    another node whose center is greater than this.center
    
    @property {Node} right
     */
    this.right = null;

    /**
    sorted list of Intervals, sorting them by their start property
    
    @property {SortedList(Interval)} starts
     */
    this.starts = new SortedList((x) => x.start);

    /**
    sorted list of Intervals, sorting them by their end property
    
    @property {SortedList(Interval)} ends
     */
    this.ends = new SortedList((x) => x.end);
  }


  /**
  the number of intervals
  
  @method count
  @return {Number}
   */

  Node.prototype.count = function() {
    return this.starts.length;
  };


  /**
  insert an interval
  
  @method insert
  @param {Interval} interval
   */

  Node.prototype.insert = function(interval) {
    this.starts.insert(interval);
    return this.ends.insert(interval);
  };


  /**
  get intervals whose start position is less than or equal to the given value
  
  @method startPointSearch
  @param {Number} val
  @return {Array(Interval)}
   */

  Node.prototype.startPointSearch = function(val) {
    let index = this.starts.lastPositionOf(val);
    return this.starts.slice(0, index + 1);
  };


  /**
  get intervals whose end position is more than or equal to the given value
  
  @method endPointSearch
  @param {Number} val
  @return {Array(Interval)}
   */

  Node.prototype.endPointSearch = function(val) {
    let index = this.ends.firstPositionOf(val);
    return this.ends.slice(index);
  };


  /**
  gets all registered interval
  
  @method getAllIntervals
  @return {Array(Interval)}
   */

  Node.prototype.getAllIntervals = function() {
    return this.starts.toArray();
  };


  /**
  remove the given interval
  
  @method remove
  @param {Interval} interval
  @param {SortedList} list
   */

  Node.prototype.remove = function(interval) {
    this.removeFromList(interval, this.starts);
    return this.removeFromList(interval, this.ends);
  };


  /**
  remove the given interval from the given list
  
  @method removeFromList
  @private
  @param {Interval} interval
  @param {SortedList} list
   */

  Node.prototype.removeFromList = function(interval, list) {
    var candidate, firstPos, i, idx, ref, ref1, results;
    firstPos = list.firstPositionOf(list.getKey(interval));
    results = [];
    for (idx = i = ref = firstPos, ref1 = list.length; ref <= ref1 ? i < ref1 : i > ref1; idx = ref <= ref1 ? ++i : --i) {
      candidate = list[idx];
      if (candidate.id === interval.id) {
        list.remove(idx);
        break;
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  return Node;

})();
