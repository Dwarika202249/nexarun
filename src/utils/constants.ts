// Lane positions (X-axis)
export const LANES = {
  LEFT: -3,
  CENTER: 0,
  RIGHT: 3,
} as const;

export const LANE_POSITIONS: readonly number[] = [LANES.LEFT, LANES.CENTER, LANES.RIGHT];

export type LaneDirection = 'LEFT' | 'RIGHT';

export const GAME = {
  // Track
  TILE_LENGTH: 30,
  TILE_WIDTH: 9,
  VISIBLE_TILES: 6,

  // Speed (Subway Surfer dynamic pace)
  INITIAL_SPEED: 28,
  MAX_SPEED: 65,
  SPEED_INCREMENT: 1.5,
  SPEED_RAMP_DISTANCE: 250,

  // Physics (manual)
  GRAVITY: -35,
  JUMP_FORCE: 14,
  GROUND_Y: 0.9,

  // Runner
  RUNNER_HEIGHT: 1.8,
  RUNNER_RADIUS: 0.4,
  LANE_SWITCH_SPEED: 0.18,
  INITIAL_LIVES: 3,
  INVINCIBLE_DURATION: 2,
  ROLL_DURATION: 0.7,
  ROLL_SCALE_Y: 0.4,

  // Spawning
  OBSTACLE_POOL_SIZE: 15,
  COIN_POOL_SIZE: 40,
  SPAWN_DISTANCE: 70,
  DESPAWN_DISTANCE: 25,
  OBSTACLE_INITIAL_INTERVAL: 2.8,
  OBSTACLE_MIN_INTERVAL: 1.0,
  COIN_SPAWN_INTERVAL: 2.5,
  COIN_VALUE: 10,
  COIN_RADIUS: 0.8,
  
  // Power-ups
  POWERUP_SPAWN_CHANCE: 0.20, // 20% chance to spawn instead of a coin cluster
  POWERUP_DURATION: 10, // seconds
  MAGNET_RADIUS: 10,

  // Camera
  CAM_RADIUS: 14,
  CAM_HEIGHT: 6,
  CAM_ROTATION: 180,
  CAM_ACCELERATION: 0.1,
  CAM_MAX_SPEED: 45,

  // Input (mobile-first)
  SWIPE_THRESHOLD: 30,
  TAP_MAX_DURATION: 250,
};


// Colors — cyberpunk palette
export const COLORS = {
  NEON_CYAN: '#00f5ff',
  NEON_MAGENTA: '#ff00ff',
  NEON_GOLD: '#ffd700',
  DARK_BG: '#0a0a1a',
  DARK_SURFACE: '#12122a',
} as const;
