"use strict";

const canvas = document.getElementById('player');
const ctx = canvas.getContext('2d');

let Player = function () {
  this.evels = { unitNum: 0, evels: []};
  this.master = null;
  this.measureWidth = 192;
}

Player.prototype.draw = function (now) {
  // - back -
  ctx.fillStyle = "#000010";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // - rulers -
  // beat
  ctx.fillStyle = "#808080";
  for (let i = 0; i < canvas.width; i += this.measureWidth / this.master.beatNum) {
    ctx.fillRect(i, 0, 1, canvas.height);
  }

  // measure
  ctx.fillStyle = "#F0F0F0";
  for (let i = 0; i < canvas.width; i += this.measureWidth) {
    ctx.fillRect(i * this.measureWidth, 0, 1, canvas.height);
  }

  // - unit rows -
  ctx.fillStyle = "#400070";
  for (let i = 0; i < this.evels.unitNum; ++i) {
    ctx.fillRect(0, i*16 + 1, canvas.width, 15);
  }

  // notes
  ctx.fillStyle = "#F08000";
  for (let e of this.evels.evels) {
    if (e.kind != "ON")
      continue;
    ctx.save();
    let clockPerPx = this.master.beatClock * this.master.beatNum / this.measureWidth;
    ctx.translate(e.clock / clockPerPx, e.unit_no*16 + 8);
    let w = e.value / clockPerPx;
    ctx.fillRect(0, -1, w, 2);
    ctx.fillRect(0, -2, Math.max(w-1, 0), 4);
    ctx.fillRect(0, -3, Math.max(Math.min(2, w), 0), 6);
    ctx.fillRect(0, -5, 1, 10);
    ctx.restore();
    // unit_no, value, clock
  }
}

Player.prototype.drawContinuously = function () {
  let k = this;
  function f(now) {
    k.draw(now);
    window.requestAnimationFrame(f);
  }
  f(performance.now());
}

export var MyPlayer = new Player();
