import { preloadAssets } from "./assets.js";
import { createState } from "./state.js";
import { render } from "./render.js";
import { holdCurrentPlayer, runNpcStep, stepStartOrder } from "./turns.js";

const state = createState();
preloadAssets();
let npcTimer = null;
let diceTimer = null;
let autoHoldTimer = null;
let startOrderTimer = null;

function dispatch(mutator) {
  mutator(state);
  render(state, dispatch);
  scheduleDiceSettle();
  scheduleAutoHold();
  scheduleStartOrder();
  scheduleNpc();
}

render(state, dispatch);
scheduleStartOrder();
scheduleNpc();

function scheduleNpc() {
  clearTimeout(npcTimer);
  const current = state.seats.find((seat) => seat.seatIndex === state.game.currentSeatId);
  if (state.phase === "round-turn" && current?.isNpc && !state.overlay && !state.game.pendingAutoHoldSeatId) {
    npcTimer = setTimeout(() => dispatch(runNpcStep), 850);
  }
}

function scheduleDiceSettle() {
  clearTimeout(diceTimer);
  if (state.dice.isAnimating) {
    diceTimer = setTimeout(() => dispatch((draft) => {
      draft.dice.isAnimating = false;
      draft.dice.animationStage = null;
      showPendingOverlay(draft);
    }), 700);
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
