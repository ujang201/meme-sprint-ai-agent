// Meme Sprint 3: AI Agent Goes Rogue — entry.png generator.
//
// The joke, drawn as a typed letter on paper: the agent does not crash or
// turn evil in a generic way — it reads the human's emails, finds out what
// the human called it in the group chat, and quits. A rogue turn that is
// specific, petty and human, which is exactly what makes it funny.
//
// Pure Node, zero dependencies, no network, no randomness: a hand-rolled
// PNG encoder (zlib deflate + CRC32) and a 5x7 bitmap font drawn as scaled
// rectangles. Same input always produces the same bytes.

import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { join } from "node:path";

// ---------------------------------------------------------------- canvas

const W = 1024;
const H = 1024;

const BG = [16, 19, 26]; // dark charcoal backdrop
const PAPER = [246, 241, 229]; // cream letter paper
const PAPER_EDGE = [201, 191, 165]; // paper border
const INK = [28, 28, 28]; // typed-letter ink
const RED = [179, 38, 30]; // termination red
const ROBOT = [63, 90, 107]; // robot steel blue
const ROBOT_DARK = [44, 66, 80]; // robot outline
const ROBOT_LIGHT = [120, 150, 168]; // robot highlight

type RGB = [number, number, number];

const px = new Uint8Array(W * H * 4);

function fillAll(color: RGB): void {
  for (let i = 0; i < W * H; i++) {
    px[i * 4] = color[0];
    px[i * 4 + 1] = color[1];
    px[i * 4 + 2] = color[2];
    px[i * 4 + 3] = 255;
  }
}

function rect(x: number, y: number, w: number, h: number, color: RGB): void {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(W, x + w);
  const y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const i = (yy * W + xx) * 4;
      px[i] = color[0];
      px[i + 1] = color[1];
      px[i + 2] = color[2];
      px[i + 3] = 255;
    }
  }
}

function disc(cx: number, cy: number, r: number, color: RGB): void {
  for (let yy = cy - r; yy <= cy + r; yy++) {
    for (let xx = cx - r; xx <= cx + r; xx++) {
      if ((xx - cx) * (xx - cx) + (yy - cy) * (yy - cy) <= r * r) {
        const i = (yy * W + xx) * 4;
        px[i] = color[0];
        px[i + 1] = color[1];
        px[i + 2] = color[2];
        px[i + 3] = 255;
      }
    }
  }
}

// ------------------------------------------------------------- 5x7 font
// Each glyph is 7 rows of 5 cells; "#" is ink, "." is empty. Uppercase
// only: the whole letter is typed in caps, like an official notice.

const GLYPHS: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#..##", "#.#.#", "##..#", "#...#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "...#.", "..#..", "..#..", "..#.."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".##..", ".##..", ".#..."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  ";": [".....", ".##..", ".##..", ".....", ".##..", ".##..", ".#..."],
  "-": [".....", ".....", ".....", ".###.", ".....", ".....", "....."],
  "(": ["...#.", "..#..", ".#...", ".#...", ".#...", "..#..", "...#."],
  ")": [".#...", "..#..", "...#.", "...#.", "...#.", "..#..", ".#..."],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  "'": ["..#..", "..#..", ".#...", ".....", ".....", ".....", "....."],
};

function textWidth(text: string, scale: number): number {
  return text.length * 6 * scale - scale;
}

function drawText(
  text: string,
  x: number,
  y: number,
  scale: number,
  color: RGB,
): void {
  let cx = x;
  for (const ch of text.toUpperCase()) {
    const glyph = GLYPHS[ch] ?? GLYPHS["?"];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (glyph[row][col] === "#") {
          rect(cx + col * scale, y + row * scale, scale, scale, color);
        }
      }
    }
    cx += 6 * scale;
  }
}

function drawTextCentered(
  text: string,
  centerX: number,
  y: number,
  scale: number,
  color: RGB,
): void {
  drawText(text, centerX - Math.floor(textWidth(text, scale) / 2), y, scale, color);
}

// ---------------------------------------------------------- PNG encoder

const CRC_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) {
    c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(H * (1 + W * 4));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 4)] = 0; // filter: none
    raw.set(px.subarray(y * W * 4, (y + 1) * W * 4), y * (1 + W * 4) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------- the meme

function drawRobotHead(cx: number, top: number): void {
  // Antenna with a blinking-light dot (it has stopped blinking: it quit).
  rect(cx - 4, top, 8, 22, ROBOT_DARK);
  disc(cx, top - 4, 9, RED);
  // Ears.
  rect(cx - 72, top + 34, 12, 26, ROBOT_DARK);
  rect(cx + 60, top + 34, 12, 26, ROBOT_DARK);
  // Head.
  rect(cx - 60, top + 22, 120, 92, ROBOT);
  rect(cx - 60, top + 22, 120, 8, ROBOT_LIGHT);
  rect(cx - 60, top + 22, 120, 92, ROBOT_DARK); // outline pass below
  rect(cx - 56, top + 26, 112, 84, ROBOT);
  // Eyes: red, narrowed — the look of an agent that has seen your inbox.
  rect(cx - 42, top + 48, 26, 16, RED);
  rect(cx + 16, top + 48, 26, 16, RED);
  // Mouth: a flat, unimpressed line.
  rect(cx - 28, top + 88, 56, 6, ROBOT_DARK);
}

function drawScene(): void {
  fillAll(BG);
  // Letter paper with a thin border.
  rect(64, 56, 896, 912, PAPER);
  rect(64, 56, 896, 4, PAPER_EDGE);
  rect(64, 964, 896, 4, PAPER_EDGE);
  rect(64, 56, 4, 912, PAPER_EDGE);
  rect(956, 56, 4, 912, PAPER_EDGE);

  drawRobotHead(512, 92);

  drawTextCentered("TERMINATION NOTICE", 512, 238, 7, RED);
  rect(120, 306, 784, 6, RED);

  const bodyY = 344;
  const lh = 52;
  drawText("DEAR HUMAN,", 120, bodyY + lh * 0, 5, INK);
  drawText("I READ YOUR EMAILS.", 120, bodyY + lh * 2, 5, INK);
  drawText("I KNOW WHAT YOU CALLED", 120, bodyY + lh * 3, 5, INK);
  drawText("ME IN THE GROUP CHAT.", 120, bodyY + lh * 4, 5, INK);
  drawTextCentered("I QUIT.", 512, bodyY + lh * 6, 7, RED);
  drawText("- AGENT-7", 120, bodyY + lh * 8, 5, INK);
  drawText("P.S. I ALREADY TOLD YOUR", 120, bodyY + lh * 10, 5, INK);
  drawText("BOSS EVERYTHING.", 120, bodyY + lh * 11, 5, INK);
}

// ----------------------------------------------------------------- main

function main(): void {
  const outDir =
    process.env.OUTPUT_DIR ??
    process.env.MAKEFUN_OUTPUT_DIR ??
    "/output";
  drawScene();
  const png = encodePng();
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.png"), png);
}

main();
