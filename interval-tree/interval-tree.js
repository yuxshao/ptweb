import { SortedList } from "./sorted-list.js"
import { Node } from "./node.js"
import { Point } from "./point.js"
import { Interval } from "./interval.js"
import { Util } from "./util.js"


/**
interval tree

@class IntervalTree
@module interval-tree2
 */

export let IntervalTree = (function() {

  /**
  @constructor
  @param {Number} center center of the root node
   */
  function IntervalTree(center) {
    Util.assertNumber(center, 'IntervalTree: center');

    /**
    center => node
    
    @property {Object(Node)} nodesByCenter
     */
    this.nodesByCenter = {};

    /**
    root node
    
    @property {Node} root
     */
    this.root = this.createNode(center);

    /**
    interval id => interval
    
    @property {Object(Interval)} intervalsById
     */
    this.intervalsById = {};

    /**
    interval id => node
    
    @property {Object(Node)} nodesById
     */
    this.nodesById = {};

    /**
    sorted list of whole point
    
    @property {SortedList(Point)} pointTree
     */
    this.pointTree = new SortedList('val');

    /**
    unique id candidate of interval without id to be added next time
    
    @property {Number} idCandidate
     */
    this.idCandidate = 0;
  }


  /**
  add one interval
  
  @method add
  @public
  @param {Number} start start of the interval to create
  @param {Number} end   end of the interval to create
  @param {String|Number} [id] identifier to distinguish intervals. Automatically defiend when not set.
  @return {Interval}
   */

  IntervalTree.prototype.add = function(start, end, id) {
    var interval;
    if (this.intervalsById[id] != null) {
      throw new Error('id ' + id + ' is already registered.');
    }
    if (id == null) {
      while (this.intervalsById[this.idCandidate] != null) {
        this.idCandidate++;
      }
      id = this.idCandidate;
    }
    Util.assertNumber(start, '1st argument of IntervalTree#add()');
    Util.assertNumber(end, '2nd argument of IntervalTree#add()');
    if (start >= end) {
      Util.assertOrder(start, end, 'start', 'end');
    }
    interval = new Interval(start, end, id);
    this.pointTree.insert(new Point(interval.start, id));
    this.pointTree.insert(new Point(interval.end, id));
    this.intervalsById[id] = interval;
    return this.insert(interval, this.root);
  };


  /**
  search intervals
  when only one argument is given, return intervals which contains the value
  when two arguments are given, ...
  
  @method search
  @public
  @param {Number} val1
  @param {Number} val2
  @return {Array(Interval)} intervals
   */

  IntervalTree.prototype.search = function(val1, val2) {
    Util.assertNumber(val1, '1st argument at IntervalTree#search()');
    if (val2 == null) {
      return this.pointSearch(val1);
    } else {
      Util.assertNumber(val2, '2nd argument at IntervalTree#search()');
      Util.assertOrder(val1, val2, '1st argument', '2nd argument', 'IntervalTree#search()');
      return this.rangeSearch(val1, val2);
    }
  };


  /**
  removes an interval of the given id
  
  @method remove
  @public
  @param {Number|String} id id of the interval to remove
   */

  IntervalTree.prototype.remove = function(id) {
    var interval, node;
    interval = this.intervalsById[id];
    if (interval == null) {
      return;
    }
    node = this.nodesById[id];
    node.remove(interval);
    delete this.nodesById[id];
    return delete this.intervalsById[id];
  };


  /**
  search intervals at the given node
  
  @method pointSearch
  @public
  @param {Number} val
  @param {Node} [node] current node to search. default is this.root
  @return {Array(Interval)}
   */

  IntervalTree.prototype.pointSearch = function(val, node, results) {
    if (node == null) {
      node = this.root;
    }
    if (results == null) {
      results = [];
    }
    Util.assertNumber(val, '1st argument of IntervalTree#pointSearch()');
    if (val < node.center) {
      results = results.concat(node.startPointSearch(val));
      if (node.left != null) {
        return this.pointSearch(val, node.left, results);
      } else {
        return results;
      }
    }
    if (val > node.center) {
      results = results.concat(node.endPointSearch(val));
      if (node.right != null) {
        return this.pointSearch(val, node.right, results);
      } else {
        return results;
      }
    }
    return results.concat(node.getAllIntervals());
  };


  /**
  returns intervals which covers the given start-end interval
  
  @method rangeSearch
  @public
  @param {Number} start start of the interval
  @param {Number} end end of the interval
  @return {Array(Interval)}
   */

  IntervalTree.prototype.rangeSearch = function(start, end) {
    var firstPos, i, id, interval, j, lastPos, len, len1, point, ref, ref1, resultsById;
    Util.assertNumber(start, '1st argument at IntervalTree#rangeSearch()');
    Util.assertNumber(end, '2nd argument at IntervalTree#rangeSearch()');
    Util.assertOrder(start, end, '1st argument', '2nd argument', 'IntervalTree#rangeSearch()');
    resultsById = {};
    ref = this.pointSearch(start);
    for (i = 0, len = ref.length; i < len; i++) {
      interval = ref[i];
      resultsById[interval.id] = interval;
    }
    firstPos = this.pointTree.firstPositionOf(new Point(start));
    // console.log("first", firstPos);
    lastPos = this.pointTree.lastPositionOf(new Point(end));
    if (lastPos < firstPos) return []; // probably not needed but who knows at this point
    // console.log("lst", lastPos);
    ref1 = this.pointTree.slice(firstPos, lastPos + 1);
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      point = ref1[j];
      resultsById[point.id] = this.intervalsById[point.id];
    }
    return (function() {
      var results1;
      results1 = [];
      for (id in resultsById) {
        interval = resultsById[id];
        results1.push(interval);
      }
      return results1;
    })();
  };


  /**
  insert interval to the given node
  
  @method insert
  @private
  @param {Interval} interval
  @param {Node} node node to insert the interval
  @return {Interval} inserted interval
   */

  IntervalTree.prototype.insert = function(interval, node) {
    if (interval.end < node.center) {
      if (node.left == null) {
        node.left = this.createNode(interval.end);
      }
      return this.insert(interval, node.left);
    }
    if (node.center < interval.start) {
      if (node.right == null) {
        node.right = this.createNode(interval.start);
      }
      return this.insert(interval, node.right);
    }
    node.insert(interval);
    this.nodesById[interval.id] = node;
    return interval;
  };


  /**
  create node by center
  
  @method createNode
  @private
  @param {Number} center
  @return {Node} node
   */

  IntervalTree.prototype.createNode = function(center) {
    var node;
    node = new Node(center);
    this.nodesByCenter[center] = node;
    return node;
  };

  return IntervalTree;

})();
