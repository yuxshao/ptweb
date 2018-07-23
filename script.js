// Based off http://codepen.io/petamoriken/pen/JGWQOE/?editors=001
"use strict";

import {AudioPlayer} from "./play_audio.js"
import {PlayerCanvas} from "./draw.js"

// AudioContext
const ctx = new (window.AudioContext || window.webkitAudioContext)();
ctx.suspend();
PlayerCanvas.audioCtx = ctx;
PlayerCanvas.drawContinuously();

// Pxtone initialize
const pxtone = new Pxtone();
pxtone.decoder = new Worker("./pxtnDecoder.js");

// set decodePxtoneData to AudioContext
ctx.decodePxtoneStream = pxtone.decodePxtoneStream.bind(pxtone, ctx);

// DOM
const file = document.querySelector("#drop > input[type='file']");

const button = document.querySelector(".playerButton");
const [pxtnName, pxtnTitle, pxtnComment] = [document.querySelector("output > .name"), document.querySelector("output > .title"), document.querySelector("output > .comment")];

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

var audioSources = [];
// to indicate not to schedule next chunk when source is stopped
function stopAudio() {
  button.classList.remove("stop");
  button.classList.add("play");
  button.classList.add("disabled");
  for (let src of audioSources) { src.onended = () => null; src.stop(); }
  ctx.suspend();
}

var currentAudioPlayer = null;

async function reader$onload() {
  if (currentAudioPlayer) {
    currentAudioPlayer.stop();
    ctx.suspend();
  }

  let {stream, master, units, evels, data} = await ctx.decodePxtoneStream(this.result);

  pxtnTitle.innerHTML = escapeHTML(data.title) || "no name";
  pxtnComment.innerHTML = escapeHTML(data.comment).replace(/[\n\r]/g, "<br>") || "no comment";

  currentAudioPlayer = new AudioPlayer(stream, ctx);
  currentAudioPlayer.schedule_start();

  PlayerCanvas.getTime = currentAudioPlayer.getCurrentTime;
  PlayerCanvas.setUnits(units);
  PlayerCanvas.evels = evels;
  PlayerCanvas.master = master;
  button.classList.remove("disabled");
}

const playerStateChange = (() => {
  let isPlaying = false;
  return () => {
    if(button.classList.contains("disabled"))
      return;
    // play
    if(!isPlaying) {
      isPlaying = true;
      ctx.resume();
      button.classList.remove("play");
      button.classList.add("stop");
    // stop
    } else {
      isPlaying = false;
      ctx.suspend();
      button.classList.remove("stop");
      button.classList.add("play");
    }
  };
  
})();

// button
button.addEventListener("click", playerStateChange);
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

