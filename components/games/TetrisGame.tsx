'use client';

import { useEffect, useRef, useState } from 'react';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;
const NEXT_BLOCK = 30;
const ASIDE_WIDTH = 130;
const LAYOUT_GAP = 16;
const LAYOUT_PADDING_X = 24;
const LAYOUT_PADDING_Y = 16;
const NATURAL_WIDTH =
  COLS * BLOCK + LAYOUT_GAP + ASIDE_WIDTH + LAYOUT_PADDING_X;
const NATURAL_HEIGHT = ROWS * BLOCK + LAYOUT_PADDING_Y;

interface TetrisGameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

type SkinId = 'retro' | 'neon' | 'pastel' | 'pixel';

interface Skin {
  label: string;
  boardBg: string;
  grid: string;
  border: string;
  accent: string;
  colors: (string | null)[];
  highlight: string;
  panelLabel: string;
  panelValue: string;
}

const SKINS: Record<SkinId, Skin> = {
  retro: {
    label: 'RETRO',
    boardBg: '#0d1b0d',
    grid: '#1f3a1f',
    border: '#3ddc3d',
    accent: '#3ddc3d',
    colors: [
      null,
      '#3ddc3d',
      '#e8e83d',
      '#d93dd9',
      '#3dd9d9',
      '#e84d3d',
      '#3d6fe8',
      '#e8a13d',
    ],
    highlight: 'rgba(255,255,255,0.18)',
    panelLabel: '#3ddc3d',
    panelValue: '#e8e83d',
  },
  neon: {
    label: 'NEON',
    boardBg: '#05010f',
    grid: '#1a0f33',
    border: '#ff2bd6',
    accent: '#ff2bd6',
    colors: [
      null,
      '#00f0ff',
      '#f5ff00',
      '#ff2bd6',
      '#39ff8f',
      '#ff3b3b',
      '#7a5cff',
      '#ff9d1f',
    ],
    highlight: 'rgba(255,255,255,0.25)',
    panelLabel: '#ff2bd6',
    panelValue: '#00f0ff',
  },
  pastel: {
    label: 'PASTEL',
    boardBg: '#f5f0fa',
    grid: '#e3d9ee',
    border: '#c9b6e4',
    accent: '#a382c9',
    colors: [
      null,
      '#a7d8de',
      '#fbe7a1',
      '#d9b8e8',
      '#b8e8c4',
      '#f4b8bd',
      '#b8c8f4',
      '#f4d3a8',
    ],
    highlight: 'rgba(255,255,255,0.5)',
    panelLabel: '#8a6bb0',
    panelValue: '#5c4a80',
  },
  pixel: {
    label: 'PIXEL ART',
    boardBg: '#000000',
    grid: '#2b2b2b',
    border: '#ffffff',
    accent: '#ffd400',
    colors: [
      null,
      '#ffffff',
      '#ffd400',
      '#ff2d55',
      '#34c759',
      '#ff453a',
      '#0a84ff',
      '#ff9f0a',
    ],
    highlight: 'rgba(0,0,0,0.35)',
    panelLabel: '#ffffff',
    panelValue: '#ffd400',
  },
};

const SKIN_ORDER: SkinId[] = ['retro', 'neon', 'pastel', 'pixel'];
const SKIN_STORAGE_KEY = 'av-tetris-skin';

const PIECES: (number[][] | null)[] = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 2],
    [2, 2],
  ], // O
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
];

const LINE_SCORES = [0, 100, 300, 500, 800];

interface Piece {
  type: number;
  shape: number[][];
  x: number;
  y: number;
}

export default function TetrisGame({
  paused,
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
}: TetrisGameProps) {
  const boardCanvasRef = useRef<HTMLCanvasElement>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement>(null);
  const scoreElRef = useRef<HTMLSpanElement>(null);
  const linesElRef = useRef<HTMLSpanElement>(null);
  const levelElRef = useRef<HTMLSpanElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const [skin, setSkin] = useState<SkinId>(() => {
    const stored = localStorage.getItem(SKIN_STORAGE_KEY) as SkinId | null;
    return stored && SKINS[stored] ? stored : 'retro';
  });
  const skinRef = useRef<Skin>(SKINS[skin]);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    const recompute = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      setScale(
        Math.min(rect.width / NATURAL_WIDTH, rect.height / NATURAL_HEIGHT),
      );
    };

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pausedRef = useRef(paused);
  const callbacksRef = useRef({
    onScoreChange,
    onLivesChange,
    onLevelChange,
    onGameOver,
  });

  useEffect(() => {
    skinRef.current = SKINS[skin];
  }, [skin]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    callbacksRef.current = {
      onScoreChange,
      onLivesChange,
      onLevelChange,
      onGameOver,
    };
  }, [onScoreChange, onLivesChange, onLevelChange, onGameOver]);

  const changeSkin = (id: SkinId) => {
    setSkin(id);
    localStorage.setItem(SKIN_STORAGE_KEY, id);
  };

  useEffect(() => {
    const canvas = boardCanvasRef.current;
    const nextCanvas = nextCanvasRef.current;
    if (!canvas || !nextCanvas) return;
    const ctx2d = canvas.getContext('2d');
    const nextCtx2d = nextCanvas.getContext('2d');
    if (!ctx2d || !nextCtx2d) return;
    const ctx: CanvasRenderingContext2D = ctx2d;
    const nextCtx: CanvasRenderingContext2D = nextCtx2d;

    const board: number[][] = createBoard();
    let current: Piece;
    let next: Piece;
    let score = 0;
    let lines = 0;
    let level = 1;
    let gameOver = false;
    let dropInterval = 1000;
    let dropAccum = 0;
    let lastTime = 0;
    let animId = 0;

    let prevScore = -1;
    let prevLevel = -1;
    let gameOverFired = false;

    function createBoard(): number[][] {
      return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
    }

    function randomPiece(): Piece {
      const type = Math.floor(Math.random() * 7) + 1;
      const shape = PIECES[type]!.map((row) => [...row]);
      return {
        type,
        shape,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0,
      };
    }

    function collide(shape: number[][], ox: number, oy: number) {
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (!shape[r][c]) continue;
          const nx = ox + c;
          const ny = oy + r;
          if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
          if (ny >= 0 && board[ny][nx]) return true;
        }
      }
      return false;
    }

    function rotateCW(shape: number[][]) {
      const rows = shape.length;
      const cols = shape[0].length;
      const result = Array.from({ length: cols }, () =>
        new Array(rows).fill(0),
      );
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
      return result;
    }

    function tryRotate() {
      const rotated = rotateCW(current.shape);
      const kicks = [0, -1, 1, -2, 2];
      for (const kick of kicks) {
        if (!collide(rotated, current.x + kick, current.y)) {
          current.shape = rotated;
          current.x += kick;
          return;
        }
      }
    }

    function merge() {
      for (let r = 0; r < current.shape.length; r++)
        for (let c = 0; c < current.shape[r].length; c++)
          if (current.shape[r][c])
            board[current.y + r][current.x + c] = current.shape[r][c];
    }

    function clearLines() {
      let cleared = 0;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every((v) => v !== 0)) {
          board.splice(r, 1);
          board.unshift(new Array(COLS).fill(0));
          cleared++;
          r++;
        }
      }
      if (cleared) {
        lines += cleared;
        score += (LINE_SCORES[cleared] || 0) * level;
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (level - 1) * 90);
      }
    }

    function ghostY() {
      let gy = current.y;
      while (!collide(current.shape, current.x, gy + 1)) gy++;
      return gy;
    }

    function hardDrop() {
      const gy = ghostY();
      score += (gy - current.y) * 2;
      current.y = gy;
      lockPiece();
    }

    function softDrop() {
      if (!collide(current.shape, current.x, current.y + 1)) {
        current.y++;
        score += 1;
      } else {
        lockPiece();
      }
    }

    function lockPiece() {
      merge();
      clearLines();
      spawn();
    }

    function spawn() {
      current = next;
      next = randomPiece();
      if (collide(current.shape, current.x, current.y)) {
        endGame();
      }
    }

    function drawBlock(
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      colorIndex: number,
      size: number,
      alpha?: number,
    ) {
      if (!colorIndex) return;
      const color = skinRef.current.colors[colorIndex];
      if (!color) return;
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = color;
      context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      context.fillStyle = skinRef.current.highlight;
      context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
      context.globalAlpha = 1;
    }

    function drawGrid() {
      ctx.strokeStyle = skinRef.current.grid;
      ctx.lineWidth = 0.5;
      for (let c = 1; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * BLOCK, 0);
        ctx.lineTo(c * BLOCK, ROWS * BLOCK);
        ctx.stroke();
      }
      for (let r = 1; r < ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * BLOCK);
        ctx.lineTo(COLS * BLOCK, r * BLOCK);
        ctx.stroke();
      }
    }

    function draw() {
      ctx.fillStyle = skinRef.current.boardBg;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      drawGrid();

      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) drawBlock(ctx, c, r, board[r][c], BLOCK);

      const gy = ghostY();
      for (let r = 0; r < current.shape.length; r++)
        for (let c = 0; c < current.shape[r].length; c++)
          if (current.shape[r][c])
            drawBlock(
              ctx,
              current.x + c,
              gy + r,
              current.shape[r][c],
              BLOCK,
              0.2,
            );

      for (let r = 0; r < current.shape.length; r++)
        for (let c = 0; c < current.shape[r].length; c++)
          if (current.shape[r][c])
            drawBlock(
              ctx,
              current.x + c,
              current.y + r,
              current.shape[r][c],
              BLOCK,
            );
    }

    function drawNext() {
      nextCtx.fillStyle = skinRef.current.boardBg;
      nextCtx.fillRect(0, 0, nextCtx.canvas.width, nextCtx.canvas.height);
      const shape = next.shape;
      const offX = Math.floor((4 - shape[0].length) / 2);
      const offY = Math.floor((4 - shape.length) / 2);
      for (let r = 0; r < shape.length; r++)
        for (let c = 0; c < shape[r].length; c++)
          drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NEXT_BLOCK);
    }

    function updateHUD() {
      if (scoreElRef.current)
        scoreElRef.current.textContent = score.toLocaleString();
      if (linesElRef.current) linesElRef.current.textContent = String(lines);
      if (levelElRef.current) levelElRef.current.textContent = String(level);
    }

    function notifyChanges() {
      const cb = callbacksRef.current;
      if (score !== prevScore) {
        prevScore = score;
        cb.onScoreChange(score);
      }
      if (level !== prevLevel) {
        prevLevel = level;
        cb.onLevelChange(level);
      }
      if (gameOver && !gameOverFired) {
        gameOverFired = true;
        cb.onLivesChange(0);
        cb.onGameOver(score);
      }
    }

    function endGame() {
      gameOver = true;
    }

    function loop(ts: number) {
      if (gameOver) {
        draw();
        drawNext();
        updateHUD();
        notifyChanges();
        return;
      }

      if (!pausedRef.current) {
        const dt = lastTime === 0 ? 0 : ts - lastTime;
        dropAccum += dt;
        if (dropAccum >= dropInterval) {
          dropAccum = 0;
          if (!collide(current.shape, current.x, current.y + 1)) {
            current.y++;
          } else {
            lockPiece();
          }
        }
      }
      lastTime = ts;

      draw();
      drawNext();
      updateHUD();
      notifyChanges();
      animId = requestAnimationFrame(loop);
    }

    const GAME_KEYS = new Set([
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Space',
    ]);

    function handleKeyDown(e: KeyboardEvent) {
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      if (e.code === 'KeyP' || e.code === 'Escape') return;
      if (pausedRef.current || gameOver) return;
      switch (e.code) {
        case 'ArrowLeft':
          if (!collide(current.shape, current.x - 1, current.y)) current.x--;
          break;
        case 'ArrowRight':
          if (!collide(current.shape, current.x + 1, current.y)) current.x++;
          break;
        case 'ArrowDown':
          softDrop();
          break;
        case 'ArrowUp':
        case 'KeyX':
          tryRotate();
          break;
        case 'Space':
          hardDrop();
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    next = randomPiece();
    spawn();
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const currentSkin = SKINS[skin];

  return (
    <div
      ref={outerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: LAYOUT_GAP,
          alignItems: 'stretch',
          justifyContent: 'center',
          width: NATURAL_WIDTH,
          height: NATURAL_HEIGHT,
          flexShrink: 0,
          boxSizing: 'border-box',
          padding: `${LAYOUT_PADDING_Y / 2}px ${LAYOUT_PADDING_X / 2}px`,
          fontFamily: "'Courier New', Courier, monospace",
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <canvas
          ref={boardCanvasRef}
          width={COLS * BLOCK}
          height={ROWS * BLOCK}
          style={{
            display: 'block',
            border: `1px solid ${currentSkin.border}`,
            background: currentSkin.boardBg,
            borderRadius: 4,
          }}
        />

        <aside
          style={{
            width: ASIDE_WIDTH,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            paddingTop: 8,
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span
              style={{
                fontSize: 10,
                letterSpacing: 2,
                color: currentSkin.panelLabel,
                fontWeight: 600,
              }}
            >
              SCORE
            </span>
            <span
              ref={scoreElRef}
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: currentSkin.panelValue,
                letterSpacing: 1,
              }}
            >
              0
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span
              style={{
                fontSize: 10,
                letterSpacing: 2,
                color: currentSkin.panelLabel,
                fontWeight: 600,
              }}
            >
              LINES
            </span>
            <span
              ref={linesElRef}
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: currentSkin.panelValue,
                letterSpacing: 1,
              }}
            >
              0
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span
              style={{
                fontSize: 10,
                letterSpacing: 2,
                color: currentSkin.panelLabel,
                fontWeight: 600,
              }}
            >
              LEVEL
            </span>
            <span
              ref={levelElRef}
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: currentSkin.panelValue,
                letterSpacing: 1,
              }}
            >
              1
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span
              style={{
                fontSize: 10,
                letterSpacing: 2,
                color: currentSkin.panelLabel,
                fontWeight: 600,
              }}
            >
              NEXT
            </span>
            <canvas
              ref={nextCanvasRef}
              width={120}
              height={120}
              style={{
                display: 'block',
                border: `1px solid ${currentSkin.border}`,
                background: currentSkin.boardBg,
                borderRadius: 4,
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span
              style={{
                fontSize: 10,
                letterSpacing: 2,
                color: currentSkin.panelLabel,
                fontWeight: 600,
              }}
            >
              SKIN
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {SKIN_ORDER.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => changeSkin(id)}
                  style={{
                    fontFamily: 'inherit',
                    fontSize: 9,
                    letterSpacing: 1,
                    padding: '4px 6px',
                    borderRadius: 3,
                    cursor: 'pointer',
                    color: skin === id ? SKINS[id].boardBg : SKINS[id].accent,
                    background: skin === id ? SKINS[id].accent : 'transparent',
                    border: `1px solid ${SKINS[id].accent}`,
                  }}
                >
                  {SKINS[id].label}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
