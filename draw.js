"use strict";

import { IntervalTree } from "./interval-tree/interval-tree.js"
import { SortedList }   from "./interval-tree/sorted-list.js"

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

function noteColor(is_playing, vel, vol) {
  let r1 = 240, g1 = 128;          // interpolate c1 to c2 until default velocities and volume
  let r2 = 255, g2 = 255, b2 = 0;  // c2 to c3 from to max velocity and volume
  let                     b3 = 128;
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

function middleSnap(x) { return Math.floor(x) + 0.5; }


const DEFAULT_MASTER = {
  beatNum: 4, beatTempo: 120, beatClock: 480,
  measNum: 1, repeatMeas: 0, lastMeas: 0
};

const DEFAULT_VOLUME   = 104;
const DEFAULT_VELOCITY = 104;
const BASE_MEASURE_WIDTH = 192;

export let PlayerCanvas = function (canvas) {
  this.unitOffsetY = 32;
  this.canvas = canvas;
  let ctx = this.canvas.getContext('2d');

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
  this.setUnits(units);

  let totalClock = master.beatClock * master.beatNum * master.measNum;
  this.notes = [];
  this.notesIndex = new IntervalTree(totalClock/2);
  this.volumes = new Array(units.length);
  for (let i = 0; i < units.length; ++i)
    this.volumes[i] = new SortedList((x) => x.clock);

  // function to call in increasing clock order to assign velocities to on events
  let assignNoteVel = (() => {
    let latestNotes = (new Array(units.length)).fill(null);
    let latestVels  = (new Array(units.length)).fill(null);
    return (function(note, vel) {
      let unit_no = null;
      if (note !== null) {
        unit_no = note.unit_no;
        latestNotes[unit_no] = note;
      }
      if (vel !== null) {
        unit_no = vel.unit_no;
        latestVels[unit_no] = vel;
      }
      if (latestNotes[unit_no] !== null && latestVels[unit_no] !== null
          && latestNotes[unit_no].clock == latestVels[unit_no].clock)
        latestNotes[unit_no].vel = latestVels[unit_no].value;
    })
  })();

  for (let e of evels) {
    switch (e.kind) {
      case "ON":
        assignNoteVel(e, null);
        this.notes.push(e);
        this.notesIndex.add(e.clock, e.clock + e.value, this.notes.length-1);
        break;
      case "VELOCITY":
        assignNoteVel(null, e);
        break;
      case "VOLUME":
        this.volumes[e.unit_no].insert(e);
        break;
      default:
        break;
    }
  }

  this.master = master;
}

PlayerCanvas.prototype.setUnits = function (units) {
  this.units = units;
  this.updateCanvasHeight();
}

PlayerCanvas.prototype.updateCanvasHeight = function () {
  let l = Math.ceil(this.units.length/10) * 10;
  canvas.height = (unitbars.regular_rect.h * l + unitbars.top_rect.h) * this.scale;
}
PlayerCanvas.prototype.volumeAt = function (unit_no, clock) {
  let i = this.volumes[unit_no].lastPositionOf({ clock: clock });
  if (i == -1) return DEFAULT_VOLUME;
  return this.volumes[unit_no][i].value;
}

PlayerCanvas.prototype.drawUnits = function () {
  let ctx = this.canvas.getContext('2d');
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

PlayerCanvas.prototype.drawTimeline = function (currBeat, dimensions) {
  let currClock = currBeat * this.master.beatClock;
  let ctx = this.canvas.getContext('2d');

  // - back -
  // global transform
  ctx.save(); // song position shift

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
  ctx.translate(shiftX, 0);
  ctx.translate(-playX, 0);

  let canvasOffsetX = playX - shiftX;

  // - rulers -
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

  // unit rows
  start = canvasOffsetX;

  ctx.fillStyle = "#400070"; // unit rows
  for (let i = 0; i < this.units.length; ++i) {
    ctx.fillRect(start, i*16 + 1 + this.unitOffsetY, dimensions.w, 15);
  }

  // notes
  let clockPerPx = this.master.beatClock * this.master.beatNum / this.measureWidth;
  ctx.fillStyle = "#F08000";
  // TODO: use interval tree to get the relevant notes to render
  // else it lags on big things
  // clock at left/right bound of visible area
  let leftBound = canvasOffsetX * clockPerPx;
  let rightBound = (canvasOffsetX + dimensions.w) * clockPerPx;
  this.notesIndex.rangeSearch(leftBound, rightBound).forEach((interval) => {
    let e = this.notes[interval.id];
    let playing = (this.isStarted() && e.clock <= currClock && e.clock + e.value > currClock);

    ctx.fillStyle = noteColor(playing, e.vel, this.volumeAt(e.unit_no, currClock));
    drawUnitNote(ctx, e.clock / clockPerPx, e.unit_no * 16 + 8 + this.unitOffsetY, e.value / clockPerPx);
  });

  // - playhead -
  ctx.save(); // playhead position
  ctx.fillStyle = "#FFFFFF";
  ctx.translate(currClock / clockPerPx, 23);
  ctx.drawImage(playhead, -playhead.centre.x, -playhead.centre.y);
  ctx.fillRect(0, 0, 1, dimensions.h);
  ctx.restore(); // playhead position

  ctx.restore(); // song position shift
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
  let ctx = this.canvas.getContext('2d');
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
  this.drawUnits();

  ctx.restore(); // widget offset and scale
}

PlayerCanvas.prototype.drawLoading = function () {
  let ctx = this.canvas.getContext('2d');
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
