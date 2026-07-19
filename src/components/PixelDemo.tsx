import { useState, useEffect, useRef, useCallback } from "react";
import BrailleCanvas from "./BrailleCanvas";

const PX_W = 80;
const PX_H = 64;
const COLS = 40;
const ROWS = 16;
const FIRE_H = 12;

const FIRE_PALETTE: [number, number, number][] = [
  [0, 0, 0],
  [28, 4, 0],
  [56, 8, 0],
  [84, 12, 0],
  [112, 16, 0],
  [140, 20, 0],
  [168, 28, 0],
  [196, 36, 0],
  [224, 48, 0],
  [244, 64, 0],
  [252, 84, 0],
  [252, 108, 4],
  [252, 132, 8],
  [252, 156, 16],
  [252, 180, 28],
  [252, 200, 44],
  [252, 220, 68],
  [252, 232, 96],
  [252, 240, 128],
  [252, 248, 164],
  [254, 252, 200],
  [254, 252, 224],
  [255, 255, 240],
  [255, 255, 255],
];

function getFireColor(heat: number): [number, number, number] {
  const idx = Math.min(Math.floor(heat * 23), 22);
  const frac = heat * 23 - idx;
  const c1 = FIRE_PALETTE[idx];
  const c2 = FIRE_PALETTE[Math.min(idx + 1, 23)];
  return [
    c1[0] + (c2[0] - c1[0]) * frac,
    c1[1] + (c2[1] - c1[1]) * frac,
    c1[2] + (c2[2] - c1[2]) * frac,
  ];
}

export default function PixelDemo() {
  const [pixels, setPixels] = useState<Uint8Array | null>(null);
  const bufRef = useRef(new Uint8Array(PX_W * PX_H * 4));
  const fireRef = useRef(new Float32Array(PX_W * FIRE_H));
  const noiseRef = useRef(
    Array.from({ length: 256 }, () => Math.random()),
  );
  const rafRef = useRef<number>(0);
  const frameRef = useRef(0);

  const animate = useCallback(() => {
    const buf = bufRef.current;
    const fire = fireRef.current;
    const noise = noiseRef.current;
    const frame = frameRef.current++;

    const skyH = PX_H - FIRE_H;

    // sky gradient
    for (let y = 0; y < skyH; y++) {
      const t = y / skyH;
      const r = 2 + t * 8;
      const g = 2 + t * 4;
      const b = 20 + t * 20;
      for (let x = 0; x < PX_W; x++) {
        const i = (y * PX_W + x) * 4;
        buf[i] = r;
        buf[i + 1] = g;
        buf[i + 2] = b;
        buf[i + 3] = 255;
      }
    }

    // stars
    for (let i = 0; i < 80; i++) {
      const sx = (i * 137 + 29) % PX_W;
      const sy = (i * 89 + 13) % skyH;
      const flicker =
        Math.sin(frame * 0.05 + i * 1.7) * 0.3 + 0.7;
      const bright = 140 + ((i * 73) % 115);
      const si = (sy * PX_W + sx) * 4;
      buf[si] = Math.min(255, buf[si] + bright * flicker);
      buf[si + 1] = Math.min(255, buf[si + 1] + bright * flicker);
      buf[si + 2] = Math.min(255, buf[si + 2] + bright * flicker * 1.2);
    }

    // mountain silhouettes
    for (let x = 0; x < PX_W; x++) {
      const m1 = 14 + Math.sin(x * 0.08) * 7 + Math.sin(x * 0.03 + 1) * 4;
      const m2 = 8 + Math.sin(x * 0.12 + 2) * 4 + Math.sin(x * 0.05 + 3) * 3;
      const peak = Math.max(m1, m2);
      const py = skyH - peak;
      if (py >= 0 && py < skyH) {
        for (let y = Math.max(0, py); y < skyH; y++) {
          const depth = (y - py) / peak;
          const r = 8 - depth * 5;
          const g = 12 - depth * 8;
          const b = 22 - depth * 14;
          const mi = (y * PX_W + x) * 4;
          buf[mi] = r;
          buf[mi + 1] = g;
          buf[mi + 2] = b;
        }
      }
    }

    // fire simulation
    const base = Math.floor(frame * 0.3);
    for (let x = 0; x < PX_W; x++) {
      fire[x] =
        (noise[(x + base) & 255] +
          noise[((x * 3 + base * 7) >> 1) & 255] * 0.5) *
        0.5;
    }

    for (let y = 1; y < FIRE_H; y++) {
      for (let x = 0; x < PX_W; x++) {
        const l = Math.max(0, x - 1);
        const r = Math.min(PX_W - 1, x + 1);
        const below = y + 1 < FIRE_H ? y + 1 : FIRE_H - 1;
        const avg =
          (fire[y * PX_W + l] +
            fire[y * PX_W + r] +
            fire[(y + 1 < FIRE_H ? below : y) * PX_W + l] +
            fire[(y + 1 < FIRE_H ? below : y) * PX_W + x] +
            fire[(y + 1 < FIRE_H ? below : y) * PX_W + r]) *
          0.2;
        const decay = 1.0 - (0.06 + y * 0.008);
        fire[y * PX_W + x] = Math.max(0, avg * decay);
      }
    }

    // render fire to pixel buffer
    for (let y = 0; y < FIRE_H; y++) {
      for (let x = 0; x < PX_W; x++) {
        const heat = fire[y * PX_W + x];
        const [r, g, b] = getFireColor(heat);
        const py = skyH + y;
        const i = (py * PX_W + x) * 4;
        buf[i] = r;
        buf[i + 1] = g;
        buf[i + 2] = b;
        buf[i + 3] = 255;
      }
    }

    // copy to force re-render
    setPixels(new Uint8Array(buf));
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ marginBottom: "0.5rem", color: "var(--accent)", fontSize: "0.85rem" }}>
        terminal-pixel-animation-react | braille unicode rendering | 80x64 px &rarr; 40x16 cells
      </p>
      <BrailleCanvas
        pixels={pixels}
        pixelWidth={PX_W}
        pixelHeight={PX_H}
        cols={COLS}
        rows={ROWS}
        style={{
          fontSize: "6px",
          lineHeight: "6px",
          letterSpacing: 0,
          display: "inline-block",
          textAlign: "left",
        }}
      />
    </div>
  );
}
