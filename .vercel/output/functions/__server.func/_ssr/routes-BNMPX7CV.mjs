import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as Play, d as Flame, f as ChevronRight, i as VibrateOff, l as Pause, n as Volume2, o as Spline, p as ChevronLeft, r as Vibrate, s as Sparkles, t as VolumeX, u as MoveHorizontal } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BNMPX7CV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SCALE = [
	392,
	440,
	493.88,
	523.25,
	587.33,
	659.25,
	783.99
];
var AudioBus = class {
	ctx = null;
	master = null;
	music = null;
	sfx = null;
	pad = null;
	noise = null;
	muted = false;
	unlock() {
		const Ctx = window.AudioContext || window.webkitAudioContext;
		if (!Ctx) return;
		if (!this.ctx) {
			const ctx = new Ctx({ latencyHint: "interactive" });
			const master = ctx.createGain();
			const music = ctx.createGain();
			const sfx = ctx.createGain();
			music.gain.value = .45;
			sfx.gain.value = .9;
			master.gain.value = this.muted ? 0 : .85;
			music.connect(master);
			sfx.connect(master);
			master.connect(ctx.destination);
			this.ctx = ctx;
			this.master = master;
			this.music = music;
			this.sfx = sfx;
			const len = Math.floor(ctx.sampleRate * .25);
			const buf = ctx.createBuffer(1, len, ctx.sampleRate);
			const data = buf.getChannelData(0);
			for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
			this.noise = buf;
		}
		if (this.ctx.state === "suspended") this.ctx.resume();
	}
	resume() {
		if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
	}
	setMuted(muted) {
		this.muted = muted;
		if (!this.ctx || !this.master) return;
		this.master.gain.setTargetAtTime(muted ? 0 : .85, this.ctx.currentTime, .03);
	}
	startPad() {
		this.unlock();
		if (!this.ctx || !this.music || this.pad) return;
		const now = this.ctx.currentTime;
		const gain = this.ctx.createGain();
		gain.gain.setValueAtTime(1e-4, now);
		gain.gain.exponentialRampToValueAtTime(.045, now + .6);
		gain.connect(this.music);
		const osc = [
			130.81,
			196,
			261.63
		].map((freq, i) => {
			const o = this.ctx.createOscillator();
			o.type = i === 2 ? "triangle" : "sine";
			o.frequency.value = freq;
			o.detune.value = (i - 1) * 6;
			o.connect(gain);
			o.start();
			return o;
		});
		this.pad = {
			osc,
			gain
		};
	}
	stopPad() {
		if (!this.ctx || !this.pad) return;
		const { osc, gain } = this.pad;
		const now = this.ctx.currentTime;
		gain.gain.cancelScheduledValues(now);
		gain.gain.setTargetAtTime(1e-4, now, .08);
		this.pad;
		this.pad = null;
		window.setTimeout(() => {
			osc.forEach((o) => {
				try {
					o.stop();
					o.disconnect();
				} catch {}
			});
			gain.disconnect();
		}, 400);
	}
	playWish(combo) {
		const freq = SCALE[Math.abs(combo) % SCALE.length];
		this.tone(freq, .16, "triangle", .07);
		this.tone(freq * 2, .1, "sine", .025, .02);
	}
	playNear() {
		this.tone(740, .09, "sine", .035);
	}
	playGrace() {
		this.tone(880, .12, "triangle", .05);
		this.tone(1174, .14, "sine", .03, .04);
	}
	playHit() {
		this.burst(.12, .22);
		this.tone(110, .22, "sine", .1);
		this.duck();
	}
	playShield() {
		this.tone(520, .12, "triangle", .05);
		this.burst(.06, .08);
	}
	playCharm() {
		this.tone(523, .14, "sine", .045);
		this.tone(784, .18, "triangle", .04, .06);
	}
	playLife() {
		this.tone(523, .1, "triangle", .05);
		this.tone(659, .12, "triangle", .045, .07);
		this.tone(784, .16, "sine", .04, .14);
	}
	playOver() {
		this.tone(392, .22, "sine", .06);
		this.tone(311, .26, "triangle", .05, .16);
		this.tone(196, .4, "sine", .05, .32);
	}
	duck() {
		if (!this.ctx || !this.music) return;
		const now = this.ctx.currentTime;
		this.music.gain.setTargetAtTime(.12, now, .01);
		this.music.gain.setTargetAtTime(.45, now + .25, .12);
	}
	tone(freq, dur, type, gainValue, delay = 0) {
		if (!this.ctx || !this.sfx || this.muted) return;
		const t = this.ctx.currentTime + delay;
		const o = this.ctx.createOscillator();
		const g = this.ctx.createGain();
		o.type = type;
		o.frequency.setValueAtTime(freq * (1 + (Math.random() - .5) * .015), t);
		g.gain.setValueAtTime(1e-4, t);
		g.gain.exponentialRampToValueAtTime(Math.max(2e-4, gainValue), t + .012);
		g.gain.exponentialRampToValueAtTime(1e-4, t + dur);
		o.connect(g);
		g.connect(this.sfx);
		o.start(t);
		o.stop(t + dur + .03);
		o.onended = () => {
			o.disconnect();
			g.disconnect();
		};
	}
	burst(dur, gainValue) {
		if (!this.ctx || !this.sfx || !this.noise || this.muted) return;
		const t = this.ctx.currentTime;
		const src = this.ctx.createBufferSource();
		src.buffer = this.noise;
		const filter = this.ctx.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.setValueAtTime(900, t);
		const g = this.ctx.createGain();
		g.gain.setValueAtTime(1e-4, t);
		g.gain.exponentialRampToValueAtTime(gainValue, t + .01);
		g.gain.exponentialRampToValueAtTime(1e-4, t + dur);
		src.connect(filter);
		filter.connect(g);
		g.connect(this.sfx);
		src.start(t);
		src.stop(t + dur + .02);
		src.onended = () => {
			src.disconnect();
			filter.disconnect();
			g.disconnect();
		};
	}
};
var KEY = "hikari-save-v1";
var empty = {
	version: 1,
	bestScore: 0,
	bestHeight: 0,
	muted: false,
	shake: null
};
function loadSave() {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return { ...empty };
		const parsed = JSON.parse(raw);
		if (parsed.version !== 1) return { ...empty };
		return {
			version: 1,
			bestScore: typeof parsed.bestScore === "number" ? parsed.bestScore : 0,
			bestHeight: typeof parsed.bestHeight === "number" ? parsed.bestHeight : 0,
			muted: parsed.muted === true,
			shake: typeof parsed.shake === "boolean" ? parsed.shake : null
		};
	} catch {
		return { ...empty };
	}
}
function writeSave(data) {
	try {
		localStorage.setItem(KEY, JSON.stringify(data));
	} catch {}
}
var W = 420;
var H = 760;
var PLAYER_Y = H * .7;
var HIT_R = 13;
var MAX_VX = 430;
var ACCEL = 2600;
var STEP = 1 / 60;
var INK = "#141820";
var INK_DEEP = "#0e121a";
var INK_RIDGE = "#1a2030";
var INK_RIDGE_FAR = "#151a28";
var PAPER = "#f3ece1";
var MIST = "#9aa1b2";
var GOLD = "#e4a84b";
var GOLD_SOFT = "#f3d7a4";
var SEAL = "#c94b3a";
var SEAL_DEEP = "#7c2c24";
function clamp(v, lo, hi) {
	return v < lo ? lo : v > hi ? hi : v;
}
function reachable(interval) {
	const tAccel = MAX_VX / ACCEL;
	const decel = Math.min(interval, tAccel);
	const after = Math.max(0, interval - decel);
	const accelT = Math.min(after, tAccel);
	const coastT = Math.max(0, after - tAccel);
	const away = MAX_VX * decel / 2;
	const toward = .5 * ACCEL * accelT * accelT + MAX_VX * coastT;
	return Math.max(72, toward - away - 44);
}
function smooth(t) {
	const x = clamp(t, 0, 1);
	return x * x * (3 - 2 * x);
}
function yOverlap(prevY, y, half, py, pr) {
	const top = Math.min(prevY, y) - half;
	const bot = Math.max(prevY, y) + half;
	return py + pr >= top && py - pr <= bot;
}
function createGame(canvas, onHud) {
	const ctxOrNull = canvas.getContext("2d");
	if (!ctxOrNull) throw new Error("Canvas unavailable");
	const ctx = ctxOrNull;
	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const save = loadSave();
	const audio = new AudioBus();
	audio.muted = save.muted;
	const keys = /* @__PURE__ */ new Set();
	const injected = /* @__PURE__ */ new Set();
	let pointerId = null;
	let pointerX = null;
	let pointerType = "";
	let phase = "menu";
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
	let lastPhase = "menu";
	let emberAcc = 0;
	let acc = 0;
	let lastTs = 0;
	let raf = 0;
	let shakeOn = save.shake ?? !reduced;
	const hazards = [];
	const pickups = [];
	const floaters = [];
	const particles = Array.from({ length: 180 }, () => ({
		on: false,
		world: false,
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		life: 0,
		max: 1,
		size: 1,
		color: GOLD
	}));
	const stars = Array.from({ length: 42 }, () => ({
		x: Math.random() * W,
		y: Math.random() * H,
		s: Math.random() * 1.3 + .3,
		a: Math.random() * .45 + .15,
		tw: Math.random() * Math.PI * 2
	}));
	const clouds = [
		{
			x: 30,
			y: 180,
			w: 150,
			h: 28,
			s: .05
		},
		{
			x: 240,
			y: 260,
			w: 180,
			h: 34,
			s: .07
		},
		{
			x: 120,
			y: 420,
			w: 130,
			h: 22,
			s: .04
		},
		{
			x: 300,
			y: 540,
			w: 160,
			h: 26,
			s: .06
		}
	];
	function scoreNow() {
		return Math.floor(distance / 12 + bonus);
	}
	function heightNow() {
		return Math.floor(distance / 46);
	}
	function snapshot() {
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
			hint: phase === "playing" && !hinted
		};
	}
	function pushHud(force = false) {
		if (!force && phase === lastPhase && hudAcc < .1) return;
		hudAcc = 0;
		lastPhase = phase;
		onHud(snapshot());
	}
	function persist() {
		writeSave(save);
	}
	function emit(x, y, n, color, spread, world, up = 0) {
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
			p.vy = Math.sin(a) * s * .6 - up;
			p.life = p.max = .35 + Math.random() * .45;
			p.size = 1.2 + Math.random() * 2.2;
			p.color = color;
			left -= 1;
		}
	}
	function popText(text, x, y, color) {
		if (floaters.length > 10) floaters.shift();
		floaters.push({
			text,
			x,
			y,
			life: .85,
			color
		});
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
		invuln = .7;
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
		for (let i = 0; i < 4; i++) pickups.push({
			kind: "wish",
			x: W / 2 + Math.sin(i * 1.3) * 36,
			y: 352 - i * 100,
			r: 11,
			taken: false
		});
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
			invuln = .45;
			trauma = Math.min(1, trauma + (shakeOn ? .35 : 0));
			flash = .18;
			audio.playShield();
			emit(px, PLAYER_Y, 14, GOLD_SOFT, 90, false, 20);
			popText("Ward", px, 492, GOLD_SOFT);
			return;
		}
		lives -= 1;
		invuln = 1.2;
		combo = 0;
		comboLeft = 0;
		hitstop = lives <= 0 ? .05 : .07;
		trauma = Math.min(1, trauma + (shakeOn ? .72 : 0));
		flash = .4;
		audio.playHit();
		emit(px, PLAYER_Y, 22, SEAL, 140, false, 10);
		emit(px, PLAYER_Y, 10, PAPER, 80, true, 0);
		if (lives <= 0) {
			phase = "dying";
			dyingT = .75;
			audio.stopPad();
			emit(px, PLAYER_Y, 28, GOLD, 160, false, 30);
		}
		pushHud(true);
	}
	function grant(points, label, color, sound) {
		const pts = points * (1 + Math.min(7, combo));
		bonus += pts;
		combo = Math.min(99, combo + 1);
		comboLeft = 2.55;
		popText(label === "+" ? `+${pts}` : label, px, 486, color);
		if (sound === "wish") audio.playWish(combo);
		else if (sound === "grace") audio.playGrace();
		else audio.playNear();
	}
	function collect(p) {
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
	function spawnPickup(x, y) {
		if (pickups.length > 7) return;
		const roll = Math.random();
		let kind = "wish";
		if (roll > .92 && !shield) kind = "charm";
		else if (roll > .82 && lives < 3) kind = "ember";
		pickups.push({
			kind,
			x,
			y,
			r: 11,
			taken: false
		});
	}
	function spawnObstacle() {
		const t = smooth(distance / 15e3);
		const interval = 1.3 - t * .52;
		const gapW = 200 - t * 82;
		const reach = reachable(interval);
		const roll = Math.random();
		let kind = "silk";
		if (t > .2 && roll > .55) kind = "wire";
		if (t > .36 && roll > .74) kind = "fan";
		if (t > .58 && roll > .88) kind = "spark";
		if (kind === "fan") {
			const left = 74;
			const right = 346;
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
					hurt: false
				});
				safeX = prefer;
				if (Math.random() < .7) spawnPickup(prefer, -150);
				nextSpawn = distance + speed * interval;
				return;
			}
			kind = "silk";
		}
		if (kind === "spark") {
			const cx = clamp(safeX + (safeX > W / 2 ? -1 : 1) * Math.min(reach * .85, 160), 100, 320);
			const escape = clamp(cx > W / 2 ? 68 : 352, 68, 352);
			if (Math.abs(escape - safeX) <= reach) {
				hazards.push({
					kind: "spark",
					y: -30,
					x: cx,
					r: 26,
					arm: .58,
					scored: false,
					hurt: false
				});
				safeX = escape;
				if (Math.random() < .65) spawnPickup(escape, -150);
				nextSpawn = distance + speed * interval;
				return;
			}
			kind = "wire";
		}
		let gapX = safeX + (Math.random() * 2 - 1) * reach * .92;
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
			hurt: false
		});
		safeX = gapX;
		if (Math.random() < .84) spawnPickup(gapX, -36);
		nextSpawn = distance + speed * (kind === "wire" ? interval * .92 : interval);
	}
	function steer() {
		const down = (code) => keys.has(code) || injected.has(code);
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
			const desired = clamp((pointerX - px) * 7.2, -430, MAX_VX);
			vx += (desired - vx) * (1 - Math.exp(-14 * STEP));
			return;
		}
		vx *= Math.exp(-7 * STEP);
	}
	function movePlayer() {
		vx = clamp(vx, -430, MAX_VX);
		px += vx * STEP;
		px = clamp(px, 26, 394);
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
			} else if (h.kind === "fan" || h.kind === "spark" && h.arm <= 0) {
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
		for (let i = hazards.length - 1; i >= 0; i--) if (hazards[i].y > 900) hazards.splice(i, 1);
	}
	function updatePickups() {
		const dy = speed * STEP;
		for (const p of pickups) {
			if (p.taken) continue;
			const prev = p.y;
			p.y += dy;
			const r = p.r + HIT_R + 6;
			if (!yOverlap(prev, p.y, p.r, PLAYER_Y, 19)) continue;
			const dx = p.x - px;
			const cy = clamp(PLAYER_Y, Math.min(prev, p.y), Math.max(prev, p.y));
			if (dx * dx + (cy - PLAYER_Y) * (cy - PLAYER_Y) <= r * r) collect(p);
		}
		for (let i = pickups.length - 1; i >= 0; i--) {
			const p = pickups[i];
			if (p.taken || p.y > 800) pickups.splice(i, 1);
		}
	}
	function updateParticles(dt, worldSpeed) {
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
		speed = 156 + smooth(distance / 15e3) * 250;
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
			emit(px + (Math.random() - .5) * 8, 524, 1, GOLD, 16, false, 50 + Math.random() * 40);
		}
		if (!reduced && Math.random() < STEP * 5) emit(Math.random() * W, -8, 1, PAPER, 8, true, 0);
		updateParticles(STEP, speed);
		for (const f of floaters) {
			f.life -= STEP;
			f.y -= 26 * STEP;
		}
		for (let i = floaters.length - 1; i >= 0; i--) if (floaters[i].life <= 0) floaters.splice(i, 1);
	}
	function stepMenu(dt) {
		clock += dt;
		distance += 28 * dt;
		px = W / 2 + Math.sin(clock * .7) * 22;
		vx = Math.cos(clock * .7) * 16;
		emberAcc += dt;
		while (emberAcc > .08) {
			emberAcc -= .08;
			emit(px, 526, 1, GOLD, 12, false, 36);
		}
		updateParticles(dt, 28);
	}
	function stepDying(dt) {
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
	function roundRect(x, y, w, h, r) {
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
		g.addColorStop(.45, INK);
		g.addColorStop(1, INK_DEEP);
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, W, H);
		for (const s of stars) {
			const tw = .65 + Math.sin(clock * 1.4 + s.tw) * .35;
			ctx.globalAlpha = s.a * tw;
			ctx.fillStyle = PAPER;
			ctx.fillRect(s.x, s.y, s.s, s.s);
		}
		ctx.globalAlpha = 1;
		const moonX = W * .73;
		const moonY = 128 + Math.sin(clock * .15) * 4;
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
		ctx.arc(294.59999999999997, moonY - 8, 10, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(320.59999999999997, moonY + 10, 6, 0, Math.PI * 2);
		ctx.fill();
		drawRidge(.12, 470, 36, INK_RIDGE_FAR, 1.4);
		for (const c of clouds) {
			const x = (c.x - distance * c.s) % (W + c.w) + c.w;
			ctx.fillStyle = "rgba(243,236,225,0.045)";
			ctx.beginPath();
			ctx.ellipse((x % 600 + W + 180) % 600 - 40, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
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
	function drawRidge(seed, base, amp, color, factor) {
		const shift = distance * factor * .15;
		ctx.beginPath();
		ctx.moveTo(0, H);
		for (let x = 0; x <= W; x += 10) {
			const n = Math.sin((x + shift) * .018 + seed) * amp + Math.sin((x + shift) * .007 + seed * 2) * amp * .45;
			ctx.lineTo(x, base + n);
		}
		ctx.lineTo(W, H);
		ctx.closePath();
		ctx.fillStyle = color;
		ctx.fill();
	}
	function drawGate(g) {
		const leftW = g.gapX - g.gapW / 2;
		const rightX = g.gapX + g.gapW / 2;
		const y = g.y - g.thick / 2;
		const flutter = reduced ? 0 : Math.sin(clock * 2.2 + g.gapX) * 1.5;
		if (g.silk) {
			drawSilk(0, y + flutter, leftW, g.thick, "left");
			drawSilk(rightX, y - flutter, W - rightX, g.thick, "right");
		} else drawWire(g.y, leftW, rightX);
	}
	function drawSilk(x, y, w, h, side) {
		if (w < 4 || h < 4) return;
		const grad = ctx.createLinearGradient(x, y, x, y + h);
		grad.addColorStop(0, "#d15a48");
		grad.addColorStop(.5, SEAL);
		grad.addColorStop(1, SEAL_DEEP);
		ctx.fillStyle = grad;
		ctx.fillRect(x, y, w, h);
		ctx.fillStyle = GOLD;
		const hem = side === "left" ? x + w - 3 : x;
		ctx.fillRect(hem, y, 3, h);
		ctx.globalAlpha = .28;
		ctx.strokeStyle = GOLD_SOFT;
		ctx.lineWidth = 1;
		ctx.beginPath();
		for (let i = 0; i < 3; i++) {
			const yy = y + 16 + i * (h / 4);
			ctx.moveTo(x + 8, yy);
			ctx.bezierCurveTo(x + w * .4, yy - 6, x + w * .6, yy + 6, x + w - 8, yy);
		}
		ctx.stroke();
		ctx.globalAlpha = 1;
		const cx = side === "left" ? x + w * .62 : x + w * .38;
		const cy = y + h * .48;
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
	function drawWire(y, leftW, rightX) {
		ctx.strokeStyle = PAPER;
		ctx.lineWidth = 2.5;
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(leftW, y);
		ctx.moveTo(rightX, y);
		ctx.lineTo(W, y);
		ctx.stroke();
		ctx.fillStyle = GOLD;
		for (const x of [
			leftW * .35,
			leftW * .7,
			rightX + (W - rightX) * .3,
			rightX + (W - rightX) * .7
		]) {
			if (x < 8 || x > 412) continue;
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
	function drawFan(f) {
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
		grad.addColorStop(.5, SEAL);
		grad.addColorStop(1, "#e07a68");
		ctx.fillStyle = grad;
		ctx.beginPath();
		ctx.ellipse(0, 0, f.r, f.r * .86, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = GOLD;
		ctx.lineWidth = 1.25;
		ctx.beginPath();
		for (let i = -2; i <= 2; i++) {
			ctx.moveTo(0, 6);
			ctx.lineTo(Math.sin(i * .45) * (f.r - 4), -f.r * .7);
		}
		ctx.stroke();
		ctx.restore();
	}
	function drawSpark(s) {
		const arming = s.arm > 0;
		const alpha = arming ? .35 + (1 - s.arm / .58) * .4 : 1;
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
		const spokes = arming ? s.r + 6 : s.r * .55;
		for (let i = 0; i < 6; i++) {
			const a = clock * 2 + i * Math.PI / 3;
			ctx.moveTo(s.x, s.y);
			ctx.lineTo(s.x + Math.cos(a) * spokes, s.y + Math.sin(a) * spokes);
		}
		ctx.stroke();
		ctx.restore();
	}
	function drawPickup(p) {
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
		const tilt = clamp(vx / MAX_VX, -1, 1) * .42;
		const flicker = .85 + Math.sin(clock * 11) * .08 + Math.sin(clock * 17) * .05;
		const alpha = phase === "dying" ? clamp(dyingT / .75, 0, 1) : invuln > 0 && Math.sin(clock * 28) > 0 ? .45 : 1;
		ctx.save();
		ctx.translate(px, PLAYER_Y);
		ctx.rotate(tilt);
		ctx.globalAlpha = alpha;
		const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 54 + Math.min(combo, 8) * 2);
		glow.addColorStop(0, `rgba(228,168,75,${.42 * flicker})`);
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
		body.addColorStop(.55, GOLD);
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
		ctx.fillStyle = `rgba(255,236,200,${.85 * flicker})`;
		ctx.beginPath();
		ctx.ellipse(0, 2, 4.5, 8 * flicker, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = `rgba(201,75,58,${.8 * flicker})`;
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
			ctx.globalAlpha = alpha * (.7 + Math.sin(clock * 4) * .2);
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
		const v = ctx.createRadialGradient(W / 2, H * .55, H * .25, W / 2, H * .5, H * .72);
		v.addColorStop(0, "rgba(0,0,0,0)");
		v.addColorStop(1, "rgba(0,0,0,0.38)");
		ctx.fillStyle = v;
		ctx.fillRect(0, 0, W, H);
		if (lives === 1 && phase === "playing") {
			ctx.fillStyle = "rgba(201,75,58,0.1)";
			ctx.fillRect(0, 0, W, H);
		}
		if (flash > 0) {
			ctx.fillStyle = `rgba(243,236,225,${flash * .45})`;
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
		const rot = shake * .02 * Math.sin(clock * 33);
		ctx.setTransform(bw / W, 0, 0, bh / H, 0, 0);
		ctx.clearRect(0, 0, W, H);
		ctx.save();
		ctx.translate(W / 2 + ox, H / 2 + oy);
		ctx.rotate(rot);
		ctx.translate(-210, -380);
		drawSky();
		for (const h of hazards) if (h.kind === "gate") drawGate(h);
		else if (h.kind === "fan") drawFan(h);
		else drawSpark(h);
		for (const p of pickups) if (!p.taken) drawPickup(p);
		drawParticles();
		if (phase !== "over") drawLantern();
		drawFloaters();
		drawVignette();
		ctx.restore();
	}
	function frame(ts) {
		const real = lastTs ? Math.min(.05, (ts - lastTs) / 1e3) : STEP;
		lastTs = ts;
		clock += real;
		if (flash > 0) flash = Math.max(0, flash - real * 1.4);
		if (trauma > 0) trauma = Math.max(0, trauma - real * 1.5);
		if (phase === "playing" && hitstop > 0) hitstop = Math.max(0, hitstop - real);
		else if (phase === "playing") {
			acc += real;
			let steps = 0;
			while (acc >= STEP && steps < 5) {
				stepPlay();
				acc -= STEP;
				steps += 1;
			}
			if (acc > STEP) acc = 0;
		} else if (phase === "menu") stepMenu(real);
		else if (phase === "dying") stepDying(real);
		hudAcc += real;
		render();
		pushHud(false);
		raf = requestAnimationFrame(frame);
	}
	function onKeyDown(e) {
		if (e.code === "Space" || e.code.startsWith("Arrow") || e.code === "Escape") e.preventDefault();
		keys.add(e.code);
		if (e.code === "KeyA" || e.code === "KeyD" || e.code === "ArrowLeft" || e.code === "ArrowRight") audio.unlock();
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
	function onKeyUp(e) {
		keys.delete(e.code);
	}
	function clearHeld() {
		keys.clear();
		pointerId = null;
		pointerX = null;
	}
	function gamePoint(e) {
		const rect = canvas.getBoundingClientRect();
		if (rect.width <= 0) return null;
		return (e.clientX - rect.left) / rect.width * W;
	}
	function onPointerDown(e) {
		if (phase !== "playing") return;
		pointerId = e.pointerId;
		pointerType = e.pointerType;
		pointerX = gamePoint(e);
		canvas.setPointerCapture(e.pointerId);
	}
	function onPointerMove(e) {
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
	function onPointerUp(e) {
		if (e.pointerId !== pointerId && pointerType !== "mouse") return;
		if (e.pointerType === "touch") {
			pointerId = null;
			pointerX = null;
		}
	}
	function onPointerLeave(e) {
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
		if ((phase === "over" || phase === "paused" || phase === "dying") && scoreNow() > 0) commitBest();
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
	const probe = {
		getX: () => px,
		getYaw: () => 0,
		getSpeed: () => vx,
		setKeys: (codes) => {
			injected.clear();
			for (const code of codes) injected.add(code);
		},
		getPhase: () => phase
	};
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
		}
	};
}
var initialHud = {
	phase: "menu",
	score: 0,
	height: 0,
	wishes: 0,
	lives: 3,
	combo: 0,
	shield: false,
	bestScore: 0,
	bestHeight: 0,
	muted: false,
	shake: true,
	newBest: false,
	hint: false
};
function fmt(n) {
	return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function HikariApp() {
	const canvasRef = (0, import_react.useRef)(null);
	const gameRef = (0, import_react.useRef)(null);
	const [hud, setHud] = (0, import_react.useState)(initialHud);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const game = createGame(canvas, setHud);
		gameRef.current = game;
		return () => {
			game.destroy();
			gameRef.current = null;
		};
	}, []);
	const bestLine = hud.bestScore > 0 ? `Best ${fmt(hud.bestScore)} · ${fmt(hud.bestHeight)} m` : "No ascent yet";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex h-dvh items-center justify-center overflow-hidden bg-ink text-paper",
		children: [hud.phase !== "menu" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "sr-only",
			children: "Hikari"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "stage-frame relative overflow-hidden bg-ink touch-none",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
					ref: canvasRef,
					className: "absolute inset-0 h-full w-full",
					"aria-hidden": "true"
				}),
				hud.phase === "menu" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-0 flex flex-col",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium tracking-widest text-mist uppercase",
							children: "A lantern ascent"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggles, {
							hud,
							gameRef
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "scrim-bottom mt-auto flex flex-col gap-4 px-5 pt-16 pb-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rise-in",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "title-fit font-display text-paper italic",
									children: "Hikari"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 max-w-sm text-sm leading-relaxed text-pretty text-paper-dim",
									children: "Steer a paper lantern through silk, wire, and falling sparks. Thread the gaps. Keep the flame."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "compact-hide flex flex-col gap-2 text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoveHorizontal, {
											className: "size-5 shrink-0 text-gold",
											"aria-hidden": "true"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "A and D, arrows, or a finger" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spline, {
											className: "size-5 shrink-0 text-gold",
											"aria-hidden": "true"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Thread close for a higher call" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
											className: "size-5 shrink-0 text-gold",
											"aria-hidden": "true"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Wishes build the combo" })]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-12 rounded-full bg-seal text-base font-semibold text-paper",
								onClick: () => gameRef.current?.start(),
								children: "Start ascent"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-center text-xs text-mist tabular-nums",
								children: bestLine
							})
						]
					})]
				}),
				(hud.phase === "playing" || hud.phase === "dying") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "scrim-top pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-display text-4xl leading-none text-paper tabular-nums",
								children: [fmt(hud.height), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-1 font-sans text-sm font-medium text-mist",
									children: "m"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex items-center gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "flex gap-1",
										"aria-label": `${hud.lives} flames`,
										children: [
											0,
											1,
											2
										].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, {
											className: i < hud.lives ? "size-5 fill-gold text-gold" : "size-5 text-mist",
											"aria-hidden": "true"
										}, i))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "inline-flex items-center gap-1 text-sm text-gold-soft tabular-nums",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
											className: "size-4",
											"aria-hidden": "true"
										}), hud.wishes]
									}),
									hud.shield && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs font-medium tracking-wide text-gold uppercase",
										children: "Ward"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-mist tabular-nums",
								children: fmt(hud.score)
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "pointer-events-auto grid size-11 place-items-center rounded-full border border-paper-dim bg-ink-soft text-paper",
							"aria-label": "Pause",
							onClick: () => gameRef.current?.pause(),
							disabled: hud.phase !== "playing",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {
								className: "size-5",
								"aria-hidden": "true"
							})
						})]
					}),
					hud.combo >= 2 && hud.phase === "playing" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 font-display text-2xl text-gold tabular-nums",
						children: ["×", hud.combo]
					}),
					hud.hint && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-none absolute inset-x-0 bottom-5 flex items-center justify-between px-3 text-mist",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
								className: "size-6",
								"aria-hidden": "true"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs tracking-wide",
								children: "Drag, or hold A and D"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
								className: "size-6",
								"aria-hidden": "true"
							})
						]
					})
				] }),
				hud.phase === "paused" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 grid place-items-center bg-ink/70 p-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rise-in w-full max-w-xs rounded-card bg-paper p-6 text-ink",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-4xl italic leading-none",
								children: "Paused"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 text-sm leading-relaxed text-ink-soft",
								children: [
									"The lantern waits. ",
									fmt(hud.height),
									" m · ",
									fmt(hud.score)
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 flex flex-col gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-seal text-base font-semibold text-paper",
									onClick: () => gameRef.current?.resume(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
										className: "size-4",
										"aria-hidden": "true"
									}), "Resume"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "h-12 rounded-full border border-ink text-base font-medium text-ink",
									onClick: () => gameRef.current?.toMenu(),
									children: "Leave"
								})]
							})
						]
					})
				}),
				hud.phase === "over" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "scrim-bottom absolute inset-0 flex flex-col justify-end px-5 pt-16 pb-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rise-in",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "title-fit font-display text-paper italic",
								children: "The flame goes out"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm text-paper-dim",
								children: hud.newBest ? "A new best." : bestLine
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "mt-4 grid grid-cols-3 gap-2 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Height",
									value: `${fmt(hud.height)} m`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Wishes",
									value: fmt(hud.wishes)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Score",
									value: fmt(hud.score)
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 flex flex-col gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-12 rounded-full bg-seal text-base font-semibold text-paper",
								onClick: () => gameRef.current?.restart(),
								children: "Rise again"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-12 rounded-full border border-paper-dim text-base font-medium text-paper",
								onClick: () => gameRef.current?.toMenu(),
								children: "Menu"
							})]
						})
					]
				})
			]
		})]
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-ink-soft px-2 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-xs tracking-wide text-mist uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "mt-1 font-display text-xl text-paper tabular-nums",
			children: value
		})]
	});
}
function Toggles({ hud, gameRef }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "grid size-11 place-items-center rounded-full bg-ink-soft text-paper",
			"aria-label": hud.muted ? "Unmute" : "Mute",
			"aria-pressed": hud.muted,
			onClick: () => gameRef.current?.toggleMute(),
			children: hud.muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, {
				className: "size-5",
				"aria-hidden": "true"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, {
				className: "size-5",
				"aria-hidden": "true"
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "grid size-11 place-items-center rounded-full bg-ink-soft text-paper",
			"aria-label": hud.shake ? "Turn shake off" : "Turn shake on",
			"aria-pressed": hud.shake,
			onClick: () => gameRef.current?.toggleShake(),
			children: hud.shake ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Vibrate, {
				className: "size-5",
				"aria-hidden": "true"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VibrateOff, {
				className: "size-5",
				"aria-hidden": "true"
			})
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HikariApp, {});
}
//#endregion
export { Home as component };
