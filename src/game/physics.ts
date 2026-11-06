/**
 * Physics character controller for the humanoid mannequin on the 1152x1152 baseplate.
 * Handles responsive third-person movement, sprinting, jumping, collision against
 * the baseplate and spawn pad, and footstep sound timing.
 */

import * as THREE from 'three';
import { soundEngine } from './audio';

export const BASEPLATE_SIZE = 1152;
export const BASEPLATE_HALF = BASEPLATE_SIZE / 2; // 576 units

export const WALK_SPEED = 18.0;
export const SPRINT_SPEED = 34.0;
export const ACCELERATION = 85.0;
export const AIR_ACCELERATION = 22.0;
export const JUMP_IMPULSE = 23.5;
export const GRAVITY = -48.0;
export const VOID_RESPAWN_Y = -35.0;
export const DEFAULT_SPAWN = { x: 0, y: 0.8, z: 0 };

export interface CharacterInput {
  moveForward: number; // -1 to 1
  moveRight: number; // -1 to 1
  jump: boolean;
  sprint: boolean;
  cameraAngleY: number; // Camera azimuth to steer relative to view
}

export interface BoxCollider {
  id: string;
  min: THREE.Vector3;
  max: THREE.Vector3;
}

const _moveDir = new THREE.Vector3();
const _targetVel = new THREE.Vector3();

export class MannequinPhysics {
  public position: THREE.Vector3 = new THREE.Vector3(DEFAULT_SPAWN.x, DEFAULT_SPAWN.y, DEFAULT_SPAWN.z);
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public facingAngle: number = 0;
  public isGrounded: boolean = true;
  public isSprinting: boolean = false;

  public boxes: BoxCollider[] = [];

  private jumpCooldown: number = 0;
  private footstepTimer: number = 0;

  public onRespawn?: () => void;

  constructor() {
    this.reset();
  }

  public reset(x = DEFAULT_SPAWN.x, y = DEFAULT_SPAWN.y, z = DEFAULT_SPAWN.z) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.facingAngle = 0;
    this.isGrounded = true;
    this.isSprinting = false;
  }

  public respawn() {
    this.reset();
    soundEngine.playRespawn();
    this.onRespawn?.();
  }

  public update(dt: number, input: CharacterInput) {
    const clampedDt = Math.min(dt, 0.05);

    if (this.jumpCooldown > 0) {
      this.jumpCooldown -= clampedDt;
    }

    // 1. Calculate Movement Vector relative to Camera Azimuth
    const cosA = Math.cos(input.cameraAngleY);
    const sinA = Math.sin(input.cameraAngleY);
    const camFwdX = -sinA;
    const camFwdZ = -cosA;
    const camRightX = -camFwdZ;
    const camRightZ = camFwdX;

    _moveDir.set(
      camFwdX * input.moveForward + camRightX * input.moveRight,
      0,
      camFwdZ * input.moveForward + camRightZ * input.moveRight
    );

    const hasInput = _moveDir.lengthSq() > 0.001;
    if (hasInput) {
      _moveDir.normalize();

      // Smoothly rotate facing angle towards movement direction
      const targetAngle = Math.atan2(_moveDir.x, _moveDir.z);
      let diff = targetAngle - this.facingAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.facingAngle += diff * Math.min(clampedDt * 16.0, 1.0);
    }

    this.isSprinting = input.sprint && hasInput && this.isGrounded;
    const maxSpeed = this.isSprinting ? SPRINT_SPEED : WALK_SPEED;

    // 2. Horizontal Velocity Integration
    if (this.isGrounded) {
      if (hasInput) {
        _targetVel.copy(_moveDir).multiplyScalar(maxSpeed);
        // Snappy ground acceleration
        this.velocity.x = THREE.MathUtils.damp(this.velocity.x, _targetVel.x, 14.0, clampedDt);
        this.velocity.z = THREE.MathUtils.damp(this.velocity.z, _targetVel.z, 14.0, clampedDt);
      } else {
        // Snappy ground deceleration to stop
        this.velocity.x = THREE.MathUtils.damp(this.velocity.x, 0, 18.0, clampedDt);
        this.velocity.z = THREE.MathUtils.damp(this.velocity.z, 0, 18.0, clampedDt);
      }

      // Jump
      if (input.jump && this.jumpCooldown <= 0) {
        this.velocity.y = JUMP_IMPULSE;
        this.isGrounded = false;
        this.jumpCooldown = 0.25;
        soundEngine.playJump();
      }

      // Footstep audio timing
      const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
      if (horizontalSpeed > 1.0) {
        this.footstepTimer += clampedDt * (this.isSprinting ? 5.2 : 3.6);
        if (this.footstepTimer >= 1.0) {
          this.footstepTimer = 0;
          soundEngine.playFootstep(this.isSprinting);
        }
      } else {
        this.footstepTimer = 0.5; // Ready to tap on initial step
      }
    } else {
      // In-air physics
      this.velocity.y += GRAVITY * clampedDt;

      // Gentle air steering
      if (hasInput) {
        this.velocity.x += _moveDir.x * AIR_ACCELERATION * clampedDt;
        this.velocity.z += _moveDir.z * AIR_ACCELERATION * clampedDt;
        // Clamp horizontal air speed
        const airHoriz = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        if (airHoriz > maxSpeed) {
          const ratio = maxSpeed / airHoriz;
          this.velocity.x *= ratio;
          this.velocity.z *= ratio;
        }
      }
    }

    // 3. Position Integration
    this.position.x += this.velocity.x * clampedDt;
    this.position.y += this.velocity.y * clampedDt;
    this.position.z += this.velocity.z * clampedDt;

    // 4. Collision Resolution with Baseplate & Spawn Pad
    this.resolveCollisions();

    // 5. Fall into Void Reset
    if (this.position.y < VOID_RESPAWN_Y) {
      this.respawn();
    }
  }

  private resolveCollisions() {
    this.isGrounded = false;

    // 1. Raised Spawn Pad Platform (24 x 24 units, Y = 0.8)
    const inSpawnX = Math.abs(this.position.x) <= 12.0;
    const inSpawnZ = Math.abs(this.position.z) <= 12.0;

    if (inSpawnX && inSpawnZ && this.position.y >= 0.0) {
      const spawnFloorY = 0.8;
      if (this.position.y <= spawnFloorY) {
        if (this.velocity.y < -4.0) {
          soundEngine.playImpact(Math.abs(this.velocity.y));
        }
        this.position.y = spawnFloorY;
        this.velocity.y = 0;
        this.isGrounded = true;
        return;
      }
    }

    // 2. 1152 x 1152 Baseplate Floor (Y = 0, X and Z in [-576, +576])
    const inBaseplateX = Math.abs(this.position.x) <= BASEPLATE_HALF;
    const inBaseplateZ = Math.abs(this.position.z) <= BASEPLATE_HALF;

    if (inBaseplateX && inBaseplateZ) {
      const floorY = 0;
      if (this.position.y <= floorY) {
        if (this.velocity.y < -4.0) {
          soundEngine.playImpact(Math.abs(this.velocity.y));
        }
        this.position.y = floorY;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
    }

    // 3. Perimeter Curbs
    for (const box of this.boxes) {
      if (
        this.position.x >= box.min.x - 0.5 &&
        this.position.x <= box.max.x + 0.5 &&
        this.position.z >= box.min.z - 0.5 &&
        this.position.z <= box.max.z + 0.5 &&
        this.position.y < box.max.y
      ) {
        // Push back
        if (this.position.x < box.min.x) this.position.x = box.min.x - 0.5;
        else if (this.position.x > box.max.x) this.position.x = box.max.x + 0.5;
        if (this.position.z < box.min.z) this.position.z = box.min.z - 0.5;
        else if (this.position.z > box.max.z) this.position.z = box.max.z + 0.5;
      }
    }
  }
}
