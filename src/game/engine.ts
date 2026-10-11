import { AudioBus } from "@/game/audio";
import { loadSave, writeSave, type SaveData } from "@/game/save";
import type { ControlsProbe, Hud, Phase } from "@/game/types";

const W = 420;
const H = 760;
const PLAYER_Y = H * 0.7;
const HIT_R = 13;
const MAX_VX = 430;
const ACCEL = 2600;
const STEP = 1 / 60;

const INK = "#141820";
const INK_DEEP = "#0e121a";
const INK_RIDGE = "#1a2030";
const INK_RIDGE_FAR = "#151a28";
const PAPER = "#f3ece1";
const MIST = "#9aa1b2";
const GOLD = "#e4a84b";
const GOLD_SOFT = "#f3d7a4";
const SEAL = "#c94b3a";
const SEAL_DEEP = "#7c2c24";

type Gate = {
  kind: "gate";
  y: number;
  gapX: number;
  gapW: number;
  thick: number;
  silk: boolean;
  scored: boolean;
  hurt: boolean;
};

type Fan = {
  kind: "fan";
  y: number;
  x: number;
  baseX: number;
  amp: number;
  phase: number;
  omega: number;
  r: number;
  scored: boolean;
  hurt: boolean;
};

type Spark = {
  kind: "spark";
  y: number;
  x: number;
  r: number;
  arm: number;
  scored: boolean;
  hurt: boolean;
};

type Hazard = Gate | Fan | Spark;

type PickupKind = "wish" | "ember" | "charm";

type Pickup = {
  kind: PickupKind;
  x: number;
  y: number;
  r: number;
  taken: boolean;
};

type Particle = {
  on: boolean;
  world: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
};

type Floater = { text: string; x: number; y: number; life: number; color: string };

type Star = { x: number; y: number; s: number; a: number; tw: number };
type Cloud = { x: number; y: number; w: number; h: number; s: number };

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

function reachable(interval: number) {
  const tAccel = MAX_VX / ACCEL;
  const decel = Math.min(interval, tAccel);
  const after = Math.max(0, interval - decel);
  const accelT = Math.min(after, tAccel);
  const coastT = Math.max(0, after - tAccel);
  const away = (MAX_VX * decel) / 2;
  const toward = 0.5 * ACCEL * accelT * accelT + MAX_VX * coastT;
  return Math.max(72, toward - away - 44);
}

function smooth(t: number) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function yOverlap(prevY: number, y: number, half: number, py: number, pr: number) {
  const top = Math.min(prevY, y) - half;
  const bot = Math.max(prevY, y) + half;
  return py + pr >= top && py - pr <= bot;
}

export type GameHandle = {
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  toMenu: () => void;
  toggleMute: () => void;
  toggleShake: () => void;
  destroy: () => void;
};

export function createGame(
  canvas: HTMLCanvasElement,
  onHud: (hud: Hud) => void,
): GameHandle {
  const ctxOrNull = canvas.getContext("2d");
  if (!ctxOrNull) throw new Error("Canvas unavailable");
  const ctx: CanvasRenderingContext2D = ctxOrNull;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const save: SaveData = loadSave();
  const audio = new AudioBus();
  audio.muted = save.muted;

  const keys = new Set<string>();
  const injected = new Set<string>();
  let pointerId: number | null = null;
  let pointerX: number | null = null;
  let pointerType = "";

  let phase: Phase = "menu";
  let distance = 0;
  let speed = 150;
  let bonus = 0;
  let wishes = 0;
  let combo = 0;
  let comboLeft = 0;
  let lives = 3;
  let shield = false;
  let invuln = 0;
  let px = W / 2;
  let vx = 0;
  let safeX = W / 2;
  let nextSpawn = 720;
  let dyingT = 0;
  let bestCommitted = false;
  let newBest = false;
  let hinted = false;
  let clock = 0;
  let flash = 0;
  let trauma = 0;
  let hitstop = 0;
  let hudAcc = 0;
  let lastPhase: Phase = "menu";
  let emberAcc = 0;
  let acc = 0;
  let lastTs = 0;
  let raf = 0;
  let shakeOn = save.shake ?? !reduced;

  const hazards: Hazard[] = [];
  const pickups: Pickup[] = [];
  const floaters: Floater[] = [];
  const particles: Particle[] = Array.from({ length: 180 }, () => ({
    on: false,
    world: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    max: 1,
    size: 1,
    color: GOLD,
  }));

  const stars: Star[] = Array.from({ length: 42 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    s: Math.random() * 1.3 + 0.3,
    a: Math.random() * 0.45 + 0.15,
    tw: Math.random() * Math.PI * 2,
  }));

  const clouds: Cloud[] = [
    { x: 30, y: 180, w: 150, h: 28, s: 0.05 },
    { x: 240, y: 260, w: 180, h: 34, s: 0.07 },
    { x: 120, y: 420, w: 130, h: 22, s: 0.04 },
    { x: 300, y: 540, w: 160, h: 26, s: 0.06 },
  ];

  function scoreNow() {
    return Math.floor(distance / 12 + bonus);
  }

  function heightNow() {
    return Math.floor(distance / 46);
  }

  function snapshot(): Hud {
    return {
      phase,
      score: scoreNow(),
      height: heightNow(),
      wishes,
      lives,
      combo,
      shield,
      bestScore: save.bestScore,
      bestHeight: save.bestHeight,
      muted: save.muted,
      shake: shakeOn,
      newBest,
      hint: phase === "playing" && !hinted,
    };
  }

  function pushHud(force = false) {
    if (!force && phase === lastPhase && hudAcc < 0.1) return;
    hudAcc = 0;
    lastPhase = phase;
    onHud(snapshot());
  }

  function persist() {
    writeSave(save);
  }

  function emit(
    x: number,
    y: number,
    n: number,
    color: string,
    spread: number,
    world: boolean,
    up = 0,
  ) {
    let left = reduced ? Math.ceil(n / 2) : n;
    for (const p of particles) {
      if (left <= 0) break;
      if (p.on) continue;
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * spread;
      p.on = true;
      p.world = world;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(a) * s;
      p.vy = Math.sin(a) * s * 0.6 - up;
      p.life = p.max = 0.35 + Math.random() * 0.45;
      p.size = 1.2 + Math.random() * 2.2;
      p.color = color;
      left -= 1;
    }
  }

  function popText(text: string, x: number, y: number, color: string) {
    if (floaters.length > 10) floaters.shift();
    floaters.push({ text, x, y, life: 0.85, color });
  }

  function clearWorld() {
    hazards.length = 0;
    pickups.length = 0;
    floaters.length = 0;
    for (const p of particles) p.on = false;
  }

  function beginRun() {
    audio.unlock();
    audio.startPad();
    clearWorld();
    phase = "playing";
    distance = 0;
    speed = 156;
    bonus = 0;
    wishes = 0;
    combo = 0;
    comboLeft = 0;
    lives = 3;
    shield = false;
    invuln = 0.7;
    px = W / 2;
    vx = 0;
    safeX = W / 2;
    nextSpawn = 680;
    dyingT = 0;
    bestCommitted = false;
    newBest = false;
    hinted = false;
    flash = 0;
    trauma = 0;
    hitstop = 0;
    for (let i = 0; i < 4; i++) {
      pickups.push({
        kind: "wish",
        x: W / 2 + Math.sin(i * 1.3) * 36,
        y: PLAYER_Y - 180 - i * 100,
        r: 11,
        taken: false,
      });
    }
    pushHud(true);
  }

  function commitBest() {
    if (bestCommitted) return;
    bestCommitted = true;
    const score = scoreNow();
    const height = heightNow();
    newBest = score > save.bestScore || height > save.bestHeight;
    if (score > save.bestScore) save.bestScore = score;
    if (height > save.bestHeight) save.bestHeight = height;
    persist();
  }

  function damage() {
    if (phase !== "playing") return;
    if (invuln > 0) return;
    if (shield) {
      shield = false;
      invuln = 0.45;
      trauma = Math.min(1, trauma + (shakeOn ? 0.35 : 0));
      flash = 0.18;
      audio.playShield();
      emit(px, PLAYER_Y, 14, GOLD_SOFT, 90, false, 20);
      popText("Ward", px, PLAYER_Y - 40, GOLD_SOFT);
      return;
    }
    lives -= 1;
    invuln = 1.2;
    combo = 0;
    comboLeft = 0;
    hitstop = lives <= 0 ? 0.05 : 0.07;
    trauma = Math.min(1, trauma + (shakeOn ? 0.72 : 0));
    flash = 0.4;
    audio.playHit();
    emit(px, PLAYER_Y, 22, SEAL, 140, false, 10);
    emit(px, PLAYER_Y, 10, PAPER, 80, true, 0);
    if (lives <= 0) {
      phase = "dying";
      dyingT = 0.75;
      audio.stopPad();
      emit(px, PLAYER_Y, 28, GOLD, 160, false, 30);
    }
    pushHud(true);
  }

  function grant(points: number, label: string, color: string, sound: "wish" | "near" | "grace") {
    const mult = 1 + Math.min(7, combo);
    const pts = points * mult;
    bonus += pts;
    combo = Math.min(99, combo + 1);
    comboLeft = 2.55;
    popText(label === "+" ? `+${pts}` : label, px, PLAYER_Y - 46, color);
    if (sound === "wish") audio.playWish(combo);
    else if (sound === "grace") audio.playGrace();
    else audio.playNear();
  }

  function collect(p: Pickup) {
    if (p.taken) return;
    p.taken = true;
    if (p.kind === "wish") {
      wishes += 1;
      grant(10, "+", GOLD_SOFT, "wish");
      emit(p.x, p.y, 10, GOLD, 70, false, 16);
    } else if (p.kind === "ember") {
      if (lives < 3) {
        lives += 1;
        popText("Flame", p.x, p.y - 16, SEAL);
        audio.playLife();
      } else {
        bonus += 40;
        popText("+40", p.x, p.y - 16, GOLD_SOFT);
        audio.playWish(4);
      }
      comboLeft = Math.max(comboLeft, 2);
      emit(p.x, p.y, 12, SEAL, 80, false, 20);
    } else {
      shield = true;
      popText("Ward", p.x, p.y - 16, GOLD);
      audio.playCharm();
      comboLeft = Math.max(comboLeft, 2);
      emit(p.x, p.y, 12, GOLD_SOFT, 70, false, 10);
    }
    pushHud(true);
  }

  function spawnPickup(x: number, y: number) {
    if (pickups.length > 7) return;
    const roll = Math.random();
    let kind: PickupKind = "wish";
    if (roll > 0.92 && !shield) kind = "charm";
    else if (roll > 0.82 && lives < 3) kind = "ember";
    pickups.push({ kind, x, y, r: 11, taken: false });
  }

  function spawnObstacle() {
    const t = smooth(distance / 15000);
    const interval = 1.3 - t * 0.52;
    const gapW = 200 - t * 82;
    const reach = reachable(interval);
    const roll = Math.random();
    let kind: "silk" | "wire" | "fan" | "spark" = "silk";
    if (t > 0.2 && roll > 0.55) kind = "wire";
    if (t > 0.36 && roll > 0.74) kind = "fan";
    if (t > 0.58 && roll > 0.88) kind = "spark";

    if (kind === "fan") {
      const left = 74;
      const right = W - 74;
      const prefer = Math.abs(left - safeX) <= Math.abs(right - safeX) ? left : right;
      if (Math.abs(prefer - safeX) <= reach) {
        hazards.push({
          kind: "fan",
          y: -46,
          x: W / 2,
          baseX: W / 2 + (Math.random() * 2 - 1) * 24,
          amp: 76,
          phase: Math.random() * Math.PI * 2,
          omega: 1.45 + t * 1.15,
          r: 30,
          scored: false,
          hurt: false,
        });
        safeX = prefer;
        if (Math.random() < 0.7) spawnPickup(prefer, -150);
        nextSpawn = distance + speed * interval;
        return;
      }
      kind = "silk";
    }

    if (kind === "spark") {
      const dir = safeX > W / 2 ? -1 : 1;
      const cx = clamp(safeX + dir * Math.min(reach * 0.85, 160), 100, W - 100);
      const escape = clamp(cx > W / 2 ? 68 : W - 68, 68, W - 68);
      if (Math.abs(escape - safeX) <= reach) {
        hazards.push({
          kind: "spark",
          y: -30,
          x: cx,
          r: 26,
          arm: 0.58,
          scored: false,
          hurt: false,
        });
        safeX = escape;
        if (Math.random() < 0.65) spawnPickup(escape, -150);
        nextSpawn = distance + speed * interval;
        return;
      }
      kind = "wire";
    }

    let gapX = safeX + (Math.random() * 2 - 1) * reach * 0.92;
    const minX = gapW / 2 + 22;
    const maxX = W - gapW / 2 - 22;
    gapX = clamp(gapX, safeX - reach, safeX + reach);
    gapX = clamp(gapX, minX, maxX);
    hazards.push({
      kind: "gate",
      y: -36,
      gapX,
      gapW,
      thick: kind === "wire" ? 16 : 84,
      silk: kind !== "wire",
      scored: false,
      hurt: false,
    });
    safeX = gapX;
    if (Math.random() < 0.84) spawnPickup(gapX, -36);
    nextSpawn = distance + speed * (kind === "wire" ? interval * 0.92 : interval);
  }

  function steer() {
    const down = (code: string) => keys.has(code) || injected.has(code);
    let axis = 0;
    if (down("KeyA") || down("ArrowLeft")) axis -= 1;
    if (down("KeyD") || down("ArrowRight")) axis += 1;
    if (axis !== 0) {
      hinted = true;
      vx += axis * ACCEL * STEP;
      return;
    }
    if (pointerX != null) {
      hinted = true;
      const desired = clamp((pointerX - px) * 7.2, -MAX_VX, MAX_VX);
      vx += (desired - vx) * (1 - Math.exp(-14 * STEP));
      return;
    }
    vx *= Math.exp(-7 * STEP);
  }

  function movePlayer() {
    vx = clamp(vx, -MAX_VX, MAX_VX);
    px += vx * STEP;
    px = clamp(px, 26, W - 26);
  }

  function updateHazards() {
    const tSpeed = speed * STEP;
    for (const h of hazards) {
      const prev = h.y;
      if (h.kind === "fan") {
        h.phase += h.omega * STEP;
        h.x = h.baseX + Math.sin(h.phase) * h.amp;
      }
      if (h.kind === "spark") h.arm = Math.max(0, h.arm - STEP);
      h.y += tSpeed;
      if (h.kind === "gate") {
        if (!yOverlap(prev, h.y, h.thick / 2, PLAYER_Y, HIT_R)) continue;
        const left = h.gapX - h.gapW / 2;
        const right = h.gapX + h.gapW / 2;
        const clearance = Math.min(px - HIT_R - left, right - (px + HIT_R));
        if (clearance < 0) {
          if (!h.hurt) {
            h.hurt = true;
            damage();
          }
        } else if (!h.scored && clearance < 22) {
          h.scored = true;
          if (clearance < 9) grant(14, "Grace", PAPER, "grace");
          else grant(5, "Thread", PAPER, "near");
        }
      } else if (h.kind === "fan" || (h.kind === "spark" && h.arm <= 0)) {
        const dx = h.x - px;
        const dy = h.y - PLAYER_Y;
        const clearance = Math.hypot(dx, dy) - h.r - HIT_R;
        const crossing = yOverlap(prev, h.y, h.r, PLAYER_Y, HIT_R);
        if (clearance < 0 && crossing) {
          if (!h.hurt) {
            h.hurt = true;
            damage();
          }
        } else if (!h.scored && crossing && clearance < 16 && clearance >= 0) {
          h.scored = true;
          grant(5, "Thread", PAPER, "near");
        }
      }
    }
    for (let i = hazards.length - 1; i >= 0; i--) {
      if (hazards[i]!.y > H + 140) hazards.splice(i, 1);
    }
  }

  function updatePickups() {
    const dy = speed * STEP;
    for (const p of pickups) {
      if (p.taken) continue;
      const prev = p.y;
      p.y += dy;
      const r = p.r + HIT_R + 6;
      if (!yOverlap(prev, p.y, p.r, PLAYER_Y, HIT_R + 6)) continue;
      const dx = p.x - px;
      const cy = clamp(PLAYER_Y, Math.min(prev, p.y), Math.max(prev, p.y));
      if (dx * dx + (cy - PLAYER_Y) * (cy - PLAYER_Y) <= r * r) collect(p);
    }
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i]!;
      if (p.taken || p.y > H + 40) pickups.splice(i, 1);
    }
  }

  function updateParticles(dt: number, worldSpeed: number) {
    for (const p of particles) {
      if (!p.on) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.on = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt + (p.world ? worldSpeed * dt : 0);
    }
  }

  function stepPlay() {
    const t = smooth(distance / 15000);
    speed = 156 + t * 250;
    steer();
    movePlayer();
    distance += speed * STEP;
    updateHazards();
    updatePickups();
    if (distance >= nextSpawn) spawnObstacle();
    if (invuln > 0) invuln -= STEP;
    if (comboLeft > 0) {
      comboLeft -= STEP;
      if (comboLeft <= 0) combo = 0;
    }
    emberAcc += STEP;
    const rate = reduced ? 10 : 24;
    while (emberAcc > 1 / rate) {
      emberAcc -= 1 / rate;
      emit(px + (Math.random() - 0.5) * 8, PLAYER_Y - 8, 1, GOLD, 16, false, 50 + Math.random() * 40);
    }
    if (!reduced && Math.random() < STEP * 5) {
      emit(Math.random() * W, -8, 1, PAPER, 8, true, 0);
    }
    updateParticles(STEP, speed);
    for (const f of floaters) {
      f.life -= STEP;
      f.y -= 26 * STEP;
    }
    for (let i = floaters.length - 1; i >= 0; i--) if (floaters[i]!.life <= 0) floaters.splice(i, 1);
  }

  function stepMenu(dt: number) {
    clock += dt;
    distance += 28 * dt;
    px = W / 2 + Math.sin(clock * 0.7) * 22;
    vx = Math.cos(clock * 0.7) * 16;
    emberAcc += dt;
    while (emberAcc > 0.08) {
      emberAcc -= 0.08;
      emit(px, PLAYER_Y - 6, 1, GOLD, 12, false, 36);
    }
    updateParticles(dt, 28);
  }

  function stepDying(dt: number) {
    dyingT -= dt;
    speed = Math.max(0, speed * Math.exp(-2.4 * dt));
    for (const h of hazards) h.y += speed * dt;
    for (const p of pickups) p.y += speed * dt;
    updateParticles(dt, speed);
    emit(px, PLAYER_Y, 1, GOLD, 40, false, 20);
    if (dyingT <= 0) {
      phase = "over";
      commitBest();
      audio.playOver();
      pushHud(true);
    }
  }

  function roundRect(
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#1a1614");
    g.addColorStop(0.45, INK);
    g.addColorStop(1, INK_DEEP);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    for (const s of stars) {
      const tw = 0.65 + Math.sin(clock * 1.4 + s.tw) * 0.35;
      ctx.globalAlpha = s.a * tw;
      ctx.fillStyle = PAPER;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;

    const moonX = W * 0.73;
    const moonY = 128 + Math.sin(clock * 0.15) * 4;
    const glow = ctx.createRadialGradient(moonX, moonY, 20, moonX, moonY, 120);
    glow.addColorStop(0, "rgba(243,236,225,0.28)");
    glow.addColorStop(1, "rgba(243,236,225,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(20,24,32,0.08)";
    ctx.beginPath();
    ctx.arc(moonX - 12, moonY - 8, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moonX + 14, moonY + 10, 6, 0, Math.PI * 2);
    ctx.fill();

    drawRidge(0.12, 470, 36, INK_RIDGE_FAR, 1.4);
    for (const c of clouds) {
      const x = ((c.x - distance * c.s) % (W + c.w)) + c.w;
      ctx.fillStyle = "rgba(243,236,225,0.045)";
      ctx.beginPath();
      ctx.ellipse(((x % (W + 180)) + W + 180) % (W + 180) - 40, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    drawRidge(1.7, 560, 48, INK_RIDGE, 2.2);

    if (speed > 240 && phase === "playing" && !reduced) {
      ctx.strokeStyle = "rgba(243,236,225,0.08)";
      ctx.lineWidth = 1;
      const shift = distance % 80;
      for (let i = 0; i < 7; i++) {
        const x = 30 + i * 58;
        const y = (shift * 3 + i * 90) % H;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 6, y + 28);
        ctx.stroke();
      }
    }
  }

  function drawRidge(seed: number, base: number, amp: number, color: string, factor: number) {
    const shift = distance * factor * 0.15;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 10) {
      const n =
        Math.sin((x + shift) * 0.018 + seed) * amp +
        Math.sin((x + shift) * 0.007 + seed * 2) * amp * 0.45;
      ctx.lineTo(x, base + n);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawGate(g: Gate) {
    const leftW = g.gapX - g.gapW / 2;
    const rightX = g.gapX + g.gapW / 2;
    const y = g.y - g.thick / 2;
    const flutter = reduced ? 0 : Math.sin(clock * 2.2 + g.gapX) * 1.5;
    if (g.silk) {
      drawSilk(0, y + flutter, leftW, g.thick, "left");
      drawSilk(rightX, y - flutter, W - rightX, g.thick, "right");
    } else {
      drawWire(g.y, leftW, rightX);
    }
  }

  function drawSilk(x: number, y: number, w: number, h: number, side: "left" | "right") {
    if (w < 4 || h < 4) return;
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, "#d15a48");
    grad.addColorStop(0.5, SEAL);
    grad.addColorStop(1, SEAL_DEEP);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = GOLD;
    const hem = side === "left" ? x + w - 3 : x;
    ctx.fillRect(hem, y, 3, h);
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = GOLD_SOFT;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const yy = y + 16 + i * (h / 4);
      ctx.moveTo(x + 8, yy);
      ctx.bezierCurveTo(x + w * 0.4, yy - 6, x + w * 0.6, yy + 6, x + w - 8, yy);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    const cx = side === "left" ? x + w * 0.62 : x + w * 0.38;
    const cy = y + h * 0.48;
    ctx.strokeStyle = GOLD_SOFT;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx + 5, cy);
    ctx.lineTo(cx, cy + 6);
    ctx.lineTo(cx - 5, cy);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = GOLD;
    const tassels = side === "left" ? x + w - 8 : x + 4;
    ctx.fillRect(tassels, y + h, 2, 10);
    ctx.beginPath();
    ctx.arc(tassels + 1, y + h + 12, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawWire(y: number, leftW: number, rightX: number) {
    ctx.strokeStyle = PAPER;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(leftW, y);
    ctx.moveTo(rightX, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    ctx.fillStyle = GOLD;
    for (const x of [leftW * 0.35, leftW * 0.7, rightX + (W - rightX) * 0.3, rightX + (W - rightX) * 0.7]) {
      if (x < 8 || x > W - 8) continue;
      ctx.beginPath();
      ctx.arc(x, y + 7, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = GOLD;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 4);
      ctx.stroke();
    }
    ctx.fillStyle = MIST;
    ctx.fillRect(leftW - 3, y - 8, 3, 16);
    ctx.fillRect(rightX, y - 8, 3, 16);
  }

  function drawFan(f: Fan) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.strokeStyle = "#c4b39a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(0, 46);
    ctx.stroke();
    const grad = ctx.createLinearGradient(-f.r, 0, f.r, 0);
    grad.addColorStop(0, SEAL_DEEP);
    grad.addColorStop(0.5, SEAL);
    grad.addColorStop(1, "#e07a68");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, f.r, f.r * 0.86, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) {
      ctx.moveTo(0, 6);
      ctx.lineTo(Math.sin(i * 0.45) * (f.r - 4), -f.r * 0.7);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawSpark(s: Spark) {
    const arming = s.arm > 0;
    const alpha = arming ? 0.35 + (1 - s.arm / 0.58) * 0.4 : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = arming ? GOLD_SOFT : SEAL;
    ctx.fillStyle = arming ? "rgba(228,168,75,0.08)" : SEAL;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    if (!arming) ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    const spokes = arming ? s.r + 6 : s.r * 0.55;
    for (let i = 0; i < 6; i++) {
      const a = clock * 2 + (i * Math.PI) / 3;
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + Math.cos(a) * spokes, s.y + Math.sin(a) * spokes);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawPickup(p: Pickup) {
    const bob = reduced ? 0 : Math.sin(clock * 3.4 + p.x) * 3;
    const y = p.y + bob;
    if (p.kind === "wish") {
      ctx.save();
      ctx.translate(p.x, y);
      ctx.rotate(Math.PI / 4);
      const g = ctx.createLinearGradient(-8, -8, 8, 8);
      g.addColorStop(0, GOLD_SOFT);
      g.addColorStop(1, GOLD);
      ctx.fillStyle = g;
      ctx.fillRect(-7, -7, 14, 14);
      ctx.restore();
      ctx.fillStyle = "rgba(228,168,75,0.18)";
      ctx.beginPath();
      ctx.arc(p.x, y, 16, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === "ember") {
      ctx.fillStyle = SEAL;
      ctx.beginPath();
      ctx.ellipse(p.x, y + 2, 6, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = GOLD_SOFT;
      ctx.beginPath();
      ctx.ellipse(p.x, y - 1, 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, y, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.x, y, 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawLantern() {
    const tilt = clamp(vx / MAX_VX, -1, 1) * 0.42;
    const flicker = 0.85 + Math.sin(clock * 11) * 0.08 + Math.sin(clock * 17) * 0.05;
    const alpha = phase === "dying" ? clamp(dyingT / 0.75, 0, 1) : invuln > 0 && Math.sin(clock * 28) > 0 ? 0.45 : 1;
    ctx.save();
    ctx.translate(px, PLAYER_Y);
    ctx.rotate(tilt);
    ctx.globalAlpha = alpha;
    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 54 + Math.min(combo, 8) * 2);
    glow.addColorStop(0, `rgba(228,168,75,${0.42 * flicker})`);
    glow.addColorStop(1, "rgba(228,168,75,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 56, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(243,236,225,0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -78);
    ctx.lineTo(0, -30);
    ctx.stroke();

    ctx.fillStyle = "#6b5332";
    roundRect(-8, -32, 16, 7, 2);
    ctx.fill();

    const body = ctx.createLinearGradient(0, -24, 0, 26);
    body.addColorStop(0, GOLD_SOFT);
    body.addColorStop(0.55, GOLD);
    body.addColorStop(1, "#c47a3a");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(124,44,36,0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-6, -16);
    ctx.lineTo(-6, 16);
    ctx.moveTo(6, -16);
    ctx.lineTo(6, 16);
    ctx.stroke();

    ctx.fillStyle = `rgba(255,236,200,${0.85 * flicker})`;
    ctx.beginPath();
    ctx.ellipse(0, 2, 4.5, 8 * flicker, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(201,75,58,${0.8 * flicker})`;
    ctx.beginPath();
    ctx.ellipse(0, 6, 2.2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#6b5332";
    ctx.fillRect(-7, 22, 14, 5);
    ctx.fillStyle = SEAL;
    ctx.beginPath();
    ctx.moveTo(0, 27);
    ctx.lineTo(3, 36);
    ctx.lineTo(-3, 36);
    ctx.fill();

    if (shield) {
      ctx.strokeStyle = GOLD_SOFT;
      ctx.globalAlpha = alpha * (0.7 + Math.sin(clock * 4) * 0.2);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 2, 30, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawParticles() {
    for (const p of particles) {
      if (!p.on) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawFloaters() {
    ctx.textAlign = "center";
    ctx.font = "600 15px Outfit, sans-serif";
    for (const f of floaters) {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawVignette() {
    const v = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.25, W / 2, H * 0.5, H * 0.72);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.38)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    if (lives === 1 && phase === "playing") {
      ctx.fillStyle = "rgba(201,75,58,0.1)";
      ctx.fillRect(0, 0, W, H);
    }
    if (flash > 0) {
      ctx.fillStyle = `rgba(243,236,225,${flash * 0.45})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function render() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bw = Math.max(1, Math.round(rect.width * dpr));
    const bh = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    const shake = shakeOn ? trauma * trauma : 0;
    const ox = shake * 7 * Math.sin(clock * 41);
    const oy = shake * 6 * Math.cos(clock * 37);
    const rot = shake * 0.02 * Math.sin(clock * 33);
    ctx.setTransform(bw / W, 0, 0, bh / H, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2 + ox, H / 2 + oy);
    ctx.rotate(rot);
    ctx.translate(-W / 2, -H / 2);
    drawSky();
    for (const h of hazards) {
      if (h.kind === "gate") drawGate(h);
      else if (h.kind === "fan") drawFan(h);
      else drawSpark(h);
    }
    for (const p of pickups) if (!p.taken) drawPickup(p);
    drawParticles();
    if (phase !== "over") drawLantern();
    drawFloaters();
    drawVignette();
    ctx.restore();
  }

  function frame(ts: number) {
    const real = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : STEP;
    lastTs = ts;
    clock += real;
    if (flash > 0) flash = Math.max(0, flash - real * 1.4);
    if (trauma > 0) trauma = Math.max(0, trauma - real * 1.5);

    if (phase === "playing" && hitstop > 0) {
      hitstop = Math.max(0, hitstop - real);
    } else if (phase === "playing") {
      acc += real;
      let steps = 0;
      while (acc >= STEP && steps < 5) {
        stepPlay();
        acc -= STEP;
        steps += 1;
      }
      if (acc > STEP) acc = 0;
    } else if (phase === "menu") {
      stepMenu(real);
    } else if (phase === "dying") {
      stepDying(real);
    }

    hudAcc += real;
    render();
    pushHud(false);
    raf = requestAnimationFrame(frame);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.code === "Space" || e.code.startsWith("Arrow") || e.code === "Escape") e.preventDefault();
    keys.add(e.code);
    if (e.code === "KeyA" || e.code === "KeyD" || e.code === "ArrowLeft" || e.code === "ArrowRight") {
      audio.unlock();
    }
    if (e.repeat) return;
    if ((e.code === "Enter" || e.code === "Space") && (phase === "menu" || phase === "over")) {
      audio.unlock();
      beginRun();
    } else if (e.code === "Escape") {
      if (phase === "playing") pause();
      else if (phase === "paused") resume();
    } else if (e.code === "KeyP") {
      if (phase === "playing") pause();
      else if (phase === "paused") resume();
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    keys.delete(e.code);
  }

  function clearHeld() {
    keys.clear();
    pointerId = null;
    pointerX = null;
  }

  function gamePoint(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0) return null;
    return ((e.clientX - rect.left) / rect.width) * W;
  }

  function onPointerDown(e: PointerEvent) {
    if (phase !== "playing") return;
    pointerId = e.pointerId;
    pointerType = e.pointerType;
    pointerX = gamePoint(e);
    canvas.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (phase !== "playing") return;
    if (e.pointerType === "touch" && e.pointerId !== pointerId) return;
    if (e.pointerType === "mouse" && e.buttons === 0 && pointerId == null) {
      pointerX = gamePoint(e);
      pointerType = "mouse";
      return;
    }
    if (e.pointerId === pointerId || e.pointerType === "mouse") {
      pointerX = gamePoint(e);
      pointerType = e.pointerType;
    }
  }

  function onPointerUp(e: PointerEvent) {
    if (e.pointerId !== pointerId && pointerType !== "mouse") return;
    if (e.pointerType === "touch") {
      pointerId = null;
      pointerX = null;
    }
  }

  function onPointerLeave(e: PointerEvent) {
    if (e.pointerType === "mouse" && pointerId == null) pointerX = null;
  }

  function onVis() {
    audio.resume();
    if (document.hidden && phase === "playing") pause();
  }

  function pause() {
    if (phase !== "playing") return;
    phase = "paused";
    pointerX = null;
    pointerId = null;
    pushHud(true);
  }

  function resume() {
    if (phase !== "paused") return;
    audio.unlock();
    phase = "playing";
    lastTs = 0;
    pushHud(true);
  }

  function start() {
    if (phase === "playing" || phase === "dying") return;
    if (phase === "paused") {
      resume();
      return;
    }
    beginRun();
  }

  function restart() {
    beginRun();
  }

  function toMenu() {
    audio.stopPad();
    if ((phase === "over" || phase === "paused" || phase === "dying") && scoreNow() > 0) {
      commitBest();
    }
    phase = "menu";
    clearWorld();
    lives = 3;
    shield = false;
    vx = 0;
    pushHud(true);
  }

  function toggleMute() {
    audio.unlock();
    save.muted = !save.muted;
    audio.setMuted(save.muted);
    persist();
    pushHud(true);
  }

  function toggleShake() {
    shakeOn = !shakeOn;
    save.shake = shakeOn;
    if (!shakeOn) trauma = 0;
    persist();
    pushHud(true);
  }

  const probe: ControlsProbe = {
    getX: () => px,
    getYaw: () => 0,
    getSpeed: () => vx,
    setKeys: (codes: string[]) => {
      injected.clear();
      for (const code of codes) injected.add(code);
    },
    getPhase: () => phase,
  };
  if (import.meta.env.DEV) window.__controlsTest = probe;

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", clearHeld);
  document.addEventListener("visibilitychange", onVis);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  pushHud(true);
  raf = requestAnimationFrame(frame);

  return {
    start,
    pause,
    resume,
    restart,
    toMenu,
    toggleMute,
    toggleShake,
    destroy() {
      cancelAnimationFrame(raf);
      audio.stopPad();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearHeld);
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      if (window.__controlsTest === probe) delete window.__controlsTest;
    },
  };
}
