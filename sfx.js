let sounds = {};
let playing = new Set();
let muted = true;

let SFX = {
  load: function (name, audio) {
    sounds[name] = audio;
  },
  play: function (name, looped = false) {
    const a = sounds[name];
    a.muted = muted;
    a.loop = looped;
    a.play();
    playing.add(a);
  },
  stop: function (name) {
    const a = sounds[name];
    a.stop();
    playing.remove(a);
  },
  stopAll: function () {
    for (let a in playing) {
      a.stop();
    }
    playing.clear();
  },
  setMuted: function (m) {
    muted = m;
    for (let a in playing) {
      a.muted = muted;
    }
  },
  isMuted: function () {
    return muted;
  },
};

export { SFX };
