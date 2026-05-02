export function spriteStyle(sprite) {
  return [
    `background-image: url("${sprite.src}")`,
    `--frames: ${sprite.frames}`,
  ].join(";");
}
