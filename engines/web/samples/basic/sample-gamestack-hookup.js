// Minimal end-to-end wiring for the gamestack web SDK in a vanilla-canvas game.
// A square moves with the arrow keys; gamestack can read, screenshot, drive,
// snapshot/restore, and pause it. Serve this directory (ES modules need an
// origin: `python3 -m http.server`), open index.html, run `gamestack-web-bridge`
// in a terminal, then `curl http://127.0.0.1:7334/health`.

import GameStack from "../../src/gamestack-client.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ----- game state ----------------------------------------------------------
const player = { x: 188, y: 108, size: 24, speed: 3 };
let hp = 100;
let score = 0;
let paused = false;     // flipped by the gamestack pause/resume handlers below
const held = new Set(); // currently-held keys, fed by real keys AND /input

addEventListener("keydown", (e) => held.add(e.key));
addEventListener("keyup", (e) => held.delete(e.key));

// ----- gamestack hookup ------------------------------------------------------

// 1. Connect. Both getters are re-read per request. With no bridge running the
//    game behaves identically — the client reconnects quietly in the background.
GameStack.connect({ scene: () => "playground", canvas: () => canvas });

// 2. Expose live values for GET /state: tagged.player.hp, tagged.player.score.
GameStack.expose("hp", () => hp, "player");
GameStack.expose("score", () => score, "player");

// 3. Translate POST /input events into the same key set real keys feed, so
//    scenarios and humans drive the exact same code path. One translation layer.
const CONTROL_TO_KEY = { Left: "ArrowLeft", Right: "ArrowRight", Up: "ArrowUp", Down: "ArrowDown" };
GameStack.onInput((event) => {
  if (event.device !== "Keyboard") return;
  const key = CONTROL_TO_KEY[event.control] ?? event.control;
  if (event.action === "Press") held.add(key);
  if (event.action === "Release") held.delete(key);
});

// 4. Snapshot/restore: position, hp, and score round-trip through POST
//    /snapshot + /restore. Exposed values alone would not — they're live reads.
GameStack.registerSnapshotable({
  key: "player",
  capture: () => ({ x: player.x, y: player.y, hp, score }),
  restore: (data) => { player.x = data.x; player.y = data.y; hp = data.hp; score = data.score; },
});

// 5. Pause/resume: POST /breakpoint pauses flip a flag the game loop respects.
GameStack.setPauseHandlers({
  pause: () => { paused = true; },
  resume: () => { paused = false; },
});

// ----- game loop -------------------------------------------------------------
function update() {
  if (held.has("ArrowLeft")) player.x -= player.speed;
  if (held.has("ArrowRight")) player.x += player.speed;
  if (held.has("ArrowUp")) player.y -= player.speed;
  if (held.has("ArrowDown")) player.y += player.speed;
  player.y = Math.max(0, Math.min(player.y, canvas.height - player.size));

  if (player.x + player.size >= canvas.width) { score += 1; player.x = 188; } // right edge scores
  if (player.x <= 0) {                                                        // left edge hurts
    hp -= 10; player.x = 188;
    if (hp <= 0) {
      // 6. Semantic checkpoint: POST /breakpoint { "action": "add-pause",
      //    "tag": "player-died" } makes the game pause right here, every death.
      GameStack.hit("player-died");
      hp = 100; score = 0;
    }
  }
}

function draw() {
  ctx.fillStyle = "#1d2330";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = paused ? "#777" : "#5ec26a";
  ctx.fillRect(player.x, player.y, player.size, player.size);
  ctx.fillStyle = "#e8e8e8";
  ctx.font = "12px monospace";
  ctx.fillText(`hp ${hp}  score ${score}${paused ? "  [paused by gamestack]" : ""}`, 8, 16);
}

(function frame() {
  if (!paused) update();
  draw();
  requestAnimationFrame(frame);
})();
