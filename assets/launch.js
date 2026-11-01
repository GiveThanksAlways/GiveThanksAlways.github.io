// Landing-page flight sim: a wireframe rocket on a pad you can launch, steer and (try to) land.
// Physics is a simple 2D point mass (thrust, gravity, altitude-scaled drag) drawn in 3D.
import * as THREE from "three";

// ---------- constants ----------
const ACCENT = 0xd9c55a, DIM = 0x6b6230, GRID = 0x1b1e23, BG = 0x0a0b0d;
const G = 9.81, DRY = 1000, FUEL = 900, THRUST = 40000, MDOT = 60, CDA = 1.2;
const TILT_RATE = 0.7, TILT_MAX = 1.4, THROTTLE_RATE = 0.8;
const REDUCED_MOTION = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- renderer / scene ----------
const canvas = document.getElementById("scene");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
} catch (err) {
  document.body.classList.add("no-webgl");
  throw err;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setClearColor(BG);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(BG, 300, 5000);
const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 60000);

const lineMat = new THREE.LineBasicMaterial({ color: ACCENT });
const dimMat = new THREE.LineBasicMaterial({ color: DIM });

const loop = (pts, mat = lineMat) =>
  new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), mat);
const circle = (r, seg = 64, y = 0) =>
  Array.from({ length: seg }, (_, i) => {
    const a = (i / seg) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
  });

// ---------- ground + pad ----------
scene.add(new THREE.GridHelper(8000, 160, DIM, GRID));
const fine = new THREE.GridHelper(200, 40, GRID, GRID);
fine.position.y = 0.02;
scene.add(fine);
scene.add(loop(circle(4), dimMat), loop(circle(7, 96), dimMat), loop(circle(12, 96), dimMat));

const tower = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.6, 16, 1.6)), dimMat);
tower.position.set(-4.2, 8, 0);
scene.add(tower);
for (let y = 2; y < 16; y += 2) {
  const brace = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-5, y - 2, 0.8), new THREE.Vector3(-3.4, y, 0.8),
    ]), dimMat);
  scene.add(brace);
}
const arm = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.6, 0.4, 0.6)), dimMat);
arm.position.set(-2.1, 10.5, 0);
scene.add(arm);

// ---------- rocket (lathe profile -> CAD-style edges) ----------
const rocket = new THREE.Group();
const profile = [
  [0.75, 0], [0.45, 0.9], [0.9, 1.1], [0.9, 5], [0.9, 9],
  [0.8, 10], [0.6, 11], [0.3, 11.8], [0, 12.3],
].map(([r, y]) => new THREE.Vector2(r, y));
rocket.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.LatheGeometry(profile, 12), 10), lineMat));
rocket.add(loop(circle(0.9, 12, 5)));
for (let k = 0; k < 4; k++) {
  const fin = loop([
    new THREE.Vector3(0.9, 3.6, 0), new THREE.Vector3(0.9, 1.2, 0),
    new THREE.Vector3(2.1, 0.6, 0), new THREE.Vector3(2.1, 1.6, 0),
  ]);
  fin.rotation.y = (k * Math.PI) / 2 + Math.PI / 4;
  rocket.add(fin);
}
scene.add(rocket);

// ---------- exhaust particles ----------
const N_EX = 900;
const exPos = new Float32Array(N_EX * 3).fill(0);
const exCol = new Float32Array(N_EX * 3).fill(0);
const exVel = new Float32Array(N_EX * 3);
const exLife = new Float32Array(N_EX);   // remaining life (s)
const exMax = new Float32Array(N_EX).fill(1);
const exGeom = new THREE.BufferGeometry();
exGeom.setAttribute("position", new THREE.BufferAttribute(exPos, 3));
exGeom.setAttribute("color", new THREE.BufferAttribute(exCol, 3));
// soft round sprite so particles read as glow, not squares
const spriteCanvas = Object.assign(document.createElement("canvas"), { width: 32, height: 32 });
const sctx = spriteCanvas.getContext("2d");
const grad = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
grad.addColorStop(0, "rgba(255,255,255,1)");
grad.addColorStop(0.35, "rgba(255,255,255,0.6)");
grad.addColorStop(1, "rgba(255,255,255,0)");
sctx.fillStyle = grad;
sctx.fillRect(0, 0, 32, 32);
const sprite = new THREE.CanvasTexture(spriteCanvas);

const exhaust = new THREE.Points(exGeom, new THREE.PointsMaterial({
  size: 1.6, map: sprite, vertexColors: true, transparent: true, depthWrite: false,
  blending: THREE.AdditiveBlending,
}));
exhaust.frustumCulled = false; // particles move far from their initial bounds
scene.add(exhaust);
let exNext = 0;
function emit(x, y, vx, vy, vz, life) {
  const i = exNext, j = i * 3;
  exNext = (exNext + 1) % N_EX;
  exPos[j] = x; exPos[j + 1] = y; exPos[j + 2] = (Math.random() - 0.5) * 0.6;
  exVel[j] = vx; exVel[j + 1] = vy; exVel[j + 2] = vz;
  exLife[i] = exMax[i] = life;
}
const accentRGB = new THREE.Color(ACCENT);
function stepExhaust(dt) {
  for (let i = 0; i < N_EX; i++) {
    const j = i * 3;
    if (exLife[i] <= 0) { exCol[j] = exCol[j + 1] = exCol[j + 2] = 0; continue; }
    exLife[i] -= dt;
    exVel[j + 1] -= G * 0.3 * dt;
    exPos[j] += exVel[j] * dt; exPos[j + 1] += exVel[j + 1] * dt; exPos[j + 2] += exVel[j + 2] * dt;
    if (exPos[j + 1] < 0.05) { // splash across the pad
      exPos[j + 1] = 0.05;
      const s = Math.abs(exVel[j + 1]) * 0.5;
      exVel[j + 1] *= -0.1;
      exVel[j] += (Math.random() - 0.5) * s; exVel[j + 2] += (Math.random() - 0.5) * s;
    }
    const f = Math.max(exLife[i] / exMax[i], 0);           // 1 = fresh, 0 = dead
    const hot = f * f;                                       // white-hot core fades to accent
    exCol[j] = (accentRGB.r + (1 - accentRGB.r) * hot) * f;
    exCol[j + 1] = (accentRGB.g + (1 - accentRGB.g) * hot) * f;
    exCol[j + 2] = (accentRGB.b + (1 - accentRGB.b) * hot) * f;
  }
  exGeom.attributes.position.needsUpdate = true;
  exGeom.attributes.color.needsUpdate = true;
}

// ---------- altitude dust (gives a sense of speed) ----------
const N_DUST = 2500, dust = new Float32Array(N_DUST * 3);
for (let i = 0; i < N_DUST; i++) {
  dust[i * 3] = (Math.random() - 0.5) * 500;
  dust[i * 3 + 1] = 30 + Math.random() * 6000;
  dust[i * 3 + 2] = (Math.random() - 0.5) * 500;
}
const dustGeom = new THREE.BufferGeometry();
dustGeom.setAttribute("position", new THREE.BufferAttribute(dust, 3));
scene.add(new THREE.Points(dustGeom, new THREE.PointsMaterial({ color: 0x4a4e57, size: 0.8 })));

// ---------- trajectory trail ----------
const TRAIL = 1500, trailPos = new Float32Array(TRAIL * 3);
const trailGeom = new THREE.BufferGeometry();
trailGeom.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
const trail = new THREE.Line(trailGeom, dimMat);
trail.frustumCulled = false;
scene.add(trail);
let trailN = 0, trailClock = 0;
function pushTrail(x, y) {
  if (trailN === TRAIL) { trailPos.copyWithin(0, 3); trailN--; }
  trailPos.set([x, y, 0], trailN * 3);
  trailN++;
  trailGeom.setDrawRange(0, trailN);
  trailGeom.attributes.position.needsUpdate = true;
}

// ---------- flight state ----------
const s = {};
function reset() {
  Object.assign(s, {
    phase: "pad", x: 0, y: 0, vx: 0, vy: 0, tilt: 0, throttle: 1, fuel: FUEL,
    engine: false, t: 0, apo: 0, phaseTimer: 0, touchdown: 0,
  });
  rocket.visible = true;
  trailN = 0; trailGeom.setDrawRange(0, 0);
  document.body.classList.remove("flying");
}
reset();

function launch() {
  if (s.phase !== "pad") return;
  s.phase = "flight"; s.engine = true;
  document.body.classList.add("flying");
}
function explode() {
  s.phase = "crashed"; s.phaseTimer = 0; rocket.visible = false;
  for (let k = 0; k < 300; k++) {
    const a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI * 0.5, v = 8 + Math.random() * 25;
    emit(s.x, 1, Math.cos(a) * Math.cos(e) * v, Math.sin(e) * v, Math.sin(a) * Math.cos(e) * v, 0.8 + Math.random() * 1.4);
  }
}

// ---------- input ----------
const keys = new Set();
let steerTouch = 0, mouseX = 0, mouseY = 0, dragX = null;
const GAME_KEYS = new Set([" ", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "d", "w", "s", "r"]);
addEventListener("keydown", (e) => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (!GAME_KEYS.has(k) || e.metaKey || e.ctrlKey || e.altKey) return;
  e.preventDefault();
  if (e.repeat) return;
  keys.add(k);
  if (k === " ") {
    if (s.phase === "pad") launch();
    else if (s.phase === "flight") s.engine = !s.engine;
    else reset();
  }
  if (k === "r") reset();
  if (s.phase === "flight") { // a single tap still nudges the tilt a little
    if (k === "ArrowLeft" || k === "a") s.tilt -= 0.04;
    if (k === "ArrowRight" || k === "d") s.tilt += 0.04;
  }
});
addEventListener("keyup", (e) => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
addEventListener("blur", () => keys.clear());
addEventListener("pointermove", (e) => {
  mouseX = (e.clientX / innerWidth) * 2 - 1;
  mouseY = (e.clientY / innerHeight) * 2 - 1;
  if (dragX !== null) steerTouch = Math.max(-1, Math.min(1, (e.clientX - dragX) / 80));
});
canvas.addEventListener("pointerdown", (e) => {
  if (s.phase === "pad") launch();
  else if (s.phase !== "flight") reset();
  if (e.pointerType !== "mouse") dragX = e.clientX;
});
addEventListener("pointerup", () => { dragX = null; steerTouch = 0; });

// ---------- physics ----------
let emitAcc = 0;
function step(dt) {
  const left = keys.has("ArrowLeft") || keys.has("a"), right = keys.has("ArrowRight") || keys.has("d");
  const steer = (right ? 1 : 0) - (left ? 1 : 0) + steerTouch;
  if (keys.has("ArrowUp") || keys.has("w")) s.throttle = Math.min(1, s.throttle + THROTTLE_RATE * dt);
  if (keys.has("ArrowDown") || keys.has("s")) s.throttle = Math.max(0, s.throttle - THROTTLE_RATE * dt);

  if (s.phase === "flight") {
    s.t += dt;
    s.tilt = Math.max(-TILT_MAX, Math.min(TILT_MAX, s.tilt + steer * TILT_RATE * dt));
    const burning = s.engine && s.fuel > 0 && s.throttle > 0;
    const thrust = burning ? THRUST * s.throttle : 0;
    if (burning) s.fuel = Math.max(0, s.fuel - MDOT * s.throttle * dt);
    const m = DRY + s.fuel;
    const rho = 1.225 * Math.exp(-s.y / 8500);
    const k = 0.5 * rho * Math.hypot(s.vx, s.vy) * CDA;
    s.vx += ((thrust * Math.sin(s.tilt) - k * s.vx) / m) * dt;
    s.vy += ((thrust * Math.cos(s.tilt) - k * s.vy) / m - G) * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.apo = Math.max(s.apo, s.y);

    if (s.y <= 0) {
      if (s.t < 0.5) { s.y = 0; s.vy = Math.max(0, s.vy); }
      else {
        s.touchdown = Math.hypot(s.vx, s.vy);
        s.y = 0;
        if (s.touchdown < 8 && Math.abs(s.tilt) < 0.3) { s.phase = "landed"; s.phaseTimer = 0; s.vx = s.vy = 0; }
        else explode();
      }
    }

    if (burning) {
      emitAcc += dt * 700 * s.throttle;
      const dx = -Math.sin(s.tilt), dy = -Math.cos(s.tilt);
      while (emitAcc >= 1) {
        emitAcc--;
        const v = 35 + Math.random() * 15, j = (Math.random() - 0.5) * 6;
        emit(s.x + dx * 0.3, s.y + dy * 0.3,
          s.vx + dx * v - dy * j, s.vy + dy * v + dx * j, (Math.random() - 0.5) * 6,
          0.4 + Math.random() * 0.6);
      }
    }
    trailClock += dt;
    if (trailClock > 0.1) { trailClock = 0; pushTrail(s.x, s.y); }
  } else if (s.phase !== "pad") {
    s.phaseTimer += dt;
    if (s.phaseTimer > (s.phase === "crashed" ? 3 : 5)) reset();
  }

  rocket.position.set(s.x, s.y, 0);
  rocket.rotation.z = -s.tilt;
  stepExhaust(dt);
}

// ---------- camera ----------
let idleAz = 0.7;
const offset = new THREE.Vector3(), desired = new THREE.Vector3(), lookAt = new THREE.Vector3();
function updateCamera(dt) {
  if (!REDUCED_MOTION && s.phase === "pad") idleAz += dt * 0.06;
  const speed = Math.hypot(s.vx, s.vy);
  const az = idleAz + mouseX * 0.8;
  const el = Math.max(0.05, Math.min(1.0, 0.22 - mouseY * 0.25 + Math.min(speed / 400, 0.35)));
  const dist = (innerWidth < 600 ? 60 : 44) + Math.min(speed * 0.25, 90);
  desired.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).multiplyScalar(dist);
  offset.lerp(desired, 1 - Math.exp(-dt * 3));
  lookAt.set(s.x, s.y + 9, 0);
  camera.position.copy(lookAt).add(offset);
  camera.lookAt(lookAt);
}
offset.set(0, 10, 44);

// ---------- HUD ----------
const $ = (id) => document.getElementById(id);
const hud = { status: $("status"), t: $("t"), alt: $("alt"), vel: $("vel"), thr: $("thr"), fuel: $("fuel"), apo: $("apo") };
const fmtDist = (m) => (m >= 10000 ? (m / 1000).toFixed(1) + " km" : Math.round(m).toLocaleString() + " m");
let hudClock = 0;
function updateHud(dt) {
  hudClock += dt;
  if (hudClock < 0.1) return;
  hudClock = 0;
  const mm = Math.floor(s.t / 60), ss = (s.t % 60).toFixed(1).padStart(4, "0");
  hud.t.textContent = `${String(mm).padStart(2, "0")}:${ss}`;
  hud.alt.textContent = fmtDist(Math.max(0, s.y));
  hud.vel.textContent = `${Math.round(Math.hypot(s.vx, s.vy))} m/s`;
  hud.thr.textContent = `${Math.round(s.throttle * 100)}%`;
  hud.fuel.style.width = `${(s.fuel / FUEL) * 100}%`;
  hud.apo.textContent = fmtDist(s.apo);
  let status = "PAD · READY";
  if (s.phase === "flight") {
    if (s.fuel <= 0) status = s.vy > 0 ? "MECO · COASTING" : "MECO · DESCENDING";
    else if (!s.engine) status = s.vy > 0 ? "ENGINE OFF · COAST" : "ENGINE OFF · FALLING";
    else status = s.vy >= 0 ? "ASCENT" : "POWERED DESCENT";
  } else if (s.phase === "landed") status = `LANDED · ${s.touchdown.toFixed(1)} m/s`;
  else if (s.phase === "crashed") status = "RAPID UNSCHEDULED DISASSEMBLY";
  hud.status.textContent = status;
}

// ---------- main loop ----------
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 1 / 30);
  last = now;
  step(dt);
  updateCamera(dt);
  updateHud(dt);
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(frame);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) renderer.setAnimationLoop(null);
  else { last = performance.now(); renderer.setAnimationLoop(frame); }
});
