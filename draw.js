"use strict";

import { SortedList } from "./lib/sorted-list.js"
import { DeferredQueue } from "./lib/deferred-queue.js"
import { getColorGen } from "./colors.js"

const DEFAULT_MASTER = {
  beatNum: 4, beatTempo: 120, beatClock: 480,
  measNum: 1, repeatMeas: 0, lastMeas: 0
};

// from pxtnEvelist.h
const DEFAULT_VOLUME   = 104;
const DEFAULT_VELOCITY = 104;
const DEFAULT_KEY      = 0x6000;
const BASE_MEASURE_WIDTH = 192;

const KEYBOARD_NOTE_NUM   = 88;
const KEYBOARD_BASE_SHIFT = 39;
const KEYBOARD_KEY_HEIGHT_SMALL  = 8;
const KEYBOARD_NOTE_HEIGHT_SMALL = 5;
const KEYBOARD_KEY_HEIGHT_BIG    = 16;
const KEYBOARD_NOTE_HEIGHT_BIG   = 8;

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

unitbars.menu_rect_unit = { x: 0,  y: 0,  w: 145, h: 16  };
unitbars.menu_rect_key  = { x: 0,  y: 16, w: 145, h: 16  };
unitbars.tab_rect       = { x: 0,  y: 32, w: 145, h: 16  };
unitbars.side_rect      = { x: 0,  y: 48, w: 16,  h: 160 };
unitbars.regular_rect   = { x: 16, y: 48, w: 128, h: 16  };
unitbars.selected_rect  = { x: 16, y: 64, w: 128, h: 16  };
unitbars.nothing_rect   = { x: 16, y: 80, w: 128, h: 16  };
unitbars.src = './res/unitbars.png';
const MENU_WIDTH = unitbars.regular_rect.w + unitbars.side_rect.w;

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

function middleSnap(x) { return Math.floor(x) + 0.5; }

let getColor = getColorGen(DEFAULT_VELOCITY, DEFAULT_VOLUME);

export let PlayerCanvas = function (canvas, canvasFixed, canvasMenu) {
  this.unitOffsetY = 32;
  this.canvas      = canvas;
  this.canvasFixed = canvasFixed;
  this.canvasMenu  = canvasMenu;

  this.lastDrawState = {}; // for avoiding redrawing the same thing
  this.getTime = () => 0;
  this.isStarted = () => false;

  this.setData([""], [], DEFAULT_MASTER);
  this.setZoom(1);
  this.setKeyZoom('small');
  this.setSnap('meas');
  this.setScale(1);
  this.addMenuListeners();
  this.view = "keyboard";
}

PlayerCanvas.prototype.toLocalCoords = function (point) {
  // TODO use currentTransform when it becomes more widely available
  return { x: point.x/this.scale, y: point.y/this.scale - 1 }
}

function rectContains(rect, point) {
  return (rect.x <= point.x && rect.y <= point.y &&
          rect.x + rect.w > point.x && rect.y + rect.h > point.y);
}

let unitTabRect = { x:45, y:0, w:39, h:15 };
let keyTabRect  = { x:84, y:0, w:61, h:15 };
let keyToggleRect  = { x:1,  y:1, w:18, h:14 };
let unitToggleRect = { x:19, y:1, w:18, h:14 };
PlayerCanvas.prototype.addMenuListeners = function() {
  // switch tab
  this.canvasFixed.addEventListener('click', (e) => {
    let coord = this.toLocalCoords({x:e.offsetX, y:e.offsetY});
    if (rectContains(unitTabRect, coord))
      this.view = 'unit';
    if (rectContains(keyTabRect, coord))
      this.view = 'keyboard';
    this.updateCanvasDims();
  });

  // toggle
  this.canvasMenu.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    let coord = this.toLocalCoords({x:e.offsetX, y:e.offsetY});
    coord.y -= this.unitOffsetY;
    coord.x -= unitbars.side_rect.w;
    for (let i = 0; i < this.units.length; ++i) {
      if (rectContains(keyToggleRect, coord))
        this.drawKey[i] = !this.drawKey[i];
      if (rectContains(unitToggleRect, coord))
        this.drawUnit[i] = !this.drawUnit[i];
      coord.y -= unitbars.regular_rect.h;
    }
    this.updateCanvasDims();
  });

  this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  this.canvasFixed.addEventListener('contextmenu', (e) => e.preventDefault());
}

PlayerCanvas.prototype.setZoom = function (zoom) {
  this.measureWidth = BASE_MEASURE_WIDTH * zoom;
}

PlayerCanvas.prototype.setKeyZoom = function (zoom) {
  switch (zoom) {
    case "small":
      this.keyboardKeyHeight  = KEYBOARD_KEY_HEIGHT_SMALL;
      this.keyboardNoteHeight = KEYBOARD_NOTE_HEIGHT_SMALL;
      break;
    case "big": default:
      this.keyboardKeyHeight  = KEYBOARD_KEY_HEIGHT_BIG;
      this.keyboardNoteHeight = KEYBOARD_NOTE_HEIGHT_BIG;
      break;
  }
  this.updateCanvasDims();
}

PlayerCanvas.prototype.setSnap  = function (snap) { this.snap = snap; };
PlayerCanvas.prototype.setScale = function (scale) {
  this.scale = scale;
  this.updateCanvasDims();
};

PlayerCanvas.prototype.setData = function(units, evels, master) {
  this.master = master;
  this.units = units;
  this.evels = new SortedList((x) => x.clock);

  let totalClock = master.beatClock * master.beatNum * master.measNum;
  this.notes = new Array(units.length);
  this.vels  = new Array(units.length);
  this.vols  = new Array(units.length);
  this.keys  = new Array(units.length);
  this.drawKey  = new Array(units.length);
  this.drawUnit = new Array(units.length);
  let that = this;
  for (let i = 0; i < units.length; ++i) {
    this.notes[i] = new SortedList((x) => evels[x].clock);
    this.vels [i] = new SortedList((x) => evels[x].clock);
    this.vols [i] = new SortedList((x) => evels[x].clock);
    this.keys [i] = new SortedList((x) => evels[x].clock);
    this.drawKey [i] = true;
    this.drawUnit[i] = false;
  }

  for (let i = 0; i < evels.length; ++i) {
    let e = evels[i];
    this.evels.push(e);
    switch (e.kind) {
      case "ON":       this.notes[e.unit_no].push(i); break;
      case "VELOCITY": this.vels [e.unit_no].push(i); break;
      case "VOLUME":   this.vols [e.unit_no].push(i); break;
      case "KEY":      this.keys [e.unit_no].push(i); break;
      default: break;
    }
  }

  this.forceRedraw();
  this.updateCanvasDims();
}

PlayerCanvas.prototype.updateCanvasDims = function () {
  let unitRowNum = Math.ceil(this.units.length/10) * 10;
  let height = unitbars.regular_rect.h * unitRowNum + unitbars.menu_rect_unit.h + unitbars.tab_rect.h;
  if (this.view === 'keyboard') {
    let keyHeight = this.unitOffsetY + this.keyboardKeyHeight * KEYBOARD_NOTE_NUM;
    if (keyHeight > height) height = keyHeight;
  }
  this.canvas.height = height * this.scale;
  this.canvasFixed.height = Math.min((this.unitOffsetY + 1) * this.scale, this.canvas.height);
  this.canvasMenu.width  = MENU_WIDTH * this.scale;
  this.canvasMenu.height = this.canvas.height;
  this.forceRedraw();
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

const UNIT_LIST_BGCOLOR = "#69656D";
PlayerCanvas.prototype.drawToggle = function(ctx, x, y, getColor) {
  ctx.save();
  ctx.translate(x+1, y+1);
  ctx.fillStyle = UNIT_LIST_BGCOLOR;
  ctx.fillRect(1, 1, 13, 9);
  ctx.fillStyle = getColor.key(0, 0, 0);
  ctx.fillRect(0, 0, 13, 9);
  ctx.fillStyle = getColor.note(0, 0, 0);
  ctx.fillRect(1, 1, 12, 8);
  ctx.restore();
}

const UNIT_TEXT_PADDING = 40;
PlayerCanvas.prototype.drawUnitList = function (ctx, height) {
  // left bar
  ctx.translate(0, this.unitOffsetY);
  for (let y = 0; y < height; y += unitbars.side_rect.h)
    drawImageRect(ctx, unitbars, unitbars.side_rect, 0, y);

  // rows
  let i;
  // 1. filled rows & text
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.save() // row translate
  ctx.translate(unitbars.side_rect.w, 0);
  for (i = 0; i < this.units.length; ++i) {
    drawImageRect(ctx, unitbars, unitbars.regular_rect, 0, 0);

    if (this.drawKey[i])
      this.drawToggle(ctx, 3, 2,  getColor[i % getColor.length]);
    if (this.drawUnit[i])
      this.drawToggle(ctx, 21, 2, getColor[i % getColor.length]);

    ctx.fillText(this.units[i], UNIT_TEXT_PADDING, unitbars.regular_rect.h / 2);
    ctx.translate(0, unitbars.regular_rect.h);
  }
  // 2. empty rows
  for (let y = i * unitbars.regular_rect.h; y < height; y += unitbars.regular_rect.h) {
    drawImageRect(ctx, unitbars, unitbars.nothing_rect, 0, 0);
    ctx.translate(0, unitbars.nothing_rect.h);
  }
  ctx.restore();

  ctx.translate(0, -this.unitOffsetY);
}

const BEATLINE_OFFSET = 25;
PlayerCanvas.prototype.drawBeatLines = function(ctx, canvasOffsetX, dimensions) {
  ctx.fillStyle = "#808080";
  let h = Math.max(0, dimensions.h - BEATLINE_OFFSET);
  let beatWidth = this.measureWidth / this.master.beatNum;
  let start = Math.floor(canvasOffsetX / beatWidth);
  for (let i = 0; i < dimensions.w / beatWidth + 1; ++i)
    ctx.fillRect((i + start) * beatWidth, 25, 1, h);
}

PlayerCanvas.prototype.drawMeasureLines = function(ctx, canvasOffsetX, dimensions) {
  ctx.fillStyle = "#F0F0F0";
  let start = Math.floor(canvasOffsetX / this.measureWidth);
  for (let i = 0; i < dimensions.w / this.measureWidth + 1; ++i)
    ctx.fillRect((i + start) * this.measureWidth, 0, 1, dimensions.h);
}

PlayerCanvas.prototype.drawRulers = function(ctx, canvasOffsetX, dimensions) {
  this.drawBeatLines(ctx, canvasOffsetX, dimensions);
  this.drawMeasureLines(ctx, canvasOffsetX, dimensions);
}

PlayerCanvas.prototype.drawMeasureMarkers = function(ctx, canvasOffsetX, dimensions) {
  ctx.fillStyle = BGCOLOR;
  ctx.fillRect(canvasOffsetX, 0, dimensions.w, dimensions.h);
  this.drawBeatLines(ctx, canvasOffsetX, dimensions);

  // measure markers
  let start = Math.floor(canvasOffsetX / this.measureWidth);
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

  // grey horizontal line above unit
  start = canvasOffsetX;
  ctx.fillStyle = "#808080";
  ctx.fillRect(start, 31, dimensions.w, 1);

  this.drawMeasureLines(ctx, canvasOffsetX, dimensions);
}

PlayerCanvas.prototype.clockPerPx = function () {
  return this.master.beatClock * this.master.beatNum / this.measureWidth;
}

PlayerCanvas.prototype.mctx = function () {
  return this.canvasMenu.getContext('2d');
}

PlayerCanvas.prototype.fctx = function () {
  return this.canvasFixed.getContext('2d');
}

PlayerCanvas.prototype.ctx = function () {
  return this.canvas.getContext('2d');
}

PlayerCanvas.prototype.drawPlayhead = function(ctx, currBeat, dimensions) {
  ctx.save(); // playhead position
  ctx.fillStyle = "#FFFFFF";
  let currClock = currBeat * this.master.beatClock;
  ctx.translate(currClock / this.clockPerPx(), 23);
  ctx.drawImage(playhead, -playhead.centre.x, -playhead.centre.y);
  ctx.fillRect(0, 0, 1, dimensions.h);
  ctx.restore(); // playhead position
}

// how much to translate by so that approximately the current time is in view
PlayerCanvas.prototype.getSongPositionShift = function(currBeat, dim_w) {
  let shiftX = Math.floor(dim_w/2);
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

PlayerCanvas.prototype.drawKeyboardNote = function(ctx, started, playing, highlight,
    unit_no, key, start, end, current) {
  let clockPerPx = this.clockPerPx();

  let offset = this.keyboardKeyHeight * (KEYBOARD_BASE_SHIFT + (DEFAULT_KEY - key) / 256);
  let y = offset + this.keyboardKeyHeight/2 - Math.floor(this.keyboardNoteHeight)/2;
  let w = (end - start) / clockPerPx;
  let vel = this.velocityAt(unit_no, current), vol = this.volumeAt(unit_no, current);
  ctx.fillStyle = getColor[unit_no % getColor.length].key(playing, vel, vol);
  ctx.fillRect(start / clockPerPx, y, (end - start) / clockPerPx, this.keyboardNoteHeight);
  if (highlight) {
    ctx.fillStyle = getColor[unit_no % getColor.length].note(playing, vel, vol);
    ctx.fillRect(start / clockPerPx, y, 2, this.keyboardNoteHeight);
  }
}

let pianoPattern = [false, true, false, true, false, false, true, false, true, false, false, true];
PlayerCanvas.prototype.drawKeyboardBack = function(ctx, canvasOffsetX, dimensions) {
  for (let i = 0; i < dimensions.h / this.keyboardKeyHeight; ++i) {
    let ind = ((i - KEYBOARD_BASE_SHIFT) % pianoPattern.length + pianoPattern.length) % pianoPattern.length;
    ctx.fillStyle = (pianoPattern[ind] ? "#202020" : "#404040");
    ctx.fillRect(canvasOffsetX, i * this.keyboardKeyHeight + 1, dimensions.w, this.keyboardKeyHeight-1);
  }
}

function drawKeyboardNoteForDeferredQueue(data) {
  data.obj.drawKeyboardNote(data.ctx, data.obj.isStarted(), data.playing, data.highlight,
    data.unit_no, data.currentKey, data.noteStart, data.noteEnd, data.currClock);
}

PlayerCanvas.prototype.drawKeyboard = function(ctx, unit_nos, canvasOffsetX, currBeat, dimensions) {
  let currClock = currBeat * this.master.beatClock;
  let clockPerPx = this.clockPerPx();

  // clock at left/right bound of visible area
  let leftBound  = clockPerPx * (canvasOffsetX);
  let rightBound = clockPerPx * (canvasOffsetX + dimensions.w);

  // an array of objects that can consume events in order and draw notes in response
  let unit_states = new Array(unit_nos.length);
  // set of evel indices that initiate a note crossing leftBound
  let first_presses = new SortedList((x) => x);
  // drawQueue is used so enforce notes starting earlier are drawn earlier.
  let drawQueue = new DeferredQueue(drawKeyboardNoteForDeferredQueue);

  for (let unit_no = 0; unit_no < unit_states.length; ++unit_no) {
    unit_states[unit_no] = null;
    if (unit_nos[unit_no] === false || this.notes[unit_no].length === 0)
      continue;

    let notes = this.notes[unit_no];
    let lastQueueId = null;

    let currentKey = this.keyAt(unit_no, leftBound);
    let noteStart = Infinity, noteEnd = Infinity;
    let playing = null;
    let highlight = null;

    // schedules a note to be drawn as soon as all starting before it are drawn
    let drawNote = (end) =>
      drawQueue.fill(lastQueueId, {
        'obj': this, 'ctx': ctx, 'playing': playing, 'highlight': highlight, 'unit_no': unit_no,
        'currentKey': currentKey, 'noteStart': noteStart, 'noteEnd': end, 'currClock': currClock
      });

    unit_states[unit_no] = {
      'consume': (e) => {
        if (e.clock >= noteEnd) { // if at end of note, draw just-finished note
          drawNote(noteEnd);
          playing = false;
          noteStart = Infinity; noteEnd = Infinity;
        }
        switch (e.kind) {
          case "ON":
            lastQueueId = drawQueue.add(); // start a new one (reserve its position)
            noteStart = e.clock; noteEnd = e.clock + e.value;
            // CONTROVERSIAL: entire press is highlighted instead of up to note
            // change. looks a bit weird but more faithful to the playback
            playing = noteStart <= currClock && currClock < noteEnd;
            highlight = true;
            break;
          case "KEY":
            // if in middle of note, draw just-finished note and start a new one
            if (e.clock > noteStart) {
              drawNote(e.clock);
              lastQueueId = drawQueue.add();
              // CONTROVERSIAL: editor puts highlights for a note change, but I
              // think it's more informative to do it when there's a new press.
              highlight = false;
              noteStart = e.clock;
            }
            currentKey = e.value;
            break;
          default: break;
        }
      },
      // draw the (possible) note continuation at end
      'conclude': () => { if (rightBound >= noteStart) drawNote(noteEnd); }
    };

    let start_id = notes.firstPositionOf(leftBound)-1;
    if (start_id !== -1) {
      let note = this.evels[notes[start_id]];
      if (note.clock + note.value > leftBound)
        first_presses.insert(notes[start_id]);
    }
  }

  // activate all the possible notes that cross the left bound
  for (let i of first_presses) {
    let e = this.evels[i];
    unit_states[e.unit_no].consume(e);
  }

  // process all evels in range
  for (let i = this.evels.firstPositionOf(leftBound);
       i < this.evels.length && this.evels[i].clock < rightBound;
       ++i) {
    let e = this.evels[i];
    if (unit_states[e.unit_no] !== null)
      unit_states[e.unit_no].consume(e);
  }

  // possibly draw continuations
  for (let state of unit_states) if (state !== null) state.conclude();
}

PlayerCanvas.prototype.drawUnitRows = function(ctx, canvasOffsetX, currBeat, dimensions) {
  let currClock = currBeat * this.master.beatClock;
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
      ctx.fillStyle = getColor[unit_no % getColor.length].note(playing,
        this.velocityAt(e.unit_no, currClock), this.volumeAt(e.unit_no, currClock));
      drawUnitNote(ctx, e.clock / clockPerPx, unit_no * 16 + 8, e.value / clockPerPx);
    }
  }
}

PlayerCanvas.prototype.withSongPositionShift = function (ctx, currBeat, dim_w, f) {
  let canvasOffsetX = -this.getSongPositionShift(currBeat, dim_w);
  ctx.translate(-canvasOffsetX, 0);
  f(canvasOffsetX);
  ctx.translate(canvasOffsetX, 0);
}

PlayerCanvas.prototype.withWidgetTransform = function (ctx, f) {
  ctx.save();
  ctx.scale(this.scale, this.scale);
  ctx.translate(0, 1);

  ctx.save();
  f();
  ctx.restore();
  ctx.restore();
}

PlayerCanvas.prototype.drawTimeline = function (ctx, currBeat, dimensions) {
  this.withSongPositionShift(ctx, currBeat, dimensions.w, (canvasOffsetX) => {
    this.drawRulers(ctx, canvasOffsetX, dimensions);

    ctx.translate(0, this.unitOffsetY); // top bar offset
    switch (this.view) {
      case "keyboard":
        this.drawKeyboardBack(ctx, canvasOffsetX, dimensions);
        this.drawKeyboard(ctx, this.drawKey, canvasOffsetX, currBeat, dimensions);
        break;
      case "unit":
      default:
        this.drawUnitRows(ctx, canvasOffsetX, currBeat, dimensions);
        break;
    }
    ctx.translate(0, -this.unitOffsetY);
    this.drawPlayhead(ctx, currBeat, dimensions);
  });
}

// sometimes you don't have to redraw if nothing's changed
PlayerCanvas.prototype.forceRedraw = function () {
  this.lastDrawState = {};
}

PlayerCanvas.prototype.needToDraw = function () {
  let last = this.lastDrawState;
  let now = {
    time:   this.getTime(), // canvasOffsetX is not enough - playhead & highlighted notes change
    width:  this.canvas.width,
    height: this.canvas.height,
    scale:  this.scale,
    view:   this.view,
    snap:   this.snap,
    zoom:   this.measureWidth,
    key_height:  this.keyboardKeyHeight,
    note_height: this.keyboardNoteHeight
  }
  let need = false;
  for (let prop in now)
    if (now[prop] !== last[prop]) {
      need = true;
      last[prop] = now[prop];
    }
  return need;
}

const BGCOLOR = "#000010";
PlayerCanvas.prototype.draw = function () {
  if (!this.needToDraw()) return;

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

  let getDims = (canvas) => {
    return { w: canvas.width / this.scale - MENU_WIDTH, h: canvas.height / this.scale };
  }

  let ctx = this.ctx();
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = BGCOLOR;
  ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  this.withWidgetTransform(ctx, () => {
    ctx.save();
    ctx.translate(MENU_WIDTH, 0);
    let dimensions = getDims(this.canvas);
    this.drawTimeline(ctx, currBeat, dimensions);
    ctx.restore();
  });

  ctx = this.mctx();
  ctx.imageSmoothingEnabled = false;
  this.withWidgetTransform(ctx, () => {
    let dimensions = getDims(this.canvasMenu);
    this.drawUnitList(ctx, dimensions.h);
  });

  // top
  ctx = this.fctx();
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, this.canvasFixed.width, this.canvasFixed.height);

  this.withWidgetTransform(ctx, () => {
    ctx.save(); // top-left tab shift
    ctx.translate(MENU_WIDTH, 0);
    let dimensions = getDims(this.canvasFixed);
    this.withSongPositionShift(ctx, currBeat, dimensions.w, (canvasOffsetX) => {
      this.drawMeasureMarkers(ctx, canvasOffsetX, dimensions);
      this.drawPlayhead(ctx, currBeat, dimensions);
    });
    ctx.restore();

    // top-left tabs
    let rect;
    switch (this.view) {
      case "keyboard":      rect = unitbars.menu_rect_key; break;
      case "unit": default: rect = unitbars.menu_rect_unit; break;
    }
    drawImageRect(ctx, unitbars, rect, 0, 0);
    drawImageRect(ctx, unitbars, unitbars.tab_rect, 0, rect.h);

    ctx.fillStyle = BGCOLOR; // fill widget offset remainder
    ctx.fillRect(0, -1, this.canvas.width, 1);
  });
}

PlayerCanvas.prototype.drawLoading = function () {
  let ctx = this.ctx();
  ctx.fillStyle = "#000010";
  ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

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
