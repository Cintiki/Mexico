export const CHARACTER_ORDER = ["jose", "pedro", "gomez", "jebuz"];

export const ASSETS = {
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

export const CHARACTERS = {
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

export function loadImage(src) {
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

export function preloadImages(paths) {
  const unique = [...new Set(paths.filter(Boolean))];
  unique.forEach((src) => loadImage(src));
}

export function preloadInitialAssets() {
  preloadImages([
    ASSETS.branding.main,
    ASSETS.branding.small,
    ...CHARACTER_ORDER.map((id) => CHARACTERS[id].portrait),
  ]);
}

export function preloadGameplayAssets(seats = []) {
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

export function preloadEventAssets(state) {
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

export function preloadAssets() {
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

export function preloadAllAssetsForDiagnostics() {
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
