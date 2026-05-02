import { CHARACTER_ORDER, CHARACTERS } from "./assets.js";
import { addLog, freshGame } from "./state.js";
import { chooseStarterRollTarget, shouldNpcRollAgain } from "./npc.js";
import { describeStrikeGain, rollOneDie, rollTwoDice, scoreTwoDice, tiedByScore } from "./scoring.js";

export function setRealPlayerCount(state, count) {
  state.realPlayerCount = count;
  state.setup.names = Array.from({ length: count }, (_, index) => state.setup.names[index] ?? "");
  state.setup.picks = Array.from({ length: count }, (_, index) => state.setup.picks[index] ?? null);
  state.setup.errors = Array.from({ length: count }, () => "");
  state.screen = "setup";
  state.phase = "player-setup";
}

export function validateAndCreateSeats(state) {
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

export function prepareNextGame(state) {
  const eligible = state.seats.filter((seat) => seat.coins > 0);
  if (eligible.length <= 1) {
    state.screen = "session-champion";
    state.phase = "session-champion";
      pushOverlay(state, "sessionChampion", `${eligible[0]?.displayName ?? "Nobody"} is Mexico Champion!`, "Session over.");
    return;
  }

  state.game = freshGame();
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

export function resolveStartOrder(state) {
  const winner = resolveOneDieTie(state, state.game.activeSeatIds, "high", "starts the game", "Start order tiebreaker");
  state.game.startingSeatId = winner;
  state.game.currentSeatId = winner;
  state.game.turnOrder = clockwiseOrder(state, winner);
  startRound(state, winner);
  state.screen = "game";
  state.phase = "round-turn";
  addLog(state, `${seatById(state, winner).displayName} starts the first round.`);
}

export function startRound(state, starterId) {
  state.game.startingSeatId = starterId;
  state.game.currentSeatId = starterId;
  state.game.turnOrder = clockwiseOrder(state, starterId);
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

export function rollCurrentPlayer(state) {
  const seat = currentSeat(state);
  if (!seat || seat.isOut || state.dice.isAnimating) return;
  const limit = rollLimitFor(state, seat);
  if (seat.turnRollsUsed >= limit) return;

  const dice = rollTwoDice();
  const score = scoreTwoDice(dice);
  state.dice.animationStage = "bounce";
  state.dice.isAnimating = true;
  seat.turnRollsUsed += 1;
  seat.lastRoll = score;
  state.dice.visibleFinalDice = dice;
  state.game.roundRolls[seat.seatIndex] = {
    score,
    rollsUsed: seat.turnRollsUsed,
  };
  if (score.isMexico) {
    state.game.mexicoCount += 1;
    pushOverlay(state, "mexico", "Mexico!", `${seat.displayName} rolled 2-1. The round penalty is now ${describeStrikeGain(state.game.mexicoCount)} strikes.`);
  }
  recomputeCurrentBest(state);
  state.message = `${seat.displayName} rolled ${score.label} in ${seat.turnRollsUsed} roll${seat.turnRollsUsed === 1 ? "" : "s"}.`;
  addLog(state, `${seat.displayName} rolled ${score.label} in ${seat.turnRollsUsed} roll${seat.turnRollsUsed === 1 ? "" : "s"}.`);

  if (score.isMexico) {
    addLog(state, `${seat.displayName} must hold on Mexico.`);
    holdCurrentPlayer(state);
  } else if (seat.turnRollsUsed >= limit) {
    holdCurrentPlayer(state);
  }
}

export function holdCurrentPlayer(state) {
  const seat = currentSeat(state);
  if (!seat || !seat.lastRoll) return;
  if (seat.seatIndex === state.game.startingSeatId && state.game.maxRollsThisRound === null) {
    state.game.maxRollsThisRound = seat.turnRollsUsed;
    addLog(state, `${seat.displayName} sets this round to ${seat.turnRollsUsed} roll${seat.turnRollsUsed === 1 ? "" : "s"}.`);
  }
  advanceTurn(state);
}

export function runNpcStep(state) {
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
  const loserId = loserEntries.length > 1
    ? resolveOneDieTie(state, loserEntries.map((entry) => entry.seatIndex), "low", "loses the round", "Round loser tiebreaker")
    : loserEntries[0].seatIndex;

  applyRoundResult(state, winnerId, loserId);
}

function applyRoundResult(state, winnerId, loserId) {
  const winner = seatById(state, winnerId);
  const loser = seatById(state, loserId);
  const strikeGain = describeStrikeGain(state.game.mexicoCount);
  winner.spriteState = "victory";
  loser.spriteState = loser.isRidingBus ? "out" : "lose";
  pushOverlay(state, "roundWinner", `${winner.displayName} wins the round!`, `${loser.displayName} takes ${strikeGain} strike${strikeGain === 1 ? "" : "s"}.`);
  addLog(state, `${winner.displayName} wins. ${loser.displayName} takes ${strikeGain} strike${strikeGain === 1 ? "" : "s"}.`);

  if (loser.isRidingBus) {
    eliminatePlayer(state, loser);
  } else {
    loser.strikes += strikeGain;
    if (loser.strikes === 5 && !state.game.busUsed) {
      loser.isRidingBus = true;
      loser.spriteState = "bus";
      state.game.busUsed = true;
      state.game.busSeatId = loser.seatIndex;
      pushOverlay(state, "rideBus", "Riding the Bus!", `${loser.displayName} gets one more chance.`);
    } else if (loser.strikes >= 5) {
      eliminatePlayer(state, loser);
    }
  }

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

export function continueAfterRound(state) {
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
  winner.coins += state.game.pot;
  const payout = state.game.pot;
  state.game.pot = 0;
  winner.spriteState = "victory";
  state.screen = "game-winner";
  state.phase = "game-winner";
  pushOverlay(state, "gameWinner", `${winner.displayName} wins the game!`, `${winner.displayName} collects ${payout} coins.`);
  addLog(state, `${winner.displayName} wins the game and collects ${payout} coins.`);
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
