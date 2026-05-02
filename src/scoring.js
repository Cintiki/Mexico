const NORMAL_RANKS = {
  31: 1,
  32: 2,
  41: 3,
  42: 4,
  43: 5,
  51: 6,
  52: 7,
  53: 8,
  54: 9,
  61: 10,
  62: 11,
  63: 12,
  64: 13,
  65: 14,
};

export function rollOneDie() {
  return Math.floor(Math.random() * 6) + 1;
}

export function rollTwoDice() {
  return [rollOneDie(), rollOneDie()];
}

export function scoreTwoDice(dice) {
  const [a, b] = dice;
  if ((a === 2 && b === 1) || (a === 1 && b === 2)) {
    return { dice, rank: 21, label: "Mexico", isMexico: true, kind: "mexico" };
  }
  if (a === b) {
    return { dice, rank: 14 + a, label: `${a}-${b}`, isMexico: false, kind: "double" };
  }
  const high = Math.max(a, b);
  const low = Math.min(a, b);
  const key = Number(`${high}${low}`);
  return { dice: [high, low], rank: NORMAL_RANKS[key], label: `${high}-${low}`, isMexico: false, kind: "normal" };
}

export function compareScores(a, b) {
  return a.rank - b.rank;
}

export function describeStrikeGain(mexicoCount) {
  return mexicoCount > 0 ? mexicoCount * 2 : 1;
}

export function tiedByScore(entries, highWins) {
  const ranks = entries.map((entry) => entry.score.rank);
  const target = highWins ? Math.max(...ranks) : Math.min(...ranks);
  return entries.filter((entry) => entry.score.rank === target);
}
