import { CHARACTERS, CHARACTER_ORDER } from "./assets.js";

export function createState() {
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
    },
    message: "Ready to roll.",
    log: [],
    overlay: null,
    overlayQueue: [],
  };
}

export function freshGame() {
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
  };
}

export function freshStartOrder() {
  return {
    phase: "ready",
    candidates: [],
    queue: [],
    lockedIds: [],
    tailIds: [],
    rolls: {},
    order: [],
    rollingSeatId: null,
    rollStartedAt: 0,
    cycleDie: 1,
    message: "Ready to roll.",
    isComplete: false,
  };
}

export function addLog(state, text) {
  state.log = [text, ...state.log].slice(0, 6);
}
