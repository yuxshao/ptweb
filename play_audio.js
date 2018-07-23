// streaming ptcop audio player with basic controls and timekeeping (e.g. loops)

const BUFFER_DURATION_DEFAULT = 1.6;

function emptyStream(ctx) {
  return {
    next: (duration) => ctx.createBuffer(1, 44100*duration, 44100),
    release: () => null
  };
}

export let AudioPlayer = function (stream, ctx, buffer_duration=BUFFER_DURATION_DEFAULT) {
  let sources = [];
  let startTime = 0;

  stream = stream || emptyStream(ctx);

  this.schedule_start = async function () {
    // play 1st buffer, schedule 2nd buffer immediately,
    // schedule buffer i+2 after buffer i finishes.
    // this way there's no delay between buffers
    let buffer = await stream.next(buffer_duration);
    let src = ctx.createBufferSource();
    src.buffer = buffer;
    // if 1st buffer is scheduled exactly at currentTime it starts slightly late,
    // causing overlap with 2nd buffer. so, delaying a bit avoids overlap.
    // a delay also makes it easier to hear the song start after a mouse click
    let time = ctx.currentTime + 0.25;
    src.start(time);
    src.connect(ctx.destination);
    (async function nextChunk(time, prev) {
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
    })(time + buffer_duration, src);

    startTime = time;
  }

  this.stop = function () {
    // make sure to detach the event handlers that start the next chunk
    for (let src of sources) { src.onended = () => null; src.stop(); }
    // TODO: reset to start position? or maybe specify position in schedule start?
  }

  this.release = function () {
    stream.release();
  }

  // current time along the song (according to actual audio context)
  this.getCurrentTime = () => ctx.currentTime - startTime;
}
