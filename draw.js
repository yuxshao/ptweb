"use strict";

const canvas = document.getElementById('player');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const numbers_green = new Image(80, 8);
numbers_green.src = './res/numbers_green.png';
numbers_green.digit_w = 8;
numbers_green.digit_h = 8;

function drawNum(ctx, res, num, xr, y) {
  if (num < 0) throw "cannot print negative number";
  do {
    let digit = num % 10;
    xr -= res.digit_w;
    ctx.drawImage(res, res.digit_w * digit, 0, res.digit_w, res.digit_h,
      xr, y, res.digit_w, res.digit_h);
    num = (num - digit) / 10;
  }
  while (num > 0);
}

let Player = function () {
  this.startTime = null;
  this.audioCtx = null;
  this.evels = { unitNum: 0, evels: []};
  this.master = null;
  this.measureWidth = 192;
}

function drawUnitNote(ctx, x, y, w) {
  ctx.fillRect(x, y-1, w, 2);
  ctx.fillRect(x, y-2, Math.max(w-1, 0), 4);
  ctx.fillRect(x, y-3, Math.max(Math.min(2, w), 0), 6);
  ctx.fillRect(x, y-5, 1, 10);
}

function middleSnap(x) { return Math.floor(x) + 0.5; }

Player.prototype.draw = function () {
  // calculate time offset
  let curr = { time: this.audioCtx.currentTime - this.startTime };
  curr.beat = (() => {
    let beat = curr.time * this.master.beatTempo / 60;
    let lastBeat = (this.master.lastMeas || this.master.measNum) * this.master.beatNum;
    if (beat < lastBeat) return beat;
    let repeatBeat = this.master.repeatMeas * this.master.beatNum;
    return (beat - repeatBeat) % (lastBeat - repeatBeat) + repeatBeat;
  })();
  curr.clock = curr.beat * this.master.beatClock;

  // - back -
  ctx.save();
  // global transform
  ctx.fillStyle = "#000010";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let shiftX = canvas.width/2;
  ctx.translate(shiftX, 0);
  ctx.scale(2, 2);

  let playX = middleSnap(curr.beat / this.master.beatNum) * this.measureWidth;
  ctx.translate(-playX, 1);

  let canvasOffsetX = playX - shiftX;

  // - rulers -
  let start; // used to get the ruler offsets in the scroll view
  // beat lines
  ctx.fillStyle = "#808080";
  let beatWidth = this.measureWidth / this.master.beatNum;
  start = Math.floor(canvasOffsetX / beatWidth);
  for (let i = 0; i < canvas.width / beatWidth + 1; ++i)
    ctx.fillRect((i + start) * beatWidth, 25, 1, canvas.height);

  // measure markers
  start = Math.floor(canvasOffsetX / this.measureWidth);
  for (let i = 0; i < canvas.width / this.measureWidth + 1; ++i) {
    let box_left = (i + start) * this.measureWidth;
    ctx.fillStyle = "#606060";
    ctx.fillRect(box_left, 0, 27, 9); // great measure number boxes
    // one px wider than in editor, but I think numbers look nicer
    if (i + start >= 0)
      drawNum(ctx, numbers_green, start+i, box_left+26, 0);

    if (i + start >= 0 && i + start < this.master.measNum)
      ctx.fillStyle = "#800000";
    else
      ctx.fillStyle = "#400000";
    ctx.fillRect(box_left, 9, this.measureWidth, 16); // red bar
  }

  start = canvasOffsetX;

  ctx.fillStyle = "#808080"; // grey horizontal line above unit
  ctx.fillRect(start, 31, canvas.width, 1);

  // measure lines
  ctx.fillStyle = "#F0F0F0";
  start = Math.floor(canvasOffsetX / this.measureWidth);
  for (let i = 0; i < canvas.width / this.measureWidth + 1; ++i)
    ctx.fillRect((i + start) * this.measureWidth, 0, 1, canvas.height);

  // unit rows
  let unitOffsetY = 32;
  start = canvasOffsetX;

  ctx.fillStyle = "#400070"; // unit rows
  for (let i = 0; i < this.evels.unitNum; ++i) {
    ctx.fillRect(start, i*16 + 1 + unitOffsetY, canvas.width, 15);
  }

  // - playhead -
  let clockPerPx = this.master.beatClock * this.master.beatNum / this.measureWidth;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(curr.clock / clockPerPx, 0, 1, canvas.height);

  // notes
  ctx.fillStyle = "#F08000";
  // TODO: use interval tree to get the relevant notes to render
  // else it lags on big things
  for (let e of this.evels.evels) {
    if (e.kind != "ON")
      continue;
    if (e.clock <= curr.clock && e.clock + e.value > curr.clock) {
      ctx.save();
      ctx.fillStyle = "#FFF000";
    }
    drawUnitNote(ctx, e.clock / clockPerPx, e.unit_no * 16 + 8 + unitOffsetY, e.value / clockPerPx);
    if (e.clock <= curr.clock && e.clock + e.value > curr.clock) ctx.restore();
  }

  ctx.restore();
}

Player.prototype.drawContinuously = function () {
  let k = this;
  function f(now) {
    k.draw();
    window.requestAnimationFrame(f);
  }
  f(performance.now());
}

export var MyPlayer = new Player();
