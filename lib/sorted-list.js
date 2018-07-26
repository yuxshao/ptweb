/** adapted from interval-tree2.SortedList */

export class SortedList extends Array {
  /**
  @constructor
  @param {String} compareKey key name to compare objects. The value of the key must be a number.
  @param {Array} init a sorted array to start with.
   */
  constructor (getKey, init = []) {
    super(init.length);
    for (let i = 0; i < init.length - 1; ++i) {
      this[i] = init[i];
      if (getKey(init[i]) > getKey(init[i + 1]))
        throw "passed in unsorted array";
    }
    if (init.length > 0)
      this[init.length-1] = init[init.length-1];
    this.getKey = getKey;
  }


  /**
    binary search:
    if value exists, returns position of some instance with value
    else, returns position of last thing < val
    if length is 0, return -1
    (so you can imagine something with -inf value at position -1)
   */
  bsearch (val) {
    // console.log(val);
    if (this.length === 0) return -1;
    // consider this[-1] = -inf, this[this.length] = inf
    let spos = -1;
    let epos = this.length;
    // invariant: this[epos] > val > this[spos]. distance decreases each iteration
    while (epos - spos > 1) {
      let mpos = Math.floor((spos + epos) / 2);
      let comp = val - this.getKey(this[mpos]);
      if (comp > 0) spos = mpos;
      else if (comp < 0) epos = mpos;
      else return mpos;
    }
    // epos = spos + 1 and this[epos] > val > this[spos], but it wasn't found
    // so closest thing under it is spos
    return spos;
  };


  // first thing >= val
  firstPositionOf (val) {
    let index = this.bsearch(val);
    // bsearch could not find key. return one more than the last thing < val
    if (index === -1 || val > this.getKey(this[index]))
      return index + 1;
    // bsearch did find key. go down until you reach the first instance of key
    while (index > 0 && this.getKey(this[index-1]) >= val)
      index--;
    return index;
  };


  // last thing <= val
  lastPositionOf (val) {
    let index = this.bsearch(val);
    // bsearch could not find key, so index is last thing < val.
    if (index === -1 || val > this.getKey(this[index]))
      return index;
    // bsearch did find key. go up until you reach last instance of key
    while (index < this.length - 1 && this.getKey(this[index+1]) <= val)
      index++;
    return index;
  };

};
