'use client';

import { useEffect, useRef } from 'react';

const GRID_COLS = 13;
const GRID_ROWS = 13;
const CELL = 40;
const W = GRID_COLS * CELL;
const H = GRID_ROWS * CELL;

const HOME_ROW = 0;
const HOME_COLUMNS = [0, 3, 6, 9, 12];
const ROAD_ROWS = [7, 8, 9, 10, 11];
const MEDIAN_ROW = 6;
const RIVER_ROWS = [1, 2, 3, 4, 5];
const START_ROW = 12;
const START_COL = 6;

const LIFE_TIME_SECONDS = 25;
const HOP_ANIMATION_MS = 120;
const STARTING_LIVES = 3;

const TURTLE_CYCLE_MS = 5000;
const TURTLE_VISIBLE_MS = 3500;

export type SkinId = 'classic' | 'retro' | 'neon' | 'pixel';

interface Skin {
  label: string;
  grassStart: string;
  grassMedian: string;
  road: string;
  water: string;
  home: string;
  homeOccupied: string;
  hedge: string;
  frog: string;
  frogEye: string;
  car: string;
  truck: string;
  bike: string;
  logWood: string;
  turtle: string;
  turtleSubmerged: string;
  hud: string;
  timerBar: string;
  boardBg: string;
  accent: string;
}

export const SKINS: Record<SkinId, Skin> = {
  classic: {
    label: 'CLASSIC',
    grassStart: '#0a2a1a',
    grassMedian: '#0a2a1a',
    road: '#1a1a24',
    water: '#001a2a',
    home: '#0a3a2a',
    homeOccupied: '#0f5a3f',
    hedge: '#0a4a2a',
    frog: '#00ff88',
    frogEye: '#0a0a18',
    car: '#ff006e',
    truck: '#f5ff00',
    bike: '#00f5ff',
    logWood: '#8a5a2a',
    turtle: '#00ff88',
    turtleSubmerged: 'rgba(0,255,136,0.25)',
    hud: '#e8e8f0',
    timerBar: '#00f5ff',
    boardBg: '#1a1a24',
    accent: '#00ff88',
  },
  retro: {
    label: 'RETRO',
    grassStart: '#031403',
    grassMedian: '#052005',
    road: '#0a1a0a',
    water: '#021208',
    home: '#0a2a0a',
    homeOccupied: '#123f12',
    hedge: '#0a3a0a',
    frog: '#3ddc3d',
    frogEye: '#021002',
    car: '#2fae2f',
    truck: '#8ef58e',
    bike: '#1f8f1f',
    logWood: '#4a3a10',
    turtle: '#3ddc3d',
    turtleSubmerged: 'rgba(61,220,61,0.25)',
    hud: '#3ddc3d',
    timerBar: '#3ddc3d',
    boardBg: '#0a1a0a',
    accent: '#3ddc3d',
  },
  neon: {
    label: 'NEON',
    grassStart: '#05010f',
    grassMedian: '#0a0520',
    road: '#120a2a',
    water: '#08002a',
    home: '#1a0a3a',
    homeOccupied: '#2f0f5a',
    hedge: '#1f0a4a',
    frog: '#39ff8f',
    frogEye: '#05010f',
    car: '#ff2bd6',
    truck: '#f5ff00',
    bike: '#00f0ff',
    logWood: '#7a5cff',
    turtle: '#39ff8f',
    turtleSubmerged: 'rgba(57,255,143,0.25)',
    hud: '#f5ff00',
    timerBar: '#ff2bd6',
    boardBg: '#120a2a',
    accent: '#ff2bd6',
  },
  pixel: {
    label: 'PIXEL ART',
    grassStart: '#001a00',
    grassMedian: '#003300',
    road: '#000000',
    water: '#00284d',
    home: '#004d26',
    homeOccupied: '#00b34d',
    hedge: '#006622',
    frog: '#ffffff',
    frogEye: '#000000',
    car: '#ff0000',
    truck: '#ffd400',
    bike: '#00aaff',
    logWood: '#aa6600',
    turtle: '#00ff00',
    turtleSubmerged: 'rgba(0,255,0,0.3)',
    hud: '#ffffff',
    timerBar: '#ffd400',
    boardBg: '#000000',
    accent: '#ffd400',
  },
};

export const SKIN_ORDER: SkinId[] = ['classic', 'retro', 'neon', 'pixel'];
export const SKIN_STORAGE_KEY = 'av-frogger-skin';

interface FroggerGameProps {
  paused: boolean;
  skin: SkinId;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

type VehicleType = 'car' | 'truck' | 'bike';
type FloaterType = 'log' | 'turtle';

interface Vehicle {
  x: number;
  width: number;
  type: VehicleType;
}

interface Floater {
  x: number;
  width: number;
  type: FloaterType;
  submerged?: boolean;
  phaseOffset?: number;
}

interface Lane {
  row: number;
  direction: 1 | -1;
  speed: number;
  vehicles?: Vehicle[];
  floaters?: Floater[];
}

const VEHICLE_WIDTH: Record<VehicleType, number> = {
  car: 50,
  truck: 90,
  bike: 28,
};

type Direction = 'up' | 'down' | 'left' | 'right';

const DIRECTION_DELTA: Record<Direction, { dc: number; dr: number }> = {
  up: { dc: 0, dr: -1 },
  down: { dc: 0, dr: 1 },
  left: { dc: -1, dr: 0 },
  right: { dc: 1, dr: 0 },
};

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function FroggerGame({
  paused,
  skin,
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
}: FroggerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const skinRef = useRef<Skin>(SKINS[skin]);
  const callbacksRef = useRef({
    onScoreChange,
    onLivesChange,
    onLevelChange,
    onGameOver,
  });

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    skinRef.current = SKINS[skin];
  }, [skin]);

  useEffect(() => {
    callbacksRef.current = {
      onScoreChange,
      onLivesChange,
      onLevelChange,
      onGameOver,
    };
  }, [onScoreChange, onLivesChange, onLevelChange, onGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;
    const ctx: CanvasRenderingContext2D = ctx2d;

    let score = 0;
    let lives = STARTING_LIVES;
    let level = 1;
    let timeLeft = LIFE_TIME_SECONDS;
    let homesOccupied = [false, false, false, false, false];
    let highestRowReached = START_ROW;
    let gameOver = false;
    let gameOverFired = false;

    let prevScore = -1;
    let prevLives = -1;
    let prevLevel = -1;

    let frogCol = START_COL;
    let frogRow = START_ROW;
    let frogPixelX = frogCol * CELL + CELL / 2;
    let frogPixelY = frogRow * CELL + CELL / 2;
    let facing: Direction = 'up';
    let hopping = false;
    let hopStart = 0;
    let hopFromX = frogPixelX;
    let hopFromY = frogPixelY;
    let hopToX = frogPixelX;
    let hopToY = frogPixelY;
    let splashUntil = 0;
    let splashX = frogPixelX;
    let splashY = frogPixelY;

    let lanes: Lane[] = [];

    function makeVehicleLane(
      row: number,
      direction: 1 | -1,
      speed: number,
    ): Lane {
      const types: VehicleType[] = ['car', 'truck', 'bike'];
      const vehicles: Vehicle[] = [];
      let x = Math.random() * W;
      while (x < W + 200) {
        const type = types[Math.floor(Math.random() * types.length)];
        const width = VEHICLE_WIDTH[type];
        vehicles.push({ x, width, type });
        x += width + 90 + Math.random() * 90;
      }
      return { row, direction, speed, vehicles };
    }

    function makeRiverLane(
      row: number,
      direction: 1 | -1,
      speed: number,
    ): Lane {
      const floaters: Floater[] = [];
      let x = Math.random() * W;
      while (x < W + 220) {
        const isLog = Math.random() < 0.5;
        const width = isLog ? 90 + Math.random() * 60 : 90;
        floaters.push({
          x,
          width,
          type: isLog ? 'log' : 'turtle',
          submerged: false,
          phaseOffset: Math.random() * TURTLE_CYCLE_MS,
        });
        x += width + 100 + Math.random() * 100;
      }
      return { row, direction, speed, floaters };
    }

    function initLanes() {
      const roadSpeeds = [50, 65, 80, 65, 50];
      lanes = ROAD_ROWS.map((row, i) =>
        makeVehicleLane(row, i % 2 === 0 ? 1 : -1, roadSpeeds[i]),
      );
      const riverSpeeds = [40, 55, 70, 55, 40];
      RIVER_ROWS.forEach((row, i) => {
        lanes.push(makeRiverLane(row, i % 2 === 0 ? -1 : 1, riverSpeeds[i]));
      });
    }

    function resetFrog() {
      frogCol = START_COL;
      frogRow = START_ROW;
      frogPixelX = frogCol * CELL + CELL / 2;
      frogPixelY = frogRow * CELL + CELL / 2;
      hopping = false;
      facing = 'up';
      timeLeft = LIFE_TIME_SECONDS;
      highestRowReached = START_ROW;
    }

    function initGame() {
      score = 0;
      lives = STARTING_LIVES;
      level = 1;
      homesOccupied = [false, false, false, false, false];
      gameOver = false;
      gameOverFired = false;
      initLanes();
      resetFrog();
    }

    function laneAt(row: number): Lane | undefined {
      return lanes.find((l) => l.row === row);
    }

    function loseLife() {
      splashUntil = performance.now() + 260;
      splashX = frogPixelX;
      splashY = frogPixelY;
      lives -= 1;
      if (lives > 0) {
        resetFrog();
      } else {
        lives = 0;
        gameOver = true;
      }
    }

    function levelUp() {
      score += 1000;
      level += 1;
      for (const lane of lanes) {
        lane.speed *= 1.15;
      }
      homesOccupied = [false, false, false, false, false];
      resetFrog();
    }

    function landFrog() {
      if (frogRow === HOME_ROW) {
        const idx = HOME_COLUMNS.indexOf(frogCol);
        score += 50 + Math.floor(timeLeft) * 10;
        homesOccupied[idx] = true;
        if (homesOccupied.every(Boolean)) {
          levelUp();
        } else {
          resetFrog();
        }
        return;
      }

      if (frogRow < highestRowReached) {
        score += 10;
        highestRowReached = frogRow;
      }
    }

    function tryHop(dir: Direction) {
      if (hopping || gameOver) return;
      const { dc, dr } = DIRECTION_DELTA[dir];
      const targetCol = clamp(frogCol + dc, 0, GRID_COLS - 1);
      const targetRow = clamp(frogRow + dr, 0, START_ROW);
      if (targetCol === frogCol && targetRow === frogRow) return;

      if (targetRow === HOME_ROW) {
        const idx = HOME_COLUMNS.indexOf(targetCol);
        if (idx === -1 || homesOccupied[idx]) return;
      }

      facing = dir;
      hopping = true;
      hopStart = performance.now();
      hopFromX = frogPixelX;
      hopFromY = frogPixelY;
      frogCol = targetCol;
      frogRow = targetRow;
      hopToX = frogCol * CELL + CELL / 2;
      hopToY = frogRow * CELL + CELL / 2;
    }

    function updateHop(now: number) {
      const elapsed = now - hopStart;
      if (elapsed >= HOP_ANIMATION_MS) {
        hopping = false;
        frogPixelX = hopToX;
        frogPixelY = hopToY;
        landFrog();
        return;
      }
      const t = elapsed / HOP_ANIMATION_MS;
      frogPixelX = hopFromX + (hopToX - hopFromX) * t;
      frogPixelY = hopFromY + (hopToY - hopFromY) * t;
    }

    function updateLanes(dt: number, now: number) {
      for (const lane of lanes) {
        if (lane.vehicles) {
          for (const v of lane.vehicles) {
            v.x += lane.direction * lane.speed * dt;
            if (lane.direction > 0 && v.x > W) v.x = -v.width;
            if (lane.direction < 0 && v.x + v.width < 0) v.x = W;
          }
        }
        if (lane.floaters) {
          for (const f of lane.floaters) {
            f.x += lane.direction * lane.speed * dt;
            if (lane.direction > 0 && f.x > W) f.x = -f.width;
            if (lane.direction < 0 && f.x + f.width < 0) f.x = W;
            if (f.type === 'turtle') {
              const cycle = (now + (f.phaseOffset ?? 0)) % TURTLE_CYCLE_MS;
              f.submerged = cycle > TURTLE_VISIBLE_MS;
            }
          }
        }
      }
    }

    function updateFrogEnvironment(dt: number) {
      if (hopping || gameOver) return;

      if (ROAD_ROWS.includes(frogRow)) {
        const lane = laneAt(frogRow);
        const hit = lane?.vehicles?.some(
          (v) => frogPixelX > v.x && frogPixelX < v.x + v.width,
        );
        if (hit) {
          loseLife();
          return;
        }
      }

      if (RIVER_ROWS.includes(frogRow)) {
        const lane = laneAt(frogRow);
        const floater = lane?.floaters?.find(
          (f) => !f.submerged && frogPixelX > f.x && frogPixelX < f.x + f.width,
        );
        if (!floater || !lane) {
          loseLife();
          return;
        }
        frogPixelX += lane.direction * lane.speed * dt;
        frogCol = clamp(
          Math.round((frogPixelX - CELL / 2) / CELL),
          0,
          GRID_COLS - 1,
        );
        if (frogPixelX < 0 || frogPixelX > W) {
          loseLife();
        }
      }
    }

    function updateTimer(dt: number) {
      if (hopping || gameOver) return;
      timeLeft -= dt;
      if (timeLeft <= 0) {
        timeLeft = 0;
        loseLife();
      }
    }

    function drawBackground() {
      const c = skinRef.current;
      for (let row = 0; row < GRID_ROWS; row++) {
        let color = c.grassMedian;
        if (row === START_ROW) color = c.grassStart;
        else if (row === MEDIAN_ROW) color = c.grassMedian;
        else if (ROAD_ROWS.includes(row)) color = c.road;
        else if (RIVER_ROWS.includes(row)) color = c.water;
        else if (row === HOME_ROW) color = c.home;
        ctx.fillStyle = color;
        ctx.fillRect(0, row * CELL, W, CELL);
      }

      ctx.fillStyle = c.hedge;
      for (let col = 0; col < GRID_COLS; col++) {
        if (HOME_COLUMNS.includes(col)) continue;
        ctx.fillRect(col * CELL, 0, CELL, CELL);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 2;
        for (let i = -1; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(col * CELL + i * 14, CELL);
          ctx.lineTo(col * CELL + i * 14 + 14, 0);
          ctx.stroke();
        }
      }

      HOME_COLUMNS.forEach((col, i) => {
        ctx.fillStyle = homesOccupied[i] ? c.homeOccupied : c.home;
        ctx.fillRect(col * CELL, 0, CELL, CELL);
        if (homesOccupied[i]) {
          ctx.fillStyle = c.frog;
          ctx.beginPath();
          ctx.arc(col * CELL + CELL / 2, CELL / 2, CELL * 0.22, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    function drawLanes() {
      const c = skinRef.current;
      const vehicleColor: Record<VehicleType, string> = {
        car: c.car,
        truck: c.truck,
        bike: c.bike,
      };
      for (const lane of lanes) {
        if (lane.vehicles) {
          for (const v of lane.vehicles) {
            ctx.save();
            ctx.shadowColor = vehicleColor[v.type];
            ctx.shadowBlur = 10;
            ctx.fillStyle = vehicleColor[v.type];
            ctx.beginPath();
            ctx.roundRect(v.x, lane.row * CELL + 6, v.width, CELL - 12, 6);
            ctx.fill();
            ctx.restore();
          }
        }
        if (lane.floaters) {
          for (const f of lane.floaters) {
            if (f.type === 'log') {
              ctx.fillStyle = c.logWood;
              ctx.beginPath();
              ctx.roundRect(f.x, lane.row * CELL + 8, f.width, CELL - 16, 8);
              ctx.fill();
              ctx.strokeStyle = 'rgba(0,0,0,0.3)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(f.x + 6, lane.row * CELL + CELL / 2);
              ctx.lineTo(f.x + f.width - 6, lane.row * CELL + CELL / 2);
              ctx.stroke();
            } else {
              ctx.fillStyle = f.submerged ? c.turtleSubmerged : c.turtle;
              const count = Math.max(2, Math.round(f.width / 40));
              const step = f.width / count;
              for (let i = 0; i < count; i++) {
                ctx.beginPath();
                ctx.ellipse(
                  f.x + step * i + step / 2,
                  lane.row * CELL + CELL / 2,
                  step / 2.2,
                  CELL / 3.4,
                  0,
                  0,
                  Math.PI * 2,
                );
                ctx.fill();
              }
            }
          }
        }
      }
    }

    function drawFrog() {
      const c = skinRef.current;
      const scale = hopping
        ? 1 +
          Math.sin(
            ((performance.now() - hopStart) / HOP_ANIMATION_MS) * Math.PI,
          ) *
            0.25
        : 1;
      const r = CELL * 0.32 * scale;

      ctx.save();
      ctx.shadowColor = c.frog;
      ctx.shadowBlur = 12;
      ctx.fillStyle = c.frog;
      ctx.beginPath();
      ctx.arc(frogPixelX, frogPixelY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const { dc, dr } = DIRECTION_DELTA[facing];
      const eyeOffsetX = dc * r * 0.5 + (dr !== 0 ? r * 0.35 : 0);
      const eyeOffsetY = dr * r * 0.5 + (dc !== 0 ? -r * 0.35 : -r * 0.3);
      const eyes =
        dc !== 0
          ? [
              { ex: frogPixelX + eyeOffsetX, ey: frogPixelY - r * 0.35 },
              { ex: frogPixelX + eyeOffsetX, ey: frogPixelY + r * 0.35 },
            ]
          : [
              { ex: frogPixelX - r * 0.35, ey: frogPixelY + eyeOffsetY },
              { ex: frogPixelX + r * 0.35, ey: frogPixelY + eyeOffsetY },
            ];

      for (const { ex, ey } of eyes) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex, ey, r * 0.24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = c.frogEye;
        ctx.beginPath();
        ctx.arc(
          ex + dc * r * 0.08,
          ey + dr * r * 0.08,
          r * 0.12,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }

    function drawSplash(now: number) {
      if (now >= splashUntil) return;
      const t = 1 - (splashUntil - now) / 260;
      ctx.save();
      ctx.strokeStyle = `rgba(0,245,255,${1 - t})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(splashX, splashY, 6 + t * 18 + i * 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawHud() {
      const c = skinRef.current;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, W, 26);

      ctx.font = '12px var(--mono, monospace)';
      ctx.fillStyle = c.hud;
      ctx.textBaseline = 'middle';
      ctx.fillText(`SCORE ${score}`, 8, 13);
      ctx.fillText('♥'.repeat(lives), 150, 13);
      ctx.fillText(`LVL ${String(level).padStart(2, '0')}`, 210, 13);

      const barW = 100;
      const ratio = clamp(timeLeft / LIFE_TIME_SECONDS, 0, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(W - barW - 8, 9, barW, 8);
      ctx.fillStyle = c.timerBar;
      ctx.fillRect(W - barW - 8, 9, barW * ratio, 8);
      ctx.restore();
    }

    function draw(now: number) {
      drawBackground();
      drawLanes();
      drawSplash(now);
      drawFrog();
      drawHud();
    }

    function notifyChanges() {
      const cb = callbacksRef.current;
      if (score !== prevScore) {
        prevScore = score;
        cb.onScoreChange(score);
      }
      if (lives !== prevLives) {
        prevLives = lives;
        cb.onLivesChange(lives);
      }
      if (level !== prevLevel) {
        prevLevel = level;
        cb.onLevelChange(level);
      }
      if (gameOver && !gameOverFired) {
        gameOverFired = true;
        cb.onGameOver(score);
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const dir = KEY_TO_DIRECTION[e.code];
      if (!dir) return;
      e.preventDefault();
      if (pausedRef.current || gameOver) return;
      tryHop(dir);
    };

    window.addEventListener('keydown', handleKeyDown);

    let rafId = 0;
    let lastTs = 0;

    function loop(ts: number) {
      if (!lastTs) lastTs = ts;
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;

      if (!pausedRef.current) {
        updateLanes(dt, ts);
        if (hopping) {
          updateHop(ts);
        } else {
          updateFrogEnvironment(dt);
          updateTimer(dt);
        }
      }

      draw(ts);
      notifyChanges();
      rafId = requestAnimationFrame(loop);
    }

    initGame();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
