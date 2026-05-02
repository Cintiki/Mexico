import { compareScores } from "./scoring.js";

export function chooseStarterRollTarget() {
  const roll = Math.random();
  if (roll < 0.25) return 1;
  if (roll < 0.75) return 2;
  return 3;
}

export function shouldNpcRollAgain(state, seat) {
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

export function getRollLimit(state, seat) {
  if (seat.seatIndex === state.game.startingSeatId) return 3;
  return state.game.maxRollsThisRound ?? 1;
}
