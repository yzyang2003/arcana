const cache = new Map<string, HTMLCanvasElement>();

const SVG_W = 300;
const SVG_H = 440;
const CX = 150;
const CY = 220;

const concentrics = [
  { r: 35, strokeW: 1.2, opacity: 0.3 },
  { r: 52, strokeW: 0.8, opacity: 0.25 },
  { r: 68, strokeW: 1.5, opacity: 0.35 },
  { r: 85, strokeW: 0.6, opacity: 0.2 },
  { r: 100, strokeW: 1, opacity: 0.3 },
  { r: 115, strokeW: 1.8, opacity: 0.4 },
];

const stars = [
  { x: 120, y: 155, r: 0.8 },
  { x: 178, y: 160, r: 0.6 },
  { x: 135, y: 205, r: 0.7 },
  { x: 168, y: 200, r: 0.5 },
  { x: 145, y: 148, r: 0.5 },
];

const innerDiamonds = [
  { x: 50, y: 60 },
  { x: 250, y: 60 },
  { x: 50, y: 380 },
  { x: 250, y: 380 },
];

function ringDots(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  count: number,
  dotR: number,
) {
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(x, y, dotR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(212,175,55,0.7)';
    ctx.fill();
  }
}

function drawCornerFlourish(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotate: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotate * Math.PI) / 180);

  // Diamond
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(6, 0);
  ctx.lineTo(0, 8);
  ctx.lineTo(-6, 0);
  ctx.closePath();
  ctx.fillStyle = 'rgba(212,175,55,0.8)';
  ctx.fill();

  // Radiating lines
  ctx.strokeStyle = 'rgba(155,140,255,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(0, -30);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(155,140,255,0.4)';
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  ctx.moveTo(7, -7);
  ctx.lineTo(20, -20);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-7, -7);
  ctx.lineTo(-20, -20);
  ctx.stroke();

  // Small crossbar
  ctx.strokeStyle = 'rgba(212,175,55,0.6)';
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  ctx.moveTo(-4, -22);
  ctx.lineTo(4, -22);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(212,175,55,0.4)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-12, -14);
  ctx.lineTo(-8, -18);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(12, -14);
  ctx.lineTo(8, -18);
  ctx.stroke();

  ctx.restore();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawCardBack(width: number, height: number): HTMLCanvasElement {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const canvas = document.createElement('canvas');
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  const sx = width / SVG_W;
  const sy = height / SVG_H;

  // === Background gradient ===
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#1a1035');
  bgGrad.addColorStop(0.5, '#0d0a1a');
  bgGrad.addColorStop(1, '#050308');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // === Noise texture ===
  const noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = width;
  noiseCanvas.height = height;
  const noiseCtx = noiseCanvas.getContext('2d')!;
  const imageData = noiseCtx.createImageData(width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() * 255;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = Math.floor(255 * 0.03);
  }
  noiseCtx.putImageData(imageData, 0, 0);
  ctx.drawImage(noiseCanvas, 0, 0);

  // === Ring glow (radial gradient behind concentrics) ===
  const ringGlow = ctx.createRadialGradient(
    CX * sx, CY * sy, 0,
    CX * sx, CY * sy, 120 * sx,
  );
  ringGlow.addColorStop(0, 'rgba(155,140,255,0.15)');
  ringGlow.addColorStop(1, 'rgba(155,140,255,0)');
  ctx.fillStyle = ringGlow;
  ctx.beginPath();
  ctx.arc(CX * sx, CY * sy, 120 * sx, 0, Math.PI * 2);
  ctx.fill();

  // === Concentric circles ===
  for (const c of concentrics) {
    ctx.beginPath();
    ctx.arc(CX * sx, CY * sy, c.r * sx, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(155,140,255,${c.opacity})`;
    ctx.lineWidth = c.strokeW * sx;
    ctx.stroke();
  }

  // === Crosshair lines ===
  ctx.strokeStyle = 'rgba(155,140,255,0.15)';
  ctx.lineWidth = 0.4 * sx;
  ctx.beginPath();
  ctx.moveTo(CX * sx, (CY - 125) * sy);
  ctx.lineTo(CX * sx, (CY + 125) * sy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo((CX - 125) * sx, CY * sy);
  ctx.lineTo((CX + 125) * sx, CY * sy);
  ctx.stroke();

  // Diagonal lines
  ctx.strokeStyle = 'rgba(155,140,255,0.1)';
  ctx.lineWidth = 0.3 * sx;
  ctx.beginPath();
  ctx.moveTo((CX - 88) * sx, (CY - 88) * sy);
  ctx.lineTo((CX + 88) * sx, (CY + 88) * sy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo((CX + 88) * sx, (CY - 88) * sy);
  ctx.lineTo((CX - 88) * sx, (CY + 88) * sy);
  ctx.stroke();

  // === Three rings of decorative dots ===
  ringDots(ctx, CX * sx, CY * sy, 42 * sx, 12, 1.5 * sx);
  ringDots(ctx, CX * sx, CY * sy, 76 * sx, 20, 1.2 * sx);
  ringDots(ctx, CX * sx, CY * sy, 108 * sx, 28, 0.9 * sx);

  // === Crescent moon glow ===
  const moonGlow = ctx.createRadialGradient(
    150 * sx, 180 * sy, 0,
    150 * sx, 180 * sy, 50 * sx,
  );
  moonGlow.addColorStop(0, 'rgba(212,175,55,0.35)');
  moonGlow.addColorStop(0.4, 'rgba(155,140,255,0.15)');
  moonGlow.addColorStop(1, 'rgba(155,140,255,0)');
  ctx.fillStyle = moonGlow;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(150 * sx, 180 * sy, 50 * sx, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Crescent shape — draw full circle then subtract offset circle via compositing
  ctx.save();
  // Draw the outer moon circle
  ctx.beginPath();
  ctx.arc(150 * sx, 180 * sy, 30 * sx, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(212,175,55,0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(212,175,55,0.5)';
  ctx.lineWidth = 1.2 * sx;
  ctx.stroke();

  // Cut out the crescent by drawing the subtracting circle with destination-out
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(162 * sx, 173 * sy, 26 * sx, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();

  // Redraw the crescent stroke for the cut edge
  ctx.save();
  ctx.beginPath();
  ctx.arc(150 * sx, 180 * sy, 30 * sx, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(162 * sx, 173 * sy, 26 * sx, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(212,175,55,0.5)';
  ctx.lineWidth = 1.2 * sx;
  ctx.stroke();
  ctx.restore();

  // === Stars around moon ===
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x * sx, s.y * sy, s.r * sx, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(212,175,55,0.6)';
    ctx.fill();
  }

  // === Corner flourishes ===
  drawCornerFlourish(ctx, 30 * sx, 35 * sy, 0);
  drawCornerFlourish(ctx, 270 * sx, 35 * sy, 0);
  drawCornerFlourish(ctx, 30 * sx, 405 * sy, 180);
  drawCornerFlourish(ctx, 270 * sx, 405 * sy, 180);

  // Inner corner diamonds
  for (const p of innerDiamonds) {
    ctx.beginPath();
    ctx.moveTo(p.x * sx, (p.y - 4) * sy);
    ctx.lineTo((p.x + 3) * sx, p.y * sy);
    ctx.lineTo(p.x * sx, (p.y + 4) * sy);
    ctx.lineTo((p.x - 3) * sx, p.y * sy);
    ctx.closePath();
    ctx.fillStyle = 'rgba(155,140,255,0.3)';
    ctx.fill();
  }

  // === Decorative border lines ===
  ctx.strokeStyle = 'rgba(155,140,255,0.2)';
  ctx.lineWidth = 0.6 * sx;
  drawRoundedRect(ctx, 12 * sx, 12 * sy, 276 * sx, 416 * sy, 8 * sx);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(212,175,55,0.15)';
  ctx.lineWidth = 0.4 * sx;
  drawRoundedRect(ctx, 18 * sx, 18 * sy, 264 * sx, 404 * sy, 6 * sx);
  ctx.stroke();

  // === ARCANA text ===
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = 13 * sx;
  ctx.font = `small-caps ${fontSize}px Georgia, 'Times New Roman', serif`;
  ctx.fillStyle = 'rgba(212,175,55,0.65)';
  ctx.letterSpacing = `${8 * sx}px`;
  ctx.fillText('ARCANA', CX * sx, 45 * sy);

  // Bottom decorative line under text
  ctx.strokeStyle = 'rgba(212,175,55,0.3)';
  ctx.lineWidth = 0.5 * sx;
  ctx.beginPath();
  ctx.moveTo(110 * sx, 52 * sy);
  ctx.lineTo(190 * sx, 52 * sy);
  ctx.stroke();

  // === Holographic shimmer overlay ===
  const holoGrad = ctx.createLinearGradient(0, 0, width, height);
  holoGrad.addColorStop(0, 'rgba(155,140,255,0)');
  holoGrad.addColorStop(0.3, 'rgba(212,175,55,0.08)');
  holoGrad.addColorStop(0.5, 'rgba(155,140,255,0.12)');
  holoGrad.addColorStop(0.7, 'rgba(212,175,55,0.06)');
  holoGrad.addColorStop(1, 'rgba(155,140,255,0)');
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = holoGrad;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;

  // === Vignette ===
  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height) * 0.6,
  );
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(0.7, 'rgba(0,0,0,0.15)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // === Outer border highlight ===
  ctx.strokeStyle = 'rgba(155,140,255,0.15)';
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, 1, 1, width - 2, height - 2, 10 * sx);
  ctx.stroke();

  return canvas;
}

export function renderCardBack(width: number, height: number): HTMLCanvasElement {
  const key = `${width}x${height}`;
  let cached = cache.get(key);
  if (cached) return cached;

  if (typeof document === 'undefined') {
    throw new Error('renderCardBack requires a DOM environment');
  }

  cached = drawCardBack(width, height);
  cache.set(key, cached);
  return cached;
}
