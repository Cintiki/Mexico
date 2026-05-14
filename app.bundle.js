(function () {
"use strict";
function showStartupError(error) {
  var app = document.querySelector("#app");
  if (!app) return;
  app.innerHTML = '<section class="board"><h1 class="screen-title">Startup Error</h1><p class="screen-copy">' + String(error && (error.message || error)).replace(/[<>&]/g, function (c) { return ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]; }) + '</p></section>';
}
window.addEventListener("error", function (event) { showStartupError(event.error || event.message); });
window.addEventListener("unhandledrejection", function (event) { showStartupError(event.reason); });
try {
// src/assets.js
const CHARACTER_ORDER = ["jose", "pedro", "gomez", "jebuz"];

const ASSETS = {
  branding: {
    main: "assets/branding/mexico_logo_main.png",
    small: "assets/branding/mexico_logo_small.png",
  },
  diceFaces: {
    1: "assets/dice/die_face_1.png",
    2: "assets/dice/die_face_2.png",
    3: "assets/dice/die_face_3.png",
    4: "assets/dice/die_face_4.png",
    5: "assets/dice/die_face_5.png",
    6: "assets/dice/die_face_6.png",
  },
  events: {
    mexico: "assets/events/event_mexico.png",
    rideBus: "assets/events/event_ride_the_bus.png",
    playerOut: "assets/events/event_player_out.png",
    roundWinner: "assets/events/event_round_winner.png",
    gameWinner: "assets/events/event_game_winner.png",
    sessionChampion: "assets/events/event_session_champion.png",
    tiebreaker: "assets/events/event_tiebreaker.png",
  },
  icons: {
    coin: "assets/icons/icon_coin.png",
    strike: "assets/icons/icon_strike.png",
    sombrero: "assets/icons/icon_sombrero_status.png",
    pot: "assets/icons/icon_pot.png",
    npc: "assets/icons/icon_npc.png",
    out: "assets/icons/icon_out.png",
    tiebreaker: "assets/icons/icon_tiebreaker_die.png",
    turn: "assets/icons/icon_turn_marker.png",
  },
  props: {
    diceRollArea: "assets/props/prop_dice_roll_area.png",
    tableShadow: "assets/props/prop_table_shadow.png",
    coinBurst: "assets/props/prop_coin_burst.png",
    sombreroLarge: "assets/props/prop_sombrero_large.png",
    diceSparkLines: "assets/props/prop_dice_spark_lines.png",
  },
  diceSprites: {
    shake: { src: "assets/sprites/dice/mexico_dice_shake_hand_02_8f.png", frames: 8, ratio: 1, duration: 560 },
    throw: { src: "assets/sprites/dice/mexico_dice_pick_up_hand_8f.png", frames: 8, ratio: 1, reverse: true, duration: 520 },
    pickup: { src: "assets/sprites/dice/mexico_dice_pick_up_hand_8f.png", frames: 8, ratio: 1, duration: 520 },
    byCharacter: {
      jose: {
        shake: { src: "assets/sprites/dice/mexico_dice_shake_hand_jose_02_8f.png", frames: 8, ratio: 1, duration: 560 },
        throw: { src: "assets/sprites/dice/mexico_dice_pick_up_hand_jose_8f.png", frames: 8, ratio: 1, reverse: true, duration: 520 },
        pickup: { src: "assets/sprites/dice/mexico_dice_pick_up_hand_jose_8f.png", frames: 8, ratio: 1, duration: 520 },
      },
      gomez: {
        shake: { src: "assets/sprites/dice/mexico_dice_shake_hand_gomez_02_8f.png", frames: 8, ratio: 1, duration: 560 },
        throw: { src: "assets/sprites/dice/mexico_dice_pick_up_hand_gomez_8f.png", frames: 8, ratio: 1, reverse: true, duration: 520 },
        pickup: { src: "assets/sprites/dice/mexico_dice_pick_up_hand_gomez_8f.png", frames: 8, ratio: 1, duration: 520 },
      },
      jebuz: {
        shake: { src: "assets/sprites/dice/mexico_dice_shake_hand_jebuz_02_8f.png", frames: 8, ratio: 1, duration: 560 },
        throw: { src: "assets/sprites/dice/mexico_dice_pick_up_hand_jebuz_8f.png", frames: 8, ratio: 1, reverse: true, duration: 520 },
        pickup: { src: "assets/sprites/dice/mexico_dice_pick_up_hand_jebuz_8f.png", frames: 8, ratio: 1, duration: 520 },
      },
    },
    bounce: { src: "assets/sprites/dice/mexico_dice_bounce_6f.png", frames: 6, ratio: 1, duration: 360 },
  },
};

const CHARACTERS = {
  jose: character("jose", "Jose"),
  pedro: character("pedro", "Pedro"),
  gomez: {
    ...character("gomez", "Gomez"),
    note: "Gomez is a Chihuahua character.",
  },
  jebuz: character("jebuz", "Jebuz"),
};

const imageCache = new Map();

function character(id, defaultName) {
  return {
    id,
    defaultName,
    portrait: `assets/portraits/portrait_${id}.png`,
    sprites: {
      idle: { src: `assets/sprites/${id}/mexico_${id}_idle_4f.png`, frames: 4, ratio: 1, loop: true },
      victory: { src: `assets/sprites/${id}/mexico_${id}_victory_8f.png`, frames: 8, ratio: 1 },
      lose: { src: `assets/sprites/${id}/mexico_${id}_lose_6f.png`, frames: 6, ratio: 1 },
      out: { src: `assets/sprites/${id}/mexico_${id}_out_static.png`, frames: 1, ratio: 1, static: true },
      bus: { src: `assets/sprites/${id}/mexico_${id}_bus_static.png`, frames: 1, ratio: 1, static: true },
    },
  };
}

function loadImage(src) {
  if (!src || typeof Image === "undefined") return Promise.resolve(null);
  if (!imageCache.has(src)) {
    const img = new Image();
    const promise = new Promise((resolve) => {
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
    img.src = src;
    imageCache.set(src, promise);
  }
  return imageCache.get(src);
}

function preloadImages(paths) {
  const unique = [...new Set(paths.filter(Boolean))];
  unique.forEach((src) => loadImage(src));
}

function preloadInitialAssets() {
  preloadImages([
    ASSETS.branding.main,
    ASSETS.branding.small,
    ...CHARACTER_ORDER.map((id) => CHARACTERS[id].portrait),
  ]);
}

function preloadGameplayAssets(seats = []) {
  const characterIds = selectedCharacterIds(seats);
  preloadImages([
    ASSETS.branding.small,
    ASSETS.props.diceRollArea,
    ASSETS.props.tableShadow,
    ...Object.values(ASSETS.diceFaces),
    ASSETS.icons.coin,
    ASSETS.icons.strike,
    ASSETS.icons.sombrero,
    ASSETS.icons.pot,
    ASSETS.icons.npc,
    ASSETS.icons.out,
    ASSETS.icons.tiebreaker,
    ASSETS.icons.turn,
    ASSETS.diceSprites.shake.src,
    ASSETS.diceSprites.throw.src,
    ASSETS.diceSprites.pickup.src,
    ASSETS.diceSprites.bounce.src,
    ...characterIds.map((id) => CHARACTERS[id].portrait),
    ...characterIds.map((id) => CHARACTERS[id].sprites.idle.src),
    ...characterIds.flatMap((id) => characterDiceSpritePaths(id)),
  ]);
}

function preloadEventAssets(state) {
  const paths = [];
  const queue = [state?.overlay, state?.pendingOverlay, ...(state?.overlayQueue ?? [])].filter(Boolean);
  queue.forEach((overlay) => {
    const event = eventAssetForType(overlay.type);
    if (event) paths.push(event);
  });

  (state?.seats ?? []).forEach((seat) => {
    const sprite = CHARACTERS[seat.characterId]?.sprites?.[seat.spriteState];
    if (sprite) paths.push(sprite.src);
  });

  if (state?.screen === "game-winner" || state?.screen === "session-champion") {
    paths.push(
      ASSETS.events.gameWinner,
      ASSETS.events.sessionChampion,
      ASSETS.props.coinBurst,
      ASSETS.icons.pot,
      ASSETS.props.diceRollArea,
    );
  }

  preloadImages(paths);
}

function preloadAssets() {
  preloadInitialAssets();
}

function selectedCharacterIds(seats) {
  return [...new Set(seats.map((seat) => seat.characterId).filter(Boolean))];
}

function characterDiceSpritePaths(characterId) {
  const characterSprites = ASSETS.diceSprites.byCharacter?.[characterId] ?? {};
  return [
    characterSprites.shake?.src,
    characterSprites.throw?.src,
    characterSprites.pickup?.src,
    ASSETS.diceSprites.bounce.src,
  ].filter(Boolean);
}

function eventAssetForType(type) {
  return {
    mexico: ASSETS.events.mexico,
    tiebreaker: ASSETS.events.tiebreaker,
    roundWinner: ASSETS.events.roundWinner,
    rideBus: ASSETS.events.rideBus,
    playerOut: ASSETS.events.playerOut,
    gameWinner: ASSETS.events.gameWinner,
    sessionChampion: ASSETS.events.sessionChampion,
  }[type];
}

function preloadAllAssetsForDiagnostics() {
  const paths = new Set();
  const collect = (value) => {
    if (!value) return;
    if (typeof value === "string") paths.add(value);
    else if (Array.isArray(value)) value.forEach(collect);
    else if (typeof value === "object") Object.values(value).forEach(collect);
  };
  collect(ASSETS);
  collect(CHARACTERS);
  preloadImages([...paths]);
}


// src/audio.js
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

function preloadAudio() {
  if (!audioEnabled) return;
  ["uiClick", "characterSelect", "startOrderRoll"].forEach((name) => getAudio(name, "metadata"));
}

function unlockAudio() {
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

function playSound(name) {
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

function startLoop(name) {
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

function stopLoop() {
  if (!activeLoop) return;
  activeLoop.pause();
  activeLoop.currentTime = 0;
  activeLoop = null;
  activeLoopName = null;
}

function stopAllAudio() {
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

function startBackgroundMusic() {
  if (!audioEnabled || !isUnlocked) return;
  const audio = getMusic("background", "auto");
  if (!audio) return;
  if (!backgroundMusic) backgroundMusic = audio;
  audio.loop = true;
  audio.volume = volumeFor("background");
  audio.play().catch(() => {});
}

function setAudioEnabled(enabled) {
  audioEnabled = Boolean(enabled);
  saveAudioPreference(audioEnabled);
  if (audioEnabled) {
    startBackgroundMusic();
  } else {
    stopAllAudio();
  }
}

function isAudioEnabled() {
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


// src/scoring.js
const NORMAL_RANKS = {
  31: 1,
  32: 2,
  41: 3,
  42: 4,
  43: 5,
  51: 6,
  52: 7,
  53: 8,
  54: 9,
  61: 10,
  62: 11,
  63: 12,
  64: 13,
  65: 14,
};

function rollOneDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function rollTwoDice() {
  return [rollOneDie(), rollOneDie()];
}

function scoreTwoDice(dice) {
  const [a, b] = dice;
  if ((a === 2 && b === 1) || (a === 1 && b === 2)) {
    return { dice, rank: 21, label: "Mexico", isMexico: true, kind: "mexico" };
  }
  if (a === b) {
    return { dice, rank: 14 + a, label: `${a}-${b}`, isMexico: false, kind: "double" };
  }
  const high = Math.max(a, b);
  const low = Math.min(a, b);
  const key = Number(`${high}${low}`);
  return { dice: [high, low], rank: NORMAL_RANKS[key], label: `${high}-${low}`, isMexico: false, kind: "normal" };
}

function compareScores(a, b) {
  return a.rank - b.rank;
}

function describeStrikeGain(mexicoCount) {
  return mexicoCount > 0 ? mexicoCount * 2 : 1;
}

function tiedByScore(entries, highWins) {
  const ranks = entries.map((entry) => entry.score.rank);
  const target = highWins ? Math.max(...ranks) : Math.min(...ranks);
  return entries.filter((entry) => entry.score.rank === target);
}


// src/state.js

function createState() {
  return {
    screen: "landing",
    phase: "landing",
    realPlayerCount: 1,
    setup: {
      names: ["", "", "", ""],
      picks: [null, null, null, null],
      errors: ["", "", "", ""],
    },
    seats: CHARACTER_ORDER.map((characterId, seatIndex) => ({
      seatIndex,
      characterId,
      displayName: CHARACTERS[characterId].defaultName,
      isNpc: true,
      coins: 3,
      strikes: 0,
      isOut: false,
      isRidingBus: false,
      spriteState: "idle",
      lastRoll: null,
      turnRollsUsed: 0,
      joinedGame: true,
    })),
    game: freshGame(),
    startOrder: freshStartOrder(),
    dice: {
      isAnimating: false,
      animationStage: null,
      visibleFinalDice: null,
      pendingRoll: null,
    },
    message: "Ready to roll.",
    log: [],
    overlay: null,
    overlayQueue: [],
    pendingOverlay: null,
    rulesOpen: false,
  };
}

function freshGame() {
  return {
    activeSeatIds: [],
    pot: 0,
    startingSeatId: null,
    currentSeatId: null,
    turnOrder: [],
    maxRollsThisRound: null,
    roundRolls: {},
    mexicoCount: 0,
    busUsed: false,
    busSeatId: null,
    roundNumber: 1,
    starterRollTarget: null,
    turnIndex: 0,
    currentBest: null,
    awaitingNextRound: false,
    pendingAutoHoldSeatId: null,
    lastPayout: 0,
    winnerSeatId: null,
  };
}

function freshStartOrder() {
  return {
    phase: "ready",
    candidates: [],
    queue: [],
    lockedIds: [],
    pendingGroups: [],
    rolls: {},
    displayRolls: {},
    order: [],
    rollingSeatId: null,
    rollStartedAt: 0,
    cycleDie: 1,
    message: "Ready to roll.",
    isComplete: false,
  };
}

function addLog(state, text) {
  state.log = [text, ...state.log].slice(0, 6);
}


// src/npc.js

function chooseStarterRollTarget() {
  const roll = Math.random();
  if (roll < 0.25) return 1;
  if (roll < 0.75) return 2;
  return 3;
}

function shouldNpcRollAgain(state, seat) {
  if (!seat.lastRoll) return true;
  const rollsLeft = getRollLimit(state, seat) - seat.turnRollsUsed;
  if (rollsLeft <= 0) return false;
  if (state.game.currentSeatId === state.game.startingSeatId) {
    return seat.turnRollsUsed < (state.game.starterRollTarget ?? 2);
  }
  if (!state.game.currentBest || state.game.currentBest.seatIndex === seat.seatIndex) {
    return false;
  }
  return compareScores(seat.lastRoll, state.game.currentBest.score) <= 0;
}

function getRollLimit(state, seat) {
  if (seat.seatIndex === state.game.startingSeatId) return 3;
  return state.game.maxRollsThisRound ?? 1;
}


// src/sprites.js
function spriteStyle(sprite) {
  return [
    `--frames: ${sprite.frames}`,
    `--sprite-ratio: ${sprite.ratio ?? 1}`,
    `--sprite-duration: ${sprite.duration ?? 700}ms`,
    `--sprite-direction: ${sprite.reverse ? "reverse" : "normal"}`,
  ].join(";");
}


// src/turns.js

function setRealPlayerCount(state, count) {
  state.realPlayerCount = count;
  state.setup.names = Array.from({ length: count }, (_, index) => state.setup.names[index] ?? "");
  state.setup.picks = Array.from({ length: count }, (_, index) => state.setup.picks[index] ?? null);
  state.setup.errors = Array.from({ length: count }, () => "");
  state.screen = "setup";
  state.phase = "player-setup";
}

function validateAndCreateSeats(state) {
  let isValid = true;
  const used = new Set();
  state.setup.errors = state.setup.names.map(() => "");

  for (let index = 0; index < state.realPlayerCount; index += 1) {
    const name = state.setup.names[index].trim();
    const pick = state.setup.picks[index];
    if (!name) {
      state.setup.errors[index] = "Enter a player name.";
      isValid = false;
    } else if (!pick) {
      state.setup.errors[index] = "Pick a character.";
      isValid = false;
    } else if (used.has(pick)) {
      state.setup.errors[index] = "Character already picked.";
      isValid = false;
    }
    if (pick) used.add(pick);
  }
  if (!isValid) return false;

  const seats = [];
  for (let index = 0; index < state.realPlayerCount; index += 1) {
    const characterId = state.setup.picks[index];
    const trimmedName = state.setup.names[index].trim();
    seats.push(makeSeat(seats.length, characterId, characterId === "jebuz" ? `${trimmedName}-Jebuz` : trimmedName, false));
  }

  CHARACTER_ORDER.filter((id) => !used.has(id)).forEach((characterId) => {
    seats.push(makeSeat(seats.length, characterId, CHARACTERS[characterId].defaultName, true));
  });

  state.seats = seats;
  state.screen = "buy-in";
  state.phase = "buy-in";
  prepareNextGame(state);
  return true;
}

function prepareNextGame(state) {
  const eligible = state.seats.filter((seat) => seat.coins > 0);
  if (eligible.length <= 1) {
    state.screen = "session-champion";
    state.phase = "session-champion";
      pushOverlay(state, "sessionChampion", `${eligible[0]?.displayName ?? "Nobody"} is Mexico Champion!`, "Session over.");
    return;
  }

  state.game = freshGame();
  state.startOrder = freshStartOrder();
  state.seats.forEach((seat) => {
    seat.strikes = 0;
    seat.isOut = false;
    seat.isRidingBus = false;
    seat.spriteState = "idle";
    seat.lastRoll = null;
    seat.turnRollsUsed = 0;
    seat.joinedGame = seat.coins > 0;
    if (seat.joinedGame) {
      seat.coins -= 1;
      state.game.pot += 1;
      state.game.activeSeatIds.push(seat.seatIndex);
    }
  });
  state.screen = "start-order";
  state.phase = "start-order";
  addLog(state, `Buy-in complete. The pot is ${state.game.pot} coins.`);
}

function resolveStartOrder(state) {
  if (!state.startOrder.isComplete) return;
  const orderedIds = state.startOrder.order.length ? state.startOrder.order : state.game.activeSeatIds;
  const winner = orderedIds[0];
  state.game.startingSeatId = winner;
  state.game.currentSeatId = winner;
  state.game.turnOrder = orderedIds;
  startRound(state, winner);
  state.screen = "game";
  state.phase = "round-turn";
  addLog(state, `${seatById(state, winner).displayName} starts the first round.`);
}

function beginStartOrder(state) {
  const active = [...state.game.activeSeatIds];
  state.overlay = null;
  state.overlayQueue = [];
  state.pendingOverlay = null;
  state.startOrder = {
    ...freshStartOrder(),
    phase: "rolling",
    candidates: active,
    queue: [...active],
    pendingGroups: [],
    order: active,
    message: "Rolling for order.",
  };
}

function stepStartOrder(state) {
  const startOrder = state.startOrder;
  if (state.screen !== "start-order" || startOrder.phase !== "rolling" || startOrder.isComplete) return;

  if (startOrder.rollingSeatId === null) {
    const nextSeatId = startOrder.queue.shift();
    if (nextSeatId === undefined) {
      settleStartOrderRound(state);
      return;
    }
    startOrder.rollingSeatId = nextSeatId;
    startOrder.rollStartedAt = Date.now();
    startOrder.cycleDie = rollOneDie();
    startOrder.message = `${seatById(state, nextSeatId).displayName} rolling...`;
    return;
  }

  startOrder.cycleDie = rollOneDie();
  if (Date.now() - startOrder.rollStartedAt < 850) return;

  const finalDie = rollOneDie();
  startOrder.rolls[startOrder.rollingSeatId] = finalDie;
  startOrder.displayRolls[startOrder.rollingSeatId] = finalDie;
  startOrder.cycleDie = finalDie;
  addLog(state, `${seatById(state, startOrder.rollingSeatId).displayName} rolled ${finalDie} for order.`);
  startOrder.rollingSeatId = null;
  startOrder.rollStartedAt = 0;
  updateStartOrderDisplay(state);
}

function startRound(state, starterId) {
  const baseOrder = state.game.turnOrder.length ? state.game.turnOrder : clockwiseOrder(state, starterId);
  state.game.startingSeatId = starterId;
  state.game.currentSeatId = starterId;
  state.game.turnOrder = rotateActiveOrder(state, baseOrder, starterId);
  state.game.turnIndex = 0;
  state.game.maxRollsThisRound = null;
  state.game.roundRolls = {};
  state.game.mexicoCount = 0;
  state.game.currentBest = null;
  state.game.awaitingNextRound = false;
  state.seats.forEach((seat) => {
    seat.lastRoll = null;
    seat.turnRollsUsed = 0;
    if (!seat.isOut && seat.joinedGame) seat.spriteState = seat.isRidingBus ? "bus" : "idle";
  });
  const starter = seatById(state, starterId);
  state.game.starterRollTarget = starter.isNpc ? chooseStarterRollTarget() : null;
  state.message = `${starter.displayName}'s turn.`;
}

function rollCurrentPlayer(state) {
  const seat = currentSeat(state);
  if (!seat || seat.isOut || state.dice.isAnimating) return;
  const limit = rollLimitFor(state, seat);
  if (seat.turnRollsUsed >= limit) return;

  const dice = rollTwoDice();
  const score = scoreTwoDice(dice);
  state.dice.animationStage = "shake";
  state.dice.isAnimating = true;
  seat.turnRollsUsed += 1;
  state.dice.pendingRoll = {
    seatIndex: seat.seatIndex,
    dice,
    score,
    rollsUsed: seat.turnRollsUsed,
  };
  state.dice.visibleFinalDice = dice;
  state.message = `${seat.displayName} rolling...`;
}

function settleCurrentRoll(state) {
  const pending = state.dice.pendingRoll;
  if (!pending) return;
  const seat = seatById(state, pending.seatIndex);
  if (!seat) {
    state.dice.pendingRoll = null;
    return;
  }
  const { dice, score, rollsUsed } = pending;
  seat.lastRoll = score;
  state.dice.visibleFinalDice = dice;
  state.game.roundRolls[seat.seatIndex] = {
    score,
    rollsUsed,
  };
  if (score.isMexico) {
    state.game.mexicoCount += 1;
    state.pendingOverlay = makeOverlay("mexico", "Mexico!", `${seat.displayName} rolled 2-1. The round penalty is now ${describeStrikeGain(state.game.mexicoCount)} strikes.`);
  }
  recomputeCurrentBest(state);
  state.message = `${seat.displayName} rolled ${score.label} in ${rollsUsed} roll${rollsUsed === 1 ? "" : "s"}.`;
  addLog(state, `${seat.displayName} rolled ${score.label} in ${rollsUsed} roll${rollsUsed === 1 ? "" : "s"}.`);

  if (score.isMexico) {
    addLog(state, `${seat.displayName} must hold on Mexico.`);
    state.game.pendingAutoHoldSeatId = seat.seatIndex;
  } else if (rollsUsed >= rollLimitFor(state, seat)) {
    state.game.pendingAutoHoldSeatId = seat.seatIndex;
  }
  state.dice.pendingRoll = null;
}

function holdCurrentPlayer(state) {
  const seat = currentSeat(state);
  if (!seat || !seat.lastRoll) return;
  state.game.pendingAutoHoldSeatId = null;
  if (seat.seatIndex === state.game.startingSeatId && state.game.maxRollsThisRound === null) {
    state.game.maxRollsThisRound = seat.turnRollsUsed;
    addLog(state, `${seat.displayName} sets this round to ${seat.turnRollsUsed} roll${seat.turnRollsUsed === 1 ? "" : "s"}.`);
  }
  advanceTurn(state);
}

function runNpcStep(state) {
  const seat = currentSeat(state);
  if (!seat?.isNpc || state.phase !== "round-turn") return;
  if (shouldNpcRollAgain(state, seat)) {
    rollCurrentPlayer(state);
  } else {
    holdCurrentPlayer(state);
  }
}

function advanceTurn(state) {
  state.game.turnIndex += 1;
  if (state.game.turnIndex >= state.game.turnOrder.length) {
    finishRound(state);
    return;
  }
  const nextId = state.game.turnOrder[state.game.turnIndex];
  state.game.currentSeatId = nextId;
  state.message = `${seatById(state, nextId).displayName}'s turn.`;
}

function finishRound(state) {
  const entries = Object.entries(state.game.roundRolls).map(([seatIndex, score]) => ({
    seatIndex: Number(seatIndex),
    score: score.score,
    rollsUsed: score.rollsUsed,
  }));

  const winnerEntries = tiedByScore(entries, true);
  const loserEntries = tiedByScore(entries, false);
  logIgnoredMiddleTies(state, entries, winnerEntries[0].score.rank, loserEntries[0].score.rank);

  const winnerId = winnerEntries.length > 1
    ? resolveOneDieTie(state, winnerEntries.map((entry) => entry.seatIndex), "high", "wins the round", "Round winner tiebreaker")
    : winnerEntries[0].seatIndex;
  const loserIds = loserEntries
    .map((entry) => entry.seatIndex)
    .filter((seatIndex) => seatIndex !== winnerId);

  applyRoundResult(state, winnerId, loserIds);
}

function applyRoundResult(state, winnerId, loserIds) {
  const winner = seatById(state, winnerId);
  const losers = loserIds.map((loserId) => seatById(state, loserId)).filter(Boolean);
  const strikeGain = describeStrikeGain(state.game.mexicoCount);
  winner.spriteState = "victory";
  losers.forEach((loser) => {
    loser.spriteState = loser.isRidingBus ? "out" : "lose";
  });
  const loserNames = formatNameList(losers.map((loser) => loser.displayName));
  pushOverlay(state, "roundWinner", `${winner.displayName} wins the round!`, `${loserNames} ${losers.length === 1 ? "takes" : "take"} ${strikeGain} strike${strikeGain === 1 ? "" : "s"}.`);
  addLog(state, `${winner.displayName} wins. ${loserNames} ${losers.length === 1 ? "takes" : "take"} ${strikeGain} strike${strikeGain === 1 ? "" : "s"}.`);

  losers.forEach((loser) => applyStrikePenalty(state, loser, strikeGain));

  const active = activeSeats(state);
  if (active.length <= 1) {
    finishGame(state, active[0] ?? winner);
    return;
  }
  state.game.awaitingNextRound = true;
  state.game.nextStarterId = winnerId;
  state.phase = "round-result";
  state.message = `${winner.displayName} starts the next round.`;
}

function applyStrikePenalty(state, loser, strikeGain) {
  if (loser.isRidingBus) {
    eliminatePlayer(state, loser);
    return;
  }
  loser.strikes += strikeGain;
  if (loser.strikes < 5) return;

  if (!state.game.busUsed) {
    state.game.busUsed = true;
    state.game.busSeatId = loser.seatIndex;
    if (loser.strikes === 5) {
      loser.isRidingBus = true;
      loser.spriteState = "bus";
      pushOverlay(state, "rideBus", "Riding the Bus!", `${loser.displayName} gets one more chance.`);
      return;
    }
  }

  eliminatePlayer(state, loser);
}

function formatNameList(names) {
  if (names.length <= 1) return names[0] ?? "Nobody";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function continueAfterRound(state) {
  if (state.phase !== "round-result") return;
  state.game.roundNumber += 1;
  startRound(state, state.game.nextStarterId);
  state.phase = "round-turn";
}

function eliminatePlayer(state, seat) {
  seat.isOut = true;
  seat.isRidingBus = false;
  seat.spriteState = "out";
  pushOverlay(state, "playerOut", `${seat.displayName} is out!`, "They are eliminated from this game.");
  addLog(state, `${seat.displayName} is out.`);
}

function finishGame(state, winner) {
  const payout = state.game.pot;
  winner.coins += payout;
  state.game.pot = 0;
  state.game.lastPayout = payout;
  state.game.winnerSeatId = winner.seatIndex;
  winner.spriteState = "victory";
  state.screen = "game-winner";
  state.phase = "game-winner";
  pushOverlay(state, "gameWinner", `${winner.displayName} wins the game!`, `${winner.displayName} collects ${payout} coins.`);
  addLog(state, `${winner.displayName} wins the game and collects ${payout} coins.`);
}

function settleStartOrderRound(state) {
  const startOrder = state.startOrder;
  const groups = groupStartOrderCandidates(startOrder.candidates, startOrder.rolls);
  const tiedGroupIndex = groups.findIndex((group) => group.ids.length > 1);

  if (tiedGroupIndex >= 0) {
    const tiedGroup = groups[tiedGroupIndex];
    const names = tiedGroup.ids.map((seatId) => seatById(state, seatId).displayName).join(" and ");
    const lockedIds = groups
      .slice(0, tiedGroupIndex)
      .flatMap((group) => group.ids);
    startOrder.lockedIds = [...startOrder.lockedIds, ...lockedIds];
    startOrder.pendingGroups = [
      ...groups.slice(tiedGroupIndex + 1).map((group) => group.ids),
      ...startOrder.pendingGroups,
    ];
    startOrder.candidates = tiedGroup.ids;
    startOrder.queue = [...tiedGroup.ids];
    startOrder.rolls = {};
    startOrder.message = `${names} battle for placement.`;
    updateStartOrderDisplay(state);
    state.overlay = null;
    state.overlayQueue = [];
    state.pendingOverlay = null;
    addLog(state, `Order tiebreaker: ${names}.`);
    return;
  }

  startOrder.lockedIds = [
    ...startOrder.lockedIds,
    ...groups.flatMap((group) => group.ids),
  ];
  if (advancePendingStartOrderGroup(state)) return;

  startOrder.order = [...startOrder.lockedIds];
  startOrder.phase = "complete";
  startOrder.isComplete = true;
  startOrder.message = `${seatById(state, startOrder.order[0]).displayName} goes first.`;
  addLog(state, `Start order: ${startOrder.order.map((seatId) => seatById(state, seatId).displayName).join(", ")}.`);
}

function updateStartOrderDisplay(state) {
  const startOrder = state.startOrder;
  const groups = groupStartOrderCandidates(startOrder.candidates, startOrder.rolls);
  startOrder.order = [
    ...startOrder.lockedIds,
    ...groups.flatMap((group) => group.ids),
    ...startOrder.candidates.filter((seatId) => startOrder.rolls[seatId] === undefined),
    ...startOrder.pendingGroups.flat(),
  ];
}

function advancePendingStartOrderGroup(state) {
  const startOrder = state.startOrder;
  while (startOrder.pendingGroups.length) {
    const nextGroup = startOrder.pendingGroups.shift();
    if (nextGroup.length <= 1) {
      startOrder.lockedIds = [...startOrder.lockedIds, ...nextGroup];
      continue;
    }
    const names = nextGroup.map((seatId) => seatById(state, seatId).displayName).join(" and ");
    startOrder.candidates = nextGroup;
    startOrder.queue = [...nextGroup];
    startOrder.rolls = {};
    startOrder.message = `${names} battle for placement.`;
    updateStartOrderDisplay(state);
    addLog(state, `Order tiebreaker: ${names}.`);
    return true;
  }
  return false;
}

function groupStartOrderCandidates(seatIds, rolls) {
  const rolled = seatIds
    .filter((seatId) => rolls[seatId] !== undefined)
    .sort((a, b) => rolls[b] - rolls[a]);
  const groups = [];
  rolled.forEach((seatId) => {
    const die = rolls[seatId];
    const group = groups.find((item) => item.die === die);
    if (group) group.ids.push(seatId);
    else groups.push({ die, ids: [seatId] });
  });
  return groups;
}

function resolveOneDieTie(state, seatIds, highOrLow, reason, title = "Tiebreaker") {
  let tied = [...seatIds];
  while (tied.length > 1) {
    const rolls = tied.map((seatIndex) => ({ seatIndex, die: rollOneDie() }));
    const target = highOrLow === "high" ? Math.max(...rolls.map((r) => r.die)) : Math.min(...rolls.map((r) => r.die));
    const next = rolls.filter((roll) => roll.die === target).map((roll) => roll.seatIndex);
    pushOverlay(state, "tiebreaker", title, rolls.map((roll) => `${seatById(state, roll.seatIndex).displayName}: ${roll.die}`).join("  "));
    addLog(state, `Tiebreaker: ${rolls.map((roll) => `${seatById(state, roll.seatIndex).displayName} ${roll.die}`).join(", ")}.`);
    tied = next;
  }
  addLog(state, `${seatById(state, tied[0]).displayName} ${reason}.`);
  return tied[0];
}

function logIgnoredMiddleTies(state, entries, highRank, lowRank) {
  const groups = new Map();
  entries.forEach((entry) => {
    if (!groups.has(entry.score.rank)) groups.set(entry.score.rank, []);
    groups.get(entry.score.rank).push(entry);
  });
  groups.forEach((group, rank) => {
    if (group.length > 1 && rank !== highRank && rank !== lowRank) {
      addLog(state, `Middle tie ignored: ${group.map((entry) => seatById(state, entry.seatIndex).displayName).join(" and ")}.`);
    }
  });
}

function recomputeCurrentBest(state) {
  const entries = Object.entries(state.game.roundRolls).map(([seatIndex, roll]) => ({
    seatIndex: Number(seatIndex),
    score: roll.score,
    rollsUsed: roll.rollsUsed,
  }));
  if (!entries.length) {
    state.game.currentBest = null;
    return;
  }
  const best = tiedByScore(entries, true)[0];
  state.game.currentBest = {
    seatIndex: best.seatIndex,
    score: best.score,
    rollsUsed: best.rollsUsed,
  };
}

function clockwiseOrder(state, starterId) {
  return state.seats
    .filter((seat) => seat.joinedGame && !seat.isOut)
    .sort((a, b) => ((a.seatIndex - starterId + 4) % 4) - ((b.seatIndex - starterId + 4) % 4))
    .map((seat) => seat.seatIndex);
}

function rotateActiveOrder(state, order, starterId) {
  const active = order.filter((seatId) => {
    const seat = seatById(state, seatId);
    return seat?.joinedGame && !seat.isOut;
  });
  const startIndex = Math.max(0, active.indexOf(starterId));
  return [...active.slice(startIndex), ...active.slice(0, startIndex)];
}

function activeSeats(state) {
  return state.seats.filter((seat) => seat.joinedGame && !seat.isOut);
}

function currentSeat(state) {
  return seatById(state, state.game.currentSeatId);
}

function rollLimitFor(state, seat) {
  if (seat.seatIndex === state.game.startingSeatId) return 3;
  return state.game.maxRollsThisRound ?? 1;
}

function seatById(state, seatIndex) {
  return state.seats.find((seat) => seat.seatIndex === seatIndex);
}

function makeSeat(seatIndex, characterId, displayName, isNpc) {
  return {
    seatIndex,
    characterId,
    displayName,
    isNpc,
    coins: 3,
    strikes: 0,
    isOut: false,
    isRidingBus: false,
    spriteState: "idle",
    lastRoll: null,
    turnRollsUsed: 0,
    joinedGame: true,
  };
}

function makeOverlay(type, title, message) {
  return { type, title, message };
}

function pushOverlay(state, type, title, message) {
  const overlay = makeOverlay(type, title, message);
  if (state.overlay) state.overlayQueue.push(overlay);
  else state.overlay = overlay;
}


// src/render.js

function render(state, dispatch) {
  const app = document.querySelector("#app");
  app.innerHTML = "";
  app.appendChild(viewForState(state, dispatch));
}

function viewForState(state, dispatch) {
  if (state.screen === "landing") return landing(state, dispatch);
  if (state.screen === "player-count") return playerCount(state, dispatch);
  if (state.screen === "setup") return setup(state, dispatch);
  if (state.screen === "buy-in" || state.screen === "start-order") return preGame(state, dispatch);
  if (state.screen === "game" || state.screen === "game-winner" || state.screen === "session-champion") return gameBoard(state, dispatch);
  return landing(dispatch);
}

function board(...children) {
  const el = h("section", "board");
  children.forEach((child) => el.append(child));
  return el;
}

function soundToggle(state, dispatch) {
  return h("button", "sound-toggle", {
    text: state.audioEnabled ? "Sound On" : "Sound Off",
    title: state.audioEnabled ? "Turn sound off" : "Turn sound on",
    onClick: () => dispatch((draft) => {
      draft.audioEnabled = !draft.audioEnabled;
    }),
  });
}

function landing(state, dispatch) {
  const screen = board(
    h("img", "logo-main", { src: ASSETS.branding.main, alt: "Mexico" }),
    h("button", "big-button", { text: "Play Now", onClick: () => dispatch((state) => {
      state.screen = "player-count";
      state.phase = "player-count";
    }) }),
  );
  screen.append(rulesButton(dispatch));
  screen.append(soundToggle(state, dispatch));
  if (state.rulesOpen) screen.append(rulesPopup(dispatch));
  return screen;
}

function playerCount(state, dispatch) {
  const choices = h("div", "count-grid");
  [1, 2, 3, 4].forEach((count) => {
    choices.append(h("button", "count-button", { text: String(count), onClick: () => dispatch((state) => setRealPlayerCount(state, count)) }));
  });
  const screen = board(
    h("img", "logo-small setup-logo", { src: ASSETS.branding.small, alt: "Mexico" }),
    h("h1", "screen-title", { text: "How many players?" }),
    choices,
  );
  screen.append(rulesButton(dispatch));
  screen.append(soundToggle(state, dispatch));
  if (state.rulesOpen) screen.append(rulesPopup(dispatch));
  return screen;
}

function setup(state, dispatch) {
  const form = h("div", "setup-list");
  for (let index = 0; index < state.realPlayerCount; index += 1) {
    const row = h("div", "setup-row");
    row.append(h("label", "field-label", { text: `Player ${index + 1}` }));
    row.append(h("input", "name-input", {
      value: state.setup.names[index],
      placeholder: "Enter name",
      onInput: (event) => {
        state.setup.names[index] = event.target.value;
        state.setup.errors[index] = "";
      },
    }));
    const picks = h("div", "portrait-grid");
    CHARACTER_ORDER.forEach((id) => {
      const usedByOther = state.setup.picks.some((pick, pickIndex) => pick === id && pickIndex !== index);
      const selected = state.setup.picks[index] === id;
      picks.append(h("button", `portrait-choice ${selected ? "is-selected" : ""}`, {
        disabled: usedByOther,
        onClick: () => dispatch((draft) => {
          draft.setup.picks[index] = id;
          draft.setup.errors[index] = "";
        }),
      }, h("img", "", { src: CHARACTERS[id].portrait, alt: CHARACTERS[id].defaultName })));
    });
    row.append(picks);
    if (state.setup.errors[index]) row.append(h("p", "validation", { text: state.setup.errors[index] }));
    form.append(row);
  }
  const screen = board(
    h("img", "logo-small setup-logo", { src: ASSETS.branding.small, alt: "Mexico" }),
    h("h1", "screen-title", { text: "Set up players" }),
    form,
    h("button", "big-button", { text: "Start Game", onClick: () => dispatch(validateAndCreateSeats) }),
  );
  screen.append(rulesButton(dispatch));
  screen.append(soundToggle(state, dispatch));
  if (state.rulesOpen) screen.append(rulesPopup(dispatch));
  return screen;
}

function preGame(state, dispatch) {
  if (state.screen === "start-order") return startOrderScreen(state, dispatch);
  const action = state.screen === "buy-in"
    ? h("button", "big-button", { text: "Roll for Start", onClick: () => dispatch((draft) => {
      draft.screen = "start-order";
      draft.phase = "start-order";
    }) })
    : h("button", "big-button", { text: "Start Rolling", onClick: () => dispatch(resolveStartOrder) });
  const screen = board(
    h("img", "logo-small setup-logo", { src: ASSETS.branding.small, alt: "Mexico" }),
    h("h1", "screen-title", { text: state.screen === "buy-in" ? "Buy-In" : "Start Order Roll" }),
    h("p", "screen-copy", { text: state.screen === "buy-in" ? `Active players paid in. The pot is ${state.game.pot} coins.` : "Each active player rolls one die. Highest starts." }),
    scoreboard(state),
    action,
  );
  screen.append(rulesButton(dispatch));
  screen.append(soundToggle(state, dispatch));
  if (state.rulesOpen) screen.append(rulesPopup(dispatch));
  return screen;
}

function startOrderScreen(state, dispatch) {
  const startOrder = state.startOrder;
  const action = startOrder.isComplete
    ? h("button", "big-button", { text: "Continue", onClick: () => dispatch(resolveStartOrder) })
    : h("button", "big-button", { text: "Start Rolling", disabled: startOrder.phase === "rolling", onClick: () => dispatch(beginStartOrder) });
  const screen = board(
    h("img", "logo-small setup-logo", { src: ASSETS.branding.small, alt: "Mexico" }),
    h("h1", "screen-title", { text: startOrder.isComplete ? "Roll Order" : "Start Order Roll" }),
    h("p", "screen-copy", { text: startOrder.message || "Each active player rolls one die. Highest starts." }),
    startOrderBoard(state),
    action,
  );
  screen.append(rulesButton(dispatch));
  screen.append(soundToggle(state, dispatch));
  if (state.rulesOpen) screen.append(rulesPopup(dispatch));
  return screen;
}

function startOrderBoard(state) {
  const wrap = h("div", "order-layout");
  const list = h("div", "order-list");
  const order = state.startOrder.order.length ? state.startOrder.order : state.game.activeSeatIds;
  order.forEach((seatId, index) => {
    const seat = state.seats.find((item) => item.seatIndex === seatId);
    if (!seat) return;
    list.append(h("div", "order-row-wrap",
      h("span", "order-row-status", { text: orderRowStatusText(state, seat) }),
      h("span", "order-rank", { text: `#${index + 1}` }),
      startOrderPlayerRow(state, seat),
    ));
  });
  wrap.append(list);
  return wrap;
}

function orderDie(state, seat) {
  const isRolling = state.startOrder.rollingSeatId === seat.seatIndex;
  const die = isRolling ? state.startOrder.cycleDie : state.startOrder.displayRolls[seat.seatIndex];
  const className = `order-die ${isRolling ? "is-rolling" : ""} ${die ? "" : "is-empty"}`;
  return h(
    "div",
    className,
    {},
    die ? h("img", "order-die-face", { src: ASSETS.diceFaces[die], alt: `Die ${die}` }) : "",
  );
}

function startOrderPlayerRow(state, seat) {
  return h("div", "order-player-row",
    {},
    h("img", "portrait", { src: CHARACTERS[seat.characterId].portrait, alt: seat.displayName }),
    h("div", "player-meta",
      {},
      h("strong", "", { text: seat.displayName }),
      h("div", "status-icons",
        {},
        seat.isNpc ? h("img", "mini-icon", { src: ASSETS.icons.npc, alt: "NPC" }) : "",
      ),
    ),
    orderDie(state, seat),
    h("span", "roll-text", { text: "-" }),
    h("span", "strike-text", { text: "0" }),
    h("span", "coin-text", { text: `${seat.coins}x` }, h("img", "mini-icon", { src: ASSETS.icons.coin, alt: "coins" })),
  );
}

function orderRowStatusText(state, seat) {
  if (state.startOrder.rollingSeatId === seat.seatIndex) return "Rolling";
  if (state.startOrder.phase === "rolling" && state.startOrder.queue[0] === seat.seatIndex) return "Waiting";
  return "";
}

function gameBoard(state, dispatch) {
  const shell = h("section", `game-board screen-${state.screen} phase-${state.phase}`);
  const left = h("div", "play-area");
  if (state.screen === "game-winner") {
    left.append(h("img", "event-card winner-logo", { src: ASSETS.events.gameWinner, alt: "Game winner" }));
    const winner = gameWinnerSeat(state);
    left.append(h("h1", "winner-name", { text: winner ? winner.displayName : "Winner" }));
  } else {
    left.append(h("img", "logo-small game-logo", { src: ASSETS.branding.small, alt: "Mexico" }));
    left.append(h("h1", "turn-title", { text: titleFor(state) }));
  }
  if (state.screen === "game-winner" || state.screen === "session-champion") {
    left.append(eventFeature(state));
  } else {
    left.append(diceStage(state));
    left.append(controls(state, dispatch));
  }

  const right = h("aside", "side-panel");
  right.append(rollToBeat(state));
  right.append(potBox(state));
  right.append(scoreboard(state));
  right.append(logPanel(state));

  shell.append(left, right);
  if (state.screen === "game") shell.append(rulesButton(dispatch));
  shell.append(soundToggle(state, dispatch));
  if (state.overlay) shell.append(overlay(state, dispatch));
  if (state.rulesOpen) shell.append(rulesPopup(dispatch));
  if (state.screen === "game-winner") shell.append(gameWinnerControls(dispatch));
  if (state.screen === "session-champion") shell.append(sessionControls(dispatch));
  return shell;
}

function rulesButton(dispatch) {
  return h("button", "rules-button", { text: "Rules", onClick: () => dispatch((state) => {
    state.rulesOpen = true;
  }) });
}

function rulesPopup(dispatch) {
  return h("div", "rules-overlay", {},
    h("div", "rules-card", {},
      h("div", "rules-card-header", {},
        h("h2", "", { text: "Mexico Rules" }),
        h("button", "rules-close", { text: "Close", onClick: () => dispatch((state) => {
          state.rulesOpen = false;
        }) }),
      ),
      h("div", "rules-grid", {},
        rulesSection("Turn Order", [
          "First roller sets the maximum rolls for the round.",
          "Everyone else may roll up to that same number.",
          "Roll both dice each time. No keeping one die.",
        ]),
        rulesSection("Roll Rank", [
          "Mexico, 2-1, beats everything.",
          "Doubles beat normal rolls.",
          "Normal rolls are read high die first, like 6-5.",
        ]),
        rulesSection("Round Result", [
          "Highest final roll wins the round.",
          "Lowest final roll takes strikes.",
          "Ties battle with one die until one winner or loser remains.",
        ]),
        rulesSection("Mexico", [
          "A Mexico roll adds to the round penalty.",
          "One Mexico means the loser takes 2 strikes.",
          "More Mexicos stack the penalty higher.",
        ]),
        rulesSection("Ride the Bus", [
          "Only the first player to reach exactly 5 strikes rides the bus.",
          "Jumping past 5 strikes means the player is out.",
          "After bus is used, later 5-strike players are out.",
        ]),
        rulesSection("Coins", [
          "Active players pay 1 coin into the pot at game start.",
          "The last player standing wins the pot.",
          "Players with 0 coins cannot enter the next game.",
        ]),
      ),
    ),
  );
}

function rulesSection(title, lines) {
  const list = h("ul", "");
  lines.forEach((line) => list.append(h("li", "", { text: line })));
  return h("section", "rules-section", {}, h("h3", "", { text: title }), list);
}

function diceStage(state) {
  const stage = h("div", "dice-stage");
  stage.append(h("img", "dice-tray", { src: ASSETS.props.diceRollArea, alt: "" }));
  const current = state.seats.find((seat) => seat.seatIndex === state.game.currentSeatId);
  if (current) stage.append(characterSprite(current));
  if (state.dice.isAnimating) {
    const sprite = diceSpriteForStage(state.dice.animationStage, current);
    stage.append(spriteElement(sprite, "dice-sprite", true, "Rolling dice"));
  }
  if (state.dice.visibleFinalDice && !state.dice.isAnimating) {
    const dice = h("div", "final-dice");
    state.dice.visibleFinalDice.forEach((die) => dice.append(
      h("div", "settled-die",
        {},
        h("img", "die-shadow", { src: ASSETS.props.tableShadow, alt: "" }),
        h("img", "die-face", { src: ASSETS.diceFaces[die], alt: `Die ${die}` }),
      ),
    ));
    stage.append(dice);
  }
  return stage;
}

function diceSpriteForStage(stage, seat) {
  const characterSprites = seat ? ASSETS.diceSprites.byCharacter?.[seat.characterId] : null;
  return characterSprites?.[stage] ?? ASSETS.diceSprites[stage] ?? ASSETS.diceSprites.bounce;
}

function characterSprite(seat) {
  const sprite = CHARACTERS[seat.characterId].sprites[seat.spriteState] ?? CHARACTERS[seat.characterId].sprites.idle;
  return spriteElement(sprite, "character-sprite", !sprite.static, seat.displayName);
}

function spriteElement(sprite, className, animated, label) {
  return h(
    "div",
    `${className} sprite-viewport frame-count-${sprite.frames} ${sprite.reverse ? "is-reversed" : ""} ${animated ? "is-animated" : "is-static"}`,
    { style: spriteStyle(sprite), title: label },
    h("img", "sprite-strip", { src: sprite.src, alt: label ?? "" }),
  );
}

function controls(state, dispatch) {
  const seat = state.seats.find((item) => item.seatIndex === state.game.currentSeatId);
  const limit = seat ? displayRollLimitFor(state, seat) : 0;
  const rollLimitReached = Boolean(seat) && seat.turnRollsUsed >= limit;
  const mustHoldMexico = Boolean(seat?.lastRoll?.isMexico);
  const disabled = !seat || seat.isNpc || state.phase !== "round-turn" || state.dice.isAnimating;
  const canHold = !disabled && Boolean(seat.lastRoll);
  const wrap = h("div", "controls");
  if (state.phase === "round-result") {
    wrap.append(h("button", "big-button", { text: "Next Round", onClick: () => dispatch(continueAfterRound) }));
    return wrap;
  }
  if (seat?.isNpc) {
    wrap.classList.add("is-npc-turn");
    wrap.append(h("span", "roll-limit-note", { text: "NPC rolling" }));
    return wrap;
  }
  if (seat) wrap.append(h("span", "roll-limit-note", { text: `Rolls: ${seat.turnRollsUsed}/${limit}` }));
  wrap.append(h("button", "game-button", { text: "Roll", disabled: disabled || rollLimitReached || mustHoldMexico, onClick: () => dispatch(rollCurrentPlayer) }));
  wrap.append(h("button", "game-button", { text: "Hold", disabled: !canHold, onClick: () => dispatch(holdCurrentPlayer) }));
  return wrap;
}

function rollToBeat(state) {
  const best = state.game.currentBest;
  const box = h("div", "info-box");
  box.append(h("h2", "", { text: "Roll to Beat" }));
  box.append(h("p", "", { text: best ? `${best.score.label}` : "None yet" }));
  if (best) box.append(h("small", "", { text: `in ${best.rollsUsed} roll${best.rollsUsed === 1 ? "" : "s"}` }));
  return box;
}

function potBox(state) {
  const text = state.screen === "game-winner"
    ? `Pot Won ${state.game.lastPayout}`
    : `The Pot ${state.game.pot}`;
  return h("div", "pot-box", {}, h("img", "icon", { src: ASSETS.icons.pot, alt: "" }), h("span", "", { text }));
}

function scoreboard(state) {
  const rows = h("div", "scoreboard");
  state.seats.forEach((seat) => rows.append(playerRow(state, seat)));
  return rows;
}

function playerRow(state, seat) {
  const row = h("div", `player-row ${state.game.currentSeatId === seat.seatIndex ? "is-current" : ""} ${seat.isOut ? "is-out" : ""}`);
  row.append(h("img", "portrait", { src: CHARACTERS[seat.characterId].portrait, alt: seat.displayName }));
  const meta = h("div", "player-meta");
  meta.append(h("strong", "", { text: seat.displayName }));
  const status = h("div", "status-icons");
  if (state.game.currentSeatId === seat.seatIndex) status.append(h("img", "mini-icon", { src: ASSETS.icons.turn, alt: "Current turn" }));
  if (seat.isNpc) status.append(h("img", "mini-icon", { src: ASSETS.icons.npc, alt: "NPC" }));
  if (seat.isRidingBus) status.append(h("img", "mini-icon", { src: ASSETS.icons.sombrero, alt: "Riding the Bus" }));
  if (seat.isOut) status.append(h("img", "mini-icon", { src: ASSETS.icons.out, alt: "Out" }));
  meta.append(status);
  row.append(meta);
  row.append(h("span", "roll-text", { text: seat.lastRoll ? `${seat.lastRoll.label}/${seat.turnRollsUsed}` : "-" }));
  row.append(h("span", "strike-text", { text: seat.strikes ? "|".repeat(seat.strikes) : "0" }));
  row.append(h("span", "coin-text", { text: `${seat.coins}x` }, h("img", "mini-icon", { src: ASSETS.icons.coin, alt: "coins" })));
  return row;
}

function displayRollLimitFor(state, seat) {
  if (seat.seatIndex === state.game.startingSeatId) return 3;
  return state.game.maxRollsThisRound ?? 1;
}

function overlay(state, dispatch) {
  const asset = {
    mexico: ASSETS.events.mexico,
    tiebreaker: ASSETS.events.tiebreaker,
    roundWinner: ASSETS.events.roundWinner,
    rideBus: ASSETS.events.rideBus,
    playerOut: ASSETS.events.playerOut,
    gameWinner: ASSETS.events.gameWinner,
    sessionChampion: ASSETS.events.sessionChampion,
  }[state.overlay.type];
  return h("div", "overlay", {},
    h("div", "overlay-card", {},
      asset ? h("img", "event-card", { src: asset, alt: "" }) : "",
      h("h2", "", { text: state.overlay.title }),
      h("p", "", { text: state.overlay.message }),
      h("button", "game-button", { text: "Continue", onClick: () => dispatch((draft) => {
        draft.overlay = draft.overlayQueue.shift() ?? null;
      }) }),
    ),
  );
}

function eventFeature(state) {
  const type = state.screen === "session-champion" ? "sessionChampion" : "gameWinner";
  const asset = type === "sessionChampion" ? ASSETS.events.sessionChampion : ASSETS.events.gameWinner;
  const feature = h("div", "event-feature");
  if (state.screen === "game-winner") {
    const winner = gameWinnerSeat(state);
    feature.classList.add("winner-feature");
    const stage = h("div", "winner-stage",
      {},
      h("img", "dice-tray winner-tray", { src: ASSETS.props.diceRollArea, alt: "" }),
      h("img", "winner-pot-icon", { src: ASSETS.icons.pot, alt: "Pot" }),
      h("img", "coin-burst", { src: ASSETS.props.coinBurst, alt: "" }),
    );
    if (winner) stage.append(characterSprite(winner));
    feature.append(stage);
    feature.append(h("div", "winner-pot",
      {},
      h("span", "", { text: "Pot Winner" }),
      h("strong", "", { text: `${state.game.lastPayout} coins` }),
    ));
  } else {
    feature.append(h("img", "event-card large", { src: asset, alt: "" }));
  }
  return feature;
}

function gameWinnerSeat(state) {
  return state.seats.find((seat) => seat.seatIndex === state.game.winnerSeatId)
    ?? state.seats.find((seat) => seat.spriteState === "victory" && !seat.isOut)
    ?? [...state.seats].sort((a, b) => b.coins - a.coins)[0];
}

function gameWinnerControls(dispatch) {
  return h("div", "bottom-actions",
    {},
    h("button", "game-button", { text: "Play Next Game", onClick: () => dispatch(prepareNextGame) }),
    h("button", "game-button", { text: "End Session", onClick: () => dispatch((state) => {
      state.screen = "session-champion";
      state.phase = "session-champion";
      const leader = [...state.seats].sort((a, b) => b.coins - a.coins)[0];
      state.overlay = { type: "sessionChampion", title: `${leader.displayName} is Mexico Champion!`, message: "Session over." };
      state.overlayQueue = [];
      state.pendingOverlay = null;
    }) }),
  );
}

function sessionControls(dispatch) {
  return h("div", "bottom-actions",
    {},
    h("button", "game-button", { text: "Play Again", onClick: () => dispatch((state) => {
      state.screen = "landing";
      state.phase = "landing";
      state.overlay = null;
      state.overlayQueue = [];
      state.pendingOverlay = null;
    }) }),
    h("button", "game-button", { text: "Quit", onClick: () => dispatch((state) => {
      state.message = "Thanks for playing.";
      state.overlay = null;
      state.pendingOverlay = null;
    }) }),
  );
}

function logPanel(state) {
  const panel = h("div", "log-panel");
  state.log.forEach((line) => panel.append(h("p", "", { text: line })));
  return panel;
}

function titleFor(state) {
  if (state.screen === "game-winner") {
    return state.overlay?.title ?? "Game Winner";
  }
  if (state.screen === "session-champion") {
    return state.overlay?.title ?? "Session Champion";
  }
  return state.message;
}

function h(tag, className = "", props = {}, ...children) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  Object.entries(props).forEach(([key, value]) => {
    if (key === "text") el.textContent = value;
    else if (key === "onClick") el.addEventListener("click", value);
    else if (key === "onInput") el.addEventListener("input", value);
    else if (key === "disabled") el.disabled = value;
    else if (key === "style") el.setAttribute("style", value);
    else if (value !== undefined && value !== null) el.setAttribute(key, value);
  });
  children.flat().forEach((child) => {
    if (child) el.append(child);
  });
  return el;
}


// src/main.js

const state = createState();
state.audioEnabled = isAudioEnabled();
preloadInitialAssets();
preloadAudio();
let npcTimer = null;
let diceTimer = null;
let autoHoldTimer = null;
let startOrderTimer = null;

function dispatch(mutator) {
  const previous = snapshotState(state);
  mutator(state);
  syncAssetPreloads(state);
  render(state, dispatch);
  syncAudio(previous, state);
  scheduleDiceSettle();
  scheduleAutoHold();
  scheduleStartOrder();
  scheduleNpc();
}

render(state, dispatch);
syncAssetPreloads(state);
syncAudio(null, state);
scheduleStartOrder();
scheduleNpc();

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || button.disabled) return;
  unlockAudio();
  playSound(button.classList.contains("portrait-choice") ? "characterSelect" : "uiClick");
}, true);

function scheduleNpc() {
  clearTimeout(npcTimer);
  const current = state.seats.find((seat) => seat.seatIndex === state.game.currentSeatId);
  if (state.phase === "round-turn" && current?.isNpc && !state.dice.isAnimating && !state.overlay && !state.game.pendingAutoHoldSeatId) {
    npcTimer = setTimeout(() => dispatch(runNpcStep), 850);
  }
}

function scheduleDiceSettle() {
  clearTimeout(diceTimer);
  if (state.dice.isAnimating) {
    const duration = state.dice.animationStage === "shake" ? 560
      : state.dice.animationStage === "throw" ? 520
        : 360;
    diceTimer = setTimeout(() => dispatch((draft) => {
      if (draft.dice.animationStage === "shake") {
        draft.dice.animationStage = "throw";
        return;
      }
      if (draft.dice.animationStage === "throw") {
        draft.dice.animationStage = "bounce";
        settleCurrentRoll(draft);
        return;
      }
      draft.dice.isAnimating = false;
      draft.dice.animationStage = null;
      showPendingOverlay(draft);
    }), duration);
  }
}

function showPendingOverlay(draft) {
  if (!draft.pendingOverlay) return;
  const overlay = draft.pendingOverlay;
  draft.pendingOverlay = null;
  if (draft.overlay) draft.overlayQueue.push(overlay);
  else draft.overlay = overlay;
}

function scheduleAutoHold() {
  clearTimeout(autoHoldTimer);
  if (state.game.pendingAutoHoldSeatId !== null && !state.dice.isAnimating && !state.overlay) {
    autoHoldTimer = setTimeout(() => dispatch((draft) => {
      const pendingSeatId = draft.game.pendingAutoHoldSeatId;
      if (pendingSeatId === null || pendingSeatId !== draft.game.currentSeatId) return;
      draft.game.pendingAutoHoldSeatId = null;
      holdCurrentPlayer(draft);
    }), 1100);
  }
}

function scheduleStartOrder() {
  clearTimeout(startOrderTimer);
  if (state.screen === "start-order" && state.startOrder.phase === "rolling" && !state.overlay) {
    startOrderTimer = setTimeout(() => dispatch(stepStartOrder), 120);
  }
}

function syncAudio(previous, current) {
  if (previous) {
    if (previous.audioEnabled !== current.audioEnabled) {
      setAudioEnabled(current.audioEnabled);
    }
    playTransitionSounds(previous, current);
  }
  startBackgroundMusic();
}

function syncAssetPreloads(current) {
  if (current.screen === "buy-in" || current.screen === "start-order" || current.screen === "game" || current.screen === "game-winner" || current.screen === "session-champion") {
    preloadGameplayAssets(current.seats);
  }
  if (current.overlay || current.pendingOverlay || current.overlayQueue.length || current.screen === "game-winner" || current.screen === "session-champion") {
    preloadEventAssets(current);
  }
}

function playTransitionSounds(previous, current) {
  if (current.game.pot > previous.game.pot) {
    playSound("potAdd");
  }
  if (hasNewStartOrderRoll(previous, current)) {
    playSound("startOrderRoll");
  }
  if (!previous.dice.isAnimating && current.dice.isAnimating && current.dice.animationStage === "shake") {
    stopLoop();
    playSound("diceShake");
  }
  if (previous.dice.isAnimating && !current.dice.isAnimating) {
    playSound("diceLand");
    if (previous.dice.pendingRoll?.score?.isMexico) playSound("mexicoRoll");
  }
  if (totalStrikes(current) > totalStrikes(previous)) {
    playSound("strike");
  }
  if (outCount(current) > outCount(previous)) {
    playSound("playerOut");
  }
  if (previous.screen !== "game-winner" && current.screen === "game-winner") {
    playSound("potWinner");
    playSound("gameWinner");
  }
}

function totalStrikes(current) {
  return current.seats.reduce((total, seat) => total + seat.strikes, 0);
}

function outCount(current) {
  return current.seats.filter((seat) => seat.isOut).length;
}

function hasNewStartOrderRoll(previous, current) {
  if (current.screen !== "start-order") return false;
  return Object.entries(current.startOrder.displayRolls)
    .some(([seatId, die]) => previous.startOrder.displayRolls[seatId] !== die);
}

function snapshotState(current) {
  return {
    audioEnabled: current.audioEnabled,
    screen: current.screen,
    phase: current.phase,
    overlay: current.overlay ? { ...current.overlay } : null,
    seats: current.seats.map((seat) => ({
      seatIndex: seat.seatIndex,
      isNpc: seat.isNpc,
      strikes: seat.strikes,
      isOut: seat.isOut,
      turnRollsUsed: seat.turnRollsUsed,
      lastRoll: seat.lastRoll ? { ...seat.lastRoll } : null,
    })),
    game: {
      pot: current.game.pot,
      currentSeatId: current.game.currentSeatId,
      startingSeatId: current.game.startingSeatId,
      maxRollsThisRound: current.game.maxRollsThisRound,
      pendingAutoHoldSeatId: current.game.pendingAutoHoldSeatId,
    },
    startOrder: {
      displayRolls: { ...current.startOrder.displayRolls },
    },
    dice: {
      isAnimating: current.dice.isAnimating,
      animationStage: current.dice.animationStage,
      pendingRoll: current.dice.pendingRoll ? {
        score: current.dice.pendingRoll.score ? { ...current.dice.pendingRoll.score } : null,
      } : null,
    },
  };
}

} catch (error) {
  showStartupError(error);
}
})();
