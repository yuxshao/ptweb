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
const KEYBOARD_ROW_HEIGHTS = {
  "tiny":  { "key": 4,  "note": 3 },
  "small": { "key": 8,  "note": 5 },
  "big":   { "key": 16, "note": 8 }
};

const numbers_green = new Image(80, 8);
const flags = new Image(81, 16);
const playhead = new Image(9, 5);
const unitbars = new Image(145, 192);

window.RESOURCE_URL = (window.RESOURCE_URL || './res');
numbers_green.src = window.RESOURCE_URL + '/numbers_green.png';
numbers_green.digit_size = { x: 8, y: 8 };

flags.src = window.RESOURCE_URL + '/flags.png';
flags.top_rect    = { x: 0,  y: 0, w: 36, h: 8 };
flags.last_rect   = { x: 45, y: 0, w: 35, h: 8 };
flags.repeat_rect = { x: 0,  y: 8, w: 36, h: 8 };

playhead.centre = { x: 4, y: 4 };
playhead.src = window.RESOURCE_URL + '/playhead.png';

unitbars.menu_rect_unit = { x: 0,  y: 0,  w: 144, h: 16  };
unitbars.menu_rect_key  = { x: 0,  y: 16, w: 144, h: 16  };
unitbars.menu_rect_arrc = { x: 16, y: 96,  w: 36, h: 16  };

unitbars.tab_rect       = { x: 0,  y: 32, w: 144, h: 16  };
unitbars.side_rect      = { x: 0,  y: 48, w: 16,  h: 160 };

unitbars.regular_rect   = { x: 16, y: 48, w: 128, h: 16  };
unitbars.selected_rect  = { x: 16, y: 64, w: 128, h: 16  };
unitbars.nothing_rect   = { x: 16, y: 80, w: 128, h: 16  };

unitbars.src = window.RESOURCE_URL + '/unitbars.png';
const MENU_WIDTH = unitbars.menu_rect_unit.w;
const COLLAPSED_MENU_WIDTH = unitbars.menu_rect_arrc.w;

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

export let PlayerCanvas = function (dom) {
  this.dom = dom;
  console.log(dom);

  this.lastDrawState = {}; // for avoiding redrawing the same thing
  this.getTime = () => 0;
  this.isStarted = () => false;

  this.initDrawOptions();
  this.setData([""], [], DEFAULT_MASTER);
  this.addListeners();
}

PlayerCanvas.prototype.toLocalCoords = function (point) {
  // TODO use currentTransform when it becomes more widely available
  return { x: point.x/this.drawOptions.scale,
           y: point.y/this.drawOptions.scale };
}

function rectContains(rect, point) {
  return (rect.x <= point.x && rect.y <= point.y &&
          rect.x + rect.w > point.x && rect.y + rect.h > point.y);
}

let unitTabRect = { x:44, y:0, w:39, h:15 };
let keyTabRect  = { x:83, y:0, w:61, h:15 };
let arrTabRect  = { x:0,  y:0, w:44, h:15 };
let arrcTabRect = { x:0,  y:0, w:36, h:15 };
let keyToggleRect  = { x:1,  y:1, w:18, h:14 };
let unitToggleRect = { x:19, y:1, w:18, h:14 };

PlayerCanvas.prototype.addListeners = function() {
  window.addEventListener('resize', () => this.updateCanvasDims(), false);
  this.updateCanvasDims();

  // switch tab
  this.dom.canvasFixedMenu.addEventListener('mousedown', (e) => {
    let coord = this.toLocalCoords({x:e.offsetX, y:e.offsetY});
    if (!this.drawOptions.collapsed_menu) {
      if (rectContains(unitTabRect, coord))
        this.setView('unit');
      if (rectContains(keyTabRect, coord))
        this.setView('keyboard');
      if (rectContains(arrTabRect, coord))
        this.setCollapsedMenu(true);
    } else if (rectContains(arrcTabRect, coord))
      this.setCollapsedMenu(false);
    this.updateCanvasDims();
    this.forceRedraw();
  });

  // toggle on pinned
  this.dom.canvasFixedMenu.addEventListener('mousedown', (e) => {
    let coord = this.toLocalCoords({x:e.offsetX, y:e.offsetY});
    coord.y -= unitbars.menu_rect_key.h + unitbars.tab_rect.h;
    coord.x -= unitbars.side_rect.w;
    this.handleToggle(e, coord, true);
    this.updateCanvasDims();
    this.forceRedraw();
  });

  // seek
  this.dom.canvasFixed.addEventListener('mousedown', (e) => {
    let coord = this.toLocalCoords({x:e.offsetX, y:e.offsetY});
    let currBeat = this.getCurrBeat();
    let seekPosPx = coord.x - this.getSongPositionShift(currBeat,
                      this.dom.canvasFixed.width / this.drawOptions.scale);
    let seekBeat = seekPosPx / this.measureWidth * this.master.beatNum;
    if (seekBeat >= 0 && seekBeat < this.getLastBeat())
      this.audioSeek(seekBeat / this.master.beatTempo * 60);

    this.updateCanvasDims();
    this.forceRedraw();
  });
  // TODO draw shadow playhead over mouse position on timeline

  // force redraw
  this.dom.canvas.addEventListener('mousedown', (e) => {
    this.updateCanvasDims();
    this.forceRedraw();
  });

  // toggle on unpinned
  this.dom.canvasMenu.addEventListener('mousedown', (e) => {
    let coord = this.toLocalCoords({x:e.offsetX, y:e.offsetY});
    // coord.y -= this.unitOffsetY;
    coord.x -= unitbars.side_rect.w;
    this.handleToggle(e, coord, false);
    this.updateCanvasDims();
    this.forceRedraw();
  });

  // disable contextmenu
  for (let c of ["canvas", "canvasFixed", "canvasMenu", "canvasFixedMenu"])
    this.dom[c].addEventListener('contextmenu', (e) => e.preventDefault());
}

PlayerCanvas.prototype.handleToggle = function (e, coord, pinned) {
  if (e.button !== 0 && e.button !== 2) return; // not left nor right
  for (let i = 0; i < this.units.length; ++i) {
    let opt = this.drawOptions.unit[i];
    if (pinned !== null && this.drawOptions.unit[i].pinned !== pinned) continue;
    if (rectContains(keyToggleRect, coord)) {
      if (e.button === 0) opt.key = !opt.key;
      else if (e.button === 2 && opt.key) opt.color = (opt.color + 1) % getColor.length;
    }
    if (rectContains(unitToggleRect, coord)) {
      if (e.button === 0) opt.pinned = !opt.pinned;
      else if (e.button === 2 && opt.pinned) opt.color = (opt.color + 1) % getColor.length;
    }
    coord.y -= unitbars.regular_rect.h;
  }
  this.applyDrawOptions();
}

PlayerCanvas.prototype.setData = function(units, evels, master, clear_unit=false) {
  this.master = master;
  this.units = units;
  this.evels = new SortedList((x) => x.clock);

  let totalClock = master.beatClock * master.beatNum * master.measNum;
  this.notes = new Array(units.length);
  this.vels  = new Array(units.length);
  this.vols  = new Array(units.length);
  this.keys  = new Array(units.length);
  if (this.drawOptions.unit === undefined || clear_unit) this.drawOptions.unit = new Array();
  for (let i = 0; i < units.length; ++i) {
    this.notes[i] = new SortedList((x) => evels[x].clock);
    this.vels [i] = new SortedList((x) => evels[x].clock);
    this.vols [i] = new SortedList((x) => evels[x].clock);
    this.keys [i] = new SortedList((x) => evels[x].clock);
    if (this.drawOptions.unit[i] === undefined)
      this.drawOptions.unit[i] = {
        'color': (i * 3) % getColor.length,
        'key': true,
        'pinned': false
      }
  }

  for (let i = 0; i < evels.length; ++i) {
    let e = evels[i];
    this.evels.push(e);
    switch (e.kind) {
      case "ON":
        // some malformed files (e.g. converted from org) have notes starting
        // before the previous is finished. we cut off the earlier note here,
        // since the keyboard rendering code relies on this invariant.
        let notes = this.notes[e.unit_no];
        if (notes.length > 0) {
          let prev_e = this.evels[notes[notes.length-1]];
          if (prev_e.clock + prev_e.value > e.clock)
            prev_e.value = e.clock - prev_e.clock;
        }
        this.notes[e.unit_no].push(i);
        break;
      case "VELOCITY": this.vels [e.unit_no].push(i); break;
      case "VOLUME":   this.vols [e.unit_no].push(i); break;
      case "KEY":      this.keys [e.unit_no].push(i); break;
      default: break;
    }
  }

  // account for unit options intitialization & force redraw
  this.applyDrawOptions();
}

PlayerCanvas.prototype.initDrawOptions = function () {
  this.drawOptions = {
    'unit': [], 'view': 'unit',
    'zoom': 1, 'key_zoom': 'small',
    'snap': 'meas', 'dark': false, 'scale': 1,
    'collapsed_menu': false,
  }
  this.onDrawOptionUpdate = () => null;
}

PlayerCanvas.prototype.setDrawOptions = function(opt) {
  for (const key in opt) {
    if (key != 'unit') this.drawOptions[key] = opt[key];
    else {
      // element-wise list assignment is more robust and handles (now-fixed)
      // bug that led to inconsistent unit draw options
      for (const i in opt[key]) this.drawOptions[key][i] = opt[key][i];
    }
  }
  this.applyDrawOptions();
}

PlayerCanvas.prototype.applyDrawOptions = function () {
  let opt = this.drawOptions;

  this.measureWidth       = BASE_MEASURE_WIDTH * opt['zoom'];
  this.keyboardKeyHeight  = KEYBOARD_ROW_HEIGHTS[opt['key_zoom']].key;
  this.keyboardNoteHeight = KEYBOARD_ROW_HEIGHTS[opt['key_zoom']].note;

  this.updateCanvasDims();
  this.onDrawOptionUpdate(this.drawOptions);
}

function setDrawOption(name) {
  return function (v) { this.setDrawOptions({[name]: v}); }
};
PlayerCanvas.prototype.setZoom    = setDrawOption('zoom');
PlayerCanvas.prototype.setKeyZoom = setDrawOption('key_zoom');
PlayerCanvas.prototype.setSnap    = setDrawOption('snap');
PlayerCanvas.prototype.setDark    = setDrawOption('dark');
PlayerCanvas.prototype.setScale   = setDrawOption('scale');
PlayerCanvas.prototype.setView    = setDrawOption('view');
PlayerCanvas.prototype.setCollapsedMenu = setDrawOption('collapsed_menu');

PlayerCanvas.prototype.getMenuWidth = function () {
  if (this.drawOptions.collapsed_menu) return COLLAPSED_MENU_WIDTH;
  return MENU_WIDTH;
}

PlayerCanvas.prototype.updateCanvasDims = function () {
  let height;
  this.unitOffsetY = unitbars.menu_rect_unit.h + unitbars.tab_rect.h;

  let topUnitRowNum = this.drawOptions.unit.filter(i => i.pinned).length;
  let botUnitRowNum = Math.ceil(this.units.length/10)*10 - topUnitRowNum;
  this.unitOffsetY += unitbars.regular_rect.h * topUnitRowNum;

  let unitHeight = unitbars.regular_rect.h * botUnitRowNum;
  switch (this.drawOptions.view) {
    case 'keyboard':
      let keyHeight = this.keyboardKeyHeight * KEYBOARD_NOTE_NUM;
      height = Math.max(keyHeight, unitHeight);
      break;
    case 'unit': default: height = unitHeight; break;
  }

  this.dom.canvasFixed.height     = this.unitOffsetY * this.drawOptions.scale;
  this.dom.canvasFixedMenu.height = this.dom.canvasFixed.height;
  this.dom.canvas.height      = height * this.drawOptions.scale;
  this.dom.canvasMenu.height  = this.dom.canvas.height;
  this.dom.canvasMenu.width = this.getMenuWidth() * this.drawOptions.scale;
  this.dom.canvasFixedMenu.width = this.dom.canvasMenu.width;
  this.dom.canvas.width =
    this.dom.canvas.parentNode.clientWidth      - this.dom.canvasMenu.width;
  this.dom.canvasFixed.width =
    this.dom.canvasFixed.parentNode.clientWidth - this.dom.canvasFixedMenu.width;

  this.forceRedraw();
}

PlayerCanvas.prototype.fillCanvasHeight = function () {
  // this isn't done immediately in updateCanvasDims because we need canvas's
  // parentNode to shrink its height in case the new canvas height is smaller
  // than the parentNode's natural size.
  let parentSpace = this.dom.canvas.parentNode.clientHeight - this.dom.canvasFixed.height;
  if (parentSpace > this.dom.canvas.height) {
    this.dom.canvas.height     = parentSpace;
    this.dom.canvasMenu.height = this.dom.canvas.height;
    this.forceRedraw();
  }
}

PlayerCanvas.prototype.velocityAt = function (unit_no, clock) {
  let i = this.vels[unit_no].lastPositionOf(clock);
  if (i == -1) return DEFAULT_VELOCITY;
  return this.evels[this.vels[unit_no][i]].value;
}

// how many clock ticks into a note you currently are (-1 if not)
PlayerCanvas.prototype.playingOffset = function (unit_no, clock) {
  let i = this.notes[unit_no].lastPositionOf(clock);
  if (i == -1) return -1;
  let e = this.evels[this.notes[unit_no][i]];
  if (e.clock + e.value <= clock) return -1;
  return clock - e.clock;
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
const UNIT_LIST_SEL_BGCOLOR = "#9D9784";
PlayerCanvas.prototype.drawToggle = function(ctx, x, y, unit_no, playing, vel, vol, pinned) {
  ctx.save();
  ctx.translate(x+1, y+1);
  ctx.fillStyle = (pinned ? UNIT_LIST_SEL_BGCOLOR : UNIT_LIST_BGCOLOR);
  ctx.fillRect(1, 1, 13, 9);
  ctx.fillStyle = this.getUnitColor(unit_no).shadow(playing, vel, vol);
  ctx.fillRect(0, 0, 13, 9);
  ctx.fillStyle = this.getUnitColor(unit_no).note(playing, vel, vol);
  ctx.fillRect(1, 1, 12, 8);
  ctx.restore();
}

const UNIT_TEXT_PADDING = 40;
PlayerCanvas.prototype.drawUnitList = function (ctx, height, currBeat, pinned) {
  let currClock = currBeat * this.master.beatClock;
  // left bar
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
  let numRenderedRows = 0;
  ctx.font = "11px sans-serif";
  let showXoff = 3;
  let pinnedXoff = (this.drawOptions.collapsed_menu ? showXoff : 21);
  for (i = 0; i < this.units.length; ++i) {
    if (pinned !== null && this.drawOptions.unit[i].pinned !== pinned) continue;
    numRenderedRows++;
    if (pinned === true)
      drawImageRect(ctx, unitbars, unitbars.selected_rect, 0, 0);
    else
      drawImageRect(ctx, unitbars, unitbars.regular_rect, 0, 0);

    let playingOffset = this.playingOffset(i, currClock);
    let offsetBoost = Math.max(0, (128 - DEFAULT_VELOCITY) * 2 - playingOffset/4);
    let vel = Math.min(128, this.velocityAt(i, currClock) + offsetBoost);
    let vol = this.volumeAt(i, currClock);
    let is_playing = playingOffset !== -1;
    if (this.drawOptions.unit[i].key)
      this.drawToggle(ctx, showXoff, 2, i, is_playing, vel, vol, pinned === true);
    if (this.drawOptions.unit[i].pinned)
      this.drawToggle(ctx, pinnedXoff, 2, i, is_playing, vel, vol, pinned === true);

    ctx.fillText(this.units[i], UNIT_TEXT_PADDING, unitbars.regular_rect.h / 2);
    ctx.translate(0, unitbars.regular_rect.h);
  }
  // 2. empty rows
  for (let y = numRenderedRows * unitbars.regular_rect.h; y < height;
       y += unitbars.regular_rect.h) {
    drawImageRect(ctx, unitbars, unitbars.nothing_rect, 0, 0);
    ctx.translate(0, unitbars.nothing_rect.h);
  }
  ctx.restore();
}

const BEATLINE_OFFSET = 25;
PlayerCanvas.prototype.drawBeatLines = function(ctx, canvasOffsetX, dimensions) {
  ctx.fillStyle = "#808080";
  let beatWidth = this.measureWidth / this.master.beatNum;
  let start = Math.floor(canvasOffsetX / beatWidth);
  for (let i = 0; i < dimensions.w / beatWidth + 1; ++i)
    ctx.fillRect((i + start) * beatWidth, 0, 1, dimensions.h);
}

PlayerCanvas.prototype.drawMeasureLines = function(ctx, canvasOffsetX, dimensions) {
  ctx.fillStyle = "#F0F0F0";
  let start = Math.floor(canvasOffsetX / this.measureWidth);
  for (let i = 0; i < dimensions.w / this.measureWidth + 1; ++i)
    ctx.fillRect((i + start) * this.measureWidth, 0, 1, dimensions.h);
}

PlayerCanvas.prototype.drawRulers = function(ctx, canvasOffsetX, dimensions) {
  if (!(this.drawOptions.dark && this.drawOptions.view === 'keyboard'))
    this.drawBeatLines(ctx, canvasOffsetX, dimensions);
  this.drawMeasureLines(ctx, canvasOffsetX, dimensions);
}

PlayerCanvas.prototype.drawMeasureMarkers = function(ctx, canvasOffsetX, dimensions) {
  ctx.fillStyle = BGCOLOR;
  ctx.fillRect(canvasOffsetX, 0, dimensions.w, dimensions.h);
  ctx.translate(0, BEATLINE_OFFSET);
  this.drawBeatLines(ctx, canvasOffsetX, dimensions);
  ctx.translate(0, -BEATLINE_OFFSET);

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

PlayerCanvas.prototype.fmctx = function () {
  return this.dom.canvasFixedMenu.getContext('2d');
}

PlayerCanvas.prototype.mctx = function () {
  return this.dom.canvasMenu.getContext('2d');
}

PlayerCanvas.prototype.fctx = function () {
  return this.dom.canvasFixed.getContext('2d');
}

PlayerCanvas.prototype.ctx = function () {
  return this.dom.canvas.getContext('2d');
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
  switch (this.drawOptions.snap) {
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

let pianoPattern = [false, true, false, true, false, false, true, false, true, false, false, true];
let WHITE_KEY_COLOR = "#404040";
let BLACK_KEY_COLOR = "#202020";
PlayerCanvas.prototype.drawKeyboardBack = function(ctx, canvasOffsetX, dimensions) {
  for (let i = 0; i < dimensions.h / this.keyboardKeyHeight; ++i) {
    let ind = ((i - KEYBOARD_BASE_SHIFT) % pianoPattern.length + pianoPattern.length) % pianoPattern.length;
    let height = this.keyboardKeyHeight - 1;
    if (this.drawOptions.dark) {
      ctx.fillStyle = BGCOLOR;
      height += (i+1)%2;
    }
    else ctx.fillStyle = (pianoPattern[ind] ? BLACK_KEY_COLOR : WHITE_KEY_COLOR);
    ctx.fillRect(canvasOffsetX, i * this.keyboardKeyHeight + 1, dimensions.w, height);
  }
}

function clamp(min, x, max) { return Math.max(Math.min(x, max), min); }
// play_{start,end} correspond to start/end of press
// start,end correspond to bounds of this rectangle (so maybe up to next key change)
PlayerCanvas.prototype.drawKeyboardNote = function(ctx, started,
    play_start, play_end, highlight, unit_no, key, start, end, current) {
  let clockPerPx = this.clockPerPx();

  let offset = this.keyboardKeyHeight * (KEYBOARD_BASE_SHIFT + (DEFAULT_KEY - key) / 256);
  let y = offset + this.keyboardKeyHeight/2 - Math.floor(this.keyboardNoteHeight)/2;
  let w = (end - start) / clockPerPx;
  let vel = this.velocityAt(unit_no, current);
  // considered taking min(start vol, end vol) if not playing but that makes
  // some notes with long attack/decay show up weird
  let vol = this.volumeAt(unit_no, clamp(play_start, current, play_end-1));
  let playing = (current >= play_start && current < play_end);
  ctx.fillStyle = this.getUnitColor(unit_no).key(playing, vel, vol);
  ctx.fillRect(start / clockPerPx, y, (end - start) / clockPerPx, this.keyboardNoteHeight);
  if (highlight) {
    ctx.fillStyle = this.getUnitColor(unit_no).highlight(playing, vel, vol);
    ctx.fillRect(start / clockPerPx, y, 2, this.keyboardNoteHeight);
  }
}

function drawKeyboardNoteForDeferredQueue(data) {
  data.obj.drawKeyboardNote(data.ctx, data.obj.isStarted(),
    data.play_start, data.play_end, data.highlight,
    data.unit_no, data.currentKey, data.noteStart, data.noteEnd, data.currClock);
}

PlayerCanvas.prototype.drawKeyboard = function(ctx, canvasOffsetX, currBeat, dimensions) {
  let currClock = currBeat * this.master.beatClock;
  let clockPerPx = this.clockPerPx();

  // clock at left/right bound of visible area
  let leftBound  = clockPerPx * (canvasOffsetX);
  let rightBound = clockPerPx * (canvasOffsetX + dimensions.w);

  // an array of objects that can consume events in order and draw notes in response
  let unit_states = new Array(this.units.length);
  // set of evel indices that initiate a note crossing leftBound
  let first_presses = new SortedList((x) => x);
  // drawQueue is used so enforce notes starting earlier are drawn earlier.
  let drawQueue = new DeferredQueue(drawKeyboardNoteForDeferredQueue);
  // use (additive-like) symmetric blend mode so draw order doesn't matter
  // only in dark mode, as this blend mode makes the notes look like lights
  if (this.drawOptions.dark) ctx.globalCompositeOperation = 'screen'; 
  else ctx.globalCompositeOperation = 'source-over';

  for (let unit_no = 0; unit_no < unit_states.length; ++unit_no) {
    unit_states[unit_no] = null;
    if (!this.drawOptions.unit[unit_no].key || this.notes[unit_no].length === 0)
      continue;

    let notes = this.notes[unit_no];
    let lastQueueId = null;

    let currentKey = this.keyAt(unit_no, leftBound);
    let noteStart = Infinity, noteEnd = Infinity;
    let play_start = null, play_end = null;
    let highlight = null;

    // schedules a note to be drawn as soon as all starting before it are drawn
    let drawNote = (end) =>
      drawQueue.fill(lastQueueId, {
        'obj': this, 'ctx': ctx, 'play_start': play_start, 'play_end': play_end,
        'highlight': highlight, 'unit_no': unit_no, 'currClock': currClock,
        'currentKey': currentKey, 'noteStart': noteStart, 'noteEnd': end
      });

    unit_states[unit_no] = {
      'consume': (e) => {
        if (e.clock >= noteEnd) { // if at end of note, draw just-finished note
          drawNote(noteEnd);
          noteStart = Infinity; noteEnd = Infinity;
        }
        switch (e.kind) {
          case "ON":
            lastQueueId = drawQueue.add(); // start a new one (reserve its position)
            noteStart = e.clock; noteEnd = e.clock + e.value;
            // CONTROVERSIAL: entire press is highlighted instead of up to note
            // change. looks a bit weird but more faithful to the playback
            play_start = noteStart; play_end = noteEnd;
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

PlayerCanvas.prototype.getUnitColor = function(unit_no) {
  return getColor[this.drawOptions.unit[unit_no].color];
}

// pinned can be set to null to draw both pinned and unpinned
PlayerCanvas.prototype.drawUnitRows = function(ctx, canvasOffsetX, currBeat, dimensions, pinned) {
  let currClock = currBeat * this.master.beatClock;
  let clockPerPx = this.clockPerPx();

  // clock at left/right bound of visible area
  let leftBound  = clockPerPx * canvasOffsetX;
  let rightBound = clockPerPx * (canvasOffsetX + dimensions.w);

  ctx.save();
  for (let unit_no = 0; unit_no < this.units.length; ++unit_no) {
    if (pinned !== null && this.drawOptions.unit[unit_no].pinned !== pinned) continue; 
    // row background
    ctx.fillStyle = "#400070";
    ctx.fillRect(canvasOffsetX, 1, dimensions.w, 15);

    ctx.fillStyle = "#F08000";
    let notes = this.notes[unit_no];
    let leftIndex  = Math.max(notes.lastPositionOf(leftBound), 0);
    let rightIndex = Math.min(notes.firstPositionOf(rightBound), notes.length);
    for (let i = leftIndex; i < rightIndex; ++i) {
      let e = this.evels[notes[i]];
      let playing = (this.isStarted() && e.clock <= currClock && e.clock + e.value > currClock);
      ctx.fillStyle = this.getUnitColor(unit_no).note(playing,
        this.velocityAt(e.unit_no, currClock), this.volumeAt(e.unit_no, currClock));
      drawUnitNote(ctx, e.clock / clockPerPx, 8, e.value / clockPerPx);
    }

    ctx.translate(0, unitbars.regular_rect.h);
  }
  ctx.restore();
}

PlayerCanvas.prototype.withSongPositionShift = function (ctx, currBeat, dim_w, f) {
  let canvasOffsetX = -this.getSongPositionShift(currBeat, dim_w);
  ctx.translate(-canvasOffsetX, 0);
  f(canvasOffsetX);
  ctx.translate(canvasOffsetX, 0);
}

PlayerCanvas.prototype.withWidgetTransform = function (ctx, f) {
  ctx.save();
  ctx.scale(this.drawOptions.scale, this.drawOptions.scale);

  ctx.save();
  f();
  ctx.restore();
  ctx.restore();
}

PlayerCanvas.prototype.drawTimeline = function (ctx, currBeat, dimensions) {
  this.withSongPositionShift(ctx, currBeat, dimensions.w, (canvasOffsetX) => {
    this.drawRulers(ctx, canvasOffsetX, dimensions);

    switch (this.drawOptions.view) {
      case "keyboard":
        this.drawKeyboardBack(ctx, canvasOffsetX, dimensions);
        this.drawKeyboard(ctx, canvasOffsetX, currBeat, dimensions);
        break;
      case "unit":
      default:
        this.drawUnitRows(ctx, canvasOffsetX, currBeat, dimensions, false);
        break;
    }
    ctx.translate(0, -this.unitOffsetY);
    this.drawPlayhead(ctx, currBeat, { w: dimensions.w, h: dimensions.h + this.unitOffsetY });
    ctx.translate(0, this.unitOffsetY); // top bar offset
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
    width:  this.dom.canvas.width,
    height: this.dom.canvas.height,
    drawOptions: this.drawOptions,
  }
  let need = false;
  for (let prop in now)
    if (now[prop] !== last[prop]) {
      need = true;
      last[prop] = now[prop];
    }
  return need;
}

PlayerCanvas.prototype.getLastBeat = function () {
  return (this.master.lastMeas || this.master.measNum) * this.master.beatNum;
}

PlayerCanvas.prototype.getCurrBeat = function () {
  let currTime = this.getTime();
  let beat = currTime * this.master.beatTempo / 60;
  let lastBeat = this.getLastBeat();
  if (beat < lastBeat) return beat;
  let repeatBeat = this.master.repeatMeas * this.master.beatNum;
  return (beat - repeatBeat) % (lastBeat - repeatBeat) + repeatBeat;
}

const BGCOLOR = "#000010";
PlayerCanvas.prototype.draw = function () {
  this.fillCanvasHeight();
  if (!this.needToDraw()) return;

  let currBeat = this.getCurrBeat();

  let getDims = (canvas) => {
    return { w: canvas.width  / this.drawOptions.scale,
             h: canvas.height / this.drawOptions.scale };
  }

  // progress (seconds)
  this.dom.progress.max   = this.getLastBeat() / this.master.beatTempo * 60;
  this.dom.progress.value = currBeat           / this.master.beatTempo * 60;

  let ctx = this.ctx();
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = BGCOLOR;
  ctx.fillRect(0, 0, this.dom.canvas.width, this.dom.canvas.height);
  this.withWidgetTransform(ctx, () => {
    let dimensions = getDims(this.dom.canvas);
    this.drawTimeline(ctx, currBeat, dimensions);
  });

  // menu
  ctx = this.mctx();
  ctx.imageSmoothingEnabled = false;
  this.withWidgetTransform(ctx, () => {
    let dimensions = getDims(this.dom.canvasMenu);
    this.drawUnitList(ctx, dimensions.h, currBeat, false);
  });

  // top
  ctx = this.fctx();
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, this.dom.canvasFixed.width, this.dom.canvasFixed.height);

  let rect;
  if (!this.drawOptions.collapsed_menu) {
    switch (this.drawOptions.view) {
      case "keyboard":      rect = unitbars.menu_rect_key; break;
      case "unit": default: rect = unitbars.menu_rect_unit; break;
    }
  }
  else rect = unitbars.menu_rect_arrc;
  let topShift = rect.h + unitbars.tab_rect.h;

  this.withWidgetTransform(ctx, () => {
    let dimensions = getDims(this.dom.canvasFixed);
    this.withSongPositionShift(ctx, currBeat, dimensions.w, (canvasOffsetX) => {
      this.drawMeasureMarkers(ctx, canvasOffsetX, dimensions);
      ctx.translate(0, topShift);
      this.drawUnitRows(ctx, canvasOffsetX, currBeat, dimensions, true);
      ctx.translate(0, -topShift);
      this.drawPlayhead(ctx, currBeat, dimensions);
    });
  });

  // top menu / tabs
  ctx = this.fmctx();
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, this.dom.canvasFixedMenu.width, this.dom.canvasFixedMenu.height);

  this.withWidgetTransform(ctx, () => {
    let dimensions = getDims(this.dom.canvasFixedMenu);
    // pinned unit list
    ctx.translate(0, topShift);
    this.drawUnitList(ctx, dimensions.h, currBeat, true);
    ctx.translate(0, -topShift);

    // top-left tabs
    drawImageRect(ctx, unitbars, rect, 0, 0);
    drawImageRect(ctx, unitbars, unitbars.tab_rect, 0, rect.h);
  });
}

PlayerCanvas.prototype.drawLoading = function () {
  let ctx = this.ctx();
  ctx.fillStyle = "#000010";
  ctx.fillRect(0, 0, this.dom.canvas.width, this.dom.canvas.height);

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
