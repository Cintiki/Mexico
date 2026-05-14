import { preloadAssets } from "./assets.js";
import { preloadAudio, playSound, startLoop, stopLoop, unlockAudio } from "./audio.js";
import { createState } from "./state.js";
import { render } from "./render.js";
import { holdCurrentPlayer, runNpcStep, settleCurrentRoll, stepStartOrder } from "./turns.js";

const state = createState();
preloadAssets();
preloadAudio();
let npcTimer = null;
let diceTimer = null;
let autoHoldTimer = null;
let startOrderTimer = null;

function dispatch(mutator) {
  const previous = snapshotState(state);
  mutator(state);
  render(state, dispatch);
  syncAudio(previous, state);
  scheduleDiceSettle();
  scheduleAutoHold();
  scheduleStartOrder();
  scheduleNpc();
}

render(state, dispatch);
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
    playTransitionSounds(previous, current);
  }
  syncLoop(current);
}

function playTransitionSounds(previous, current) {
  if (previous.screen === "setup" && current.screen !== "setup") {
    playSound("startGame");
  }
  if (current.game.pot > previous.game.pot) {
    playSound("potAdd");
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

function syncLoop(current) {
  const loop = loopForState(current);
  if (loop) startLoop(loop);
  else stopLoop();
}

function loopForState(current) {
  if (current.screen === "setup") return "setupLoop";
  if (current.screen === "game-winner" && !current.overlay) return "winnerLoop";
  if (current.screen === "game" && current.phase === "round-turn" && isWaitingForHumanRoll(current)) return "rollWaitLoop";
  return null;
}

function isWaitingForHumanRoll(current) {
  if (current.dice.isAnimating || current.overlay || current.game.pendingAutoHoldSeatId !== null) return false;
  const seat = current.seats.find((item) => item.seatIndex === current.game.currentSeatId);
  if (!seat || seat.isNpc || seat.lastRoll?.isMexico) return false;
  return seat.turnRollsUsed < rollLimitForAudio(current, seat);
}

function totalStrikes(current) {
  return current.seats.reduce((total, seat) => total + seat.strikes, 0);
}

function outCount(current) {
  return current.seats.filter((seat) => seat.isOut).length;
}

function rollLimitForAudio(current, seat) {
  if (seat.seatIndex === current.game.startingSeatId) return 3;
  return current.game.maxRollsThisRound ?? 1;
}

function snapshotState(current) {
  return {
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
    dice: {
      isAnimating: current.dice.isAnimating,
      animationStage: current.dice.animationStage,
      pendingRoll: current.dice.pendingRoll ? {
        score: current.dice.pendingRoll.score ? { ...current.dice.pendingRoll.score } : null,
      } : null,
    },
  };
}
