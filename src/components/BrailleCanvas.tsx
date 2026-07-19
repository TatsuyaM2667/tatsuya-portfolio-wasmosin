import React, { useMemo } from "react";
import { WasmProvider, useBraille } from "terminal-pixel-animation-react";

interface BrailleCanvasInnerProps {
  pixels: Uint8Array | null;
  pixelWidth: number;
  pixelHeight: number;
  cols: number;
  rows: number;
  className?: string;
  style?: React.CSSProperties;
}

function BrailleCanvasInner({
  pixels,
  pixelWidth,
  pixelHeight,
  cols,
  rows,
  className,
  style,
}: BrailleCanvasInnerProps) {
  const { decoded } = useBraille(pixels, pixelWidth, pixelHeight, cols, rows);

  const lines = useMemo(() => {
    if (!decoded) return null;
    const result: string[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: string[] = [];
      for (let c = 0; c < cols; c++) {
        const cell = decoded[r * cols + c];
        row.push(cell.char);
      }
      result.push(row);
    }
    return result;
  }, [decoded, rows, cols]);

  if (!lines) {
    return (
      <pre className={className} style={{ margin: 0, ...style }}>
        {"Loading WASM..."}
      </pre>
    );
  }

  return (
    <pre className={`braille-canvas ${className || ""}`} style={{ margin: 0, ...style }}>
      {lines.map((row, r) => (
        <span key={r}>
          {row.map((char, c) => {
            const cell = decoded![r * cols + c];
            return (
              <span
                key={c}
                style={{
                  color: `rgb(${cell.r},${cell.g},${cell.b})`,
                }}
              >
                {char}
              </span>
            );
          })}
          {"\n"}
        </span>
      ))}
    </pre>
  );
}

interface BrailleCanvasProps {
  pixels: Uint8Array | null;
  pixelWidth: number;
  pixelHeight: number;
  cols: number;
  rows: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function BrailleCanvas({
  pixels,
  pixelWidth,
  pixelHeight,
  cols,
  rows,
  className,
  style,
}: BrailleCanvasProps) {
  return (
    <WasmProvider>
      <BrailleCanvasInner
        pixels={pixels}
        pixelWidth={pixelWidth}
        pixelHeight={pixelHeight}
        cols={cols}
        rows={rows}
        className={className}
        style={style}
      />
    </WasmProvider>
  );
}
