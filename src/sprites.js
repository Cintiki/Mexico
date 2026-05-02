export function spriteStyle(sprite) {
  return [
    `--frames: ${sprite.frames}`,
    `--sprite-ratio: ${sprite.ratio ?? 1}`,
  ].join(";");
}
