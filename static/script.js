// Based off http://codepen.io/petamoriken/pen/JGWQOE/?editors=001
"use strict";

import {AudioPlayer} from "./play_audio.js"
import {PlayerCanvas} from "./draw.js"

// AudioContext
const ctx = new (window.AudioContext || window.webkitAudioContext)();
ctx.suspend();

let currentAudioPlayer = new AudioPlayer(null, ctx);
let progressBar = document.getElementById('songProgress');

let myPlayerCanvas = (() => {
  let dom = {
    'canvas':          document.getElementById('playerBody'),
    'canvasFixed':     document.getElementById('playerFixed'),
    'canvasMenu':      document.getElementById('playerMenu'),
    'canvasFixedMenu': document.getElementById('playerFixedMenu'),
    'progress':        progressBar,
  }
  return new PlayerCanvas(dom);
})();
myPlayerCanvas.getTime = currentAudioPlayer.getCurrentTime;
myPlayerCanvas.audioSeek = currentAudioPlayer.seek;
myPlayerCanvas.drawContinuously();

// Pxtone initialize
window.DECODER_URL = (window.DECODER_URL || "./pxtnDecoder.js");
const pxtone = new Pxtone();
pxtone.decoder = new Worker(window.DECODER_URL);

// set decodePxtoneData to AudioContext
ctx.decodePxtoneStream = pxtone.decodePxtoneStream.bind(pxtone, ctx);

// DOM
const wholePlayer     = document.querySelector("#playerContainer");
const playBtn         = document.querySelector(".playerButton");
const stopBtn         = document.querySelector(".stopButton");
const volumeSlider    = document.querySelector("#volumeSlider");
const volumeIndicator = document.querySelector("#volumeIndicator");
const zoomSelect      = document.querySelector("#zoomSelect");
const keyZoomSelect   = document.querySelector("#keyZoomSelect");
const snapSelect      = document.querySelector("#snapSelect");
const scaleSelect     = document.querySelector("#scaleSelect");
const [pxtnName, pxtnTitle, pxtnComment] = [
  document.querySelector("output .name"),
  document.querySelector("output .title"),
  document.querySelector("output .comment")
];

// http://qiita.com/noriaki/items/4bfef8d7cf85dc1035b3
const escapeHTML = (() => {
  const escapeMap = {
    "&": "&amp;",
    "'": "&#39;",
    '"': "&quot;",
    "<": "&lt;",
    ">": "&gt;"
  };

  function callback(char) {
    return escapeMap[char];
  }

  return (str) => {
    return str.replace(/[&"'<>]/g, callback);
  };
})();

let loadingFile = false;
function updateButtonDisplay() {
  if (!loadingFile) stopBtn.classList.remove("disabled");
  else stopBtn.classList.add("disabled");

  if (currentAudioPlayer.isSuspended()) {
    playBtn.classList.remove("pause");
    playBtn.classList.add("play");
  } else {
    playBtn.classList.remove("play");
    playBtn.classList.add("pause");
  }

  if (loadingFile) playBtn.classList.add("disabled");
  else playBtn.classList.remove("disabled");
}

async function resumeAudio() { await currentAudioPlayer.resume(); updateButtonDisplay(); }
async function pauseAudio()  { await currentAudioPlayer.pause();  updateButtonDisplay(); }
async function stopAudio()   { await currentAudioPlayer.stop();   updateButtonDisplay(); }
async function seekAudio(s)  { await currentAudioPlayer.seek(s);  updateButtonDisplay(); }

// button
const playerStateChange = async () => {
  if (playBtn.classList.contains("disabled")) return;
  playBtn.classList.add("disabled");
  if (currentAudioPlayer.isSuspended()) await resumeAudio();
  else await pauseAudio();
  playBtn.classList.remove("disabled");
};
playBtn.addEventListener("click", playerStateChange);
wholePlayer.addEventListener("keypress", function (e) {
  if (e.key === ' ') {
    e.preventDefault();
    playerStateChange();
  }
});

const playerStop = async () => {
  if (stopBtn.classList.contains("disabled")) return;
  stopBtn.classList.add("disabled");
  if (currentAudioPlayer.isStarted()) await stopAudio();
  stopBtn.classList.remove("disabled");
  updateButtonDisplay();
}
stopBtn.addEventListener("click", playerStop);

// progress
const progressClick = (e) => {
  var progressValue = e.offsetX * progressBar.max / progressBar.offsetWidth;
  return seekAudio(progressValue);
};
progressBar.addEventListener("click", progressClick);

// fullscreen toggle
let toggleFullscreenBtn = document.getElementById('toggleFullscreenBtn');
let switchToFullBtn = document.getElementById("switchToFull");
let switchToSmallBtn = document.getElementById("switchToSmall");
const postToggleCheck = () => {
  if (wholePlayer.classList.contains("fullscreen")) {
    switchToFullBtn.style.display = 'none';
    switchToSmallBtn.style.display = 'block';
  }
  else {
    switchToFullBtn.style.display = 'block';
    switchToSmallBtn.style.display = 'none';
  }
  myPlayerCanvas.updateCanvasDims();
}
const switchToFull = (_e) => {
  wholePlayer.classList.add("fullscreen");
  postToggleCheck();
}
const switchToSmall = (_e) => {
  wholePlayer.classList.remove("fullscreen");
  postToggleCheck();
}
if (switchToFullBtn !== null)
  switchToFullBtn.addEventListener("click", switchToFull);
if (switchToSmallBtn !== null)
  switchToSmallBtn.addEventListener("click", switchToSmall);

// volume slider
const updateVolume = (_e) => {
  currentAudioPlayer.setVolume(volumeSlider.value);
  volumeIndicator.innerHTML = Math.floor(volumeSlider.value * 100) + "%";
}
volumeSlider.addEventListener("input", updateVolume);

// draw options: zoom and snap and scale
const updateZoom = (_e) => myPlayerCanvas.setZoom(zoomSelect.value);
zoomSelect.addEventListener("input", updateZoom);
zoomSelect.addEventListener("change", updateZoom);
updateZoom(null);

const updateKeyZoom = (_e) => myPlayerCanvas.setKeyZoom(keyZoomSelect.value);
keyZoomSelect.addEventListener("input", updateKeyZoom);
keyZoomSelect.addEventListener("change", updateKeyZoom);
updateKeyZoom(null);

const updateDark = (_e) => myPlayerCanvas.setDark(darkSelect.checked);
darkSelect.addEventListener("input", updateDark);
darkSelect.addEventListener("change", updateDark);
updateDark(null);

const updateSnap = (_e) => myPlayerCanvas.setSnap(snapSelect.value);
snapSelect.addEventListener("input", updateSnap);
snapSelect.addEventListener("change", updateSnap);
updateSnap(null);

const updateScale = (_e) => myPlayerCanvas.setScale(scaleSelect.checked ? 2 : 1);
scaleSelect.addEventListener("input", updateScale);
updateScale(null);

const drawOptionInput = document.querySelector("#id_draw_options");
myPlayerCanvas.onDrawOptionUpdate = function (opt) {
  zoomSelect.value    = opt.zoom;
  keyZoomSelect.value = opt.key_zoom;
  darkSelect.checked  = opt.dark;
  snapSelect.value    = opt.snap;
  scaleSelect.checked = (opt.scale > 1);
  if (drawOptionInput !== null) drawOptionInput.value = JSON.stringify(opt);
}
myPlayerCanvas.applyDrawOptions();

export let loadDrawOptions = async function (opt) {
  myPlayerCanvas.setDrawOptions(opt);
}

// input Pxtone Collage file
// file is ArrayBuffer
export let loadFile = async function (file, filename, reset_draw=false) {
  pxtnName.innerHTML = filename;
  pxtnTitle.innerHTML = "&nbsp;";
  pxtnComment.innerHTML = "&nbsp;";

  loadingFile = true;
  await currentAudioPlayer.release();
  updateButtonDisplay();

  let {stream, master, units, evels, data} = await ctx.decodePxtoneStream(file);

  pxtnTitle.innerHTML = escapeHTML(data.title) || "no name";
  pxtnComment.innerHTML = escapeHTML(data.comment).replace(/[\n\r]/g, "<br>") || "no comment";

  currentAudioPlayer = new AudioPlayer(stream, ctx);
  currentAudioPlayer.onspuriousstart = updateButtonDisplay;
  updateVolume(null);

  myPlayerCanvas.getTime = currentAudioPlayer.getCurrentTime;
  myPlayerCanvas.audioSeek = currentAudioPlayer.seek;
  myPlayerCanvas.isStarted = currentAudioPlayer.isStarted;
  myPlayerCanvas.setData(units, evels, master, reset_draw);
  loadingFile = false;
  updateButtonDisplay();
}
