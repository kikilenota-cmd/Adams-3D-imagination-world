/**
 * Pristine 3D World Setup for 1152x1152 Baseplate and Spawn Pad.
 * Completely cleared of all parkour courses, ramps, and obstacle clutter.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  BASEPLATE_SIZE,
  BASEPLATE_THICKNESS,
} from './constants';
import {
  createStudTexture,
  createStudBumpTexture,
  createSpawnDecalTexture,
} from './textures';
import {
  MannequinPhysics,
  BoxCollider,
} from './physics';

export interface WorldBuildResult {
  scene: THREE.Scene;
  physics: MannequinPhysics;
  sunLight: THREE.DirectionalLight;
  update: (delta: number) => void;
}

export function buildWorld(renderer: THREE.WebGLRenderer): WorldBuildResult {
  const scene = new THREE.Scene();
  const physics = new MannequinPhysics();

  // 1. Studio Environment & Atmosphere
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  pmremGenerator.dispose();

  // Sky blue background & soft atmospheric distance fog
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.FogExp2(0x87ceeb, 0.0009);

  // 2. Lighting Rig
  // Warm directional sun
  const sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
  sunLight.position.set(180, 260, 140);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 600;
  const shadowDist = 140;
  sunLight.shadow.camera.left = -shadowDist;
  sunLight.shadow.camera.right = shadowDist;
  sunLight.shadow.camera.top = shadowDist;
  sunLight.shadow.camera.bottom = -shadowDist;
  sunLight.shadow.bias = -0.0004;
  sunLight.shadow.normalBias = 0.02;
  scene.add(sunLight);

  // Cool sky fill
  const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x64748b, 0.95);
  scene.add(hemiLight);

  // Ambient fill
  const ambLight = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambLight);

  // 3. Sky Dome & Drifting Procedural Clouds
  buildSkyAndClouds(scene);

  // 4. The 1152 x 1152 Baseplate
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  const studDiffuse = createStudTexture(maxAnisotropy);
  const studBump = createStudBumpTexture(maxAnisotropy);

  // 72 repeats across 1152 units (each tile has 8 studs, 1 stud = 2 units)
  const tileRepeats = 72;
  studDiffuse.repeat.set(tileRepeats, tileRepeats);
  studBump.repeat.set(tileRepeats, tileRepeats);

  const baseplateGeo = new THREE.BoxGeometry(BASEPLATE_SIZE, BASEPLATE_THICKNESS, BASEPLATE_SIZE);
  const baseplateMat = new THREE.MeshStandardMaterial({
    map: studDiffuse,
    bumpMap: studBump,
    bumpScale: 0.06,
    roughness: 0.65,
    metalness: 0.08,
  });

  const baseplateMesh = new THREE.Mesh(baseplateGeo, baseplateMat);
  baseplateMesh.position.set(0, -BASEPLATE_THICKNESS / 2, 0);
  baseplateMesh.receiveShadow = true;
  scene.add(baseplateMesh);

  // Perimeter boundary curbs at the edge of the 1152x1152 expanse
  buildPerimeterCurb(scene, physics);

  // 5. Classic Roblox Spawn Location (the only structure on the baseplate)
  buildSpawnPlatform(scene, physics);

  // Cloud animation group
  const clouds = scene.getObjectByName('cloudsGroup');
  const update = (delta: number) => {
    if (clouds) {
      clouds.position.x += delta * 1.5;
      if (clouds.position.x > 600) {
        clouds.position.x = -600;
      }
    }
  };

  return {
    scene,
    physics,
    sunLight,
    update,
  };
}

/**
 * Builds stylized sunny sky dome and drifting cumulus clouds.
 */
function buildSkyAndClouds(scene: THREE.Scene) {
  // Giant Sky Dome
  const skyGeo = new THREE.SphereGeometry(1400, 32, 24);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x60a5fa,
    side: THREE.BackSide,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyDome);

  // Procedural 3D Cumulus Clouds clusters drifting high overhead
  const cloudGroup = new THREE.Group();
  cloudGroup.name = 'cloudsGroup';

  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.05,
    flatShading: true,
  });

  const cloudPuffGeo = new THREE.DodecahedronGeometry(20, 1);

  // Generate 24 distributed cloud clusters across the 1152 baseplate airspace
  for (let i = 0; i < 24; i++) {
    const cluster = new THREE.Group();
    const cx = (Math.random() - 0.5) * 1100;
    const cy = 180 + Math.random() * 80;
    const cz = (Math.random() - 0.5) * 1100;
    cluster.position.set(cx, cy, cz);

    const puffs = 5 + Math.floor(Math.random() * 4);
    for (let p = 0; p < puffs; p++) {
      const puff = new THREE.Mesh(cloudPuffGeo, cloudMat);
      puff.position.set(
        (Math.random() - 0.5) * 45,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 35
      );
      const s = 0.8 + Math.random() * 0.9;
      puff.scale.set(s * 1.4, s * 0.7, s);
      cluster.add(puff);
    }
    cloudGroup.add(cluster);
  }
  scene.add(cloudGroup);
}

/**
 * Builds low aesthetic curbs around the 1152x1152 baseplate boundary.
 */
function buildPerimeterCurb(scene: THREE.Scene, physics: MannequinPhysics) {
  const curbHeight = 3.5;
  const curbWidth = 4.0;
  const curbLength = 1152;
  const half = 576;

  const curbMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.6,
  });

  const configs = [
    { pos: [0, curbHeight / 2, -half + curbWidth / 2], size: [curbLength, curbHeight, curbWidth] },
    { pos: [0, curbHeight / 2, half - curbWidth / 2], size: [curbLength, curbHeight, curbWidth] },
    { pos: [-half + curbWidth / 2, curbHeight / 2, 0], size: [curbWidth, curbHeight, curbLength] },
    { pos: [half - curbWidth / 2, curbHeight / 2, 0], size: [curbWidth, curbHeight, curbLength] },
  ];

  for (let i = 0; i < configs.length; i++) {
    const c = configs[i];
    const geo = new THREE.BoxGeometry(c.size[0], c.size[1], c.size[2]);
    const mesh = new THREE.Mesh(geo, curbMat);
    mesh.position.set(c.pos[0], c.pos[1], c.pos[2]);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    scene.add(mesh);

    physics.boxes.push({
      id: `curb_${i}`,
      min: new THREE.Vector3(c.pos[0] - c.size[0] / 2, 0, c.pos[2] - c.size[2] / 2),
      max: new THREE.Vector3(c.pos[0] + c.size[0] / 2, c.size[1], c.pos[2] + c.size[2] / 2),
    });
  }
}

/**
 * Builds the classic Roblox spawn platform in the center of the baseplate.
 */
function buildSpawnPlatform(scene: THREE.Scene, physics: MannequinPhysics) {
  const spawnSize = 24;
  const spawnDecalTexture = createSpawnDecalTexture();

  // Raised spawn slab
  const spawnGeo = new THREE.BoxGeometry(spawnSize, 0.8, spawnSize);
  const spawnMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.5,
  });
  const spawnMesh = new THREE.Mesh(spawnGeo, spawnMat);
  spawnMesh.position.set(0, 0.4, 0);
  spawnMesh.receiveShadow = true;
  spawnMesh.castShadow = true;
  scene.add(spawnMesh);

  // Spawn Decal Plane on top
  const decalGeo = new THREE.PlaneGeometry(spawnSize - 2, spawnSize - 2);
  const decalMat = new THREE.MeshStandardMaterial({
    map: spawnDecalTexture,
    roughness: 0.4,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const decalMesh = new THREE.Mesh(decalGeo, decalMat);
  decalMesh.rotation.x = -Math.PI / 2;
  decalMesh.position.set(0, 0.81, 0);
  decalMesh.receiveShadow = true;
  scene.add(decalMesh);

  // Spawn beacon corner posts
  const postGeo = new THREE.CylinderGeometry(0.8, 0.8, 6, 12);
  const postMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.3,
    metalness: 0.4,
  });
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xfacc15,
    emissiveIntensity: 0.4,
  });

  const offsets = [
    [-11, -11],
    [11, -11],
    [-11, 11],
    [11, 11],
  ];

  for (const [ox, oz] of offsets) {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(ox, 3.0, oz);
    post.castShadow = true;
    scene.add(post);

    const cap = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 12), capMat);
    cap.position.set(ox, 6.2, oz);
    scene.add(cap);

    physics.boxes.push({
      id: `spawn_post_${ox}_${oz}`,
      min: new THREE.Vector3(ox - 0.9, 0, oz - 0.9),
      max: new THREE.Vector3(ox + 0.9, 6.5, oz + 0.9),
    });
  }
}
