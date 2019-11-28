// streaming ptcop audio player with basic controls and timekeeping (e.g. loops)

import { Mutex } from "./lib/Mutex.js"

const BUFFER_DURATION_DEFAULT = 0.3;

function emptyStream(ctx) {
  return {
    next: (duration) => ctx.createBuffer(1, 44100*duration, 44100),
    release: () => null,
    reset: (seek_seconds) => null
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
  let is_started = null, is_suspended = null, startTime = null;
  stream = stream || emptyStream(ctx);

  // detach the event handlers that start the next chunk when stopping
  function clearBuffers() {
    for (let src of sources) { src.onended = () => null; src.stop(); }
  }

  // each of the player control fns are sequential, but block, so we need a
  // a mutex to avoid race conditions from outside
  const mutex = new Mutex();

  let start = async function () {
    await stop();
    // schedule buffer i+2 after buf i finishes so there's no delay between bufs
    async function nextChunk(time, prev) {
      let buffer = await stream.next(buffer_duration);
      let src = ctx.createBufferSource();
      sources.push(src);
      src.buffer = buffer;
      src.start(time);
      src.connect(gainNode);
      prev.onended = (_e) => {
        let i = sources.indexOf(prev);
        if (i > -1) sources.splice(i, 1);
        return nextChunk(time + buffer_duration, src);
      }
    }

    let delay = 0.05;
    startTime += delay;
    let dummy = {};

    // schedule the first buffer
    await nextChunk(ctx.currentTime + delay, dummy);
    // also schedule 2nd buffer immediately (when buffer '0' finishes)
    await dummy.onended(null);
    is_started = true;

    await resume();
  }

  // minStart prevents the displayed clock from backing up a bit when resuming
  let minStart = 0;
  let stop = async function (seek_seconds = null) {
    await pause();
    if (!is_started && seek_seconds === null) return;
    await stream.reset(seek_seconds);
    startTime = ctx.currentTime - seek_seconds;
    minStart = seek_seconds;
    clearBuffers();
    is_started = false;
  }

  let pause = async function () {
    is_suspended = true;
    await ctx.suspend();
  }

  let resume = async function () {
    is_suspended = false;
    // a short delay makes it easier to hear the song start after a mouse click
    if (is_started) {
      await sleep(100);
      await ctx.resume();
    }
    else await start();
  }

  let seek = async function (seek_seconds) {
    let was_suspended = is_suspended;
    await stop(seek_seconds);
    if (!was_suspended) await start();
  }

  let release = async () => {
    // nullify all future control commands
    this.start = () => null; this.stop   = () => null;
    this.pause = () => null; this.resume = () => null;

    await pause();
    clearBuffers(); // cleared after pause so no event gets triggered in process
    await stream.release();
  }

  let setMute = async function(unitNum, mute) {
    stream.setMute(unitNum, mute);
  }

  let guarded = (f) => {
    return async (...args) => {
      const release = await mutex.acquire();
      try { await f(...args); } finally { release(); }
    };
  }
  this.start   = guarded(start);
  this.stop    = guarded(stop);
  this.pause   = guarded(pause);
  this.resume  = guarded(resume);
  this.release = guarded(release);
  this.setMute = guarded(setMute);
  this.seek    = guarded(seek);

  this.setVolume = function (volume) {
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  }

  // can't use ctx.state in place of is_suspended because updates are delayed/async
  this.isStarted = () => is_started;

  // initialize player state
  this.isSuspended = () => true;
  this.stop().then(() => {
    this.isSuspended  = () => is_suspended;
    startTime = ctx.currentTime;
  });

  // current time along the song (according to actual audio context)
  this.getCurrentTime = () => Math.max(ctx.currentTime - startTime, minStart);
}
