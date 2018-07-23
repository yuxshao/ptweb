"use strict";

const canvas = document.getElementById('player');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const numbers_green = new Image(80, 8);
numbers_green.src = './res/numbers_green.png';
numbers_green.digit_size = { x: 8, y: 8 };

const flags = new Image(81, 16);
flags.src = './res/flags.png';
flags.top_rect    = { x: 0,  y: 0, w: 36, h: 8 };
flags.last_rect   = { x: 45, y: 0, w: 35, h: 8 };
flags.repeat_rect = { x: 0,  y: 8, w: 36, h: 8 };

const playhead = new Image(9, 5);
playhead.centre = { x: 4, y: 4 };
playhead.src = './res/playhead.png';

const unitbars = new Image(145, 192);
unitbars.top_rect      = { x: 0,  y: 0,  w: 145, h: 32  };
unitbars.side_rect     = { x: 0,  y: 32, w: 16,  h: 160 };
unitbars.regular_rect  = { x: 16, y: 32, w: 128, h: 16  };
unitbars.selected_rect = { x: 16, y: 48, w: 128, h: 16  };
unitbars.nothing_rect  = { x: 16, y: 64, w: 128, h: 16  };
unitbars.src = './res/unitbars.png';

var imagesToLoad = [numbers_green, flags, playhead, unitbars];
async function waitForImages() {
  for (let image of imagesToLoad)
    await new Promise((resolve) => { image.onload = () => { resolve() }; })
}

function drawImageRect(ctx, res, rect, x, y) {
  ctx.drawImage(res, rect.x, rect.y, rect.w, rect.h, x, y, rect.w, rect.h);
}

function drawNum(ctx, res, num, xr, y) {
  if (num < 0) throw "cannot print negative number";
  do {
    let digit = num % 10;
    xr -= res.digit_size.x;
    ctx.drawImage(res,
      res.digit_size.x * digit, 0, res.digit_size.x, res.digit_size.y,
      xr, y, res.digit_size.x, res.digit_size.y);
    num = (num - digit) / 10;
  }
  while (num > 0);
}

let Player = function () {
  this.getTime = () => 0;
  this.setUnits([""]);
  this.evels = [];
  this.master = { beatNum: 4, beatTempo: 120, beatClock: 480, measNum: 1, repeatMeas: 0, lastMeas: 0 };
  this.measureWidth = 192;
  this.unitOffsetY = 32;
}

Player.prototype.setUnits = function (units) {
  this.units = units;
  let l = Math.ceil(units.length/10) * 10;
  canvas.height = unitbars.regular_rect.h * l + unitbars.top_rect.h;
}

function drawUnitNote(ctx, x, y, w) {
  ctx.fillRect(x, y-1, w, 2);
  ctx.fillRect(x, y-2, Math.max(w-1, 0), 4);
  ctx.fillRect(x, y-3, Math.max(Math.min(2, w), 0), 6);
  ctx.fillRect(x, y-5, 1, 10);
}

function middleSnap(x) { return Math.floor(x) + 0.5; }

Player.prototype.drawUnits = function () {
  let i;
  drawImageRect(ctx, unitbars, unitbars.top_rect, 0, 0);
  ctx.translate(0, this.unitOffsetY);
  for (i = 0; i < 5; ++i)
    drawImageRect(ctx, unitbars, unitbars.side_rect, 0, unitbars.side_rect.h * i);
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  for (i = 0; i < this.units.length; ++i) {
    drawImageRect(ctx, unitbars, unitbars.regular_rect, unitbars.side_rect.w, i*unitbars.regular_rect.h);
    ctx.fillText(this.units[i],
      unitbars.side_rect.w + 5,
      (i + 0.5) * unitbars.regular_rect.h);
  }
  for ( ; i < 50; ++i)
    drawImageRect(ctx, unitbars, unitbars.nothing_rect, unitbars.side_rect.w, i*unitbars.nothing_rect.h);
  ctx.translate(0, -this.unitOffsetY);
}

Player.prototype.drawTimeline = function (currBeat, canvas) {
  let currClock = currBeat * this.master.beatClock;

  // - back -
  // global transform
  ctx.save(); // song position shift
  let shiftX = canvas.width/2;
  ctx.translate(shiftX, 0);
  // ctx.scale(2, 2);

  let playX = middleSnap(currBeat / this.master.beatNum) * this.measureWidth;
  ctx.translate(-playX, 0);

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

    // flags
    if (i + start == this.master.repeatMeas)
      drawImageRect(ctx, flags, flags.repeat_rect, box_left, 9);
    if (i + start == 0)
      drawImageRect(ctx, flags, flags.top_rect, box_left, 9);
    if (this.master.lastMeas && i + start == this.master.lastMeas)
      drawImageRect(ctx, flags, flags.last_rect, box_left-flags.last_rect.w, 9);
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
  start = canvasOffsetX;

  ctx.fillStyle = "#400070"; // unit rows
  for (let i = 0; i < this.units.length; ++i) {
    ctx.fillRect(start, i*16 + 1 + this.unitOffsetY, canvas.width, 15);
  }

  // notes
  let clockPerPx = this.master.beatClock * this.master.beatNum / this.measureWidth;
  ctx.fillStyle = "#F08000";
  // TODO: use interval tree to get the relevant notes to render
  // else it lags on big things
  for (let e of this.evels) {
    if (e.kind != "ON")
      continue;
    if (e.clock <= currClock && e.clock + e.value > currClock) {
      ctx.save();
      ctx.fillStyle = "#FFF000";
    }
    drawUnitNote(ctx, e.clock / clockPerPx, e.unit_no * 16 + 8 + this.unitOffsetY, e.value / clockPerPx);
    if (e.clock <= currClock && e.clock + e.value > currClock) ctx.restore();
  }

  // - playhead -
  ctx.save(); // playhead position
  ctx.fillStyle = "#FFFFFF";
  ctx.translate(currClock / clockPerPx, 23);
  ctx.drawImage(playhead, -playhead.centre.x, -playhead.centre.y);
  ctx.fillRect(0, 0, 1, canvas.height);
  ctx.restore(); // playhead position

  ctx.restore(); // song position shift
}
Player.prototype.draw = function () {
  // calculate time offset
  let currBeat = (() => {
    let currTime = this.getTime();
    let beat = currTime * this.master.beatTempo / 60;
    let lastBeat = (this.master.lastMeas || this.master.measNum) * this.master.beatNum;
    if (beat < lastBeat) return beat;
    let repeatBeat = this.master.repeatMeas * this.master.beatNum;
    return (beat - repeatBeat) % (lastBeat - repeatBeat) + repeatBeat;
  })();
  if (currBeat < 0) currBeat = 0;

  ctx.fillStyle = "#000010";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(0, 1); // widget offset

  ctx.save();
  let menuWidth = unitbars.regular_rect.w + unitbars.side_rect.w;
  ctx.translate(menuWidth, 0);
  this.drawTimeline(currBeat, { width: canvas.width - menuWidth, height: canvas.height });
  ctx.restore();
  // ctx.scale(2, 2);
  this.drawUnits();

  ctx.restore(); // widget offset
}

function drawLoading() {
  ctx.fillStyle = "#000010";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = "30px sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "hanging";
  ctx.fillText("Loading...", 10, 10);
}

Player.prototype.drawContinuously = function () {
  let k = this;
  function f(now) {
    k.draw();
    window.requestAnimationFrame(f);
  }
  drawLoading();
  waitForImages().then(() => f(performance.now()));
}

export var PlayerCanvas = new Player();
