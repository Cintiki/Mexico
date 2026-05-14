const fs = require("fs");
const path = require("path");

const files = [
  "src/assets.js",
  "src/audio.js",
  "src/scoring.js",
  "src/state.js",
  "src/npc.js",
  "src/sprites.js",
  "src/turns.js",
  "src/render.js",
  "src/main.js",
];

const pieces = files.map((file) => {
  let source = fs.readFileSync(path.join(__dirname, file), "utf8");
  source = source
    .replace(/^import[\s\S]*?from\s+["'][^"']+["'];\r?\n/gm, "")
    .replace(/^import .*?;\r?\n/gm, "")
    .replace(/^export function /gm, "function ")
    .replace(/^export const /gm, "const ");
  return `// ${file}\n${source}`;
});

const bundle = `(function () {\n"use strict";\nfunction showStartupError(error) {\n  var app = document.querySelector("#app");\n  if (!app) return;\n  app.innerHTML = '<section class="board"><h1 class="screen-title">Startup Error</h1><p class="screen-copy">' + String(error && (error.message || error)).replace(/[<>&]/g, function (c) { return ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]; }) + '</p></section>';\n}\nwindow.addEventListener("error", function (event) { showStartupError(event.error || event.message); });\nwindow.addEventListener("unhandledrejection", function (event) { showStartupError(event.reason); });\ntry {\n${pieces.join("\n\n")}\n} catch (error) {\n  showStartupError(error);\n}\n})();\n`;

fs.writeFileSync(path.join(__dirname, "app.bundle.js"), bundle);

const template = fs.readFileSync(path.join(__dirname, "index.template.html"), "utf8");
fs.writeFileSync(path.join(__dirname, "index.html"), template);
