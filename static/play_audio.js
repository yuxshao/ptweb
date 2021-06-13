// streaming ptcop audio player with basic controls and timekeeping (e.g. loops)

import { Mutex } from "./lib/Mutex.js"

const BUFFER_DURATION_DEFAULT = 0.3;

function emptyStream(ctx) {
  return {
    next: (duration) => ctx.createBuffer(1, 44100*duration, 44100),
    release: () => null,
    reset: (seek_seconds) => null,
    setMute: (_1, _2) => null,
    getMute: (_) => false,
    getSps: () => 44100
  };
}

async function sleep (ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

// issue: https://bugzilla.mozilla.org/show_bug.cgi?id=1375562
// since this player uses suspend to pause, an unexpected resume messes with
// chunk order (e.g. open up dev tools while paused). need to either not rely
// on ctx.suspend, or catch when a resume occurs
export let AudioPlayer = function (stream, ctx, buffer_duration=BUFFER_DURATION_DEFAULT) {
  let sources = [];
  let gainNode = ctx.createGain();
  gainNode.connect(ctx.destination);
  // player state initialized later down
  let is_suspended = null, startTime = null;
  stream = stream || emptyStream(ctx);
  let bufferNumSamples = Math.round(buffer_duration * stream.getSps());

  // detach the event handlers that start the next chunk when stopping
  function clearBuffers() {
    for (let src of sources) { src.onended = () => null; src.stop(); }
  }

  // each of the player control fns are sequential, but block, so we need a
  // a mutex to avoid race conditions from outside
  const mutex = new Mutex();

  let enqueue = async function () {
    // schedule buffer i+2 after buf i finishes so there's no delay between bufs
    async function nextChunk(chunkNum, baseStartTime) {
      let src = ctx.createBufferSource();
      src.onended = (_e) => {
        let i = sources.indexOf(src);
        if (i > -1) sources.splice(i, 1);
        return nextChunk(chunkNum + 2, baseStartTime);
      }

      // Since we have two loops going, there's the possibility chunk n+1 calls
      // stream.next before chunk n and get the wrong buffer. I haven't seen
      // this happen, but if it does, the computer is really struggling.
      // To make this sound, stream.next can take a chunk index and keep track
      // of skipped chunks.
      let buffer = await stream.next(bufferNumSamples);
      src.buffer = buffer;

      {
        let time = baseStartTime + chunkNum * bufferNumSamples / stream.getSps();
        let thisStartTime = Math.max(time, ctx.currentTime);
        let offset = thisStartTime - time;
        if (offset > 0) { console.log("Warning: buffer underrun (" + (offset * 1000) + "ms)"); }

        // We're so behind that when this chunk starts, it's already past its end time
        if (offset * stream.getSps >= bufferNumSamples) src.onended(null);
        else {
          // I think there's a possibility of a race here. What if sources was
          // cleared while loading the buffer?
          src.start(thisStartTime, offset);
          sources.push(src);
        }
      }

      src.connect(gainNode);
    }

    let delay = 0.05;
    startTime += delay;

    // schedule the first 2 buffers
    let baseStartTime = ctx.currentTime + delay;
    await nextChunk(0, baseStartTime);
    await nextChunk(1, baseStartTime);
  }
  // minStart prevents the displayed clock from backing up a bit when resuming
  let minStart = 0;
  let stop = async function (seek_seconds = 0) {
    await pause();
    await stream.reset(Math.round(seek_seconds * stream.getSps()));
    startTime = ctx.currentTime - seek_seconds;
    minStart = seek_seconds;
    clearBuffers();
    await enqueue();
  }

  let pause = async function () {
    is_suspended = true;
    // Need this since in webkit ctx.suspend may hang forever
    if (ctx.state !== 'suspended')
      await ctx.suspend();
  }

  let resume = async function () {
    is_suspended = false;
    // a short delay makes it easier to hear the song start after a mouse click
    await sleep(100);
    await ctx.resume();
  }

  // since the user can start the context outside of the player controls only
  // thing we can do is reactively handle it
  this.onspuriousstart = () => { }
  ctx.onstatechange = () => {
    if (ctx.state === 'running') {
      is_suspended = false;
      this.onspuriousstart();
    }
  }

  let seek = async function (seek_seconds) {
    let was_suspended = is_suspended;
    await stop(seek_seconds);
    if (!was_suspended) await resume();
  }

  // current time along the song (according to actual audio context)
  let getCurrentTime = () => Math.max(ctx.currentTime - startTime, minStart);

  // We allow setting this in a batch because we need to do so when loading up
  // the initial draw options, and stopping takes a lot of time.
  let setMute = async function(muteSettings) {
    for (let muteSetting of muteSettings) {
      stream.setMute(muteSetting.unitNum, muteSetting.isMuted);
    }
    if (is_suspended) {
      // Clear the buffers so that upon resume, there's no blip with the wrong
      // mute status
      await stop(getCurrentTime ());
    }
  }

  let release = async () => {
    this.stop   = () => null;
    this.pause = () => null; this.resume = () => null;
    this.setMute = () => null; this.seek = () => null;

    await pause();
    clearBuffers(); // cleared after pause so no event gets triggered in process
    await stream.release();
  }

  let guarded = (f) => {
    return async (...args) => {
      const release_mutex = await mutex.acquire();
      try { await f(...args); } finally { release_mutex(); }
    };
  }

  this.stop    = guarded(stop);
  this.pause   = guarded(pause);
  this.resume  = guarded(resume);
  this.release = guarded(release);
  this.setMute = guarded(setMute);
  this.seek    = guarded(seek);
  this.getCurrentTime = getCurrentTime;

  this.setVolume = function (volume) {
    let ampl = Math.pow(65, volume-1);
    if (volume < 0.05) ampl *= volume / 0.05;
    gainNode.gain.setValueAtTime(ampl, ctx.currentTime);
  }

  // initialize player state
  this.isSuspended = () => true;
  this.stop().then(() => {
    this.isSuspended  = () => is_suspended;
    startTime = ctx.currentTime;
  });
}
