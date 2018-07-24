// streaming ptcop audio player with basic controls and timekeeping (e.g. loops)

const BUFFER_DURATION_DEFAULT = 1.6;

function emptyStream(ctx) {
  return {
    next: (duration) => ctx.createBuffer(1, 44100*duration, 44100),
    release: () => null
  };
}

async function sleep (ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export let AudioPlayer = function (stream, ctx, buffer_duration=BUFFER_DURATION_DEFAULT) {
  let sources = [];
  // player state initialized later down
  let buffered = null, is_playing = null, startTime = null;
  stream = stream || emptyStream(ctx);

  // TODO: allow seek functionality
  // you'll need it if you want to do stop and then start
  this.start = async function () {
    await this.stop();
    // schedule buffer i+2 after buffer i finishes.
    // this way there's no delay between buffers
    async function nextChunk(time, prev) {
      let buffer = await stream.next(buffer_duration);
      let src = ctx.createBufferSource();
      sources.push(src);
      src.buffer = buffer;
      src.start(time);
      src.connect(ctx.destination);
      prev.onended = (_e) => {
        let i = sources.indexOf(prev);
        if (i > -1) sources.splice(i, 1);
        nextChunk(time + buffer_duration, src);
      }
    }

    startTime = ctx.currentTime + 0.1;
    let dummy = {};

    // schedule the first buffer
    await nextChunk(startTime, dummy);
    // also schedule 2nd buffer immediately (when buffer '0' finishes)
    dummy.onended(null);
    buffered = true;

    await this.resume();
  }

  this.stop = async function () {
    await this.pause();
    // make sure to detach the event handlers that start the next chunk
    for (let src of sources) { src.onended = () => null; src.stop(); }
    buffered = false;
  }

  this.release = function () {
    stream.release();
  }

  this.pause = async function () {
    is_playing = false;
    await ctx.suspend();
  }

  this.resume = async function () {
    is_playing = true;
    // a short delay makes it easier to hear the song start after a mouse click
    if (buffered) {
      await sleep(100);
      await ctx.resume();
    }
    else await this.start();
  }

  // can't use ctx.state because updates are delayed/async
  this.isPlaying = () => is_playing;

  // initialize player state
  this.stop().then(() => { startTime = ctx.currentTime; });

  // current time along the song (according to actual audio context)
  this.getCurrentTime = () => ctx.currentTime - startTime;
}
