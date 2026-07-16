'use client';

import { useEffect, useRef } from 'react';

const GRID = 20;
const CELL = 40;
const W = GRID * CELL;
const H = GRID * CELL;
const TICK_MS = 1000 / 8;

export type SkinId = 'classic' | 'retro' | 'neon' | 'pixel';

interface Skin {
  label: string;
  boardBg: string;
  bodyA: string;
  bodyB: string;
  headColor: string;
  headGlow: string;
  glowBlur: number;
  eyeWhite: string;
  eyePupil: string;
  accent: string;
}

export const SKINS: Record<SkinId, Skin> = {
  classic: {
    label: 'CLASSIC',
    boardBg: '#000000',
    bodyA: '#2fbf6a',
    bodyB: '#249e56',
    headColor: '#5dffab',
    headGlow: 'rgba(93, 255, 171, 0.85)',
    glowBlur: 14,
    eyeWhite: '#f4fff8',
    eyePupil: '#04140a',
    accent: '#5dffab',
  },
  retro: {
    label: 'RETRO',
    boardBg: '#0a0f0a',
    bodyA: '#1f8f3f',
    bodyB: '#157030',
    headColor: '#3ddc3d',
    headGlow: 'rgba(61, 220, 61, 0.85)',
    glowBlur: 10,
    eyeWhite: '#d9ffd9',
    eyePupil: '#06170a',
    accent: '#3ddc3d',
  },
  neon: {
    label: 'NEON',
    boardBg: '#05010f',
    bodyA: '#00f0ff',
    bodyB: '#0891a8',
    headColor: '#ff2bd6',
    headGlow: 'rgba(255, 43, 214, 0.9)',
    glowBlur: 18,
    eyeWhite: '#ffffff',
    eyePupil: '#1a0f33',
    accent: '#ff2bd6',
  },
  pixel: {
    label: 'PIXEL ART',
    boardBg: '#000000',
    bodyA: '#ffffff',
    bodyB: '#cfcfcf',
    headColor: '#ffd400',
    headGlow: 'rgba(0, 0, 0, 0)',
    glowBlur: 0,
    eyeWhite: '#ffffff',
    eyePupil: '#000000',
    accent: '#ffd400',
  },
};

export const SKIN_ORDER: SkinId[] = ['classic', 'retro', 'neon', 'pixel'];
export const SKIN_STORAGE_KEY = 'av-snake-skin';

interface SnakeGameProps {
  paused: boolean;
  skin: SkinId;
  onScoreChange: (score: number) => void;
  onLengthChange: (length: number) => void;
  onGameOver: (finalScore: number) => void;
}

interface AtlasFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Trasladado de references/source-assets/snake-assets/sprites.js (fruits.png, hoja 3790x442px).
const FRUIT_ATLAS: Record<string, AtlasFrame> = {
  banana: { x: 34, y: 136, w: 110, h: 160 },
  orange: { x: 186, y: 136, w: 150, h: 160 },
  grape: { x: 378, y: 136, w: 110, h: 160 },
  garlic: { x: 540, y: 136, w: 130, h: 160 },
  eggplant: { x: 712, y: 136, w: 130, h: 160 },
  strawberry: { x: 894, y: 136, w: 110, h: 160 },
  cherry: { x: 1066, y: 136, w: 110, h: 160 },
  carrot: { x: 1228, y: 136, w: 130, h: 160 },
  mushroom: { x: 1400, y: 136, w: 130, h: 160 },
  broccoli: { x: 1582, y: 136, w: 110, h: 160 },
  watermelon: { x: 1734, y: 136, w: 150, h: 160 },
  pepper: { x: 1906, y: 136, w: 150, h: 160 },
  kiwi: { x: 2068, y: 136, w: 170, h: 160 },
  lemon: { x: 2250, y: 136, w: 140, h: 160 },
  peach: { x: 2432, y: 136, w: 130, h: 160 },
  peanut: { x: 2604, y: 136, w: 130, h: 160 },
  apple: { x: 2786, y: 136, w: 110, h: 160 },
  tomato: { x: 2948, y: 136, w: 130, h: 160 },
  berries: { x: 3110, y: 136, w: 150, h: 160 },
  grapes2: { x: 3302, y: 136, w: 110, h: 160 },
  pineapple: { x: 3454, y: 136, w: 150, h: 160 },
  melon: { x: 3637, y: 136, w: 130, h: 160 },
};

const FRUIT_NAMES = Object.keys(FRUIT_ATLAS);

type Direction = 'up' | 'down' | 'left' | 'right';

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const DIRECTION_DELTA: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
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

interface Segment {
  x: number;
  y: number;
}

export default function SnakeGame({
  paused,
  skin,
  onScoreChange,
  onLengthChange,
  onGameOver,
}: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const skinRef = useRef<Skin>(SKINS[skin]);
  const callbacksRef = useRef({ onScoreChange, onLengthChange, onGameOver });

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    skinRef.current = SKINS[skin];
  }, [skin]);

  useEffect(() => {
    callbacksRef.current = { onScoreChange, onLengthChange, onGameOver };
  }, [onScoreChange, onLengthChange, onGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;
    const ctx: CanvasRenderingContext2D = ctx2d;

    let snake: Segment[] = [];
    let direction: Direction = 'right';
    let queuedDirection: Direction = 'right';
    let food: { x: number; y: number; fruit: string } | null = null;
    let score = 0;
    let gameOver = false;
    let gameOverFired = false;
    let prevScore = -1;
    let prevLength = -1;

    const fruitImage = new Image();
    let imageLoaded = false;
    fruitImage.onload = () => {
      imageLoaded = true;
    };
    fruitImage.src = '/games/snake/fruits.png';

    function initSnake() {
      const cy = Math.floor(GRID / 2);
      const cx = Math.floor(GRID / 2);
      snake = [
        { x: cx, y: cy },
        { x: cx - 1, y: cy },
        { x: cx - 2, y: cy },
      ];
      direction = 'right';
      queuedDirection = 'right';
      score = 0;
      gameOver = false;
      gameOverFired = false;
      spawnFood();
    }

    function spawnFood() {
      const free: { x: number; y: number }[] = [];
      for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
          if (!snake.some((seg) => seg.x === x && seg.y === y)) {
            free.push({ x, y });
          }
        }
      }
      if (free.length === 0) return;
      const cell = free[Math.floor(Math.random() * free.length)];
      const fruit = FRUIT_NAMES[Math.floor(Math.random() * FRUIT_NAMES.length)];
      food = { x: cell.x, y: cell.y, fruit };
    }

    function update() {
      if (gameOver) return;

      direction = queuedDirection;
      const { dx, dy } = DIRECTION_DELTA[direction];
      const head = snake[0];
      const newHead: Segment = { x: head.x + dx, y: head.y + dy };

      if (
        newHead.x < 0 ||
        newHead.x >= GRID ||
        newHead.y < 0 ||
        newHead.y >= GRID
      ) {
        gameOver = true;
        return;
      }

      if (snake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
        gameOver = true;
        return;
      }

      snake.unshift(newHead);

      if (food && newHead.x === food.x && newHead.y === food.y) {
        score += 10;
        spawnFood();
      } else {
        snake.pop();
      }
    }

    function drawBody(seg: Segment, index: number) {
      const skinNow = skinRef.current;
      ctx.fillStyle = index % 2 === 0 ? skinNow.bodyA : skinNow.bodyB;
      ctx.beginPath();
      ctx.roundRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2, 6);
      ctx.fill();
    }

    function drawHead(seg: Segment) {
      const skinNow = skinRef.current;
      const px = seg.x * CELL;
      const py = seg.y * CELL;

      ctx.save();
      ctx.shadowColor = skinNow.headGlow;
      ctx.shadowBlur = skinNow.glowBlur;
      ctx.fillStyle = skinNow.headColor;
      ctx.beginPath();
      ctx.roundRect(px + 1, py + 1, CELL - 2, CELL - 2, 10);
      ctx.fill();
      ctx.restore();

      const cx = px + CELL / 2;
      const cy = py + CELL / 2;
      const forward = CELL * 0.26;
      const side = CELL * 0.2;
      const eyeR = CELL * 0.11;
      const pupilR = eyeR * 0.55;
      const pupilShift = eyeR * 0.35;

      let eyes: { ex: number; ey: number }[];
      switch (direction) {
        case 'up':
          eyes = [
            { ex: cx - side, ey: cy - forward },
            { ex: cx + side, ey: cy - forward },
          ];
          break;
        case 'down':
          eyes = [
            { ex: cx - side, ey: cy + forward },
            { ex: cx + side, ey: cy + forward },
          ];
          break;
        case 'left':
          eyes = [
            { ex: cx - forward, ey: cy - side },
            { ex: cx - forward, ey: cy + side },
          ];
          break;
        case 'right':
          eyes = [
            { ex: cx + forward, ey: cy - side },
            { ex: cx + forward, ey: cy + side },
          ];
          break;
      }

      const { dx, dy } = DIRECTION_DELTA[direction];
      for (const { ex, ey } of eyes) {
        ctx.fillStyle = skinNow.eyeWhite;
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = skinNow.eyePupil;
        ctx.beginPath();
        ctx.arc(
          ex + dx * pupilShift,
          ey + dy * pupilShift,
          pupilR,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }

    function draw() {
      ctx.fillStyle = skinRef.current.boardBg;
      ctx.fillRect(0, 0, W, H);

      for (let i = snake.length - 1; i >= 1; i--) {
        drawBody(snake[i], i);
      }
      if (snake.length > 0) drawHead(snake[0]);

      if (food && imageLoaded) {
        const frame = FRUIT_ATLAS[food.fruit];
        ctx.drawImage(
          fruitImage,
          frame.x,
          frame.y,
          frame.w,
          frame.h,
          food.x * CELL,
          food.y * CELL,
          CELL,
          CELL,
        );
      }
    }

    function notifyChanges() {
      const cb = callbacksRef.current;
      if (score !== prevScore) {
        prevScore = score;
        cb.onScoreChange(score);
      }
      if (snake.length !== prevLength) {
        prevLength = snake.length;
        cb.onLengthChange(snake.length);
      }
      if (gameOver && !gameOverFired) {
        gameOverFired = true;
        cb.onGameOver(score);
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const next = KEY_TO_DIRECTION[e.code];
      if (!next) return;
      e.preventDefault();
      if (next === OPPOSITE[direction]) return;
      queuedDirection = next;
    };

    window.addEventListener('keydown', handleKeyDown);

    let rafId = 0;
    let lastTick = 0;

    function loop(ts: number) {
      if (!pausedRef.current && !gameOver) {
        if (ts - lastTick >= TICK_MS) {
          lastTick = ts;
          update();
        }
      }
      draw();
      notifyChanges();
      rafId = requestAnimationFrame(loop);
    }

    initSnake();
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
