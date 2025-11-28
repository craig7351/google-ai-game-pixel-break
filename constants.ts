import { BallSpeed, PowerUpType } from "./types";

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const PADDLE_WIDTH = 100;
export const PADDLE_HEIGHT = 16;
export const PADDLE_SPEED = 8;
export const PADDLE_Y_OFFSET = 30; // Distance from bottom

export const BALL_RADIUS = 6;
export const MAX_BALL_SPEED = 14; // Cap for speed increase

export const BRICK_ROWS = 6;
export const BRICK_COLS = 10;
export const BRICK_PADDING = 8;
export const BRICK_OFFSET_TOP = 60;
export const BRICK_OFFSET_LEFT = 35;
export const BRICK_HEIGHT = 24;

// Calculated Brick Width
export const BRICK_WIDTH = (CANVAS_WIDTH - (BRICK_OFFSET_LEFT * 2) - (BRICK_PADDING * (BRICK_COLS - 1))) / BRICK_COLS;

export const SPEED_INCREMENT_INTERVAL = 10000; // Increase speed every 10 seconds
export const SPEED_INCREMENT_AMOUNT = 1.1; // 10% faster

// Power Ups
export const POWERUP_SIZE = 20;
export const POWERUP_SPEED = 2;
export const POWERUP_CHANCE = 0.15; // 15% chance per brick
export const POWERUP_DURATION_EXPAND = 10000; // 10s
export const POWERUP_DURATION_LASER = 8000; // 8s
export const LASER_SPEED = 12;
export const LASER_WIDTH = 4;
export const LASER_HEIGHT = 12;
export const LASER_COOLDOWN = 400; // ms between shots

export const COLORS = {
  PADDLE: '#3b82f6', // blue-500
  PADDLE_LASER: '#ef4444', // red-500 (when laser active)
  BALL: '#ffffff',
  TEXT: '#ffffff',
  BACKGROUND: '#0f172a', // slate-900
  BRICKS: [
    '#ef4444', // red-500
    '#f97316', // orange-500
    '#eab308', // yellow-500
    '#22c55e', // green-500
    '#06b6d4', // cyan-500
    '#8b5cf6', // violet-500
  ],
  POWERUPS: {
    [PowerUpType.EXPAND]: '#22c55e', // Green
    [PowerUpType.LASER]: '#ef4444', // Red
    [PowerUpType.MULTI]: '#eab308' // Yellow
  }
};

export const SPEED_LABELS: Record<BallSpeed, string> = {
  [BallSpeed.SLOW]: "RELAXED",
  [BallSpeed.NORMAL]: "NORMAL",
  [BallSpeed.FAST]: "INTENSE",
  [BallSpeed.INSANE]: "NIGHTMARE",
};