import type { CSSProperties } from "react";

function loadingNoise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

const CELLS = Array.from({ length: 216 }, (_, index) => {
  const noiseA = loadingNoise(index * 17 + 11);
  const noiseB = loadingNoise(index * 29 + 37);
  const hue = 16 + noiseA * 26;
  const saturation = 88 + noiseB * 10;
  const lightness = 46 + noiseA * 19;

  return {
    id: `loading-${index}`,
    color: `hsl(${hue.toFixed(1)} ${saturation.toFixed(1)}% ${lightness.toFixed(1)}%)`,
    delay: -(noiseA * 1.6),
    duration: 0.9 + noiseB * 1.2,
  };
});

export default function PieceLoading() {
  return (
    <div className="wws-loading-overlay" aria-live="polite" aria-busy>
      <div className="wws-loading-grid">
        {CELLS.map((cell) => (
          <span
            key={cell.id}
            className="wws-loading-cell"
            style={
              {
                backgroundColor: cell.color,
                "--wws-loading-delay": `${cell.delay.toFixed(3)}s`,
                "--wws-loading-duration": `${cell.duration.toFixed(3)}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <p className="wws-loading-label">loading exhibition</p>
    </div>
  );
}
