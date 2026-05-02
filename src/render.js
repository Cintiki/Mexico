import { ASSETS, CHARACTERS, CHARACTER_ORDER } from "./assets.js";
import { spriteStyle } from "./sprites.js";
import {
  continueAfterRound,
  beginStartOrder,
  prepareNextGame,
  resolveStartOrder,
  rollCurrentPlayer,
  runNpcStep,
  setRealPlayerCount,
  validateAndCreateSeats,
  holdCurrentPlayer,
} from "./turns.js";

export function render(state, dispatch) {
  const app = document.querySelector("#app");
  app.innerHTML = "";
  app.appendChild(viewForState(state, dispatch));
}

function viewForState(state, dispatch) {
  if (state.screen === "landing") return landing(dispatch);
  if (state.screen === "player-count") return playerCount(dispatch);
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

function landing(dispatch) {
  return board(
    h("img", "logo-main", { src: ASSETS.branding.main, alt: "Mexico" }),
    h("button", "big-button", { text: "Play Now", onClick: () => dispatch((state) => {
      state.screen = "player-count";
      state.phase = "player-count";
    }) }),
  );
}

function playerCount(dispatch) {
  const choices = h("div", "count-grid");
  [1, 2, 3, 4].forEach((count) => {
    choices.append(h("button", "count-button", { text: String(count), onClick: () => dispatch((state) => setRealPlayerCount(state, count)) }));
  });
  return board(
    h("img", "logo-small setup-logo", { src: ASSETS.branding.small, alt: "Mexico" }),
    h("h1", "screen-title", { text: "How many players?" }),
    choices,
  );
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
  return board(
    h("img", "logo-small setup-logo", { src: ASSETS.branding.small, alt: "Mexico" }),
    h("h1", "screen-title", { text: "Set up players" }),
    form,
    h("button", "big-button", { text: "Start Game", onClick: () => dispatch(validateAndCreateSeats) }),
  );
}

function preGame(state, dispatch) {
  if (state.screen === "start-order") return startOrderScreen(state, dispatch);
  const action = state.screen === "buy-in"
    ? h("button", "big-button", { text: "Roll for Start", onClick: () => dispatch((draft) => {
      draft.screen = "start-order";
      draft.phase = "start-order";
    }) })
    : h("button", "big-button", { text: "Start Rolling", onClick: () => dispatch(resolveStartOrder) });
  return board(
    h("img", "logo-small setup-logo", { src: ASSETS.branding.small, alt: "Mexico" }),
    h("h1", "screen-title", { text: state.screen === "buy-in" ? "Buy-In" : "Start Order Roll" }),
    h("p", "screen-copy", { text: state.screen === "buy-in" ? `Active players paid in. The pot is ${state.game.pot} coins.` : "Each active player rolls one die. Highest starts." }),
    scoreboard(state),
    action,
  );
}

function startOrderScreen(state, dispatch) {
  const startOrder = state.startOrder;
  const action = startOrder.isComplete
    ? h("button", "big-button", { text: "Continue", onClick: () => dispatch(resolveStartOrder) })
    : h("button", "big-button", { text: "Start Rolling", disabled: startOrder.phase === "rolling", onClick: () => dispatch(beginStartOrder) });
  return board(
    h("img", "logo-small setup-logo", { src: ASSETS.branding.small, alt: "Mexico" }),
    h("h1", "screen-title", { text: startOrder.isComplete ? "Roll Order" : "Start Order Roll" }),
    h("p", "screen-copy", { text: startOrder.message || "Each active player rolls one die. Highest starts." }),
    startOrderBoard(state),
    action,
  );
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
      playerRow(state, seat),
      orderDie(state, seat),
    ));
  });
  wrap.append(list);
  return wrap;
}

function orderDie(state, seat) {
  const isRolling = state.startOrder.rollingSeatId === seat.seatIndex;
  const die = isRolling ? state.startOrder.cycleDie : state.startOrder.displayRolls[seat.seatIndex];
  const className = `order-die ${isRolling ? "is-rolling" : ""} ${die ? "" : "is-empty"}`;
  return h("div", className, die
    ? h("img", "die-face", { src: ASSETS.diceFaces[die], alt: `Die ${die}` })
    : h("span", "", { text: "-" }));
}

function orderRowStatusText(state, seat) {
  if (state.startOrder.rollingSeatId === seat.seatIndex) return "Rolling";
  if (state.startOrder.phase === "rolling" && state.startOrder.queue[0] === seat.seatIndex) return "Waiting";
  return "";
}

function gameBoard(state, dispatch) {
  const shell = h("section", "game-board");
  const left = h("div", "play-area");
  if (state.screen === "game-winner") {
    left.append(h("img", "event-card winner-logo", { src: ASSETS.events.gameWinner, alt: "Game winner" }));
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
  if (state.overlay) shell.append(overlay(state, dispatch));
  if (state.screen === "game-winner") shell.append(gameWinnerControls(dispatch));
  if (state.screen === "session-champion") shell.append(sessionControls(dispatch));
  return shell;
}

function diceStage(state) {
  const stage = h("div", "dice-stage");
  stage.append(h("img", "dice-tray", { src: ASSETS.props.diceRollArea, alt: "" }));
  const current = state.seats.find((seat) => seat.seatIndex === state.game.currentSeatId);
  if (current) stage.append(characterSprite(current));
  if (state.dice.isAnimating) {
    const sprite = ASSETS.diceSprites[state.dice.animationStage] ?? ASSETS.diceSprites.bounce;
    stage.append(spriteElement(sprite, "dice-sprite", true, "Rolling dice"));
  }
  if (state.dice.visibleFinalDice && !state.dice.isAnimating) {
    const dice = h("div", "final-dice");
    state.dice.visibleFinalDice.forEach((die) => dice.append(h("img", "die-face", { src: ASSETS.diceFaces[die], alt: `Die ${die}` })));
    stage.append(dice);
  }
  return stage;
}

function characterSprite(seat) {
  const sprite = CHARACTERS[seat.characterId].sprites[seat.spriteState] ?? CHARACTERS[seat.characterId].sprites.idle;
  return spriteElement(sprite, "character-sprite", !sprite.static, seat.displayName);
}

function spriteElement(sprite, className, animated, label) {
  return h(
    "div",
    `${className} sprite-viewport frame-count-${sprite.frames} ${animated ? "is-animated" : "is-static"}`,
    { style: spriteStyle(sprite), title: label },
    h("img", "sprite-strip", { src: sprite.src, alt: label ?? "" }),
  );
}

function controls(state, dispatch) {
  const seat = state.seats.find((item) => item.seatIndex === state.game.currentSeatId);
  const limit = seat ? displayRollLimitFor(state, seat) : 0;
  const rollLimitReached = Boolean(seat) && seat.turnRollsUsed >= limit;
  const mustHoldMexico = Boolean(seat?.lastRoll?.isMexico);
  const disabled = !seat || seat.isNpc || state.phase !== "round-turn";
  const canHold = !disabled && Boolean(seat.lastRoll);
  const wrap = h("div", "controls");
  if (state.phase === "round-result") {
    wrap.append(h("button", "big-button", { text: "Next Round", onClick: () => dispatch(continueAfterRound) }));
    return wrap;
  }
  if (seat) wrap.append(h("span", "roll-limit-note", { text: `Rolls: ${seat.turnRollsUsed}/${limit}` }));
  if (!rollLimitReached && !mustHoldMexico) {
    wrap.append(h("button", "game-button", { text: "Roll", disabled, onClick: () => dispatch(rollCurrentPlayer) }));
  }
  wrap.append(h("button", "game-button", { text: "Hold", disabled: !canHold, onClick: () => dispatch(holdCurrentPlayer) }));
  if (seat?.isNpc) wrap.append(h("button", "game-button", { text: "NPC Step", onClick: () => dispatch(runNpcStep) }));
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
  return h("div", "pot-box", {}, h("img", "icon", { src: ASSETS.icons.pot, alt: "" }), h("span", "", { text: `The Pot ${state.game.pot}` }));
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
    feature.append(h("img", "dice-tray winner-tray", { src: ASSETS.props.diceRollArea, alt: "" }));
    if (winner) feature.append(characterSprite(winner));
    feature.append(h("img", "coin-burst", { src: ASSETS.props.coinBurst, alt: "" }));
  } else {
    feature.append(h("img", "event-card large", { src: asset, alt: "" }));
  }
  return feature;
}

function gameWinnerSeat(state) {
  return state.seats.find((seat) => seat.spriteState === "victory" && !seat.isOut)
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
    }) }),
    h("button", "game-button", { text: "Quit", onClick: () => dispatch((state) => {
      state.message = "Thanks for playing.";
      state.overlay = null;
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
