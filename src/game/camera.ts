/**
 * Smooth Third-Person Chase & Orbit Camera Controller for Mannequin Humanoid.
 * Provides exponential damping, mouse look orbit, distance zoom, and camera modes.
 */

import * as THREE from 'three';

export type CameraMode = '3rd Person' | '1st Person';

export class ThirdPersonCamera {
  public camera: THREE.PerspectiveCamera;
  public mode: CameraMode = '3rd Person';

  // Spherical orbit parameters
  public azimuth: number = 0; // Horizontal angle in radians
  public elevation: number = 0.35; // Vertical pitch in radians (~20 degrees)
  public distance: number = 16.0; // Distance from character

  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private currentCameraPos: THREE.Vector3 = new THREE.Vector3();
  private currentLookAt: THREE.Vector3 = new THREE.Vector3();

  private isDragging: boolean = false;
  private previousMouseX: number = 0;
  private previousMouseY: number = 0;

  private baseFov: number = 60;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(this.baseFov, aspect, 0.1, 2000);
    this.currentCameraPos.set(0, 8, 16);
    this.currentLookAt.set(0, 3.2, 0);
    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentLookAt);
  }

  public setAspect(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  public handlePointerDown(clientX: number, clientY: number) {
    this.isDragging = true;
    this.previousMouseX = clientX;
    this.previousMouseY = clientY;
  }

  public handlePointerMove(clientX: number, clientY: number) {
    if (!this.isDragging) return;
    const deltaX = clientX - this.previousMouseX;
    const deltaY = clientY - this.previousMouseY;
    this.previousMouseX = clientX;
    this.previousMouseY = clientY;

    // Mouse sensitivity:
    // Drag left -> looks left, Drag right -> looks right
    // Drag up -> looks up, Drag down -> looks down
    const sensitivity = 0.0055;
    this.azimuth -= deltaX * sensitivity;
    this.elevation += deltaY * sensitivity;

    // Clamp elevation to avoid flipping or clipping into floor
    this.elevation = Math.max(0.06, Math.min(1.42, this.elevation));
  }

  public handlePointerUp() {
    this.isDragging = false;
  }

  public handleZoom(deltaY: number) {
    // Zooming is only applicable in 3rd person mode
    if (this.mode === '3rd Person') {
      this.distance += deltaY * 0.015;
      this.distance = Math.max(5.0, Math.min(45.0, this.distance));
    }
  }

  public togglePerspective(): CameraMode {
    this.mode = this.mode === '3rd Person' ? '1st Person' : '3rd Person';
    return this.mode;
  }

  public cycleMode(): CameraMode {
    return this.togglePerspective();
  }

  public setMode(mode: CameraMode) {
    this.mode = mode;
  }

  public update(characterPos: THREE.Vector3, characterVelocity: THREE.Vector3, delta: number) {
    this.targetPosition.copy(characterPos);
    const speed = characterVelocity.length();

    if (this.mode === '1st Person') {
      // 1st Person view: place camera at head / eye height (~4.8 units above feet)
      const eyeHeight = 4.8;
      const desiredEyePos = new THREE.Vector3(
        this.targetPosition.x,
        this.targetPosition.y + eyeHeight,
        this.targetPosition.z
      );

      // Smooth camera position follow
      const dampLambda = 24.0;
      this.currentCameraPos.lerp(desiredEyePos, 1.0 - Math.exp(-dampLambda * delta));
      this.camera.position.copy(this.currentCameraPos);

      // Pitch: elevation 0.45 is level horizon. Drag up decreases elevation -> pitch increases (looks up).
      const pitch = (0.45 - this.elevation) * 1.4;
      const cosPitch = Math.cos(pitch);
      const sinPitch = Math.sin(pitch);
      const fwdX = -Math.sin(this.azimuth) * cosPitch;
      const fwdY = sinPitch;
      const fwdZ = -Math.cos(this.azimuth) * cosPitch;

      const lookTarget = new THREE.Vector3(
        this.currentCameraPos.x + fwdX * 20,
        this.currentCameraPos.y + fwdY * 20,
        this.currentCameraPos.z + fwdZ * 20
      );
      this.camera.lookAt(lookTarget);

      // FOV response
      const targetFov = this.baseFov + Math.min(speed * 0.18, 12.0);
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 4.0, delta);
      this.camera.updateProjectionMatrix();
      return;
    }

    // 3rd Person Mode:
    // In chase mode, if moving forward without manual dragging, camera gently follows movement direction
    if (!this.isDragging && speed > 3.0) {
      const velAngle = Math.atan2(-characterVelocity.x, -characterVelocity.z);
      let diff = velAngle - this.azimuth;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.azimuth += diff * Math.min(delta * 1.8, 0.09);
    }

    const horizontalDist = this.distance * Math.cos(this.elevation);
    const desiredX = this.targetPosition.x + horizontalDist * Math.sin(this.azimuth);
    const desiredY = Math.max(1.2, this.targetPosition.y + this.distance * Math.sin(this.elevation) + 1.2);
    const desiredZ = this.targetPosition.z + horizontalDist * Math.cos(this.azimuth);
    const desiredCameraPos = new THREE.Vector3(desiredX, desiredY, desiredZ);

    // Exponential damping for smooth tracking
    const dampLambda = 14.0;
    this.currentCameraPos.lerp(desiredCameraPos, 1.0 - Math.exp(-dampLambda * delta));

    // Look-at point: centered on the mannequin's chest/head (~3.2 units above feet)
    const desiredLookAt = new THREE.Vector3(
      this.targetPosition.x,
      this.targetPosition.y + 3.2,
      this.targetPosition.z
    );
    this.currentLookAt.lerp(desiredLookAt, 1.0 - Math.exp(-dampLambda * 1.2 * delta));

    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentLookAt);

    // Subtle FOV response on sprinting
    const targetFov = this.baseFov + Math.min(speed * 0.18, 12.0);
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 4.0, delta);
    this.camera.updateProjectionMatrix();
  }
}
