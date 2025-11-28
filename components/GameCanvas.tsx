
import React, { useRef, useEffect } from 'react';
import { GameSettings, GameState, Ball, Brick, Paddle, Particle, BallSpeed, PowerUp, Laser, PowerUpType } from '../types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_SPEED,
  PADDLE_Y_OFFSET,
  BALL_RADIUS,
  BRICK_ROWS,
  BRICK_COLS,
  BRICK_PADDING,
  BRICK_OFFSET_TOP,
  BRICK_OFFSET_LEFT,
  BRICK_HEIGHT,
  BRICK_WIDTH,
  COLORS,
  SPEED_INCREMENT_INTERVAL,
  SPEED_INCREMENT_AMOUNT,
  MAX_BALL_SPEED,
  POWERUP_CHANCE,
  POWERUP_SIZE,
  POWERUP_SPEED,
  POWERUP_DURATION_EXPAND,
  POWERUP_DURATION_LASER,
  LASER_COOLDOWN,
  LASER_HEIGHT,
  LASER_SPEED,
  LASER_WIDTH
} from '../constants';
import { audioManager } from '../audio';

interface GameCanvasProps {
  settings: GameSettings;
  onGameOver: (score: number, won: boolean) => void;
  onBack: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ settings, onGameOver, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Game State Refs (using refs to avoid closure staleness in loop)
  const gameState = useRef<{
    score: number;
    lives: number;
    status: GameState;
    balls: Ball[];
    paddle: Paddle;
    bricks: Brick[];
    particles: Particle[];
    powerUps: PowerUp[];
    lasers: Laser[];
    keysPressed: Set<string>;
    lastSpeedIncrease: number;
    speedMultiplier: number;
    startTime: number;
    activeEffects: {
      expandUntil: number;
      laserUntil: number;
      lastLaserShot: number;
    }
  }>({
    score: 0,
    lives: 3,
    status: GameState.PLAYING,
    balls: [],
    paddle: {
      x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
      y: CANVAS_HEIGHT - PADDLE_Y_OFFSET,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      color: COLORS.PADDLE
    },
    bricks: [],
    particles: [],
    powerUps: [],
    lasers: [],
    keysPressed: new Set(),
    lastSpeedIncrease: Date.now(),
    speedMultiplier: 1,
    startTime: Date.now(),
    activeEffects: {
      expandUntil: 0,
      laserUntil: 0,
      lastLaserShot: 0
    }
  });

  // Initialization
  useEffect(() => {
    initGame();
    audioManager.startBGM();
    
    // Input listeners
    const handleKeyDown = (e: KeyboardEvent) => gameState.current.keysPressed.add(e.key);
    const handleKeyUp = (e: KeyboardEvent) => gameState.current.keysPressed.delete(e.key);

    // Touch controls
    const handleTouchStart = (e: TouchEvent) => {
      const touchX = e.touches[0].clientX;
      if (touchX < window.innerWidth / 2) {
        gameState.current.keysPressed.add('ArrowLeft');
      } else {
        gameState.current.keysPressed.add('ArrowRight');
      }
    };
    const handleTouchEnd = () => {
      gameState.current.keysPressed.delete('ArrowLeft');
      gameState.current.keysPressed.delete('ArrowRight');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    // Start loop
    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      audioManager.stopBGM();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initGame = () => {
    // Create Bricks
    const bricks: Brick[] = [];
    for (let c = 0; c < BRICK_COLS; c++) {
      for (let r = 0; r < BRICK_ROWS; r++) {
        bricks.push({
          x: (c * (BRICK_WIDTH + BRICK_PADDING)) + BRICK_OFFSET_LEFT,
          y: (r * (BRICK_HEIGHT + BRICK_PADDING)) + BRICK_OFFSET_TOP,
          w: BRICK_WIDTH,
          h: BRICK_HEIGHT,
          active: true,
          color: COLORS.BRICKS[r % COLORS.BRICKS.length],
          value: (BRICK_ROWS - r) * 10
        });
      }
    }

    // Create Balls
    const balls: Ball[] = [];
    for (let i = 0; i < settings.ballCount; i++) {
      // Spread balls slightly if multi-ball
      const offsetX = (i - (settings.ballCount - 1) / 2) * 20;
      const speed = settings.initialSpeed;
      
      // Calculate angle: straight up with slight deviation
      const angle = -Math.PI / 2 + (i - (settings.ballCount - 1) / 2) * 0.2;

      balls.push({
        x: CANVAS_WIDTH / 2 + offsetX,
        y: CANVAS_HEIGHT - PADDLE_Y_OFFSET - 30,
        dx: speed * Math.cos(angle),
        dy: speed * Math.sin(angle),
        active: true,
        color: COLORS.BALL
      });
    }

    gameState.current = {
      ...gameState.current,
      score: 0,
      lives: 3,
      status: GameState.PLAYING,
      bricks,
      balls,
      paddle: {
        x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
        y: CANVAS_HEIGHT - PADDLE_Y_OFFSET,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        color: COLORS.PADDLE
      },
      particles: [],
      powerUps: [],
      lasers: [],
      lastSpeedIncrease: Date.now(),
      speedMultiplier: 1,
      startTime: Date.now(),
      activeEffects: {
        expandUntil: 0,
        laserUntil: 0,
        lastLaserShot: 0
      }
    };
  };

  const createParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 8; i++) {
      gameState.current.particles.push({
        x,
        y,
        dx: (Math.random() - 0.5) * 4,
        dy: (Math.random() - 0.5) * 4,
        life: 1.0,
        color: color,
        size: Math.random() * 3 + 2
      });
    }
  };

  const spawnPowerUp = (x: number, y: number) => {
    if (Math.random() > POWERUP_CHANCE) return;

    const rand = Math.random();
    let type = PowerUpType.MULTI;
    if (rand < 0.33) type = PowerUpType.EXPAND;
    else if (rand < 0.66) type = PowerUpType.LASER;

    gameState.current.powerUps.push({
      x: x - POWERUP_SIZE / 2,
      y: y,
      width: POWERUP_SIZE,
      height: POWERUP_SIZE,
      type,
      dy: POWERUP_SPEED,
      active: true
    });
  };

  const update = () => {
    const state = gameState.current;
    if (state.status !== GameState.PLAYING) return;

    const now = Date.now();

    // --- Effect Management ---
    // Expand
    if (now < state.activeEffects.expandUntil) {
      state.paddle.width = PADDLE_WIDTH * 1.5;
    } else {
      state.paddle.width = PADDLE_WIDTH;
    }
    
    // Laser
    if (now < state.activeEffects.laserUntil) {
       state.paddle.color = COLORS.PADDLE_LASER;
       if (now - state.activeEffects.lastLaserShot > LASER_COOLDOWN) {
          state.lasers.push({
            x: state.paddle.x + 2,
            y: state.paddle.y,
            width: LASER_WIDTH,
            height: LASER_HEIGHT,
            dy: -LASER_SPEED,
            active: true
          });
          state.lasers.push({
            x: state.paddle.x + state.paddle.width - LASER_WIDTH - 2,
            y: state.paddle.y,
            width: LASER_WIDTH,
            height: LASER_HEIGHT,
            dy: -LASER_SPEED,
            active: true
          });
          state.activeEffects.lastLaserShot = now;
          audioManager.playLaserShoot();
       }
    } else {
      state.paddle.color = COLORS.PADDLE;
    }


    // --- Speed Increase Logic ---
    if (now - state.lastSpeedIncrease > SPEED_INCREMENT_INTERVAL) {
      state.speedMultiplier = Math.min(state.speedMultiplier * SPEED_INCREMENT_AMOUNT, 2.5); // Cap at 2.5x
      state.lastSpeedIncrease = now;
    }

    // --- Move Paddle ---
    if (state.keysPressed.has('ArrowLeft')) {
      state.paddle.x -= PADDLE_SPEED;
    }
    if (state.keysPressed.has('ArrowRight')) {
      state.paddle.x += PADDLE_SPEED;
    }

    // Clamp Paddle
    if (state.paddle.x < 0) state.paddle.x = 0;
    if (state.paddle.x + state.paddle.width > CANVAS_WIDTH) state.paddle.x = CANVAS_WIDTH - state.paddle.width;

    // --- Lasers ---
    for (let i = state.lasers.length - 1; i >= 0; i--) {
      const laser = state.lasers[i];
      laser.y += laser.dy;

      // Off screen
      if (laser.y < 0) {
        laser.active = false;
        state.lasers.splice(i, 1);
        continue;
      }

      // Check Brick Collision
      for (const brick of state.bricks) {
        if (!brick.active) continue;
        if (
          laser.x < brick.x + brick.w &&
          laser.x + laser.width > brick.x &&
          laser.y < brick.y + brick.h &&
          laser.y + laser.height > brick.y
        ) {
          brick.active = false;
          laser.active = false;
          state.lasers.splice(i, 1);
          state.score += Math.floor(brick.value / 2); // Less points for laser kills
          createParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color);
          spawnPowerUp(brick.x + brick.w / 2, brick.y + brick.h / 2);
          audioManager.playBrickHit(0.5); // Lower pitch for laser hit
          break; 
        }
      }
    }

    // --- Power Ups ---
    for (let i = state.powerUps.length - 1; i >= 0; i--) {
      const p = state.powerUps[i];
      p.y += p.dy;

      // Off screen
      if (p.y > CANVAS_HEIGHT) {
        p.active = false;
        state.powerUps.splice(i, 1);
        continue;
      }

      // Collect
      if (
        p.x < state.paddle.x + state.paddle.width &&
        p.x + p.width > state.paddle.x &&
        p.y < state.paddle.y + state.paddle.height &&
        p.y + p.height > state.paddle.y
      ) {
        p.active = false;
        state.powerUps.splice(i, 1);
        audioManager.playPowerUpCollect();
        
        // Activate Effect
        if (p.type === PowerUpType.EXPAND) {
          state.activeEffects.expandUntil = now + POWERUP_DURATION_EXPAND;
        } else if (p.type === PowerUpType.LASER) {
          state.activeEffects.laserUntil = now + POWERUP_DURATION_LASER;
        } else if (p.type === PowerUpType.MULTI) {
          // Clone existing balls
          const newBalls: Ball[] = [];
          state.balls.forEach(ball => {
            if (ball.active) {
               // Clone 1
               newBalls.push({
                 ...ball,
                 dx: ball.dx * 0.8 + ball.dy * 0.2, // Perturb angle slightly
                 dy: ball.dy * 0.8 - ball.dx * 0.2
               });
               // Clone 2
               newBalls.push({
                 ...ball,
                 dx: ball.dx * 0.8 - ball.dy * 0.2,
                 dy: ball.dy * 0.8 + ball.dx * 0.2
               });
            }
          });
          state.balls.push(...newBalls);
        }
      }
    }

    // --- Move Balls ---
    let activeBalls = 0;
    state.balls.forEach(ball => {
      if (!ball.active) return;
      activeBalls++;

      // Apply dynamic speed multiplier
      const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      if (currentSpeed < MAX_BALL_SPEED) {
          ball.x += ball.dx * state.speedMultiplier;
          ball.y += ball.dy * state.speedMultiplier;
      } else {
          ball.x += ball.dx;
          ball.y += ball.dy;
      }

      // Wall Collisions
      let wallHit = false;
      if (ball.x + BALL_RADIUS > CANVAS_WIDTH) {
        ball.dx = -Math.abs(ball.dx); // Always go left
        ball.x = CANVAS_WIDTH - BALL_RADIUS; // unstuck
        wallHit = true;
      } else if (ball.x - BALL_RADIUS < 0) {
        ball.dx = Math.abs(ball.dx); // Always go right
        ball.x = BALL_RADIUS; // unstuck
        wallHit = true;
      }

      if (ball.y - BALL_RADIUS < 0) {
        ball.dy = Math.abs(ball.dy); // Always go down
        ball.y = BALL_RADIUS; // unstuck
        wallHit = true;
      }

      if (wallHit) {
        audioManager.playWallHit();
      }

      // Paddle Collision
      if (
        ball.y + BALL_RADIUS >= state.paddle.y &&
        ball.y - BALL_RADIUS <= state.paddle.y + state.paddle.height &&
        ball.x >= state.paddle.x &&
        ball.x <= state.paddle.x + state.paddle.width
      ) {
        // Advanced bounce logic based on where it hit the paddle
        let collidePoint = ball.x - (state.paddle.x + state.paddle.width / 2);
        // Normalize the value between -1 and 1
        collidePoint = collidePoint / (state.paddle.width / 2);

        // Calculate rebound angle (max 60 degrees)
        const angle = collidePoint * (Math.PI / 3);
        
        // Base speed
        const baseSpeed = settings.initialSpeed; 
        
        ball.dx = baseSpeed * Math.sin(angle);
        ball.dy = -baseSpeed * Math.cos(angle);
        
        // Ensure ball is above paddle to prevent sticking
        ball.y = state.paddle.y - BALL_RADIUS - 1; 

        createParticles(ball.x, state.paddle.y, '#ffffff');
        audioManager.playPaddleHit();
      }

      // Brick Collision
      for (const brick of state.bricks) {
        if (!brick.active) continue;

        if (
          ball.x + BALL_RADIUS > brick.x &&
          ball.x - BALL_RADIUS < brick.x + brick.w &&
          ball.y + BALL_RADIUS > brick.y &&
          ball.y - BALL_RADIUS < brick.y + brick.h
        ) {
          brick.active = false;
          state.score += brick.value;
          createParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color);
          
          spawnPowerUp(brick.x + brick.w / 2, brick.y + brick.h / 2);

          // Simple bounce logic
          const overlapLeft = (ball.x + BALL_RADIUS) - brick.x;
          const overlapRight = (brick.x + brick.w) - (ball.x - BALL_RADIUS);
          const overlapTop = (ball.y + BALL_RADIUS) - brick.y;
          const overlapBottom = (brick.y + brick.h) - (ball.y - BALL_RADIUS);

          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

          if (minOverlap === overlapLeft || minOverlap === overlapRight) {
            ball.dx = -ball.dx;
          } else {
            ball.dy = -ball.dy;
          }
          
          // Pitch variation based on brick value (higher value = higher pitch)
          audioManager.playBrickHit(1 + (brick.value / 100)); 
          break; // One brick per frame per ball
        }
      }

      // Bottom Collision (Ball lost)
      if (ball.y - BALL_RADIUS > CANVAS_HEIGHT) {
        ball.active = false;
      }
    });

    // Handle audio for lost ball separately to avoid spam if multiball
    if (state.balls.filter(b => b.active).length < activeBalls) {
       // A ball died this frame
       if (state.balls.filter(b => b.active).length === 0) {
           audioManager.playBallLost();
       }
    }

    // Check Win Condition
    if (state.bricks.every(b => !b.active)) {
      state.status = GameState.VICTORY;
      audioManager.playWin();
      onGameOver(state.score, true);
    }

    // Check Loss Condition
    if (activeBalls === 0) {
      if (state.lives > 1) {
        state.lives--;
        // Reset effects
        state.activeEffects = { expandUntil: 0, laserUntil: 0, lastLaserShot: 0 };
        state.powerUps = []; // Clear falling powerups
        state.lasers = [];

        // Reset balls
        state.balls = [];
        for (let i = 0; i < settings.ballCount; i++) {
          const offsetX = (i - (settings.ballCount - 1) / 2) * 20;
          const speed = settings.initialSpeed;
          const angle = -Math.PI / 2 + (i - (settings.ballCount - 1) / 2) * 0.2;
          state.balls.push({
            x: CANVAS_WIDTH / 2 + offsetX,
            y: CANVAS_HEIGHT - PADDLE_Y_OFFSET - 30,
            dx: speed * Math.cos(angle),
            dy: speed * Math.sin(angle),
            active: true,
            color: COLORS.BALL
          });
        }
        state.speedMultiplier = 1;
        state.lastSpeedIncrease = Date.now();
      } else {
        state.status = GameState.GAME_OVER;
        audioManager.playGameOver();
        onGameOver(state.score, false);
      }
    }

    // Update Particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.dx;
      p.y += p.dy;
      p.life -= 0.02;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const state = gameState.current;

    // Clear Screen
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Bricks
    state.bricks.forEach(brick => {
      if (!brick.active) return;
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(brick.x, brick.y, brick.w, 4); // Top highlight
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(brick.x, brick.y + brick.h - 4, brick.w, 4); // Bottom shadow
    });

    // Draw Lasers
    ctx.fillStyle = '#ef4444';
    state.lasers.forEach(laser => {
       ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
    });

    // Draw PowerUps
    state.powerUps.forEach(p => {
      if (!p.active) return;
      ctx.fillStyle = COLORS.POWERUPS[p.type];
      ctx.fillRect(p.x, p.y, p.width, p.height);
      
      // Border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, p.width, p.height);

      // Letter
      ctx.fillStyle = '#fff';
      ctx.font = '10px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = p.type === PowerUpType.EXPAND ? 'E' : p.type === PowerUpType.MULTI ? 'M' : 'L';
      ctx.fillText(label, p.x + p.width/2, p.y + p.height/2);
    });
    // Reset alignment
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Draw Paddle
    ctx.fillStyle = state.paddle.color;
    ctx.fillRect(state.paddle.x, state.paddle.y, state.paddle.width, state.paddle.height);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; // lighter blue
    ctx.fillRect(state.paddle.x + 4, state.paddle.y + 4, state.paddle.width - 8, state.paddle.height - 8);

    // Draw Balls
    state.balls.forEach(ball => {
      if (!ball.active) return;
      ctx.beginPath();
      ctx.fillStyle = ball.color;
      ctx.fillRect(ball.x - BALL_RADIUS, ball.y - BALL_RADIUS, BALL_RADIUS * 2, BALL_RADIUS * 2);
      ctx.closePath();
    });

    // Draw Particles
    state.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.globalAlpha = 1.0;
    });

    // Draw HUD
    ctx.font = '16px "Press Start 2P"';
    ctx.fillStyle = COLORS.TEXT;
    ctx.fillText(`SCORE: ${state.score}`, 20, 30);
    ctx.fillText(`LIVES: ${state.lives}`, CANVAS_WIDTH - 150, 30);
    
    // Speed Indicator
    const timeElapsed = Math.floor((Date.now() - state.startTime) / 1000);
    ctx.font = '10px "Press Start 2P"';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`TIME: ${timeElapsed}s`, 20, CANVAS_HEIGHT - 10);
    ctx.fillStyle = state.speedMultiplier > 1.5 ? '#ef4444' : '#22c55e';
    ctx.fillText(`SPEED: ${state.speedMultiplier.toFixed(1)}x`, CANVAS_WIDTH - 150, CANVAS_HEIGHT - 10);
    
    // PowerUp Indicator
    const now = Date.now();
    if (now < state.activeEffects.expandUntil) {
       ctx.fillStyle = '#22c55e';
       ctx.fillText(`EXPAND: ${Math.ceil((state.activeEffects.expandUntil - now)/1000)}s`, CANVAS_WIDTH / 2 - 50, 30);
    } else if (now < state.activeEffects.laserUntil) {
       ctx.fillStyle = '#ef4444';
       ctx.fillText(`LASER: ${Math.ceil((state.activeEffects.laserUntil - now)/1000)}s`, CANVAS_WIDTH / 2 - 50, 30);
    }
  };

  const gameLoop = () => {
    update();
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        draw(ctx);
      }
    }
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  return (
    <div className="relative border-4 border-slate-700 shadow-2xl">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="block max-w-full h-auto bg-slate-900 cursor-none touch-none"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-none md:hidden opacity-50">
          <div className="w-16 h-16 border-2 border-white rounded-full flex items-center justify-center text-white text-2xl">←</div>
          <div className="w-16 h-16 border-2 border-white rounded-full flex items-center justify-center text-white text-2xl">→</div>
      </div>
    </div>
  );
};

export default GameCanvas;
