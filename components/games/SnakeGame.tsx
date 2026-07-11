'use client';

import { useEffect, useRef } from 'react';

const GRID = 20;
const CELL = 30;
const W = GRID * CELL;
const H = GRID * CELL;
const TICK_MS = 1000 / 8;

interface SnakeGameProps {
  paused: boolean;
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
  onScoreChange,
  onLengthChange,
  onGameOver,
}: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const callbacksRef = useRef({ onScoreChange, onLengthChange, onGameOver });

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

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

    function draw() {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#3ddc3d';
      for (const seg of snake) {
        ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
      }

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
