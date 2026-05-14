import { preloadEventAssets, preloadGameplayAssets, preloadInitialAssets } from "./assets.js";
import { isAudioEnabled, preloadAudio, playSound, setAudioEnabled, startBackgroundMusic, stopLoop, unlockAudio } from "./audio.js";
import { createState } from "./state.js";
import { render } from "./render.js";
import { holdCurrentPlayer, runNpcStep, settleCurrentRoll, stepStartOrder } from "./turns.js";

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
    const duration = state.dice.animationStage === "shake" ? 560 : 520;
    diceTimer = setTimeout(() => dispatch((draft) => {
      if (draft.dice.animationStage === "shake") {
        draft.dice.animationStage = "throw";
        return;
      }
      draft.dice.isAnimating = false;
      draft.dice.animationStage = null;
      settleCurrentRoll(draft);
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
