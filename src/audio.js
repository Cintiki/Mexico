const SOUND_PATHS = {
  uiClick: "assets/sounds/01_ui_click_guitar_pluck_16bit.wav",
  startOrderRoll: "assets/sounds/02_character_select_guitar_blip_16bit.wav",
  characterSelect: "assets/sounds/02_character_select_guitar_blip_16bit.wav",
  setupLoop: "assets/sounds/03_setup_screen_loop_cantina_16bit.wav",
  startGame: "assets/sounds/04_start_game_mariachi_stinger_16bit.wav",
  rollWaitLoop: "assets/sounds/05_roll_choice_loop_mariachi_waiting_16bit.wav",
  diceShake: "assets/sounds/06_dice_shake_16bit_1p08s.wav",
  diceLand: "assets/sounds/07_dice_land_guitar_clack_16bit.wav",
  mexicoRoll: "assets/sounds/08_mexico_roll_mariachi_horns_16bit.wav",
  strike: "assets/sounds/09_strike_muted_guitar_stab_16bit.wav",
  playerOut: "assets/sounds/10_player_out_sad_horn_16bit.wav",
  potAdd: "assets/sounds/11_coin_pot_cantina_clink_16bit.wav",
  potWinner: "assets/sounds/12_pot_winner_coin_mariachi_16bit.wav",
  gameWinner: "assets/sounds/13_game_winner_mariachi_fanfare_16bit.wav",
  winnerLoop: "assets/sounds/14_winner_screen_loop_soft_mariachi_16bit.wav",
};

const MUSIC_PATHS = {
  background: "assets/sounds/15_mexico_song_Loop.mp3",
};

const VOLUMES = {
  background: 0.24,
  setupLoop: 0.05,
  rollWaitLoop: 0.04,
  winnerLoop: 0.05,
  uiClick: 0.58,
  startOrderRoll: 0.64,
  characterSelect: 0.58,
  diceShake: 0.72,
  diceLand: 0.78,
  mexicoRoll: 0.82,
  strike: 0.72,
  playerOut: 0.82,
  potAdd: 0.68,
  potWinner: 0.82,
  gameWinner: 0.86,
  startGame: 0.82,
};

const STORAGE_KEY = "mexicoAudioEnabled";
const cache = new Map();
const musicCache = new Map();
const activeEffects = new Set();
let activeLoop = null;
let activeLoopName = null;
let isUnlocked = false;
let audioEnabled = loadAudioPreference();
let backgroundMusic = null;

export function preloadAudio() {
  if (!audioEnabled) return;
  ["uiClick", "characterSelect", "startOrderRoll"].forEach((name) => getAudio(name, "metadata"));
}

export function unlockAudio() {
  if (isUnlocked) {
    startBackgroundMusic();
    return;
  }
  isUnlocked = true;
  const audio = getAudio("uiClick", "auto");
  audio?.play().then(() => {
    audio.pause();
    audio.currentTime = 0;
  }).catch(() => {});
  startBackgroundMusic();
}

export function playSound(name) {
  if (!audioEnabled) return;
  const base = getAudio(name, "auto");
  if (!base) return;
  const audio = base.cloneNode();
  audio.volume = volumeFor(name);
  audio.loop = false;
  activeEffects.add(audio);
  audio.addEventListener("ended", () => activeEffects.delete(audio), { once: true });
  audio.play().catch(() => {});
}

export function startLoop(name) {
  if (!audioEnabled) return;
  if (activeLoopName === name && activeLoop) return;
  stopLoop();
  const audio = getAudio(name, "auto");
  if (!audio) return;
  audio.loop = true;
  audio.volume = volumeFor(name);
  audio.currentTime = 0;
  activeLoop = audio;
  activeLoopName = name;
  audio.play().catch(() => {});
}

export function stopLoop() {
  if (!activeLoop) return;
  activeLoop.pause();
  activeLoop.currentTime = 0;
  activeLoop = null;
  activeLoopName = null;
}

export function stopAllAudio() {
  stopLoop();
  stopBackgroundMusic();
  activeEffects.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  activeEffects.clear();
  cache.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
}

export function startBackgroundMusic() {
  if (!audioEnabled || !isUnlocked) return;
  const audio = getMusic("background", "auto");
  if (!audio) return;
  if (!backgroundMusic) backgroundMusic = audio;
  audio.loop = true;
  audio.volume = volumeFor("background");
  audio.play().catch(() => {});
}

export function setAudioEnabled(enabled) {
  audioEnabled = Boolean(enabled);
  saveAudioPreference(audioEnabled);
  if (audioEnabled) {
    startBackgroundMusic();
  } else {
    stopAllAudio();
  }
}

export function isAudioEnabled() {
  return audioEnabled;
}

function getAudio(name, preload = "metadata") {
  if (!SOUND_PATHS[name] || typeof Audio === "undefined") return null;
  if (!cache.has(name)) {
    const audio = new Audio(SOUND_PATHS[name]);
    audio.preload = preload;
    audio.volume = volumeFor(name);
    cache.set(name, audio);
  } else if (preload === "auto") {
    cache.get(name).preload = "auto";
  }
  return cache.get(name);
}

function getMusic(name, preload = "metadata") {
  if (!MUSIC_PATHS[name] || typeof Audio === "undefined") return null;
  if (!musicCache.has(name)) {
    const audio = new Audio(MUSIC_PATHS[name]);
    audio.preload = preload;
    audio.loop = true;
    audio.volume = volumeFor(name);
    musicCache.set(name, audio);
  } else if (preload === "auto") {
    musicCache.get(name).preload = "auto";
  }
  return musicCache.get(name);
}

function stopBackgroundMusic() {
  if (!backgroundMusic) return;
  backgroundMusic.pause();
}

function volumeFor(name) {
  return VOLUMES[name] ?? 0.4;
}

function loadAudioPreference() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

function saveAudioPreference(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {}
}
