# Clean 1152x1152 Baseplate & Minimalist Mannequin Controller

Transform the environment into a pristine, uncluttered 1152x1152 stud baseplate containing only the central spawn pad, and replace the rolling marble player model with a fully articulated, minimalist white silhouette humanoid mannequin featuring smooth spherical joints and procedural walking, sprinting, and jumping animations.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following parameters have been confirmed by user choices and govern this refactor:

- **Confirmed Character Aesthetic**: Minimalist matte porcelain white silhouette mannequin featuring smooth spherical ball joints at the neck, shoulders, elbows, hips, and knees.
- **Confirmed Locomotion & Animation**: Third-person character controller with dynamic procedural limb swing animations (sinusoidal arm/leg counter-swing, spine lean, vertical stride bounce, and mid-air jump pose).
- **Confirmed World Scope**: Complete removal of all obstacle courses, platforms, ramps, pins, and jump pads—leaving the pure, expansive 1152x1152 stud baseplate and the iconic central spawn pad.
- **Camera & Movement**: Third-person orbit/chase camera oriented behind the mannequin with smooth rotation, WASD / Arrow directional movement, Spacebar jump, and Shift sprint.

---

### 1. Overview & Core Concept

- **What It Does**: The user controls a sleek, white articulated mannequin standing on the vast 1152x1152 stud baseplate. The mannequin walks, runs, and leaps across the endless gray grid with fluid procedural kinematics, leaving behind the toy marble to become a clean humanoid testing sandbox.
- **Visual Feel**: Pure, high-end architectural and game-engine testing aesthetic—a monolithic stone gray stud plane beneath a bright sunny sky, anchored by a single detailed spawn pad and a smooth, studio-lit white silhouette mannequin.

---

### 2. User Experience & Visual Design

#### Mannequin Character Model (Composite 15-Part Procedural `THREE.Group`)
- **Materials**: Ultra-clean matte white porcelain finish (`color: 0xf8fafc`, `roughness: 0.28`, `metalness: 0.08`, `clearcoat: 0.4`), accented by subtle slate-tinted interior joint spheres (`color: 0x94a3b8`, `roughness: 0.45`).
- **Anatomy & Silhouette Hierarchy**:
  1. **Head & Neck**: Faceless, aerodynamically smoothed head egg atop a spherical neck pivot joint.
  2. **Torso & Spine**: Two-tier athletic torso (upper chest cage and lower waist/pelvis connected by an articulated lumbar ball joint).
  3. **Arms & Hands**: Left and right upper arms, smooth elbow ball joints, tapered forearms, and streamlined hands.
  4. **Legs & Feet**: Left and right upper thighs, smooth knee ball joints, lower calves, and articulated beveled feet.
  5. **Dynamic Contact Ground Shadow**: Soft radial contact shadow beneath the mannequin's feet that adapts to jumping altitude.

#### Procedural Animation State Machine
- **Idle Stance**: Natural breathing sway, subtle arm relaxation, and relaxed leg stance.
- **Walk Cycle ($\approx 16\text{ studs/s}$)**: Coordinated counter-oscillation where left arm swings forward with right leg; rhythmic vertical torso bobbing ($\Delta y = 0.12\sin(2\omega t)$).
- **Sprint Cycle ($\approx 32\text{ studs/s}$)**: Forward spine tilt ($12^\circ$), increased arm pump amplitude, and wider leg stride.
- **Jump & In-Air Stance**: When leaping into the air, legs sweep slightly backward at the knees, arms flare outward for balance, and forward velocity is preserved.
- **Rotation Smoothing**: The mannequin smoothly faces the direction of travel relative to the camera view with rotational damping.

#### Baseplate Environment
- **1152x1152 Baseplate Expanse**: Completely cleared of all ramps, parkour towers, jump pads, and sandbox pins.
- **Retained Centerpiece**: The iconic classic Roblox Spawn Location pad at $(0, 0, 0)$ with safety border, decal, and four corner beacon pillars.
- **Sunny Atmospheric Skybox**: Retained bright sunny sky dome with warm directional key light and soft procedural clouds.

#### Clean Minimalist HUD
- **Bottom Dock**:
  - Running Speed (studs/s) & Stride Cadence
  - Altitude (studs) & Grounded / Airborne State
  - Stance / Gait Mode: Idle / Walking / Sprinting / Airborne
  - Camera View Toggle (Close Third-Person / Over-Shoulder / Free Orbit)
  - Audio Mute Toggle & Reset to Spawn (`[R]`)
- **Anti-Slop Discipline**: No pulsating dots, tabular figures (`font-mono tabular-nums`), and clean unboxed metadata.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Procedural Mathematical Skeletal Animation vs. Heavy Rigged Mesh Files**
  - *Chosen Approach*: Implement inverse-kinematic style sinusoidal limb rotations directly on hierarchically grouped Three.js Object3D pivots in code.
  - *Why*: Eliminates 404 file dependencies and bulky GLTF loading times; runs instantaneously with zero external network requests and 100% deterministic frame rates.
  
- **Decision 2: Kinematic Humanoid Character Controller vs. Rolling Sphere Integrator**
  - *Chosen Approach*: Replace the angular torque marble integrator with an agile humanoid character controller with snappy acceleration, air steering, step height detection, and grounded state transitions.

---

### 4. Technical Architecture & Data Strategy

#### Mannequin Kinematic Hierarchy

```
┌────────────────────────────────────────────────────────┐
│               Mannequin Root (THREE.Group)             │
│  ├── Contact Ground Shadow (Projects on Y = 0.02)      │
│  └── Pelvis (Root Body Pivot)                          │
│       ├── Torso / Chest                                │
│       │    ├── Neck Joint -> Head Mesh                 │
│       │    ├── Left Shoulder Joint                     │
│       │    │    └── Left Upper Arm -> Left Elbow -> Hand
│       │    └── Right Shoulder Joint                    │
│       │         └── Right Upper Arm -> Right Elbow -> Hand
│       ├── Left Hip Joint                               │
│       │    └── Left Thigh -> Left Knee -> Left Foot    │
│       └── Right Hip Joint                              │
│            └── Right Thigh -> Right Knee -> Right Foot │
└────────────────────────────────────────────────────────┘
```

#### Locomotion Physics Parameters
- Walk Speed: $18\text{ studs/s}$
- Sprint Speed: $34\text{ studs/s}$ (holding Shift)
- Jump Velocity: $24\text{ studs/s}$
- Gravity: $-46\text{ studs/s}^2$
- Rotation Turn Rate: $14.0\text{ rad/s}$ smooth damping towards movement vector

---

### Verification & Testing Plan
- **Clean Baseplate Verification**: Confirm that all parkour towers, obstacles, ramps, and pins are purged from the scene and collision lists.
- **Mannequin Anatomy Verification**: Confirm that all 15 mannequin parts render seamlessly with smooth spherical joints and crisp studio lighting.
- **Animation Verification**: Test walking, sprinting, turning, jumping, and falling to verify natural motion without clipping or limb inversions.
- **Build & Lint Verification**: Run `compile_applet` and `lint_applet` to verify clean compilation with zero warnings or errors.
