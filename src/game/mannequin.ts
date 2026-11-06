/**
 * Procedural Minimalist White Silhouette Articulated Mannequin Player Model.
 * Built with smooth spherical ball joints at neck, shoulders, elbows, hips, and knees.
 * Features procedural walk, sprint, and jump animations.
 */

import * as THREE from 'three';

export interface MannequinModel {
  group: THREE.Group;
  contactShadow: THREE.Mesh;
  update: (
    position: THREE.Vector3,
    facingAngle: number,
    speed: number,
    isSprinting: boolean,
    isGrounded: boolean,
    delta: number
  ) => void;
}

export function createMannequinModel(): MannequinModel {
  const group = new THREE.Group();

  // Materials
  // Matte porcelain white finish for main silhouette
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.28,
    metalness: 0.08,
  });

  // Smooth darker slate-gray joint balls
  const jointMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.42,
    metalness: 0.15,
  });

  // Base Root / Body Pivot
  const bodyRoot = new THREE.Group();
  group.add(bodyRoot);

  // 1. Pelvis (Center Root)
  const pelvisGroup = new THREE.Group();
  pelvisGroup.position.set(0, 2.7, 0);
  bodyRoot.add(pelvisGroup);

  const pelvisGeo = new THREE.CylinderGeometry(0.55, 0.45, 0.5, 16);
  const pelvisMesh = new THREE.Mesh(pelvisGeo, bodyMat);
  pelvisMesh.castShadow = true;
  pelvisGroup.add(pelvisMesh);

  // 2. Lumbar Ball Joint & Torso / Chest
  const lumbarJoint = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 14), jointMat);
  lumbarJoint.position.set(0, 0.4, 0);
  pelvisGroup.add(lumbarJoint);

  const chestGroup = new THREE.Group();
  chestGroup.position.set(0, 0.35, 0);
  lumbarJoint.add(chestGroup);

  // Athletic Tapered Chest
  const chestGeo = new THREE.CylinderGeometry(0.72, 0.52, 1.05, 16);
  const chestMesh = new THREE.Mesh(chestGeo, bodyMat);
  chestMesh.position.set(0, 0.55, 0);
  chestMesh.scale.set(1.15, 1, 0.75); // Flatter depth, broader shoulders
  chestMesh.castShadow = true;
  chestGroup.add(chestMesh);

  // 3. Neck & Head
  const neckJoint = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), jointMat);
  neckJoint.position.set(0, 1.15, 0);
  chestGroup.add(neckJoint);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.18, 0);
  neckJoint.add(headGroup);

  // Smooth faceless aerodynamic head egg
  const headGeo = new THREE.SphereGeometry(0.48, 20, 20);
  const headMesh = new THREE.Mesh(headGeo, bodyMat);
  headMesh.scale.set(0.85, 1.15, 0.95);
  headMesh.position.set(0, 0.45, 0.05);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // 4. Left Arm & Joint Chain
  const leftShoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), jointMat);
  leftShoulderJoint.position.set(-0.85, 0.92, 0);
  chestGroup.add(leftShoulderJoint);

  const leftUpperArmGroup = new THREE.Group();
  leftShoulderJoint.add(leftUpperArmGroup);

  const upperArmGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.8, 12);
  const leftUpperArmMesh = new THREE.Mesh(upperArmGeo, bodyMat);
  leftUpperArmMesh.position.set(0, -0.4, 0);
  leftUpperArmMesh.castShadow = true;
  leftUpperArmGroup.add(leftUpperArmMesh);

  const leftElbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), jointMat);
  leftElbowJoint.position.set(0, -0.85, 0);
  leftUpperArmGroup.add(leftElbowJoint);

  const leftForearmGroup = new THREE.Group();
  leftElbowJoint.add(leftForearmGroup);

  const forearmGeo = new THREE.CylinderGeometry(0.16, 0.14, 0.75, 12);
  const leftForearmMesh = new THREE.Mesh(forearmGeo, bodyMat);
  leftForearmMesh.position.set(0, -0.4, 0);
  leftForearmMesh.castShadow = true;
  leftForearmGroup.add(leftForearmMesh);

  const handGeo = new THREE.SphereGeometry(0.18, 10, 10);
  const leftHandMesh = new THREE.Mesh(handGeo, bodyMat);
  leftHandMesh.scale.set(0.8, 1.1, 0.5);
  leftHandMesh.position.set(0, -0.85, 0);
  leftHandMesh.castShadow = true;
  leftForearmGroup.add(leftHandMesh);

  // 5. Right Arm & Joint Chain
  const rightShoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), jointMat);
  rightShoulderJoint.position.set(0.85, 0.92, 0);
  chestGroup.add(rightShoulderJoint);

  const rightUpperArmGroup = new THREE.Group();
  rightShoulderJoint.add(rightUpperArmGroup);

  const rightUpperArmMesh = new THREE.Mesh(upperArmGeo, bodyMat);
  rightUpperArmMesh.position.set(0, -0.4, 0);
  rightUpperArmMesh.castShadow = true;
  rightUpperArmGroup.add(rightUpperArmMesh);

  const rightElbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), jointMat);
  rightElbowJoint.position.set(0, -0.85, 0);
  rightUpperArmGroup.add(rightElbowJoint);

  const rightForearmGroup = new THREE.Group();
  rightElbowJoint.add(rightForearmGroup);

  const rightForearmMesh = new THREE.Mesh(forearmGeo, bodyMat);
  rightForearmMesh.position.set(0, -0.4, 0);
  rightForearmMesh.castShadow = true;
  rightForearmGroup.add(rightForearmMesh);

  const rightHandMesh = new THREE.Mesh(handGeo, bodyMat);
  rightHandMesh.scale.set(0.8, 1.1, 0.5);
  rightHandMesh.position.set(0, -0.85, 0);
  rightHandMesh.castShadow = true;
  rightForearmGroup.add(rightHandMesh);

  // 6. Left Leg & Joint Chain
  const leftHipJoint = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), jointMat);
  leftHipJoint.position.set(-0.42, -0.25, 0);
  pelvisGroup.add(leftHipJoint);

  const leftThighGroup = new THREE.Group();
  leftHipJoint.add(leftThighGroup);

  const thighGeo = new THREE.CylinderGeometry(0.24, 0.2, 1.05, 14);
  const leftThighMesh = new THREE.Mesh(thighGeo, bodyMat);
  leftThighMesh.position.set(0, -0.55, 0);
  leftThighMesh.castShadow = true;
  leftThighGroup.add(leftThighMesh);

  const leftKneeJoint = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), jointMat);
  leftKneeJoint.position.set(0, -1.15, 0);
  leftThighGroup.add(leftKneeJoint);

  const leftCalfGroup = new THREE.Group();
  leftKneeJoint.add(leftCalfGroup);

  const calfGeo = new THREE.CylinderGeometry(0.2, 0.16, 1.05, 14);
  const leftCalfMesh = new THREE.Mesh(calfGeo, bodyMat);
  leftCalfMesh.position.set(0, -0.55, 0);
  leftCalfMesh.castShadow = true;
  leftCalfGroup.add(leftCalfMesh);

  const footGeo = new THREE.BoxGeometry(0.36, 0.2, 0.65);
  const leftFootMesh = new THREE.Mesh(footGeo, bodyMat);
  leftFootMesh.position.set(0, -1.15, 0.12);
  leftFootMesh.castShadow = true;
  leftCalfGroup.add(leftFootMesh);

  // 7. Right Leg & Joint Chain
  const rightHipJoint = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), jointMat);
  rightHipJoint.position.set(0.42, -0.25, 0);
  pelvisGroup.add(rightHipJoint);

  const rightThighGroup = new THREE.Group();
  rightHipJoint.add(rightThighGroup);

  const rightThighMesh = new THREE.Mesh(thighGeo, bodyMat);
  rightThighMesh.position.set(0, -0.55, 0);
  rightThighMesh.castShadow = true;
  rightThighGroup.add(rightThighMesh);

  const rightKneeJoint = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), jointMat);
  rightKneeJoint.position.set(0, -1.15, 0);
  rightThighGroup.add(rightKneeJoint);

  const rightCalfGroup = new THREE.Group();
  rightKneeJoint.add(rightCalfGroup);

  const rightCalfMesh = new THREE.Mesh(calfGeo, bodyMat);
  rightCalfMesh.position.set(0, -0.55, 0);
  rightCalfMesh.castShadow = true;
  rightCalfGroup.add(rightCalfMesh);

  const rightFootMesh = new THREE.Mesh(footGeo, bodyMat);
  rightFootMesh.position.set(0, -1.15, 0.12);
  rightFootMesh.castShadow = true;
  rightCalfGroup.add(rightFootMesh);

  // Dynamic Contact Ground Shadow
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const sGrad = sCtx.createRadialGradient(64, 64, 0, 64, 64, 60);
  sGrad.addColorStop(0, 'rgba(15, 23, 42, 0.65)');
  sGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.25)');
  sGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 128, 128);

  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeo = new THREE.PlaneGeometry(2.4, 2.4);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0, 0.02, 0);

  // Animation cycle state
  let walkPhase = 0;

  const update = (
    position: THREE.Vector3,
    facingAngle: number,
    speed: number,
    isSprinting: boolean,
    isGrounded: boolean,
    delta: number
  ) => {
    // 1. Update root transform
    group.position.copy(position);
    bodyRoot.rotation.y = facingAngle;

    // Contact Shadow position
    contactShadow.position.x = position.x;
    contactShadow.position.z = position.z;

    const groundDist = position.y;
    if (groundDist >= -0.1 && groundDist < 12.0) {
      contactShadow.position.y = 0.03;
      contactShadow.visible = true;
      const scale = 1.0 + groundDist * 0.12;
      contactShadow.scale.set(scale, scale, 1);
      shadowMat.opacity = Math.max(0.08, 0.6 - groundDist * 0.05);
    } else {
      contactShadow.visible = false;
    }

    // 2. Procedural Animation Controller
    if (!isGrounded) {
      // In-Air / Jump Pose
      // Spine arches back slightly
      chestGroup.rotation.x = -0.12;
      lumbarJoint.rotation.x = -0.05;

      // Arms flare upward/outward for balance
      leftUpperArmGroup.rotation.x = 0.5;
      leftUpperArmGroup.rotation.z = 0.45;
      leftForearmGroup.rotation.x = -0.8;

      rightUpperArmGroup.rotation.x = 0.5;
      rightUpperArmGroup.rotation.z = -0.45;
      rightForearmGroup.rotation.x = -0.8;

      // Legs trail slightly back with bent knees
      leftThighGroup.rotation.x = -0.35;
      leftCalfGroup.rotation.x = 0.75;

      rightThighGroup.rotation.x = -0.25;
      rightCalfGroup.rotation.x = 0.65;

      pelvisGroup.position.y = 2.7;
    } else if (speed > 0.4) {
      // Walk / Sprint Cycle
      const strideFreq = isSprinting ? 16.0 : 10.5;
      walkPhase += delta * strideFreq;

      const swingAmp = isSprinting ? 0.85 : 0.55;
      const armSwingAmp = isSprinting ? 0.95 : 0.6;

      // Counter-oscillation of legs
      const leftLegAngle = Math.sin(walkPhase) * swingAmp;
      const rightLegAngle = -Math.sin(walkPhase) * swingAmp;

      leftThighGroup.rotation.x = leftLegAngle;
      rightThighGroup.rotation.x = rightLegAngle;

      // Knee flexing during back-to-front recovery swing
      leftCalfGroup.rotation.x = Math.max(0, -Math.sin(walkPhase) * 0.8);
      rightCalfGroup.rotation.x = Math.max(0, Math.sin(walkPhase) * 0.8);

      // Arm counter-swing
      leftUpperArmGroup.rotation.x = -Math.sin(walkPhase) * armSwingAmp;
      leftUpperArmGroup.rotation.z = 0.12;
      leftForearmGroup.rotation.x = -0.3 - Math.max(0, -Math.sin(walkPhase) * 0.5);

      rightUpperArmGroup.rotation.x = Math.sin(walkPhase) * armSwingAmp;
      rightUpperArmGroup.rotation.z = -0.12;
      rightForearmGroup.rotation.x = -0.3 - Math.max(0, Math.sin(walkPhase) * 0.5);

      // Forward chest tilt on movement (deeper on sprint)
      const forwardTilt = isSprinting ? 0.22 : 0.1;
      chestGroup.rotation.x = forwardTilt;
      lumbarJoint.rotation.x = forwardTilt * 0.5;

      // Subtle torso twisting
      chestGroup.rotation.y = -Math.sin(walkPhase) * 0.12;

      // Natural vertical stride bounce
      pelvisGroup.position.y = 2.7 + Math.sin(walkPhase * 2) * (isSprinting ? 0.12 : 0.07);
    } else {
      // Idle Pose (Natural Breathing Sway)
      const time = performance.now() * 0.002;
      const breath = Math.sin(time) * 0.03;

      chestGroup.rotation.x = breath;
      lumbarJoint.rotation.x = breath * 0.5;
      chestGroup.rotation.y = 0;

      leftUpperArmGroup.rotation.x = 0.08 + breath * 0.5;
      leftUpperArmGroup.rotation.z = 0.12;
      leftForearmGroup.rotation.x = -0.2;

      rightUpperArmGroup.rotation.x = 0.08 + breath * 0.5;
      rightUpperArmGroup.rotation.z = -0.12;
      rightForearmGroup.rotation.x = -0.2;

      leftThighGroup.rotation.x = 0;
      leftCalfGroup.rotation.x = 0;
      rightThighGroup.rotation.x = 0;
      rightCalfGroup.rotation.x = 0;

      pelvisGroup.position.y = 2.7;
    }
  };

  return {
    group,
    contactShadow,
    update,
  };
}
