// Supports two operations:
// int add() - declares a new planned operation to add to the front of the queue
// void fill(int, data) - schedules a planned operation added earlier.
// operation is executed if it is scheduled and at the front of queue. it is then removed.
export class DeferredQueue {
  constructor (op) { 
    this._op = op;
    this._head = 0;
    this._next = 0;
    this._arr = new Array(100);
  }

  // reserves next thing in queue
  add () { return this._next++; }

  // schedule an operation once all ops before it are scheduled
  fill (id, data) {
    // console.assert (id < this._next && id >= this._head)
    this._arr[id] = data;
    // if (id !== this._head) return;
    while (this._arr[this._head] !== undefined) {
      this._op(this._arr[this._head]);
      ++this._head;
    }
  }
}
