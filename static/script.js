// Based off http://codepen.io/petamoriken/pen/JGWQOE/?editors=001
"use strict";

import {AudioPlayer} from "./play_audio.js"
import {PlayerCanvas} from "./draw.js"
import {Pxtone} from "./lib/Pxtone.mjs"

// AudioContext
const ctx = new AudioContext();
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
  };
  return new PlayerCanvas(dom);
})();
myPlayerCanvas.getTime = currentAudioPlayer.getCurrentTime;
myPlayerCanvas.audioSeek = currentAudioPlayer.seek;
myPlayerCanvas.drawContinuously();

// Pxtone initialize
const pxtone = new Pxtone({ sampleRate: ctx.sampleRate });

// DOM
const wholePlayer     = document.querySelector("#player");
const playBtn         = document.querySelector(".playerButton");
const stopBtn         = document.querySelector(".stopButton");
const volumeSlider    = document.querySelector("#volumeSlider");
const volumeIndicator = document.querySelector("#volumeIndicator");
const zoomSelect      = document.querySelector("#zoomSelect");
const keyZoomSelect   = document.querySelector("#keyZoomSelect");
const snapSelect      = document.querySelector("#snapSelect");
const scaleSelect     = document.querySelector("#scaleSelect");
const muteLock        = document.querySelector("#muteLock");
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
  await stopAudio();
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
    switchToSmallBtn.style.display = 'flex';
  }
  else {
    switchToFullBtn.style.display = 'flex';
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

if (muteLock !== null) {
  muteLock.addEventListener('change', function() {
    myPlayerCanvas.setMuteLock(this.checked);
  });
}

const drawOptionInput = document.querySelector("#id_draw_options");
myPlayerCanvas.onDrawOptionUpdate = function (opt) {
  zoomSelect.value    = opt.zoom;
  keyZoomSelect.value = opt.key_zoom;
  darkSelect.checked  = opt.dark;
  snapSelect.value    = opt.snap;
  scaleSelect.checked = (opt.scale > 1);
  if (muteLock !== null && opt.mute_lock !== null) muteLock.checked = opt.mute_lock;
  if (drawOptionInput !== null) drawOptionInput.value = JSON.stringify(opt);
}
myPlayerCanvas.applyDrawOptions();

export let loadDrawOptions = async function (opt) {
  myPlayerCanvas.setDrawOptions(opt);
}

// Map numeric event kinds to the string names draw.js expects
const eventKindNames = [
  "NULL", "ON", "KEY", "PAN_VOLUME", "VELOCITY", "VOLUME", "PORTAMENT",
  "BEATCLOCK", "BEATTEMPO", "BEATNUM", "REPEAT", "LAST", "VOICENO",
  "GROUPNO", "TUNING", "PAN_TIME", "NUM"
];

// Adapts ReadableStream<AudioData> from Pxtone.mjs to the stream interface
// expected by AudioPlayer: { next, reset, release, setMute, getMute }
function createPxtoneStream(pxtone, ctx, numberOfFrames) {
  const sps = pxtone.sampleRate;
  const ch  = pxtone.numberOfChannels;
  let gen    = 0;
  let reader = null;

  function startNew(startTime = 0) {
    if (reader) reader.cancel().catch(() => {});
    reader = pxtone.stream({
      startTime, loop: true, unitMute: true, numberOfFrames,
    }).getReader();
  }
  startNew(0);

  return {
    next: async function () {
      const myGen = gen;
      const { done, value: audioData } = await reader.read();
      if (gen !== myGen || done) {
        // Stale chunk after reset/release — return silence so the old nextChunk
        // chain terminates cleanly without audible artifacts
        if (audioData) audioData.close();
        return ctx.createBuffer(ch, numberOfFrames, sps);
      }
      const buf = ctx.createBuffer(
        audioData.numberOfChannels, audioData.numberOfFrames, audioData.sampleRate
      );
      for (let i = 0; i < audioData.numberOfChannels; i++) {
        audioData.copyTo(buf.getChannelData(i), { planeIndex: i });
      }
      audioData.close();
      return buf;
    },
    reset: function (positionInSamples) {
      gen++;
      startNew(positionInSamples / sps);
    },
    // async so AudioPlayer's `await stream.release()` waits for reader cancel,
    // ensuring pxtone.clear() can be called safely afterwards
    release: async function () {
      gen++;
      if (reader) { try { await reader.cancel(); } catch (_) {} reader = null; }
    },
    setMute: function (unitNum, isMute) {
      if (unitNum < pxtone.units.length)
        pxtone.units[unitNum].togglePlayed(!isMute);
    },
    getMute: function (unitNum) {
      return !pxtone.units[unitNum].played;
    },
  };
}

// input Pxtone Collage file
// file is ArrayBuffer
export let loadFile = async function (file, filename, reset_draw, buffer_size) {
  pxtnName.innerHTML = filename;
  pxtnTitle.innerHTML = "&nbsp;";
  pxtnComment.innerHTML = "&nbsp;";

  loadingFile = true;
  await currentAudioPlayer.release();
  updateButtonDisplay();

  pxtone.clear();
  pxtone.read(new Uint8Array(file));

  pxtnTitle.innerHTML = escapeHTML(pxtone.name ?? "") || "no name";
  pxtnComment.innerHTML = escapeHTML(pxtone.comment ?? "").replace(/[\n\r]/g, "<br>") || "no comment";

  const sps = pxtone.sampleRate;
  const numberOfFrames = Math.round((buffer_size ?? 0.3) * sps);
  const stream = createPxtoneStream(pxtone, ctx, numberOfFrames);

  // Convert pxtone.events to the format draw.js expects
  const unitIndexMap = new Map(pxtone.units.map((u, i) => [u, i]));
  const evels = pxtone.events.map(e => ({
    kind:    eventKindNames[e.kind] ?? "NULL",
    unit_no: unitIndexMap.get(e.unit) ?? 0,
    value:   e.value,
    clock:   e.tick,
  }));
  const units = pxtone.units.map(u => u.name);
  const master = {
    beatNum:    pxtone.beatsPerMeasure,
    beatTempo:  pxtone.beatTempo,
    beatClock:  pxtone.ticksPerBeat,
    measNum:    pxtone.numberOfMeasures,
    repeatMeas: pxtone.loopStartMeasure,
    lastMeas:   pxtone.loopEndMeasure,
  };

  currentAudioPlayer = new AudioPlayer(stream, ctx, buffer_size);

  // Mute setting is here because of a potential race: both the draw options
  // and audio player have to be loaded.
  myPlayerCanvas.onMuteToggle = currentAudioPlayer.setMute;
  currentAudioPlayer.setMute(myPlayerCanvas.getMuteSettings());

  currentAudioPlayer.onspuriousstart = updateButtonDisplay;
  updateVolume(null);

  myPlayerCanvas.getTime = currentAudioPlayer.getCurrentTime;
  myPlayerCanvas.audioSeek = currentAudioPlayer.seek;
  myPlayerCanvas.isStarted = function () {
    return currentAudioPlayer.getCurrentTime() > 0;
  }
  myPlayerCanvas.setData(units, evels, master, reset_draw);
  loadingFile = false;
  updateButtonDisplay();
}
