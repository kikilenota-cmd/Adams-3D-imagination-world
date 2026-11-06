/**
 * Main Application Component for 1152x1152 Stud Baseplate with Mannequin Player.
 * Coordinates Three.js WebGL canvas lifecycle, mannequin animations, character physics, and HUD.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { buildWorld } from './game/world';
import { createMannequinModel } from './game/mannequin';
import { ThirdPersonCamera, CameraMode } from './game/camera';
import { soundEngine } from './game/audio';
import { HUD } from './components/HUD';
import { CharacterInput } from './game/physics';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);

  // HUD State (throttled updates)
  const [speed, setSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [altitude, setAltitude] = useState(0.8);
  const [isGrounded, setIsGrounded] = useState(true);
  const [isSprinting, setIsSprinting] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('3rd Person');
  const [isMuted, setIsMuted] = useState(false);

  // Background Music State: default to user's uploaded song "Pure Imagination"
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [trackName, setTrackName] = useState('Pure Imagination');
  const [isCustomTrack, setIsCustomTrack] = useState(true);

  // Input state refs
  const keysRef = useRef<{ [code: string]: boolean }>({});
  const touchInputRef = useRef<{ fwd: number; right: number; jump: boolean; sprint: boolean }>({
    fwd: 0,
    right: 0,
    jump: false,
    sprint: false,
  });

  const cameraCtrlRef = useRef<ThirdPersonCamera | null>(null);
  const physicsRef = useRef<any>(null);
  const maxSpeedTrackerRef = useRef(0);

  // Handlers for HUD buttons
  const handleToggleMute = useCallback(() => {
    soundEngine.resume();
    const nextMuted = !soundEngine.getMuted();
    soundEngine.setMuted(nextMuted);
    setIsMuted(nextMuted);
  }, []);

  const handleToggleMusic = useCallback(() => {
    soundEngine.resume();
    const playing = soundEngine.toggleMusic();
    setIsMusicPlaying(playing);
  }, []);

  const handleLoadCustomTrack = useCallback(async (file: File) => {
    soundEngine.resume();
    try {
      const name = await soundEngine.loadCustomTrack(file);
      setTrackName(name);
      setIsCustomTrack(true);
      setIsMusicPlaying(true);
    } catch {
      // Audio load error handling
    }
  }, []);

  const handleResetTrack = useCallback(() => {
    soundEngine.resume();
    if (trackName === 'Pure Imagination') {
      soundEngine.resetToProceduralMusic();
      setTrackName('Ambient Expanse');
      setIsCustomTrack(false);
    } else {
      soundEngine.loadPureImaginationTrack();
      setTrackName('Pure Imagination');
      setIsCustomTrack(true);
    }
    setIsMusicPlaying(true);
  }, [trackName]);

  const handleRespawn = useCallback(() => {
    soundEngine.resume();
    if (physicsRef.current) {
      physicsRef.current.respawn();
    }
  }, []);

  const handleCycleCamera = useCallback(() => {
    if (cameraCtrlRef.current) {
      const nextMode = cameraCtrlRef.current.cycleMode();
      setCameraMode(nextMode);
    }
  }, []);

  const handleTouchMove = useCallback((fwd: number, right: number) => {
    soundEngine.resume();
    touchInputRef.current.fwd = fwd;
    touchInputRef.current.right = right;
  }, []);

  const handleTouchJump = useCallback((pressed: boolean) => {
    soundEngine.resume();
    touchInputRef.current.jump = pressed;
  }, []);

  const handleTouchSprint = useCallback((pressed: boolean) => {
    soundEngine.resume();
    touchInputRef.current.sprint = pressed;
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect Software WebGL capability
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 2. Initialize Three.js WebGLRenderer
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. Build Clean World (1152x1152 Baseplate + Skybox + Spawn Pad)
    const world = buildWorld(renderer);
    physicsRef.current = world.physics;

    // 4. Build Articulated Mannequin Model
    const mannequin = createMannequinModel();
    world.scene.add(mannequin.group);
    world.scene.add(mannequin.contactShadow);

    // 5. Build Camera
    const cameraController = new ThirdPersonCamera(width / height);
    cameraCtrlRef.current = cameraController;

    // 6. Input Event Listeners
    const onKeyDown = (e: KeyboardEvent) => {
      soundEngine.resume();
      keysRef.current[e.code] = true;

      // F5 Hotkey to switch between 1st Person and 3rd Person (prevent browser page refresh)
      if (e.code === 'F5' || e.key === 'F5') {
        e.preventDefault();
        const nextMode = cameraController.togglePerspective();
        setCameraMode(nextMode);
        return;
      }

      if (e.code === 'KeyR') {
        world.physics.respawn();
      }
      if (e.code === 'KeyC') {
        const next = cameraController.cycleMode();
        setCameraMode(next);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    const onPointerDown = (e: PointerEvent) => {
      soundEngine.resume();
      cameraController.handlePointerDown(e.clientX, e.clientY);
    };

    const onPointerMove = (e: PointerEvent) => {
      cameraController.handlePointerMove(e.clientX, e.clientY);
    };

    const onPointerUp = () => {
      cameraController.handlePointerUp();
    };

    const onWheel = (e: WheelEvent) => {
      cameraController.handleZoom(e.deltaY);
    };

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      renderer.setSize(w, h);
      cameraController.setAspect(w / h);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('resize', onResize);

    // 7. Main Render & Animation Loop
    const clock = new THREE.Clock();
    let frameId = 0;
    let hudTimer = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      const delta = Math.min(clock.getDelta(), 0.05);

      // Collect user inputs
      const keys = keysRef.current;
      const touch = touchInputRef.current;

      let fwd = 0;
      let right = 0;

      if (keys['KeyW'] || keys['ArrowUp']) fwd += 1;
      if (keys['KeyS'] || keys['ArrowDown']) fwd -= 1;
      if (keys['KeyA'] || keys['ArrowLeft']) right -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) right += 1;

      if (touch.fwd !== 0) fwd = touch.fwd;
      if (touch.right !== 0) right = touch.right;

      const jump = !!(keys['Space'] || touch.jump);
      const sprint = !!(keys['ShiftLeft'] || keys['ShiftRight'] || touch.sprint);

      const input: CharacterInput = {
        moveForward: fwd,
        moveRight: right,
        jump,
        sprint,
        cameraAngleY: cameraController.azimuth,
      };

      // Advance physics simulation
      world.physics.update(delta, input);

      // Current horizontal speed
      const horizontalSpeed = Math.sqrt(
        world.physics.velocity.x * world.physics.velocity.x +
          world.physics.velocity.z * world.physics.velocity.z
      );

      // In 1st Person mode, align mannequin facing angle with camera view and hide mesh to prevent camera clipping
      const isFirstPerson = cameraController.mode === '1st Person';
      if (isFirstPerson) {
        world.physics.facingAngle = cameraController.azimuth;
      }
      mannequin.group.visible = !isFirstPerson;
      mannequin.contactShadow.visible = !isFirstPerson;

      // Update Mannequin transforms and procedural limb swing animations
      mannequin.update(
        world.physics.position,
        world.physics.facingAngle,
        horizontalSpeed,
        world.physics.isSprinting,
        world.physics.isGrounded,
        delta
      );

      // Update Camera tracking
      cameraController.update(world.physics.position, world.physics.velocity, delta);

      // Update world clouds
      world.update(delta);

      // Keep sun directional shadow frustum centered around mannequin position
      world.sunLight.position.set(
        world.physics.position.x + 180,
        260,
        world.physics.position.z + 140
      );
      world.sunLight.target.position.copy(world.physics.position);
      world.sunLight.target.updateMatrixWorld();

      // Render Scene
      renderer.render(world.scene, cameraController.camera);

      // Throttled HUD State Update (~12 Hz)
      hudTimer += delta;
      if (hudTimer >= 0.08) {
        hudTimer = 0;
        setSpeed(horizontalSpeed);
        if (horizontalSpeed > maxSpeedTrackerRef.current) {
          maxSpeedTrackerRef.current = horizontalSpeed;
          setMaxSpeed(horizontalSpeed);
        }
        setAltitude(world.physics.position.y);
        setIsGrounded(world.physics.isGrounded);
        setIsSprinting(world.physics.isSprinting);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (!isSoftwareGl) {
      renderer.compile(world.scene, cameraController.camera);
    }

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [handleRespawn]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 select-none">
      {/* 3D WebGL Canvas Mount Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Floating HUD & Bottom Dock Overlay */}
      <HUD
        speed={speed}
        maxSpeed={maxSpeed}
        altitude={altitude}
        isGrounded={isGrounded}
        isSprinting={isSprinting}
        cameraMode={cameraMode}
        isMuted={isMuted}
        isMusicPlaying={isMusicPlaying}
        trackName={trackName}
        isCustomTrack={isCustomTrack}
        onToggleMute={handleToggleMute}
        onToggleMusic={handleToggleMusic}
        onLoadCustomTrack={handleLoadCustomTrack}
        onResetTrack={handleResetTrack}
        onRespawn={handleRespawn}
        onCycleCamera={handleCycleCamera}
        onTouchMove={handleTouchMove}
        onTouchJump={handleTouchJump}
        onTouchSprint={handleTouchSprint}
      />
    </div>
  );
}
