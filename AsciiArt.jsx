import { useRef, useEffect, useCallback } from "react";

const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*+=-:;!?/\\|(){}[]<>";

const DEFAULTS = {
  bg: [0x11, 0x3d, 0x38],
  highlight: [0xf4, 0xf2, 0x7b],
  hoverRadius: 120,
  pushForce: 40,
  fontSize: 10,
  font: "monospace",
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export default function AsciiArt({ data, className, style, ...overrides }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const stateRef = useRef(null);

  const opts = { ...DEFAULTS, ...overrides };
  const { cols, rows, cellWidth: CW, cellHeight: CH, cells } = data;
  const W = cols * CW;
  const H = rows * CH;

  // Initialize per-cell animation state once
  if (!stateRef.current || stateRef.current.length !== cells.length) {
    stateRef.current = {
      offX: new Float32Array(cells.length),
      offY: new Float32Array(cells.length),
      chars: cells.map((c) => (c ? c[0] : null)),
    };
  }

  const handleMouseMove = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) * (W / rect.width);
      mouseRef.current.y = (e.clientY - rect.top) * (H / rect.height);
    },
    [W, H]
  );

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.x = -9999;
    mouseRef.current.y = -9999;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { bg, highlight, hoverRadius: RADIUS, pushForce: FORCE } = opts;
    const state = stateRef.current;
    let raf;

    function draw() {
      ctx.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
      ctx.fillRect(0, 0, W, H);
      ctx.font = `${opts.fontSize}px ${opts.font}`;
      ctx.textBaseline = "top";

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const idx = row * cols + col;
          const cell = cells[idx];
          if (!cell) continue;

          const baseX = col * CW;
          const baseY = row * CH;
          const cx = baseX + CW / 2;
          const cy = baseY + CH / 2;

          const dx = cx - mx;
          const dy = cy - my;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < RADIUS && dist > 0) {
            const t = 1 - dist / RADIUS;
            const force = t * t * FORCE;
            const angle = Math.atan2(dy, dx);
            state.offX[idx] = lerp(state.offX[idx], Math.cos(angle) * force, 0.2);
            state.offY[idx] = lerp(state.offY[idx], Math.sin(angle) * force, 0.2);
            if (t > 0.3 && Math.random() < t * 0.4) {
              state.chars[idx] = CHARS[(Math.random() * CHARS.length) | 0];
            }
          } else {
            state.offX[idx] *= 0.85;
            state.offY[idx] *= 0.85;
            if (
              Math.abs(state.offX[idx]) < 0.5 &&
              Math.abs(state.offY[idx]) < 0.5
            ) {
              state.chars[idx] = cell[0];
            }
          }

          const drawX = baseX + state.offX[idx];
          const drawY = baseY + state.offY[idx];

          const pushDist = Math.sqrt(
            state.offX[idx] ** 2 + state.offY[idx] ** 2
          );
          const glow = Math.min(1, pushDist / FORCE);
          const r = Math.round(lerp(cell[1], highlight[0], glow * 0.5));
          const g = Math.round(lerp(cell[2], highlight[1], glow * 0.5));
          const b = Math.round(lerp(cell[3], highlight[2], glow * 0.5));

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillText(state.chars[idx], drawX, drawY);
        }
      }

      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(raf);
  }, [data, opts.bg, opts.highlight, opts.hoverRadius, opts.pushForce]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className={className}
      style={{ maxWidth: "100%", maxHeight: "100vh", ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  );
}
