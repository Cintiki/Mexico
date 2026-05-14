const SOUND_PATHS = {
  uiClick: "assets/sounds/01_ui_click_guitar_pluck_16bit.wav",
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

const VOLUMES = {
  setupLoop: 0.24,
  rollWaitLoop: 0.18,
  winnerLoop: 0.18,
  uiClick: 0.34,
  characterSelect: 0.34,
  diceShake: 0.46,
  diceLand: 0.52,
  mexicoRoll: 0.56,
  strike: 0.46,
  playerOut: 0.56,
  potAdd: 0.42,
  potWinner: 0.56,
  gameWinner: 0.62,
  startGame: 0.56,
};

const cache = new Map();
let activeLoop = null;
let activeLoopName = null;
let isUnlocked = false;

export function preloadAudio() {
  Object.keys(SOUND_PATHS).forEach((name) => getAudio(name));
}

export function unlockAudio() {
  if (isUnlocked) return;
  isUnlocked = true;
  const audio = getAudio("uiClick");
  audio?.play().then(() => {
    audio.pause();
    audio.currentTime = 0;
  }).catch(() => {});
}

export function playSound(name) {
  const base = getAudio(name);
  if (!base) return;
  const audio = base.cloneNode();
  audio.volume = volumeFor(name);
  audio.loop = false;
  audio.play().catch(() => {});
}

export function startLoop(name) {
  if (activeLoopName === name && activeLoop) return;
  stopLoop();
  const audio = getAudio(name);
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
  cache.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
}

function getAudio(name) {
  if (!SOUND_PATHS[name] || typeof Audio === "undefined") return null;
  if (!cache.has(name)) {
    const audio = new Audio(SOUND_PATHS[name]);
    audio.preload = "auto";
    audio.volume = volumeFor(name);
    cache.set(name, audio);
  }
  return cache.get(name);
}

function volumeFor(name) {
  return VOLUMES[name] ?? 0.4;
}
