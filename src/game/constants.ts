/**
 * Constants & world configuration for the 1152x1152 Stud Baseplate with Mannequin Player.
 */

export const BASEPLATE_SIZE = 1152;
export const BASEPLATE_HALF = BASEPLATE_SIZE / 2; // 576 units from center in +/- X and Z
export const BASEPLATE_THICKNESS = 16;

// Mannequin character parameters
export const MANNEQUIN_HEIGHT = 5.6;

// Movement & Physics Tuning
export const WALK_SPEED = 18.0;
export const SPRINT_SPEED = 34.0;
export const JUMP_IMPULSE = 23.5;
export const GRAVITY = -48.0;

// World & Respawn
export const VOID_RESPAWN_Y = -35.0;
export const DEFAULT_SPAWN = { x: 0, y: 0.8, z: 0 };

// Classic Palette
export const COLORS = {
  baseplate: 0x8c8d90, // Classic Medium Stone Gray
  spawnPad: 0x9fa3a9,
  curb: 0x475569,
  mannequin: 0xf8fafc,
  mannequinJoint: 0x94a3b8,
};
