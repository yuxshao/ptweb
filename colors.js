"use strict";

let DEFAULT_VELOCITY;
let DEFAULT_VOLUME;

// this module exports getColorGen, a function taking in the default velocity
// and volume and outputting a list of named pairs (note, key). Each element
// in the pair is a function producing a color given current velocity and
// volume, according to a linear interpolation in the corresponding colors
// structure here.
let colors = [
  { "note": ["#F08000", "#FFFF00", "#FFFF80"], // orange 0
    "key" : ["#C06000", "#F08000", "#FFC400"] },
  { "note": ["#6979FF", "#B4C9FF", "#D9E8FF"], // indigo 3
    "key" : ["#483EFF", "#6979FF", "#B4C9FF"] },
  { "note": ["#5BB308", "#96FF33", "#DAFFB8"], // yellow-green 6
    "key" : ["#479100", "#5BB308", "#96FF33"] },
  { "note": ["#FC32CB", "#FFA9FF", "#FFE0FF"], // magenta 2
    "key" : ["#DF0083", "#FF4CD4", "#FFA9FF"] },
  { "note": ["#00C060", "#31FF98", "#C5FFE2"], // blue-green 5
    "key" : ["#008041", "#00C060", "#00E874"] },
  { "note": ["#FF775D", "#FFC39C", "#FFEDD9"], // red 1
    "key" : ["#D82E2E", "#FF775D", "#FFC39C"] },
  { "note": ["#00BDFF", "#CFE8FF", "#90FFFF"], // cyan 4
    "key" : ["#0093C6", "#00BDFF", "#CFE8FF"] },
];

function colToStr(c) {
  return "rgb(" + c.r + ", " + c.g + ", " + c.b + ")";
}

function colLerp(c1, c2, p) {
  return {
    r: c1.r * (1-p) + c2.r * p,
    g: c1.g * (1-p) + c2.g * p,
    b: c1.b * (1-p) + c2.b * p
  }
}

// adapted from kennebec's answer here: https://stackoverflow.com/a/21648508/
function fromHex(hex){
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return {r:(c>>16)&255, g:(c>>8)&255, b:c&255};
    }
    throw new Error('Bad Hex');
}

function noteColorGen(cs) {
  let c1 = fromHex(cs[0]);
  let c2 = fromHex(cs[1]);
  let c3 = fromHex(cs[2]);
  // interpolate c1 to c2 until default velocities and volume
  // c2 to c3 from to max velocity and volume
  return function (is_playing, vel, vol) {
    let c = {r:null, g:null, b:null};
    if (!is_playing) return colToStr(c1);
    // velocity has a higher floor (e.g. 0.1 vel -> ~0.235*p) than volume (e.g. 0.1 vol -> 0.1*p)
    let p = Math.min((0.15 + 0.85 * (vel / DEFAULT_VELOCITY)) * vol / DEFAULT_VOLUME, 1);
    if (p < 1) return colToStr(colLerp(c1, c2, p));
    let def_p = DEFAULT_VELOCITY * DEFAULT_VOLUME / 128 / 128;
    let raw_p = vel * vol / 128 / 128;
    p = Math.max(0, (raw_p - def_p) / (1 - def_p));
    return colToStr(colLerp(c2, c3, p));
  }
}

export let getColorGen = (function (default_vel, default_vol) {
  DEFAULT_VELOCITY = default_vel;
  DEFAULT_VOLUME   = default_vol;
  let getColor = new Array(colors.length);
  for (let i = 0; i < colors.length; ++i) {
    getColor[i] = {
      "note": noteColorGen(colors[i].note),
      "key":  noteColorGen(colors[i].key),
    };
  }
  return getColor;
});