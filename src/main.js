import { preloadAssets } from "./assets.js";
import { createState } from "./state.js";
import { render } from "./render.js";
import { runNpcStep } from "./turns.js";

const state = createState();
preloadAssets();
let npcTimer = null;
let diceTimer = null;

function dispatch(mutator) {
  mutator(state);
  render(state, dispatch);
  scheduleDiceSettle();
  scheduleNpc();
}

render(state, dispatch);
scheduleNpc();

function scheduleNpc() {
  clearTimeout(npcTimer);
  const current = state.seats.find((seat) => seat.seatIndex === state.game.currentSeatId);
  if (state.phase === "round-turn" && current?.isNpc && !state.overlay) {
    npcTimer = setTimeout(() => dispatch(runNpcStep), 850);
  }
}

function scheduleDiceSettle() {
  clearTimeout(diceTimer);
  if (state.dice.isAnimating) {
    diceTimer = setTimeout(() => dispatch((draft) => {
      draft.dice.isAnimating = false;
      draft.dice.animationStage = null;
    }), 700);
  }
}
