import { CHARACTER_ORDER, CHARACTERS } from "./assets.js";
import { addLog, freshGame, freshStartOrder } from "./state.js";
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

export function resolveStartOrder(state) {
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

export function beginStartOrder(state) {
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

export function stepStartOrder(state) {
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

export function startRound(state, starterId) {
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

export function rollCurrentPlayer(state) {
  const seat = currentSeat(state);
  if (!seat || seat.isOut || state.dice.isAnimating) return;
  const limit = rollLimitFor(state, seat);
  if (seat.turnRollsUsed >= limit) return;

  const dice = rollTwoDice();
  const score = scoreTwoDice(dice);
  state.dice.animationStage = "shake";
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
    state.pendingOverlay = makeOverlay("mexico", "Mexico!", `${seat.displayName} rolled 2-1. The round penalty is now ${describeStrikeGain(state.game.mexicoCount)} strikes.`);
  }
  recomputeCurrentBest(state);
  state.message = `${seat.displayName} rolled ${score.label} in ${seat.turnRollsUsed} roll${seat.turnRollsUsed === 1 ? "" : "s"}.`;
  addLog(state, `${seat.displayName} rolled ${score.label} in ${seat.turnRollsUsed} roll${seat.turnRollsUsed === 1 ? "" : "s"}.`);

  if (score.isMexico) {
    addLog(state, `${seat.displayName} must hold on Mexico.`);
    state.game.pendingAutoHoldSeatId = seat.seatIndex;
  } else if (seat.turnRollsUsed >= limit) {
    state.game.pendingAutoHoldSeatId = seat.seatIndex;
  }
}

export function holdCurrentPlayer(state) {
  const seat = currentSeat(state);
  if (!seat || !seat.lastRoll) return;
  state.game.pendingAutoHoldSeatId = null;
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
