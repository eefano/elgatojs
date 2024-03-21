let context;
let gain, loopgain;

let sounds = {};
let playing = new Set();
let looping = new Set();
let muted = true;
let loopmuted = false;
let initialized = false;

let SFX = {
  load: function (name, rawbuffer) {
    sounds[name] = { rawbuffer };
  },
  play: function (name, looped = false) {
    const a = sounds[name];
    if (initialized) {
      const source = context.createBufferSource();
      source.buffer = a.audiobuffer;
      source.connect(looped ? loopgain : gain);
      source.loop = looped;
      source.onended = () => { playing.delete(source); }
      source.start();
      playing.add(source);
    }
    if (looped) looping.add(a);
  },
  stopAll: function () {
    if (initialized) {
      for (const source of playing) {
        source.stop(0);
      }
    }
    looping.clear();
  },
  setMuted: function (m) {
    muted = m;
    if (!muted && !initialized) {
      context = new AudioContext();
      gain = context.createGain();
      gain.connect(context.destination);
      loopgain = context.createGain();
      loopgain.connect(gain);
      loopgain.gain.value = loopmuted ? 0 : 1;

      Object.values(sounds).forEach(async (a) => {
        a.audiobuffer = await context.decodeAudioData(a.rawbuffer);
        if (looping.has(a)) {
          const source = context.createBufferSource();
          source.buffer = a.audiobuffer;
          source.connect(loopgain);
          source.onended = () => { playing.delete(source); }
          source.loop = true;
          source.start();
          playing.add(source);
        }
      });
      initialized = true;
    }
    gain.gain.value = muted ? 0 : 1;
  },
  isMuted: function () {
    return muted;
  },
  setLoopMuted: function(m) {
    loopmuted = m;
    if(initialized)
    {
      loopgain.gain.value = loopmuted ? 0 : 1;
    }
  },
  isLoopMuted: function () {
    return loopmuted;
  },
};

export { SFX };
