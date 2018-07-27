// Based off http://codepen.io/petamoriken/pen/JGWQOE/?editors=001
"use strict";

import {AudioPlayer} from "./play_audio.js"
import {PlayerCanvas} from "./draw.js"

// AudioContext
const ctx = new (window.AudioContext || window.webkitAudioContext)();
ctx.suspend();

let currentAudioPlayer = new AudioPlayer(null, ctx);

const getScroll = () => document.getElementById('scrollContainer').scrollTop;
let myPlayerCanvas = new PlayerCanvas(document.getElementById('player'), getScroll);
myPlayerCanvas.getTime = currentAudioPlayer.getCurrentTime;
myPlayerCanvas.drawContinuously();

// Pxtone initialize
const pxtone = new Pxtone();
pxtone.decoder = new Worker("./pxtnDecoder.js");

// set decodePxtoneData to AudioContext
ctx.decodePxtoneStream = pxtone.decodePxtoneStream.bind(pxtone, ctx);

// DOM
const file            = document.querySelector("#drop > input[type='file']");
const playBtn         = document.querySelector(".playerButton");
const stopBtn         = document.querySelector(".stopButton");
const volumeSlider    = document.querySelector("#volumeSlider");
const volumeIndicator = document.querySelector("#volumeIndicator");
const zoomSelect      = document.querySelector("#zoomSelect");
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
  if (currentAudioPlayer.isStarted() && !loadingFile)
    stopBtn.classList.remove("disabled");
  else
    stopBtn.classList.add("disabled");

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

// button
const playerStateChange = async () => {
  if (playBtn.classList.contains("disabled")) return;
  playBtn.classList.add("disabled");
  if (currentAudioPlayer.isSuspended()) await resumeAudio();
  else await pauseAudio();
  playBtn.classList.remove("disabled");
};
playBtn.addEventListener("click", playerStateChange);

const playerStop = async () => {
  if (stopBtn.classList.contains("disabled")) return;
  stopBtn.classList.add("disabled");
  if (currentAudioPlayer.stop()) await stopAudio();
  stopBtn.classList.remove("disabled");
  updateButtonDisplay();
}
stopBtn.addEventListener("click", playerStop);

// volume slider
const updateVolume = (_e) => {
  currentAudioPlayer.setVolume(volumeSlider.value);
  volumeIndicator.innerHTML = Math.floor(volumeSlider.value * 100) + "%";
}
volumeSlider.addEventListener("input", updateVolume);

// display: zoom and snap and scale
const updateZoom = (_e) => myPlayerCanvas.setZoom(zoomSelect.value);
zoomSelect.addEventListener("input", updateZoom);
zoomSelect.addEventListener("change", updateZoom);
updateZoom(null);

const updateSnap = (_e) => myPlayerCanvas.setSnap(snapSelect.value);
snapSelect.addEventListener("input", updateSnap);
snapSelect.addEventListener("change", updateSnap);
updateSnap(null);

const updateScale = (_e) => myPlayerCanvas.setScale(scaleSelect.checked ? 2 : 1);
scaleSelect.addEventListener("input", updateScale);
updateScale(null);

async function reader$onload() {
  loadingFile = true;
  await currentAudioPlayer.release();
  updateButtonDisplay();

  let {stream, master, units, evels, data} = await ctx.decodePxtoneStream(this.result);

  pxtnTitle.innerHTML = escapeHTML(data.title) || "no name";
  pxtnComment.innerHTML = escapeHTML(data.comment).replace(/[\n\r]/g, "<br>") || "no comment";

  currentAudioPlayer = new AudioPlayer(stream, ctx);
  updateVolume(null);

  myPlayerCanvas.getTime = currentAudioPlayer.getCurrentTime;
  myPlayerCanvas.isStarted = currentAudioPlayer.isStarted;
  myPlayerCanvas.setData(units, evels, master);
  loadingFile = false;
  updateButtonDisplay();
}

// input Pxtone Collage file
file.addEventListener("change", () => {
  const pxtnFile = file.files[0];
  
  pxtnName.innerHTML = pxtnFile.name;
  pxtnTitle.innerHTML = "&nbsp;";
  pxtnComment.innerHTML = "&nbsp;";
  
  const reader = new FileReader();
  reader.addEventListener("load", reader$onload);
  reader.readAsArrayBuffer(pxtnFile);
});

