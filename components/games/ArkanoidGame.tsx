'use client';

import { useEffect, useRef } from 'react';
import {
  loadSpritesheet,
  drawSprite,
  drawFrame,
  EXPLOSION_FRAMES,
  EXPLOSION_DURATION,
  type BlockColor,
} from './arkanoid/spritesheet';

const W = 800;
const H = 600;

interface ArkanoidGameProps {
  paused: boolean;
  skin: SkinId;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

export type SkinId = 'classic' | 'retro' | 'neon' | 'pixel';

interface Skin {
  label: string;
  bg: string;
  hudText: string;
  accent: string;
  pauseOverlay: string;
  pauseText: string;
  spriteFilter: string;
}

export const SKINS: Record<SkinId, Skin> = {
  classic: {
    label: 'CLASSIC',
    bg: '#000000',
    hudText: '#ffffff',
    accent: '#f0c040',
    pauseOverlay: 'rgba(0, 0, 0, 0.65)',
    pauseText: '#ffffff',
    spriteFilter: 'none',
  },
  retro: {
    label: 'RETRO',
    bg: '#0d1b0d',
    hudText: '#3ddc3d',
    accent: '#3ddc3d',
    pauseOverlay: 'rgba(4, 20, 4, 0.75)',
    pauseText: '#3ddc3d',
    spriteFilter:
      'sepia(1) hue-rotate(70deg) saturate(3.5) brightness(0.9) contrast(1.1)',
  },
  neon: {
    label: 'NEON',
    bg: '#05010f',
    hudText: '#00f0ff',
    accent: '#ff2bd6',
    pauseOverlay: 'rgba(5, 1, 15, 0.75)',
    pauseText: '#ff2bd6',
    spriteFilter:
      'saturate(2.4) brightness(1.2) contrast(1.15) hue-rotate(-8deg)',
  },
  pixel: {
    label: 'PIXEL ART',
    bg: '#000000',
    hudText: '#ffffff',
    accent: '#ffd400',
    pauseOverlay: 'rgba(0, 0, 0, 0.8)',
    pauseText: '#ffffff',
    spriteFilter: 'contrast(2) saturate(1.6) brightness(1.05)',
  },
};

export const SKIN_ORDER: SkinId[] = ['classic', 'retro', 'neon', 'pixel'];
export const SKIN_STORAGE_KEY = 'av-arkanoid-skin';

type GameState = 'playing' | 'gameover' | 'win';

interface LevelBlock {
  col: number;
  row: number;
  color: BlockColor;
}

interface Level {
  speed: number;
  blocks: LevelBlock[];
}

const LEVELS: Level[] = (() => {
  const rowColors1: BlockColor[] = [
    'red',
    'yellow',
    'cyan',
    'magenta',
    'hotpink',
    'green',
  ];
  const rowColors2: BlockColor[] = [
    'gray',
    'cyan',
    'hotpink',
    'yellow',
    'magenta',
    'green',
  ];
  const rowColors4: BlockColor[] = [
    'cyan',
    'magenta',
    'green',
    'yellow',
    'hotpink',
    'red',
  ];

  const l1: LevelBlock[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      l1.push({ col, row, color: rowColors1[row] });

  const l2: LevelBlock[] = [];
  const pyStart = [4, 3, 2, 1, 0, 0];
  const pyEnd = [5, 6, 7, 8, 9, 9];
  for (let row = 0; row < 6; row++)
    for (let col = pyStart[row]; col <= pyEnd[row]; col++)
      l2.push({ col, row, color: rowColors2[row] });

  const l3: LevelBlock[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      if ((col + row) % 2 === 0)
        l3.push({ col, row, color: row < 3 ? 'yellow' : 'magenta' });

  const gaps4 = [
    [2, 5, 8],
    [0, 4, 7, 9],
    [1, 3, 6],
    [2, 5, 8, 9],
    [0, 4, 7],
    [1, 3, 6, 9],
  ];
  const l4: LevelBlock[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      if (!gaps4[row].includes(col))
        l4.push({ col, row, color: rowColors4[row] });

  const l5: LevelBlock[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++) {
      const isFrame = col === 0 || col === 9 || row === 0 || row === 5;
      const isCross = col === 4 || row === 2;
      if (isFrame || isCross)
        l5.push({
          col,
          row,
          color: isCross && !isFrame ? 'hotpink' : 'cyan',
        });
    }

  return [
    { speed: 1.0, blocks: l1 },
    { speed: 1.1, blocks: l2 },
    { speed: 1.21, blocks: l3 },
    { speed: 1.33, blocks: l4 },
    { speed: 1.46, blocks: l5 },
  ];
})();

export default function ArkanoidGame({
  paused,
  skin,
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
}: ArkanoidGameProps) {
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

    // ── Constantes ────────────────────────────────────────────────────────
    const PADDLE_SPEED = 400;
    const BLOCK_COLS = 10;
    const BLOCK_W = 64;
    const BLOCK_H = 24;
    const BLOCKS_ORIGIN_X = (W - BLOCK_COLS * BLOCK_W) / 2;
    const BLOCKS_ORIGIN_Y = 80;
    const BASE_BALL_VX = 200;
    const BASE_BALL_VY = -300;

    const PAUSE_BTN_W = 60;
    const PAUSE_BTN_H = 40;
    const PAUSE_BTN_GAP = 12;
    const PAUSE_BTN_Y = 340;
    const PAUSE_BTN_ROW_X = (W - (5 * PAUSE_BTN_W + 4 * PAUSE_BTN_GAP)) / 2;

    // ── Audio ─────────────────────────────────────────────────────────────
    const bounceSound = new Audio('/games/arkanoid/sounds/ball-bounce.mp3');
    const breakSound = new Audio('/games/arkanoid/sounds/break-sound.mp3');
    const activeSoundNodes = new Set<HTMLAudioElement>();

    function playSound(sound: HTMLAudioElement) {
      const node = sound.cloneNode() as HTMLAudioElement;
      activeSoundNodes.add(node);
      node.addEventListener('ended', () => activeSoundNodes.delete(node));
      node.play().catch(() => {});
    }

    function stopAllSounds() {
      for (const node of activeSoundNodes) {
        node.pause();
        node.currentTime = 0;
      }
      activeSoundNodes.clear();
      bounceSound.pause();
      breakSound.pause();
    }

    // ── Estado ────────────────────────────────────────────────────────────
    interface Block {
      x: number;
      y: number;
      w: number;
      h: number;
      color: BlockColor;
      alive: boolean;
    }

    interface Explosion {
      x: number;
      y: number;
      w: number;
      h: number;
      color: BlockColor;
      elapsed: number;
    }

    const paddle = { x: 0, y: 560, w: 81, h: 14 };
    const ball = { x: 0, y: 0, w: 16, h: 16, vx: 200, vy: -300 };

    let blocks: Block[] = [];
    let explosions: Explosion[] = [];
    let lives = 3;
    let score = 0;
    let gameState: GameState = 'playing';
    let currentLevel = 1;
    let isPaused = false;

    const keys: Record<string, boolean> = {
      ArrowLeft: false,
      ArrowRight: false,
    };

    let prevScore = -1;
    let prevLives = -1;
    let prevLevel = -1;
    let gameOverFired = false;

    function initPaddle() {
      paddle.x = (W - paddle.w) / 2;
    }

    function initBall() {
      const speed = LEVELS[currentLevel - 1].speed;
      ball.x = paddle.x + (paddle.w - ball.w) / 2;
      ball.y = paddle.y - ball.h;
      ball.vx = BASE_BALL_VX * speed;
      ball.vy = BASE_BALL_VY * speed;
    }

    function loadLevel(n: number) {
      currentLevel = n;
      const level = LEVELS[n - 1];
      blocks = level.blocks.map((b) => ({
        x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
        y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
        w: BLOCK_W,
        h: BLOCK_H,
        color: b.color,
        alive: true,
      }));
      explosions = [];
      ball.x = paddle.x + (paddle.w - ball.w) / 2;
      ball.y = paddle.y - ball.h;
      ball.vx = BASE_BALL_VX * level.speed;
      ball.vy = BASE_BALL_VY * level.speed;
    }

    function collideAABB(block: Block) {
      return (
        ball.x < block.x + block.w &&
        ball.x + ball.w > block.x &&
        ball.y < block.y + block.h &&
        ball.y + ball.h > block.y
      );
    }

    // ── Input ─────────────────────────────────────────────────────────────
    const handleClick = (e: MouseEvent) => {
      if (!isPaused) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      for (let i = 0; i < 5; i++) {
        const bx = PAUSE_BTN_ROW_X + i * (PAUSE_BTN_W + PAUSE_BTN_GAP);
        if (
          mx >= bx &&
          mx <= bx + PAUSE_BTN_W &&
          my >= PAUSE_BTN_Y &&
          my <= PAUSE_BTN_Y + PAUSE_BTN_H
        ) {
          loadLevel(i + 1);
          isPaused = false;
          return;
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      paddle.x = Math.max(0, Math.min(W - paddle.w, mouseX - paddle.w / 2));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault();
        keys[e.code] = true;
      }
      if (
        (e.code === 'KeyP' || e.code === 'Escape') &&
        gameState === 'playing'
      ) {
        isPaused = !isPaused;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        keys[e.code] = false;
      }
    };

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // ── Update ────────────────────────────────────────────────────────────
    function update(dt: number) {
      if (gameState !== 'playing') return;

      if (keys.ArrowLeft) paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * dt);
      if (keys.ArrowRight)
        paddle.x = Math.min(W - paddle.w, paddle.x + PADDLE_SPEED * dt);

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      if (ball.x <= 0) {
        ball.x = 0;
        ball.vx = Math.abs(ball.vx);
        playSound(bounceSound);
      }
      if (ball.x + ball.w >= W) {
        ball.x = W - ball.w;
        ball.vx = -Math.abs(ball.vx);
        playSound(bounceSound);
      }
      if (ball.y <= 0) {
        ball.y = 0;
        ball.vy = Math.abs(ball.vy);
        playSound(bounceSound);
      }

      if (
        ball.vy > 0 &&
        ball.x + ball.w > paddle.x &&
        ball.x < paddle.x + paddle.w &&
        ball.y + ball.h >= paddle.y &&
        ball.y + ball.h <= paddle.y + paddle.h + 8
      ) {
        ball.y = paddle.y - ball.h;
        ball.vy = -Math.abs(ball.vy);
        playSound(bounceSound);
      }

      for (const block of blocks) {
        if (!block.alive) continue;
        if (collideAABB(block)) {
          block.alive = false;
          explosions.push({
            x: block.x,
            y: block.y,
            w: block.w,
            h: block.h,
            color: block.color,
            elapsed: 0,
          });
          score += 10;
          ball.vy = -ball.vy;
          playSound(breakSound);
          if (blocks.every((b) => !b.alive)) {
            if (currentLevel < 5) loadLevel(currentLevel + 1);
            else gameState = 'win';
          }
          break;
        }
      }

      for (const exp of explosions) exp.elapsed += dt * 1000;
      explosions = explosions.filter((exp) => exp.elapsed < EXPLOSION_DURATION);

      if (ball.y > H) {
        lives--;
        if (lives <= 0) {
          lives = 0;
          gameState = 'gameover';
        } else {
          initBall();
        }
      }
    }

    // ── Draw ──────────────────────────────────────────────────────────────
    function drawPauseOverlay() {
      const skin = skinRef.current;
      ctx.fillStyle = skin.pauseOverlay;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = skin.pauseText;
      ctx.font = 'bold 56px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PAUSA', W / 2, 260);

      ctx.font = 'bold 16px monospace';
      ctx.fillText('Saltar al nivel:', W / 2, 310);

      for (let i = 0; i < 5; i++) {
        const bx = PAUSE_BTN_ROW_X + i * (PAUSE_BTN_W + PAUSE_BTN_GAP);
        const isActive = i + 1 === currentLevel;
        ctx.fillStyle = isActive ? skin.accent : '#444';
        ctx.strokeStyle = skin.pauseText;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(bx, PAUSE_BTN_Y, PAUSE_BTN_W, PAUSE_BTN_H, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isActive ? '#000' : '#fff';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          String(i + 1),
          bx + PAUSE_BTN_W / 2,
          PAUSE_BTN_Y + PAUSE_BTN_H / 2,
        );
      }
    }

    function draw() {
      const skin = skinRef.current;
      ctx.fillStyle = skin.bg;
      ctx.fillRect(0, 0, W, H);

      const filter = skin.spriteFilter;

      for (const block of blocks) {
        if (block.alive)
          drawSprite(
            ctx,
            'block_' + block.color,
            block.x,
            block.y,
            block.w,
            block.h,
            filter,
          );
      }

      for (const exp of explosions) {
        const frameIndex = Math.min(
          Math.floor((exp.elapsed / EXPLOSION_DURATION) * 4),
          3,
        );
        drawFrame(
          ctx,
          EXPLOSION_FRAMES[exp.color][frameIndex],
          exp.x,
          exp.y,
          exp.w,
          exp.h,
          filter,
        );
      }

      drawSprite(ctx, 'paddle', paddle.x, paddle.y, paddle.w, paddle.h, filter);
      drawSprite(ctx, 'ball', ball.x, ball.y, ball.w, ball.h, filter);

      if (gameState === 'playing') {
        const ballSize = 16;
        const ballSpacing = 4;
        for (let i = 0; i < lives; i++) {
          const bx = W - 10 - (lives - i) * (ballSize + ballSpacing);
          drawSprite(ctx, 'ball', bx, 10, ballSize, ballSize, filter);
        }
      }

      if (gameState === 'playing') {
        ctx.fillStyle = skin.hudText;
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Score: ' + score, 10, 10);
        ctx.textAlign = 'center';
        ctx.fillText('Nivel: ' + currentLevel, W / 2, 10);
      }

      if (isPaused) drawPauseOverlay();
    }

    function notifyChanges() {
      const cb = callbacksRef.current;
      if (score !== prevScore) {
        prevScore = score;
        cb.onScoreChange(score);
      }
      if (currentLevel !== prevLevel) {
        prevLevel = currentLevel;
        cb.onLevelChange(currentLevel);
      }
      if (lives !== prevLives) {
        prevLives = lives;
        cb.onLivesChange(lives);
      }
      if ((gameState === 'gameover' || gameState === 'win') && !gameOverFired) {
        gameOverFired = true;
        if (lives !== 0) {
          lives = 0;
          prevLives = 0;
        }
        cb.onLivesChange(0);
        cb.onGameOver(score);
      }
    }

    // ── Loop principal ───────────────────────────────────────────────────
    let lastTime: number | null = null;
    let rafId = 0;
    let disposed = false;

    function loop(ts: number) {
      const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
      lastTime = ts;
      if (!pausedRef.current && !isPaused) update(dt);
      draw();
      notifyChanges();
      rafId = requestAnimationFrame(loop);
    }

    loadSpritesheet(() => {
      if (disposed) return;
      initPaddle();
      loadLevel(1);
      rafId = requestAnimationFrame(loop);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      stopAllSounds();
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
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
