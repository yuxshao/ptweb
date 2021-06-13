import Memory from "./memory";
import textDecoder from "./textDecoder";

// emscripten import
import {
    ENVIRONMENT, getNativeTypeSize, getValue, HEAPU8, _free,
    decodeNoise, createPxtone, releasePxtone,
    getPxtoneText, getPxtoneInfo,
    getPxtoneMaster, getPxtoneUnits, getPxtoneEvels,
    setPxtoneUnitMute, getPxtoneUnitMute,
    prepareVomitPxtone, vomitPxtone,
    waitForReady
} from "./emDecoder";

// constant
const TEMP_BUFFER_SIZE = 4096;

const eventKinds = [ // from pxtone_source/pxtnEvelist.h
  "NULL", "ON", "KEY", "PAN_VOLUME", "VELOCITY", "VOLUME", "PORTAMENT",
  "BEATCLOCK", "BEATTEMPO", "BEATNUM", "REPEAT", "LAST", "VOICENO",
  "GROUPNO", "TUNING", "PAN_TIME", "NUM"
];

// main function
// type: noise | pxtone | stream
// inputBuffer: the input project/noise/tune file
// ch: # channels
// sps: samples per second?
// bps: bits per sample I think
async function decode(type, inputBuffer, ch, sps, bps) {
    await waitForReady;
    // input buffer 
    const inputSize = inputBuffer.byteLength;

    const inputBufferMem = new Memory(inputSize);
    // write to Emscripten heap for binding calls
    (new Uint8Array(HEAPU8.buffer)).set(new Uint8Array(inputBuffer), inputBufferMem.ptr);

    // get a buffer of data from the Emscripten heap
    function get_heap (start, size, conv) {
        // we have to re-retrieve the buffer from HEAPU8 every time in case it
        // gets detached from a memory resize
        let buf = HEAPU8.buffer.slice(start, start+size);
        if (typeof conv !== 'undefined')
            buf = new conv(buf);
        return buf;
    }

    // output
    let outputBuffer = null, outputStream = null, data = null,
        master = null, units = null, evels = null;

    switch(type) {
        case "noise": {
            const outputMem = new Memory("*"), outputSizeMem = new Memory("i32");

            const release = () => {
                outputMem.release();
                outputSizeMem.release();
            };

            await waitUntilIdle();

            if(!decodeNoise(
                inputBufferMem.ptr, inputSize, ch, sps, bps,
                outputMem.ptr, outputSizeMem.ptr
            )) {
                release();
                throw new Error("Decode Pxtone Noise Error.");
            }

            const outputStart = outputMem.getValue(), outputEnd = outputStart + outputSizeMem.getValue();
            outputBuffer = get_heap(outputStart, outputSizeMem.getValue());

            _free(outputStart);
            release();
            break;
        }

        case "pxtone": 
        case "stream": {
            // pxVomitMem points to the pxVomit instance. doc for pxwrDoc (some pointer to a ptcop file?)
            // this is allocation
            const pxVomitMem = new Memory("*"), docMem = new Memory("*");

            // create
            if(!createPxtone(
                inputBufferMem.ptr, inputSize, ch, sps, bps,
                pxVomitMem.ptr, docMem.ptr
            )) {
                pxVomitMem.release();
                docMem.release();	
                throw new Error("Create Pxtone Vomit Error.");
            }

            const releaseVomit = () => {
                releasePxtone(pxVomitMem.ptr, docMem.ptr);
                pxVomitMem.release();
                docMem.release();
            };

            // text
            let title = "", comment = "";
            {
                const titleMem = new Memory("*"), titleSizeMem = new Memory("i32");
                const commentMem = new Memory("*"), commentSizeMem = new Memory("i32");

                const release = () => {
                    titleMem.release();
                    titleSizeMem.release();
                    commentMem.release();
                    commentSizeMem.release();
                };

                if(!getPxtoneText(
                    pxVomitMem.ptr, 
                    titleMem.ptr, titleSizeMem.ptr,
                    commentMem.ptr, commentSizeMem.ptr
                )) {
                    release();
                    releaseVomit();
                    throw new Error("Get Pxtone Vomit Text Error.");
                }

                const titleStart = titleMem.getValue(), commentStart = commentMem.getValue();

                if(titleStart) {
                    const titleBuffer = get_heap(titleStart, titleSizeMem.getValue());
                    title = await textDecoder(titleBuffer);
                }

                if(commentStart) {
                    const commentBuffer = get_heap(commentStart, commentSizeMem.getValue());
                    comment = await textDecoder(commentBuffer);
                }

                release();
            }

            // info
            let outputSize;
            {
                const outputSizeMem = new Memory("i32");
                const loopStartMem = new Memory("double"), loopEndMem = new Memory("double");

                const release = () => {
                    outputSizeMem.release();
                    loopStartMem.release();
                    loopEndMem.release();
                };

                if(!getPxtoneInfo(
                    pxVomitMem.ptr, ch, sps, bps,
                    outputSizeMem.ptr, loopStartMem.ptr, loopEndMem.ptr
                )) {
                    release();
                    releaseVomit();
                    throw new Error("Get Pxtone Vomit Info Error.");
                }

                outputSize = outputSizeMem.getValue();

                const loopStart = loopStartMem.getValue(), loopEnd = loopEndMem.getValue();

                data = {
                    "loopStart":    loopStart,
                    "loopEnd":      loopEnd,
                    "title":        title,
                    "comment":      comment,
                    "byteLength":   outputSize
                }

                release();
            }

            // master
            {
                const beatNumMem    = new Memory("i32");
                const beatTempoMem  = new Memory("float");
                const beatClockMem  = new Memory("i32");
                const measNumMem    = new Memory("i32");
                const repeatMeasMem = new Memory("i32");
                const lastMeasMem   = new Memory("i32");

                const release = () => {
                    beatNumMem.release();
                    beatTempoMem.release();
                    beatClockMem.release();
                    measNumMem.release();
                    repeatMeasMem.release();
                    lastMeasMem.release();
                }

                if(!getPxtoneMaster(pxVomitMem.ptr,
                        beatNumMem.ptr, beatTempoMem.ptr, beatClockMem.ptr, measNumMem.ptr,
                        repeatMeasMem.ptr, lastMeasMem.ptr)) {
                    release();
                    releaseVomit();
                    throw new Error("Get Pxtone Vomit Master Error.");
                }

                master = {
                    beatNum:    beatNumMem.getValue(),
                    beatTempo:  beatTempoMem.getValue(),
                    beatClock:  beatClockMem.getValue(),
                    measNum:    measNumMem.getValue(),
                    repeatMeas: repeatMeasMem.getValue(),
                    lastMeas:   lastMeasMem.getValue(),
                }

                release();
            }

            // units
            {
                const unitNumMem = new Memory("i32");
                const namesMem = new Memory("*"), sizesMem = new Memory("*");
                const release = () => {
                    unitNumMem.release();
                    namesMem.release();
                    sizesMem.release();
                }

                if (!getPxtoneUnits(pxVomitMem.ptr, unitNumMem.ptr, namesMem.ptr, sizesMem.ptr)) {
                    release();
                    releaseVomit();
                    throw new Error("Get Pxtone Vomit Units Error.");
                }

                const unitNum = unitNumMem.getValue();
                const sizesStart = sizesMem.getValue();
                const sizesBuffer = get_heap(sizesStart, unitNum * getNativeTypeSize("i32"), Int32Array);
                const namesStart = namesMem.getValue();
                const pointerArray = (function () {
                    switch (getNativeTypeSize("*")) {
                        case 1: return Int8Array;
                        case 2: return Int16Array;
                        case 4: return Int32Array;
                        default: throw "pointer buffer cannot be converted to typed array";
                    }
                })();
                const namesBuffer = get_heap(namesStart, unitNum * getNativeTypeSize("*"), pointerArray);

                units = new Array(unitNum);
                for (let i = 0; i < unitNum; ++i) {
                    const size = sizesBuffer[i];
                    const nameBuffer = get_heap(namesBuffer[i], size);
                    units[i] = await textDecoder(nameBuffer);
                }

                _free(sizesStart);
                _free(namesStart);
                release();
            }

            // evels
            {
                const evelNumMem = new Memory("i32");
                const kindsMem = new Memory("*"), unitsMem = new Memory("*");
                const valuesMem = new Memory("*"), clocksMem = new Memory("*");

                const release = () => {
                    evelNumMem.release();
                    kindsMem.release();
                    unitsMem.release();
                    valuesMem.release();
                    clocksMem.release();
                };

                if(!getPxtoneEvels(pxVomitMem.ptr, evelNumMem.ptr,
                    kindsMem.ptr, unitsMem.ptr, valuesMem.ptr, clocksMem.ptr)) {
                    release();
                    releaseVomit();
                    throw new Error("Get Pxtone Vomit Evels Error.");
                }

                const evelNum = evelNumMem.getValue();

                const kindsStart = kindsMem.getValue();
                const kindsBuffer = get_heap(kindsStart, evelNum * getNativeTypeSize("i8"), Uint8Array);

                const unitsStart = unitsMem.getValue();
                const unitsBuffer = get_heap(unitsStart, evelNum * getNativeTypeSize("i8"), Uint8Array);

                const valuesStart = valuesMem.getValue();
                const valuesBuffer = get_heap(valuesStart, evelNum * getNativeTypeSize("i32"), Int32Array);

                const clocksStart = clocksMem.getValue();
                const clocksBuffer = get_heap(clocksStart, evelNum * getNativeTypeSize("i32"), Int32Array);

                evels = new Array(evelNum);
                for (let i = 0; i < evelNum; ++i) {
                    evels[i] = {
                        kind:    eventKinds[kindsBuffer[i]],
                        unit_no: unitsBuffer[i],
                        value:   valuesBuffer[i],
                        clock:   clocksBuffer[i]
                    }
                }

                _free(kindsStart);
                _free(unitsStart);
                _free(valuesStart);
                _free(clocksStart);
                release();
            }

            // prepare vomit
            {
                if(!prepareVomitPxtone(pxVomitMem.ptr, 0)) {
                    releaseVomit();
                    throw new Error("Get Pxtone Prepare Vomit Error.");
                }
            }

            // vomit
            if(type === "pxtone") {

                // outputSize is essentially sample_num
                outputBuffer = new ArrayBuffer(outputSize);
                const outputArray = new Uint8Array(outputBuffer);

                const tempBufferMem = new Memory(TEMP_BUFFER_SIZE);
                const tempArray = HEAPU8.subarray(tempBufferMem.ptr, tempBufferMem.ptr + TEMP_BUFFER_SIZE);

                const release = () => {
                        tempBufferMem.release();
                };


                // let deadline = await waitUntilIdle();
                for(let pc = 0; pc < outputSize; pc += TEMP_BUFFER_SIZE) {
                    const size = Math.min(TEMP_BUFFER_SIZE, outputSize - pc);

                    if(!vomitPxtone(pxVomitMem.ptr, tempBufferMem.ptr, size)) {
                        release();
                        releaseVomit();
                        throw new Error("Pxtone Vomit Error.");
                    }

                    // memcpy
                    outputArray.set(size === TEMP_BUFFER_SIZE ? tempArray : HEAPU8.subarray(tempBufferMem.ptr, tempBufferMem.ptr + size), pc);

                   // if(!deadline || deadline && deadline.timeRemaining() === 0) deadline = await waitUntilIdle();
                }

                // release
                release();
                releaseVomit();

            } else if(type === "stream") {

                let deadline;
                outputStream = {
                    next: async function (size) {
                        const tempBufferMem = new Memory(size);

                        const release = () => {
                            tempBufferMem.release();
                        };

                        // if (!deadline || deadline && deadline.timeRemaining() === 0)
                            // deadline = await waitUntilIdle();

                        if(!vomitPxtone(pxVomitMem.ptr, tempBufferMem.ptr, size)) {
                            release();
                            releaseVomit();
                            throw new Error("Pxtone Vomit Error.");
                        }

                        let buf = get_heap(tempBufferMem.ptr, size);
                        release();
                        return buf;
                    },
                    reset: function (position) {
                        if(!prepareVomitPxtone(pxVomitMem.ptr, position)) {
                            releaseVomit();
                            throw new Error("Get Pxtone Prepare Vomit Error.");
                        }
                    },
                    release: function () {
                        releaseVomit();
                    },
                    setMute: function(unitNum, isMute) {
                      if (!setPxtoneUnitMute(pxVomitMem.ptr, unitNum, isMute)) {
                        releaseVomit();
                        throw new Error("Set Pxtone Unit Mute Error.");
                      }
                    },
                    getMute: function(unitNum) {
                      const isMuteMem = new Memory("i8");
                      if (!getPxtoneUnitMute(pxVomitMem.ptr, unitNum, isMuteMem.ptr)) {
                        isMuteMem.release();
                        releaseVomit();
                        throw new Error("Get Pxtone Unit Mute Error.");
                      }

                      const isMute = isMuteMem.getValue();
                      isMuteMem.release();
                      return (isMute != 0);
                    }
                };
            }
            break;
        }

        default:
            throw new TypeError(`decode type is invalid (${ type })`);
    }

    return {
        "buffer":   outputBuffer,
        "stream":   outputStream,
        "data":     data,
        "master":   master,
        "units":    units,
        "evels":    evels
    };
}

// export
if(ENVIRONMENT === "NODE") {
	module["exports"] = decode;
} else if(ENVIRONMENT === "WEB") {
	global["pxtnDecoder"] = decode;
} else if(ENVIRONMENT === "WORKER") {
    function handleExceptions(handle) {
        return async function (e) {
            try { await handle(e["data"]); } catch (err) {
                console.log("Error while handling message");
                console.log("Data: ", e["data"]);
                console.log("Error: ", err);
                throw err
            }
        }
    }

    // e is a MessageEvent. import info is in data
    async function handleMessage(data) {
        const type = data["type"];

        const types = ["noise", "pxtone", "stream"];
        const stream_commands =
          ["stream_next", "stream_reset", "stream_release",
            "stream_set_mute", "stream_get_mute"];

        if(!types.includes(type) && !stream_commands.includes(type))
            throw new TypeError(`worker message type is invalid (${ type })`);

        if(stream_commands.includes(type))
            return;

        const sessionId = data["sessionId"];
        let msg = await decode(type, data["buffer"], data["ch"], data["sps"], data["bps"]);
        const { buffer, stream } = msg;

        msg.sessionId = sessionId;
        // requestId added so that different worker calls of the same session
        // wouldn't get responses mixed up. (e.g., mute and next)
        msg.requestId = data["requestId"];
        delete msg.stream;
        // here the worker is responding to the main thread
        global["postMessage"](msg, stream ? [] : [buffer]);

        // stream
        if(stream) {
            async function handleStream(data) {
                if (data["sessionId"] !== sessionId)
                    return;
                switch (data["type"]) {
                    case "stream_next":
                        await stream.next(data["size"]).then((next) =>
                            global["postMessage"]({
                                "sessionId":    sessionId,
                                "requestId":    data["requestId"],
                                "streamBuffer": next
                            }));
                        break;
                    case "stream_reset": stream.reset(data['position']); break;
                    case "stream_release": stream.release(); break;
                    case "stream_set_mute": stream.setMute(data['unitNum'], data['isMute']); break;
                    case "stream_get_mute":
                        let isMute = stream.getMute(data['unitNum'], data['isMute']);
                        global["postMessage"]({
                            "sessionId":    sessionId,
                            "requestId":    data["requestId"],
                            "isMute": isMute
                        });
                        break;
                }
            }
            global["addEventListener"]("message", handleExceptions(handleStream));
        }
	};

    global["addEventListener"]("message", handleExceptions(handleMessage));
}
