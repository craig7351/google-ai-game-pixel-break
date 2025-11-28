export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum BallSpeed {
  SLOW = 4,
  NORMAL = 6,
  FAST = 8,
  INSANE = 10
}

export enum PowerUpType {
  EXPAND = 'EXPAND',
  LASER = 'LASER',
  MULTI = 'MULTI'
}

export interface GameSettings {
  ballCount: number;
  initialSpeed: BallSpeed;
}

export interface Vector {
  x: number;
  y: number;
}

export interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  active: boolean;
  color: string;
}

export interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  active: boolean;
  color: string;
  value: number;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  life: number;
  color: string;
  size: number;
}

export interface PowerUp {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PowerUpType;
  dy: number;
  active: boolean;
}

export interface Laser {
  x: number;
  y: number;
  width: number;
  height: number;
  dy: number;
  active: boolean;
}