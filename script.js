// Based off http://codepen.io/petamoriken/pen/JGWQOE/?editors=001
"use strict";

import {AudioPlayer} from "./play_audio.js"
import {PlayerCanvas} from "./draw.js"

// AudioContext
const ctx = new (window.AudioContext || window.webkitAudioContext)();
ctx.suspend();

let currentAudioPlayer = new AudioPlayer(null, ctx);
let myPlayerCanvas = new PlayerCanvas(document.getElementById('player'));
myPlayerCanvas.getTime = currentAudioPlayer.getCurrentTime;
myPlayerCanvas.drawContinuously();

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

// to indicate not to schedule next chunk when source is stopped
function stopAudio() {
  button.classList.remove("stop");
  button.classList.add("play");
  button.classList.add("disabled");
  currentAudioPlayer.stop();
  ctx.suspend();
}


async function reader$onload() {
  stopAudio();

  let {stream, master, units, evels, data} = await ctx.decodePxtoneStream(this.result);

  pxtnTitle.innerHTML = escapeHTML(data.title) || "no name";
  pxtnComment.innerHTML = escapeHTML(data.comment).replace(/[\n\r]/g, "<br>") || "no comment";

  currentAudioPlayer = new AudioPlayer(stream, ctx);
  currentAudioPlayer.schedule_start();

  myPlayerCanvas.getTime = currentAudioPlayer.getCurrentTime;
  myPlayerCanvas.setUnits(units);
  myPlayerCanvas.evels = evels;
  myPlayerCanvas.master = master;
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

