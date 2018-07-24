
/**
interval, containing start and and

@class Interval
@module interval-tree2
 */
export let Interval = (function() {

  /**
  @constructor
  @param {Number} start start of the interval
  @param {Number} end end of the interval
  @param {Number|String} id id of the interval
   */
  function Interval(start, end, id) {
    this.start = start;
    this.end = end;
    this.id = id;
  }


  /**
  get center of the interval
  
  @method center
  @return {Number} center
   */

  Interval.prototype.center = function() {
    return (this.start + this.end) / 2;
  };

  return Interval;

})();
