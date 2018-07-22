// Based off http://codepen.io/petamoriken/pen/JGWQOE/?editors=001
"use strict";

import {MyPlayer} from "./draw.js"

// AudioContext
const ctx = new (window.AudioContext || window.webkitAudioContext)();
ctx.suspend();
MyPlayer.audioCtx = ctx;
MyPlayer.drawContinuously();

// Pxtone initialize
const pxtone = new Pxtone();
pxtone.decoder = new Worker("./pxtnDecoder.js");

// set decodePxtoneData to AudioContext
ctx.decodePxtoneStream = pxtone.decodePxtoneStream.bind(pxtone, ctx);

// DOM
const file = document.querySelector("#drop > input[type='file']");

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

const BUFFER_DURATION = 1.6;

var audioSources = [];
// to indicate not to schedule next chunk when source is stopped
function stopAudio() {
  for (let src of audioSources) { src.onended = () => null; src.stop(); }
  ctx.suspend();
}

async function reader$onload() {
  stopAudio();
  let {stream, master, units, evels, data} = await ctx.decodePxtoneStream(this.result);

  pxtnTitle.innerHTML = escapeHTML(data.title) || "no name";
  pxtnComment.innerHTML = escapeHTML(data.comment).replace(/[\n\r]/g, "<br>") || "no comment";

  // play 1st buffer, schedule 2nd buffer immediately,
  // schedule buffer i+2 after buffer i finishes.
  // this way there's no delay between buffers
  let buffer = await stream.next(BUFFER_DURATION);
  let src = ctx.createBufferSource();
  src.buffer = buffer;
  // if 1st buffer is scheduled exactly at currentTime it starts slightly late,
  // causing overlap with 2nd buffer. so, delaying a bit avoids overlap.
  let time = ctx.currentTime + 0.02;data
  src.start(time);
  src.connect(ctx.destination);
  (async function nextChunk(time, prev) {
    let buffer = await stream.next(BUFFER_DURATION);
    let src = ctx.createBufferSource();
    audioSources.push(src);
    src.buffer = buffer;
    src.start(time);
    src.connect(ctx.destination);
    prev.onended = (_e) => {
      let i = audioSources.indexOf(prev);
      if (i > -1) audioSources.splice(i, 1);
      nextChunk(time + BUFFER_DURATION, src);
    }
  })(time + BUFFER_DURATION, src);

  MyPlayer.startTime = time + 0.01;
  MyPlayer.units = units;
  MyPlayer.evels = evels;
  MyPlayer.master = master;
  await ctx.resume();
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

