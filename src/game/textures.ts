/**
 * Procedural texture generators using HTML5 2D Canvas.
 * Generates classic Roblox circular studs, bump maps, decals, and marble surfaces
 * with zero external asset dependencies.
 */

import * as THREE from 'three';

/**
 * Generates the iconic classic Roblox gray stud diffuse texture.
 */
export function createStudTexture(maxAnisotropy: number = 8): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const studsPerSide = 8;
  const cellSize = canvas.width / studsPerSide; // 64px per stud cell
  const radius = cellSize * 0.32; // ~20.5px radius

  // Baseplate stone gray base
  ctx.fillStyle = '#8c8d90';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle grid divider lines
  ctx.strokeStyle = '#828487';
  ctx.lineWidth = 1;
  for (let i = 0; i <= studsPerSide; i++) {
    const pos = i * cellSize;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
    ctx.stroke();
  }

  // Draw circular studs
  for (let y = 0; y < studsPerSide; y++) {
    for (let x = 0; x < studsPerSide; x++) {
      const cx = x * cellSize + cellSize / 2;
      const cy = y * cellSize + cellSize / 2;

      // Drop shadow (bottom-right offset)
      ctx.beginPath();
      ctx.arc(cx + 1.5, cy + 2.5, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(60, 62, 65, 0.45)';
      ctx.fill();

      // Ambient occlusion ring (slightly darker perimeter)
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 1, 0, Math.PI * 2);
      ctx.fillStyle = '#7a7c80';
      ctx.fill();

      // Stud top fill with directional lighting gradient
      const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
      grad.addColorStop(0.0, '#a8aaad'); // Top-left highlight
      grad.addColorStop(0.5, '#929497'); // Mid stone gray
      grad.addColorStop(1.0, '#7f8184'); // Bottom-right shadow
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Top-left rim highlight
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 0.75, Math.PI * 0.75, Math.PI * 1.75);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Bottom-right rim shadow
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 0.75, -Math.PI * 0.25, Math.PI * 0.75);
      ctx.strokeStyle = 'rgba(40, 42, 45, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner embossed top rim
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.max(1, maxAnisotropy);
  return texture;
}

/**
 * Normal/Bump heightmap for physical stud surface depth.
 */
export function createStudBumpTexture(maxAnisotropy: number = 8): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const studsPerSide = 8;
  const cellSize = canvas.width / studsPerSide;
  const radius = cellSize * 0.32;

  // Medium gray base (neutral height)
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < studsPerSide; y++) {
    for (let x = 0; x < studsPerSide; x++) {
      const cx = x * cellSize + cellSize / 2;
      const cy = y * cellSize + cellSize / 2;

      // Darker moat around stud
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
      ctx.fillStyle = '#555555';
      ctx.fill();

      // Raised stud top (bright = high)
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.85, '#e0e0e0');
      grad.addColorStop(1.0, '#a0a0a0');

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = Math.max(1, maxAnisotropy);
  return texture;
}

/**
 * Classic Roblox SpawnLocation Decal Texture.
 */
export function createSpawnDecalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d1d5db';
  ctx.fillRect(0, 0, 512, 512);

  // Outer dark bevel border
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 16;
  ctx.strokeRect(16, 16, 480, 480);

  // Outer yellow safety border
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 12;
  ctx.strokeRect(32, 32, 448, 448);

  // Inner dark plate
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(44, 44, 424, 424);

  // Concentric target circles
  const cx = 256;
  const cy = 256;

  ctx.beginPath();
  ctx.arc(cx, cy, 180, 0, Math.PI * 2);
  ctx.fillStyle = '#eab308';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, 140, 0, Math.PI * 2);
  ctx.fillStyle = '#1f2937';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, 100, 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, 60, 0, Math.PI * 2);
  ctx.fillStyle = '#dc2626';
  ctx.fill();

  // Central star / diamond emblem
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 35);
  ctx.lineTo(cx + 25, cy);
  ctx.lineTo(cx, cy + 35);
  ctx.lineTo(cx - 25, cy);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural marble texture with high-contrast swirl patterns and latitude/longitude lines.
 * This makes sphere rolling rotation instantly visible and satisfying to watch!
 */
export function createMarbleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep pearlescent base
  const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGrad.addColorStop(0.0, '#1e3a8a'); // Royal blue
  bgGrad.addColorStop(0.35, '#0284c7'); // Bright azure
  bgGrad.addColorStop(0.7, '#0f172a'); // Deep navy
  bgGrad.addColorStop(1.0, '#1e3a8a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Swirl ribbon 1: Vibrant gold/amber flame
  ctx.fillStyle = '#f59e0b';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    const startX = (i * canvas.width) / 4;
    ctx.moveTo(startX, 0);
    ctx.bezierCurveTo(startX + 180, 150, startX - 120, 350, startX + 90, 512);
    ctx.lineTo(startX + 130, 512);
    ctx.bezierCurveTo(startX - 80, 350, startX + 220, 150, startX + 40, 0);
    ctx.closePath();
    ctx.fill();
  }

  // Swirl ribbon 2: Pure bright pearlescent white
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    const startX = (i * canvas.width) / 4 + 80;
    ctx.moveTo(startX, 0);
    ctx.bezierCurveTo(startX - 140, 180, startX + 160, 320, startX - 40, 512);
    ctx.lineTo(startX - 10, 512);
    ctx.bezierCurveTo(startX + 190, 320, startX - 110, 180, startX + 110, 0);
    ctx.closePath();
    ctx.fill();
  }

  // Equator band for prominent rotational tracking
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();

  // White pinstripe borders on equator
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2 - 8);
  ctx.lineTo(canvas.width, canvas.height / 2 - 8);
  ctx.moveTo(0, canvas.height / 2 + 8);
  ctx.lineTo(canvas.width, canvas.height / 2 + 8);
  ctx.stroke();

  // Meridian longitude stripes
  for (let i = 0; i < 8; i++) {
    const x = (i * canvas.width) / 8;
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.65)' : 'rgba(245, 158, 11, 0.65)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Glowing launch / jump pad texture.
 */
export function createJumpPadTexture(isMega: boolean = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const primaryColor = isMega ? '#10b981' : '#22c55e';
  const glowColor = isMega ? '#34d399' : '#86efac';

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 512);

  // Outer ring
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.arc(256, 256, 220, 0, Math.PI * 2);
  ctx.stroke();

  // Concentric upward arrows / chevron ring
  for (let r = 180; r >= 60; r -= 40) {
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(256, 256, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Upward launch triangle in center
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(256, 120);
  ctx.lineTo(330, 240);
  ctx.lineTo(290, 240);
  ctx.lineTo(290, 360);
  ctx.lineTo(222, 360);
  ctx.lineTo(222, 240);
  ctx.lineTo(182, 240);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Directional chevron speed booster texture.
 */
export function createBoosterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(0, 0, 256, 512);

  // Draw 4 stacked forward-pointing amber chevrons
  ctx.fillStyle = '#f59e0b';
  for (let y = 60; y < 512; y += 120) {
    ctx.beginPath();
    ctx.moveTo(128, y);
    ctx.lineTo(220, y + 80);
    ctx.lineTo(190, y + 80);
    ctx.lineTo(128, y + 30);
    ctx.lineTo(66, y + 80);
    ctx.lineTo(36, y + 80);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Checkpoint pad circular emblem texture.
 */
export function createCheckpointTexture(isActive: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const color = isActive ? '#10b981' : '#06b6d4';
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 512);

  // Outer border
  ctx.strokeStyle = color;
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(256, 256, 220, 0, Math.PI * 2);
  ctx.stroke();

  // Flag emblem in center
  ctx.fillStyle = color;
  ctx.fillRect(180, 100, 14, 300); // Pole

  ctx.beginPath();
  ctx.moveTo(194, 110);
  ctx.lineTo(330, 170);
  ctx.lineTo(194, 230);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
