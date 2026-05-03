export function spriteStyle(sprite) {
  return [
    `--frames: ${sprite.frames}`,
    `--sprite-ratio: ${sprite.ratio ?? 1}`,
    `--sprite-duration: ${sprite.duration ?? 700}ms`,
    `--sprite-direction: ${sprite.reverse ? "reverse" : "normal"}`,
  ].join(";");
}
