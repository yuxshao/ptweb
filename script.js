"use strict";

// AudioContext
const ctx = new (window.AudioContext || window.webkitAudioContext)();

// Pxtone initialize
const pxtone = new Pxtone();
pxtone.decoder = pxtnDecoder;

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

const BUFFER_DURATION = 1;

async function reader$onload() {
  let {stream, data} = await ctx.decodePxtoneStream(this.result);
  pxtnTitle.innerHTML = escapeHTML(data.title) || "no name";
  pxtnComment.innerHTML = escapeHTML(data.comment).replace(/[\n\r]/g, "<br>") || "no comment";

  // play 1st buffer, schedule 2nd buffer immediately,
  // schedule buffer i+2 after buffer i finishes.
  // this way there's no delay between buffers
  let buffer = await stream.next(BUFFER_DURATION);
  let src = ctx.createBufferSource();
  src.buffer = buffer;
  let time = ctx.currentTime;
  src.start(time);
  src.connect(ctx.destination);
  (async function nextChunk(time, prev) {
    let buffer = await stream.next(BUFFER_DURATION);
    let src = ctx.createBufferSource();
    src.buffer = buffer;
    src.start(time);
    src.connect(ctx.destination);
    prev.onended = (_e) => nextChunk(time + BUFFER_DURATION, src);
  })(time + BUFFER_DURATION, src);
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
