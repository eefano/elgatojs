let context;
let gain;

let sounds = {};
let playing = new Set();
let looping = new Set();
let muted = true;
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
      source.connect(gain);
      source.loop = looped;
      source.onended = () => { playing.delete(source); }
      source.start();
      playing.add(source);
    }
    if (looped) looping.add(a);
  },
  stopAll: function () {
    if (initialized) {
      console.log(playing);
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

      Object.values(sounds).forEach(async (a) => {
        a.audiobuffer = await context.decodeAudioData(a.rawbuffer);
        if (looping.has(a)) {
          const source = context.createBufferSource();
          source.buffer = a.audiobuffer;
          source.connect(gain);
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
};

export { SFX };
