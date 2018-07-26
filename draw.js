"use strict";

import { SortedList } from "./lib/sorted-list.js"

const canvas = document.getElementById('player');

const numbers_green = new Image(80, 8);
const flags = new Image(81, 16);
const playhead = new Image(9, 5);
const unitbars = new Image(145, 192);
numbers_green.src = './res/numbers_green.png';
numbers_green.digit_size = { x: 8, y: 8 };

flags.src = './res/flags.png';
flags.top_rect    = { x: 0,  y: 0, w: 36, h: 8 };
flags.last_rect   = { x: 45, y: 0, w: 35, h: 8 };
flags.repeat_rect = { x: 0,  y: 8, w: 36, h: 8 };

playhead.centre = { x: 4, y: 4 };
playhead.src = './res/playhead.png';

unitbars.top_rect      = { x: 0,  y: 0,  w: 145, h: 32  };
unitbars.side_rect     = { x: 0,  y: 32, w: 16,  h: 160 };
unitbars.regular_rect  = { x: 16, y: 32, w: 128, h: 16  };
unitbars.selected_rect = { x: 16, y: 48, w: 128, h: 16  };
unitbars.nothing_rect  = { x: 16, y: 64, w: 128, h: 16  };
unitbars.src = './res/unitbars.png';

var imagesToLoad = [numbers_green, flags, playhead, unitbars];
// we don't wait for the onloads to be called in case some were already loaded
// instead we just poll this boolean function
function imagesLoaded() {
  return imagesToLoad.every((img) => img.complete);
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

function drawUnitNote(ctx, x, y, w) {
  ctx.fillRect(x, y-1, w, 2);
  ctx.fillRect(x, y-2, Math.max(w-1, 0), 4);
  ctx.fillRect(x, y-3, Math.max(Math.min(2, w), 0), 6);
  ctx.fillRect(x, y-5, 1, 10);
}

function noteColorGen(r1, g1, r2, g2, b2, b3) {
  // interpolate c1 to c2 until default velocities and volume
  // c2 to c3 from to max velocity and volume
  return function (is_playing, vel, vol) {
    let r, g, b;
    if (!is_playing) { r = r1; g = g1; b = b2; }
    else {
      let raw_p = vel * vol / 128 / 128;
      let def_p = DEFAULT_VELOCITY * DEFAULT_VOLUME / 128 / 128;
      let p = Math.min((0.15 + 0.85 * (vel / DEFAULT_VELOCITY)) * vol / DEFAULT_VOLUME, 1);
      let pb = Math.max(0, (raw_p - def_p) / (1 - def_p));
      r = r2 * p + (1 - p) * r1;
      g = g2 * p + (1 - p) * g1;
      b = b3 * pb + (1 - pb) * b2;
    }
    return "rgb(" + r + ", " + g + ", " + b + ")";
  }
}

let noteColor = (function () {
  let r1 = 240, g1 = 128;
  let r2 = 255, g2 = 255, b2 = 0;
  let                     b3 = 128;
  return noteColorGen(r1, g1, r2, g2, b2, b3);
})();

let keyboardNoteColor = (function () {
  let r1 = 192, g1 = 96;
  let r2 = 240, g2 = 128, b2 = 0;
  let                     b3 = 0;
  return noteColorGen(r1, g1, r2, g2, b2, b3);
})();

function middleSnap(x) { return Math.floor(x) + 0.5; }


const DEFAULT_MASTER = {
  beatNum: 4, beatTempo: 120, beatClock: 480,
  measNum: 1, repeatMeas: 0, lastMeas: 0
};

// from pxtnEvelist.h
const DEFAULT_VOLUME   = 104;
const DEFAULT_VELOCITY = 104;
const DEFAULT_KEY      = 0x6000;
const BASE_MEASURE_WIDTH = 192;

export let PlayerCanvas = function (canvas) {
  this.unitOffsetY = 32;
  this.canvas = canvas;

  this.getTime = () => 0;
  this.isStarted = () => false;

  this.setData([""], [], DEFAULT_MASTER);
  this.setZoom(1);
  this.setSnap('meas');
  this.setScale(1);
}

PlayerCanvas.prototype.setZoom = function (zoom) {
  this.measureWidth = BASE_MEASURE_WIDTH * zoom;
}

PlayerCanvas.prototype.setSnap  = function (snap) { this.snap = snap; };
PlayerCanvas.prototype.setScale = function (scale) {
  this.scale = scale;
  this.updateCanvasHeight();
};

PlayerCanvas.prototype.setData = function(units, evels, master) {
  this.master = master;
  this.setUnits(units);
  this.evels = evels;

  let totalClock = master.beatClock * master.beatNum * master.measNum;
  this.notes = new Array(units.length);
  this.vels  = new Array(units.length);
  this.vols  = new Array(units.length);
  this.keys  = new Array(units.length);
  let that = this;
  for (let i = 0; i < units.length; ++i) {
    this.notes[i] = new SortedList((x) => evels[x].clock);
    this.vels [i] = new SortedList((x) => evels[x].clock);
    this.vols [i] = new SortedList((x) => evels[x].clock);
    this.keys [i] = new SortedList((x) => evels[x].clock);
  }

  for (let i = 0; i < evels.length; ++i) {
    let e = evels[i];
    switch (e.kind) {
      case "ON":       this.notes[e.unit_no].push(i); break;
      case "VELOCITY": this.vels [e.unit_no].push(i); break;
      case "VOLUME":   this.vols [e.unit_no].push(i); break;
      case "KEY":      this.keys [e.unit_no].push(i); break;
      default: break;
    }
  }

}

PlayerCanvas.prototype.setUnits = function (units) {
  this.units = units;
  this.updateCanvasHeight();
}

PlayerCanvas.prototype.updateCanvasHeight = function () {
  let l = Math.ceil(this.units.length/10) * 10;
  canvas.height = (unitbars.regular_rect.h * l + unitbars.top_rect.h) * this.scale;
}

PlayerCanvas.prototype.velocityAt = function (unit_no, clock) {
  let i = this.vels[unit_no].lastPositionOf(clock);
  if (i == -1) return DEFAULT_VELOCITY;
  return this.evels[this.vels[unit_no][i]].value;
}

PlayerCanvas.prototype.volumeAt = function (unit_no, clock) {
  let i = this.vols[unit_no].lastPositionOf(clock);
  if (i == -1) return DEFAULT_VOLUME;
  return this.evels[this.vols[unit_no][i]].value;
}

PlayerCanvas.prototype.keyAt = function (unit_no, clock) {
  let i = this.keys[unit_no].lastPositionOf(clock);
  if (i == -1) return DEFAULT_KEY;
  return this.evels[this.keys[unit_no][i]].value;
}

PlayerCanvas.prototype.drawUnitList = function () {
  let ctx = this.ctx();
  // top
  drawImageRect(ctx, unitbars, unitbars.top_rect, 0, 0);

  // left bar
  ctx.translate(0, this.unitOffsetY);
  for (let i = 0; i < 5; ++i)
    drawImageRect(ctx, unitbars, unitbars.side_rect, 0, unitbars.side_rect.h * i);

  // rows
  let i;
  // 1. filled rows & text
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  for (i = 0; i < this.units.length; ++i) {
    drawImageRect(ctx, unitbars, unitbars.regular_rect, unitbars.side_rect.w, i*unitbars.regular_rect.h);
    ctx.fillText(this.units[i],
      unitbars.side_rect.w + 5,
      (i + 0.5) * unitbars.regular_rect.h);
  }
  // 2. empty rows
  for ( ; i < 50; ++i)
    drawImageRect(ctx, unitbars, unitbars.nothing_rect, unitbars.side_rect.w, i*unitbars.nothing_rect.h);

  ctx.translate(0, -this.unitOffsetY);
}

PlayerCanvas.prototype.drawRulers = function(canvasOffsetX, dimensions) {
  let ctx = this.ctx();
  let start; // used to get the ruler offsets in the scroll view
  // beat lines
  ctx.fillStyle = "#808080";
  let beatWidth = this.measureWidth / this.master.beatNum;
  start = Math.floor(canvasOffsetX / beatWidth);
  for (let i = 0; i < dimensions.w / beatWidth + 1; ++i)
    ctx.fillRect((i + start) * beatWidth, 25, 1, dimensions.h);

  // measure markers
  start = Math.floor(canvasOffsetX / this.measureWidth);
  for (let i = 0; i < dimensions.w / this.measureWidth + 1; ++i) {
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
  ctx.fillRect(start, 31, dimensions.w, 1);

  // measure lines
  ctx.fillStyle = "#F0F0F0";
  start = Math.floor(canvasOffsetX / this.measureWidth);
  for (let i = 0; i < dimensions.w / this.measureWidth + 1; ++i)
    ctx.fillRect((i + start) * this.measureWidth, 0, 1, dimensions.h);
}

PlayerCanvas.prototype.clockPerPx = function () {
  return this.master.beatClock * this.master.beatNum / this.measureWidth;
}

PlayerCanvas.prototype.ctx = function () {
  return this.canvas.getContext('2d');
}

PlayerCanvas.prototype.drawPlayhead = function(currBeat, dimensions) {
  let ctx = this.ctx();
  ctx.save(); // playhead position
  ctx.fillStyle = "#FFFFFF";
  let currClock = currBeat * this.master.beatClock;
  ctx.translate(currClock / this.clockPerPx(), 23);
  ctx.drawImage(playhead, -playhead.centre.x, -playhead.centre.y);
  ctx.fillRect(0, 0, 1, dimensions.h);
  ctx.restore(); // playhead position
}

// how much to translate by so that approximately the current time is in view
PlayerCanvas.prototype.getSongPositionShift = function(currBeat, dimensions) {
  let shiftX = Math.floor(dimensions.w/2);
  let playX;
  switch (this.snap) {
    case 'beat':
      playX = middleSnap(currBeat) / this.master.beatNum * this.measureWidth;
      break;
    case 'meas':
      playX = middleSnap(currBeat / this.master.beatNum) * this.measureWidth;
      break;
    default:
      playX = currBeat / this.master.beatNum * this.measureWidth;
      break;
  }
  return shiftX - playX;
}

PlayerCanvas.prototype.drawKeyboardNote = function(started, unit_no, key, start, end, current) {
  let playing = (started && start <= current && end > current);
  let clockPerPx = this.clockPerPx();
  let ctx = this.ctx();

  ctx.fillStyle = keyboardNoteColor(playing, this.velocityAt(unit_no, current), this.volumeAt(unit_no, current));
  ctx.fillRect(start / clockPerPx, 4 + (DEFAULT_KEY - key)/16, (end - start) / clockPerPx, 8);
  ctx.fillStyle = noteColor(playing, this.velocityAt(unit_no, current), this.volumeAt(unit_no, current));
  ctx.fillRect(start / clockPerPx, 4 + (DEFAULT_KEY - key)/16, 2, 8);
}

let pianoPattern = [false, true, false, true, false, false, true, false, true, false, false, true];
PlayerCanvas.prototype.drawKeyboard = function(unit_no, canvasOffsetX, currBeat, dimensions) {
  let currClock = currBeat * this.master.beatClock;
  let clockPerPx = this.clockPerPx();
  let ctx = this.ctx();
  for (let i = 0; i < dimensions.h / 16; ++i) {
    ctx.fillStyle = (pianoPattern[i % pianoPattern.length] ? "#202020" : "#404040");
    ctx.fillRect(canvasOffsetX, i * 16 + 1, dimensions.w, 15);
  }

  // clock at left/right bound of visible area
  let leftBound  = clockPerPx * canvasOffsetX;
  let rightBound = clockPerPx * (canvasOffsetX + dimensions.w);

  let currentKey = this.keyAt(unit_no, leftBound);
  let noteStart = Infinity, noteEnd = Infinity;
  let drawNote = (end) => this.drawKeyboardNote(this.isStarted(), unit_no, currentKey, noteStart, end, currClock);
  for (let i = Math.max(this.notes[unit_no].lastPositionOf(leftBound), 0);
       i < this.evels.length && this.evels[i].clock < rightBound;
       ++i) {
    let e = this.evels[i];
    if (e.unit_no !== unit_no) continue;
    if (e.clock >= noteEnd) { // if at end of note, draw just-finished note
      drawNote(noteEnd);
      noteStart = Infinity; noteEnd = Infinity;
    }
    switch (e.kind) {
      case "ON": noteStart = e.clock; noteEnd = e.clock + e.value; break;
      case "KEY": 
        // if in middle of note, draw just-finished note
        if (e.clock > noteStart) drawNote(e.clock);
        currentKey = e.value;
        noteStart = e.clock;
        break;
      default: break;
    }
  }
  if (rightBound >= noteEnd) drawNote(noteEnd);
}

PlayerCanvas.prototype.drawUnitRows = function(canvasOffsetX, currBeat, dimensions) {
  let currClock = currBeat * this.master.beatClock;
  let ctx = this.ctx();
  let clockPerPx = this.clockPerPx();

  // clock at left/right bound of visible area
  let leftBound  = clockPerPx * canvasOffsetX;
  let rightBound = clockPerPx * (canvasOffsetX + dimensions.w);

  for (let unit_no = 0; unit_no < this.units.length; ++unit_no) {
    // row background
    ctx.fillStyle = "#400070";
    ctx.fillRect(canvasOffsetX, unit_no*16 + 1, dimensions.w, 15);

    ctx.fillStyle = "#F08000";
    let notes = this.notes[unit_no];
    let leftIndex  = Math.max(notes.lastPositionOf(leftBound), 0);
    let rightIndex = Math.min(notes.firstPositionOf(rightBound), notes.length);
    for (let i = leftIndex; i < rightIndex; ++i) {
      let e = this.evels[notes[i]];
      let playing = (this.isStarted() && e.clock <= currClock && e.clock + e.value > currClock);
      ctx.fillStyle = noteColor(playing,
        this.velocityAt(e.unit_no, currClock), this.volumeAt(e.unit_no, currClock));
      drawUnitNote(ctx, e.clock / clockPerPx, unit_no * 16 + 8, e.value / clockPerPx);
    }
  }
}

PlayerCanvas.prototype.drawTimeline = function (currBeat, dimensions) {
  this.ctx().save(); // song position shift

  let canvasOffsetX = -this.getSongPositionShift(currBeat, dimensions);
  this.ctx().translate(-canvasOffsetX, 0);

  this.drawRulers(canvasOffsetX, dimensions);

  this.ctx().translate(0, this.unitOffsetY); // top bar offset

  this.drawUnitRows(canvasOffsetX, currBeat, dimensions);
  // this.drawKeyboard(0, canvasOffsetX, currBeat, dimensions);

  this.ctx().translate(0, -this.unitOffsetY);

  this.drawPlayhead(currBeat, dimensions);

  this.ctx().restore(); // song position shift
}

PlayerCanvas.prototype.draw = function () {
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
  let ctx = this.ctx();
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = "#000010";
  ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  ctx.save(); // widget offset and scale
  ctx.scale(this.scale, this.scale);
  ctx.translate(0, 1);

  ctx.save();
  let menuWidth = unitbars.regular_rect.w + unitbars.side_rect.w;
  ctx.translate(menuWidth, 0);
  let dimensions = {
    w: this.canvas.width/this.scale - menuWidth,
    h: this.canvas.height/this.scale
  };
  this.drawTimeline(currBeat, dimensions);
  ctx.restore();
  this.drawUnitList();

  ctx.restore(); // widget offset and scale
}

PlayerCanvas.prototype.drawLoading = function () {
  let ctx = this.ctx();
  ctx.fillStyle = "#000010";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = "30px sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "hanging";
  ctx.fillText("Loading...", 10, 10);
}

PlayerCanvas.prototype.drawContinuously = function () {
  let k = this;
  function waitForLoadDraw(now) {
    function afterLoadDraw(now) {
      k.draw();
      window.requestAnimationFrame(afterLoadDraw);
    }
    if (imagesLoaded()) afterLoadDraw(performance.now());
    else {
      k.drawLoading();
      window.requestAnimationFrame(waitForLoadDraw);
    }
  }
  waitForLoadDraw(performance.now());
}
